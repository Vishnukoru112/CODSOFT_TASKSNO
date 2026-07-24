const ApiError = require('../utils/ApiError');

/**
 * Catches requests that didn't match any route and forwards a 404
 * to the central error handler.
 */
module.exports = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
