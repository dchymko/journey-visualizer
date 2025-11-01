const axios = require('axios');
const db = require('../db/connection');
const logger = require('../config/logger');

const KIT_API_BASE = process.env.KIT_API_BASE_URL;

class KitService {
  constructor() {
    this.axiosConfig = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  getAuthHeaders(accessToken) {
    return {
      ...this.axiosConfig.headers,
      'Authorization': `Bearer ${accessToken}`
    };
  }

  async getAccountInfo(accessToken) {
    try {
      const response = await axios.get(`${KIT_API_BASE}/account`, {
        headers: this.getAuthHeaders(accessToken)
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching account info from Kit:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchTags(accessToken) {
    try {
      const response = await axios.get(`${KIT_API_BASE}/tags`, {
        headers: this.getAuthHeaders(accessToken)
      });
      return response.data.tags || [];
    } catch (error) {
      logger.error('Error fetching tags from Kit:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchSequences(accessToken) {
    try {
      const response = await axios.get(`${KIT_API_BASE}/sequences`, {
        headers: this.getAuthHeaders(accessToken)
      });
      return response.data.sequences || [];
    } catch (error) {
      logger.error('Error fetching sequences from Kit:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchSubscribers(accessToken, page = 1) {
    try {
      const response = await axios.get(`${KIT_API_BASE}/subscribers`, {
        headers: this.getAuthHeaders(accessToken),
        params: { page, per_page: 100 }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching subscribers from Kit:', error.response?.data || error.message);
      throw error;
    }
  }

  async fetchSubscriberTags(accessToken, subscriberId) {
    try {
      const response = await axios.get(`${KIT_API_BASE}/subscribers/${subscriberId}/tags`, {
        headers: this.getAuthHeaders(accessToken)
      });
      return response.data.tags || [];
    } catch (error) {
      // Log but don't throw - some subscribers may not have tags
      logger.debug(`No tags for subscriber ${subscriberId}`);
      return [];
    }
  }

  async syncAccountData(user) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      logger.info(`Syncing tags for user: ${user.email}`);
      const tags = await this.fetchTags(user.access_token);
      for (const tag of tags) {
        await client.query(
          `INSERT INTO tags (account_id, kit_tag_id, name, subscriber_count)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (account_id, kit_tag_id)
           DO UPDATE SET name = $3, subscriber_count = $4, updated_at = CURRENT_TIMESTAMP`,
          [user.id, tag.id, tag.name, tag.total_subscriptions || 0]
        );
      }

      logger.info(`Syncing sequences for user: ${user.email}`);
      const sequences = await this.fetchSequences(user.access_token);
      for (const sequence of sequences) {
        await client.query(
          `INSERT INTO sequences (account_id, kit_sequence_id, name, subscriber_count)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (account_id, kit_sequence_id)
           DO UPDATE SET name = $3, subscriber_count = $4, updated_at = CURRENT_TIMESTAMP`,
          [user.id, sequence.id, sequence.name, sequence.total_subscriptions || 0]
        );
      }

      logger.info(`Syncing subscribers for user: ${user.email} (this may take a while)`);
      let page = 1;
      let totalSubscribers = 0;
      let hasMore = true;

      while (hasMore) {
        const subscriberData = await this.fetchSubscribers(user.access_token, page);
        const subscribers = subscriberData.subscribers || [];

        if (subscribers.length === 0) {
          hasMore = false;
          break;
        }

        for (const subscriber of subscribers) {
          // Insert/update subscriber
          const result = await client.query(
            `INSERT INTO subscribers (account_id, kit_subscriber_id, email, first_name, state)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (account_id, kit_subscriber_id)
             DO UPDATE SET email = $3, first_name = $4, state = $5, updated_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [user.id, subscriber.id, subscriber.email_address, subscriber.first_name, subscriber.state]
          );

          const subscriberDbId = result.rows[0].id;

          // Fetch and store subscriber's tags
          const subscriberTags = await this.fetchSubscriberTags(user.access_token, subscriber.id);
          for (const tag of subscriberTags) {
            const tagResult = await client.query(
              'SELECT id FROM tags WHERE account_id = $1 AND kit_tag_id = $2',
              [user.id, tag.id]
            );

            if (tagResult.rows.length > 0) {
              await client.query(
                `INSERT INTO subscriber_tags (subscriber_id, tag_id)
                 VALUES ($1, $2)
                 ON CONFLICT (subscriber_id, tag_id) DO NOTHING`,
                [subscriberDbId, tagResult.rows[0].id]
              );
            }
          }

          totalSubscribers++;
        }

        // Check pagination
        if (subscriberData.pagination && subscriberData.pagination.has_next_page) {
          page++;
          logger.info(`Fetched ${totalSubscribers} subscribers so far...`);
        } else {
          hasMore = false;
        }

        // Rate limiting - wait a bit between pages
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Update last sync time
      await client.query(
        'UPDATE accounts SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      await client.query('COMMIT');

      logger.info(`Sync completed for user: ${user.email} - ${totalSubscribers} subscribers, ${tags.length} tags, ${sequences.length} sequences`);

      return {
        subscribers: totalSubscribers,
        tags: tags.length,
        sequences: sequences.length
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error syncing account data:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new KitService();
