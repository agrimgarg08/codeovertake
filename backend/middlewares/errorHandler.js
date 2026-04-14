/**
 * Global error handler middleware.
 * Must be registered last (after all routes).
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);

  const status = err.statusCode || 500;

  // Validation errors from services (array of { field, message })
  if (err.errors) {
    return res.status(status).json({ errors: err.errors });
  }

  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
};

module.exports = errorHandler;
