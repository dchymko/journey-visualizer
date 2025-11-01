const express = require('express');
const passport = require('passport');
const logger = require('../config/logger');

const router = express.Router();

// Initiate Kit OAuth flow
router.get('/kit', (req, res, next) => {
  logger.info('Initiating Kit OAuth flow');
  passport.authenticate('kit')(req, res, next);
});

// Kit OAuth callback
router.get('/kit/callback',
  passport.authenticate('kit', {
    failureRedirect: `${process.env.FRONTEND_URL}/auth/error`
  }),
  (req, res) => {
    logger.info('Kit OAuth successful for user:', req.user.email);
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      logger.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ authenticated: false });
  }

  // Don't send sensitive token data to frontend
  const { access_token, refresh_token, ...userData } = req.user;

  res.json({
    authenticated: true,
    user: userData
  });
});

module.exports = router;
