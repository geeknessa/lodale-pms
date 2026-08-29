export const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.message || err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    error: err.message || 'An unexpected server error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
