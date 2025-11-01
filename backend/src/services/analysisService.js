const db = require('../db/connection');
const logger = require('../config/logger');

class AnalysisService {
  async getJourneyFlows(accountId) {
    try {
      const result = await db.query(
        `SELECT * FROM journey_flows
         WHERE account_id = $1
         ORDER BY subscriber_count DESC`,
        [accountId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching journey flows:', error);
      throw error;
    }
  }

  async analyzeJourneys(accountId) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Create analysis run record
      const analysisRun = await client.query(
        `INSERT INTO analysis_runs (account_id, status, started_at)
         VALUES ($1, 'running', CURRENT_TIMESTAMP)
         RETURNING id`,
        [accountId]
      );
      const analysisRunId = analysisRun.rows[0].id;

      logger.info(`Starting journey analysis for account ${accountId}, run ${analysisRunId}`);

      // Clear old flow data for this account
      await client.query('DELETE FROM journey_flows WHERE account_id = $1', [accountId]);

      // Get all subscribers with their tags
      const subscribersWithTags = await client.query(
        `SELECT s.id as subscriber_id, s.kit_subscriber_id,
                t.id as tag_id, t.kit_tag_id, t.name as tag_name
         FROM subscribers s
         LEFT JOIN subscriber_tags st ON s.id = st.subscriber_id
         LEFT JOIN tags t ON st.tag_id = t.id
         WHERE s.account_id = $1 AND s.state = 'active'`,
        [accountId]
      );

      // Get all subscribers with their sequences
      const subscribersWithSequences = await client.query(
        `SELECT s.id as subscriber_id, s.kit_subscriber_id,
                seq.id as sequence_id, seq.kit_sequence_id, seq.name as sequence_name,
                ss.state as enrollment_state
         FROM subscribers s
         LEFT JOIN subscriber_sequences ss ON s.id = ss.subscriber_id
         LEFT JOIN sequences seq ON ss.sequence_id = seq.id
         WHERE s.account_id = $1 AND s.state = 'active'`,
        [accountId]
      );

      // Build subscriber journey map
      const subscriberMap = new Map();

      // Process tags
      for (const row of subscribersWithTags.rows) {
        if (!subscriberMap.has(row.subscriber_id)) {
          subscriberMap.set(row.subscriber_id, { tags: [], sequences: [] });
        }
        if (row.tag_id) {
          subscriberMap.get(row.subscriber_id).tags.push({
            id: row.kit_tag_id,
            name: row.tag_name
          });
        }
      }

      // Process sequences
      for (const row of subscribersWithSequences.rows) {
        if (!subscriberMap.has(row.subscriber_id)) {
          subscriberMap.set(row.subscriber_id, { tags: [], sequences: [] });
        }
        if (row.sequence_id) {
          subscriberMap.get(row.subscriber_id).sequences.push({
            id: row.kit_sequence_id,
            name: row.sequence_name,
            state: row.enrollment_state
          });
        }
      }

      // Analyze flows: Tag -> Tag
      const tagToTagFlows = new Map();

      for (const [subscriberId, data] of subscriberMap.entries()) {
        if (data.tags.length >= 2) {
          // Sort tags to ensure consistent ordering (you may want to use timestamps in production)
          for (let i = 0; i < data.tags.length - 1; i++) {
            for (let j = i + 1; j < data.tags.length; j++) {
              const flowKey = `tag_${data.tags[i].id}_to_tag_${data.tags[j].id}`;
              tagToTagFlows.set(flowKey, {
                sourceType: 'tag',
                sourceId: data.tags[i].id,
                sourceName: data.tags[i].name,
                targetType: 'tag',
                targetId: data.tags[j].id,
                targetName: data.tags[j].name,
                count: (tagToTagFlows.get(flowKey)?.count || 0) + 1
              });
            }
          }
        }
      }

      // Analyze flows: Tag -> Sequence
      const tagToSequenceFlows = new Map();

      for (const [subscriberId, data] of subscriberMap.entries()) {
        for (const tag of data.tags) {
          for (const sequence of data.sequences) {
            const flowKey = `tag_${tag.id}_to_seq_${sequence.id}`;
            tagToSequenceFlows.set(flowKey, {
              sourceType: 'tag',
              sourceId: tag.id,
              sourceName: tag.name,
              targetType: 'sequence',
              targetId: sequence.id,
              targetName: sequence.name,
              count: (tagToSequenceFlows.get(flowKey)?.count || 0) + 1
            });
          }
        }
      }

      // Insert flow data into database
      let totalFlows = 0;

      for (const flow of tagToTagFlows.values()) {
        const totalTagSubscribers = await client.query(
          `SELECT COUNT(DISTINCT st.subscriber_id) as count
           FROM subscriber_tags st
           JOIN tags t ON st.tag_id = t.id
           WHERE t.account_id = $1 AND t.kit_tag_id = $2`,
          [accountId, flow.sourceId]
        );

        const sourceCount = parseInt(totalTagSubscribers.rows[0].count) || 1;
        const percentage = ((flow.count / sourceCount) * 100).toFixed(2);

        await client.query(
          `INSERT INTO journey_flows
           (account_id, source_type, source_id, source_name, target_type, target_id, target_name, subscriber_count, percentage)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [accountId, flow.sourceType, flow.sourceId, flow.sourceName,
           flow.targetType, flow.targetId, flow.targetName, flow.count, percentage]
        );
        totalFlows++;
      }

      for (const flow of tagToSequenceFlows.values()) {
        const totalTagSubscribers = await client.query(
          `SELECT COUNT(DISTINCT st.subscriber_id) as count
           FROM subscriber_tags st
           JOIN tags t ON st.tag_id = t.id
           WHERE t.account_id = $1 AND t.kit_tag_id = $2`,
          [accountId, flow.sourceId]
        );

        const sourceCount = parseInt(totalTagSubscribers.rows[0].count) || 1;
        const percentage = ((flow.count / sourceCount) * 100).toFixed(2);

        await client.query(
          `INSERT INTO journey_flows
           (account_id, source_type, source_id, source_name, target_type, target_id, target_name, subscriber_count, percentage)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [accountId, flow.sourceType, flow.sourceId, flow.sourceName,
           flow.targetType, flow.targetId, flow.targetName, flow.count, percentage]
        );
        totalFlows++;
      }

      // Get final counts
      const [tags, sequences, subscribers] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM tags WHERE account_id = $1', [accountId]),
        client.query('SELECT COUNT(*) as count FROM sequences WHERE account_id = $1', [accountId]),
        client.query('SELECT COUNT(*) as count FROM subscribers WHERE account_id = $1', [accountId])
      ]);

      // Update analysis run
      await client.query(
        `UPDATE analysis_runs
         SET status = 'completed',
             total_subscribers = $1,
             total_tags = $2,
             total_sequences = $3,
             total_flows = $4,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          parseInt(subscribers.rows[0].count),
          parseInt(tags.rows[0].count),
          parseInt(sequences.rows[0].count),
          totalFlows,
          analysisRunId
        ]
      );

      await client.query('COMMIT');

      logger.info(`Journey analysis completed for account ${accountId}: ${totalFlows} flows identified`);

      return {
        total_flows: totalFlows,
        total_subscribers: parseInt(subscribers.rows[0].count),
        total_tags: parseInt(tags.rows[0].count),
        total_sequences: parseInt(sequences.rows[0].count)
      };

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error analyzing journeys:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new AnalysisService();
