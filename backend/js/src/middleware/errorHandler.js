const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Default error status and message
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  }

  if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  }

  // Kit API errors
  if (err.response?.status) {
    status = err.response.status;
    message = err.response.data?.message || message;
  }

  // Don't leak error details in production
  const response = {
    error: status >= 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(status).json(response);
};

module.exports = errorHandler;
