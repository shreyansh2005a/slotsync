/**
 * Centralized API Error Handling Middleware
 */

const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name || 'API Error'}: ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Resource not found with id of ${err.value}`,
      errorCode: 'INVALID_ID'
    });
  }

  // Mongoose Duplicate Key (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists. Duplicate values are not allowed.`,
      errorCode: 'DUPLICATE_KEY_ERROR'
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      errorCode: 'INVALID_TOKEN'
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errorCode: err.code || 'INTERNAL_ERROR'
  });
};

module.exports = errorHandler;
