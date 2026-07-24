/**
 * Wraps an async Express route handler so any rejected promise / thrown
 * error is forwarded to next(), letting the central error handler deal
 * with it instead of requiring try/catch in every controller function.
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
