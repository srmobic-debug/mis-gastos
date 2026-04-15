export const errorHandler = (err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  // Default error
  let statusCode = 500;
  let response = {
    error: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR'
  };

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    response = {
      error: 'Base de datos no disponible',
      code: 'DATABASE_UNAVAILABLE'
    };
  }

  // Validation errors
  if (err.statusCode === 400) {
    statusCode = 400;
    response = {
      error: err.message,
      code: 'VALIDATION_ERROR'
    };
  }

  // Authentication errors
  if (err.statusCode === 401) {
    statusCode = 401;
    response = {
      error: err.message,
      code: 'UNAUTHORIZED'
    };
  }

  // Not found errors
  if (err.statusCode === 404) {
    statusCode = 404;
    response = {
      error: err.message,
      code: 'NOT_FOUND'
    };
  }

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = err.message;
  }

  res.status(statusCode).json(response);
};
