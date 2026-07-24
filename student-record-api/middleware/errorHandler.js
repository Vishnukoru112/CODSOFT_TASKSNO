const ApiError = require('../utils/ApiError');

/**
 * Converts known Sequelize errors into ApiError instances so they
 * get consistent, client-friendly responses.
 */
function normalizeError(err) {
  if (err.name === 'SequelizeValidationError') {
    const details = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(422, 'Validation failed', details);
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    const details = err.errors.map((e) => ({ field: e.path, message: `${e.path} already exists` }));
    return new ApiError(409, 'Duplicate value violates a unique constraint', details);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return new ApiError(400, 'Invalid reference: related record does not exist');
  }
  if (err.name === 'SequelizeDatabaseError') {
    return new ApiError(400, 'Invalid data supplied to the database');
  }
  return err;
}

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;
  const isOperational = normalized.isOperational || false;

  if (!isOperational) {
    // Unexpected error - log full detail server-side, hide internals from client
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? normalized.message : 'Something went wrong on the server',
    ...(normalized.details ? { errors: normalized.details } : {}),
  });
};
