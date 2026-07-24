const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after an array of express-validator checks. If any failed,
 * responds with 422 and a list of field-level error messages.
 */
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ApiError(422, 'Validation failed', details));
  }
  return next();
};
