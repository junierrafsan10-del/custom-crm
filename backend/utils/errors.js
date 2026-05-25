class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (req.id) {
    console.error(`[${req.id}] Error ${statusCode}: ${err.message}`);
  }

  if (!err.isOperational) {
    console.error('Unexpected error:', err);
  }

  const body = { success: false, error: message };
  if (err.details) {
    body.details = err.details;
  }
  res.status(statusCode).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
}

module.exports = { AppError, errorHandler, notFoundHandler };
