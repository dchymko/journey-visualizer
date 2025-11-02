const express = require('express');
const { requireAuth } = require('../middleware/auth');
const kitService = require('../services/kitService');
const analysisService = require('../services/analysisService');
const logger = require('../config/logger');

const router = express.Router();

// All API routes require authentication
router.use(requireAuth);

// Health check (authenticated)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    user: req.user.email,
    timestamp: new Date().toISOString()
  });
});

// Get account info
router.get('/account', async (req, res, next) => {
  try {
    const accountInfo = await kitService.getAccountInfo(req.user.access_token);
    res.json(accountInfo);
  } catch (error) {
    logger.error('Error fetching account info:', error);
    next(error);
  }
});

// Sync data from Kit (tags, sequences, subscribers)
router.post('/sync', async (req, res, next) => {
  try {
    logger.info(`Starting sync for user: ${req.user.email}`);
    const result = await kitService.syncAccountData(req.user);
    res.json({
      message: 'Sync completed',
      ...result
    });
  } catch (error) {
    logger.error('Error syncing data:', error);
    next(error);
  }
});

// Get sync status
router.get('/sync/status', async (req, res, next) => {
  try {
    const db = require('../db/connection');
    const result = await db.query(
      'SELECT last_sync_at FROM accounts WHERE id = $1',
      [req.user.id]
    );
    res.json({
      last_sync_at: result.rows[0]?.last_sync_at,
      needs_sync: !result.rows[0]?.last_sync_at
    });
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    next(error);
  }
});

// Get journey flow data
router.get('/journey/flows', async (req, res, next) => {
  try {
    const flows = await analysisService.getJourneyFlows(req.user.id);
    res.json(flows);
  } catch (error) {
    logger.error('Error fetching journey flows:', error);
    next(error);
  }
});

// Trigger journey analysis
router.post('/journey/analyze', async (req, res, next) => {
  try {
    logger.info(`Starting journey analysis for user: ${req.user.email}`);
    const result = await analysisService.analyzeJourneys(req.user.id);
    res.json({
      message: 'Analysis completed',
      ...result
    });
  } catch (error) {
    logger.error('Error analyzing journeys:', error);
    next(error);
  }
});

// Get dashboard metrics
router.get('/dashboard/metrics', async (req, res, next) => {
  try {
    const db = require('../db/connection');

    const [tags, sequences, subscribers, flows] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM tags WHERE account_id = $1', [req.user.id]),
      db.query('SELECT COUNT(*) as count FROM sequences WHERE account_id = $1', [req.user.id]),
      db.query('SELECT COUNT(*) as count FROM subscribers WHERE account_id = $1', [req.user.id]),
      db.query('SELECT COUNT(*) as count FROM journey_flows WHERE account_id = $1', [req.user.id])
    ]);

    res.json({
      tags: parseInt(tags.rows[0].count),
      sequences: parseInt(sequences.rows[0].count),
      subscribers: parseInt(subscribers.rows[0].count),
      flows: parseInt(flows.rows[0].count)
    });
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    next(error);
  }
});

module.exports = router;
