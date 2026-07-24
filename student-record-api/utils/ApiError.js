/**
 * Custom error class carrying an HTTP status code.
 * Throw this from controllers/services; the global error handler
 * middleware will turn it into a consistent JSON error response.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
