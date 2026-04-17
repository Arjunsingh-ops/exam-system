// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.stack || err.message}`);

  // Joi validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: err.details.map(d => d.message),
    });
  }

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry: ' + (err.sqlMessage || 'Record already exists.'),
    });
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
