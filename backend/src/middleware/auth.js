const logger = require('../config/logger');

const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated()) {
    logger.warn('Unauthenticated request to protected route');
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    });
  }
  next();
};

const optionalAuth = (req, res, next) => {
  // Just pass through - user may or may not be authenticated
  next();
};

module.exports = {
  requireAuth,
  optionalAuth
};
