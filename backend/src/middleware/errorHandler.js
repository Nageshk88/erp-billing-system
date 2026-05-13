const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: Object.values(err.errors).map(e => e.message) });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ error: `Duplicate value: ${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ID format` });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
};

module.exports = errorHandler;
