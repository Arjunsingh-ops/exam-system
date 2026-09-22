const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('❌ Error caught in middleware:', err.message || err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry detected. A record with this information already exists.'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference: Related record does not exist.'
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.details ? err.details[0].message : err.message
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication session is invalid or expired. Please sign in again.'
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An unexpected server error occurred. Please try again later.'
    : (err.message || 'Internal server error.');

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;

