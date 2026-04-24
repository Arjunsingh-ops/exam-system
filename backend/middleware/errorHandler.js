const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'Duplicate entry. Record already exists.' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  const status = err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error.' });
};

module.exports = errorHandler;
