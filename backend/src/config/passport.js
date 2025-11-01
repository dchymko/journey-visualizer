const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const logger = require('./logger');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = require('../db/connection');
    const result = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return done(null, false);
    }

    done(null, result.rows[0]);
  } catch (error) {
    logger.error('Error deserializing user:', error);
    done(error, null);
  }
});

// Kit OAuth2 Strategy
passport.use('kit', new OAuth2Strategy({
    authorizationURL: process.env.OAUTH_AUTHORIZATION_URL,
    tokenURL: process.env.OAUTH_TOKEN_URL,
    clientID: process.env.KIT_CLIENT_ID,
    clientSecret: process.env.KIT_CLIENT_SECRET,
    callbackURL: process.env.KIT_REDIRECT_URI
    // Note: Kit may not require explicit scopes, or they may be configured in the Kit app settings
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const db = require('../db/connection');

      // Fetch user info from Kit API
      const response = await axios.get(`${process.env.KIT_API_BASE_URL}/account`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const kitResponse = response.data;
      const kitAccount = kitResponse.account || kitResponse;

      // Extract account ID - Kit returns it nested under 'account'
      const accountId = kitAccount.id ||
                       kitAccount.account_id ||
                       kitAccount.primary_email_address ||
                       kitAccount.email;

      if (!accountId) {
        logger.error('Could not find account ID in Kit response');
        throw new Error('Kit API did not return a valid account identifier');
      }

      // Calculate token expiration (Kit tokens typically last 2 hours)
      const tokenExpiresAt = new Date(Date.now() + (2 * 60 * 60 * 1000));

      // Check if account exists
      const existingAccount = await db.query(
        'SELECT * FROM accounts WHERE kit_account_id = $1',
        [accountId]
      );

      let account;
      if (existingAccount.rows.length > 0) {
        // Update existing account
        const updateResult = await db.query(
          `UPDATE accounts
           SET access_token = $1,
               refresh_token = $2,
               token_expires_at = $3,
               email = $4,
               name = $5,
               updated_at = CURRENT_TIMESTAMP
           WHERE kit_account_id = $6
           RETURNING *`,
          [
            accessToken,
            refreshToken,
            tokenExpiresAt,
            kitAccount.email || kitAccount.primary_email_address || accountId,
            kitAccount.name || 'Kit User',
            accountId
          ]
        );
        account = updateResult.rows[0];
        logger.info(`Updated account for Kit user: ${account.email}`);
      } else {
        // Create new account
        const insertResult = await db.query(
          `INSERT INTO accounts (
            kit_account_id,
            email,
            name,
            access_token,
            refresh_token,
            token_expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [
            accountId,
            kitAccount.email || kitAccount.primary_email_address || accountId,
            kitAccount.name || 'Kit User',
            accessToken,
            refreshToken,
            tokenExpiresAt
          ]
        );
        account = insertResult.rows[0];
        logger.info(`Created new account for Kit user: ${account.email}`);
      }

      return done(null, account);
    } catch (error) {
      logger.error('OAuth callback error:', error.response?.data || error.message);
      return done(error, null);
    }
  }
));

module.exports = passport;
