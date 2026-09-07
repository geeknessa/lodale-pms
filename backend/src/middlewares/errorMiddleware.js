export const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', req.method, req.originalUrl, '-', err.message || err);
  if (err.stack) console.error('[Error Middleware Stack]:', err.stack);
  if (req.body && Object.keys(req.body).length > 0) {
    try {
      console.error('[Error Middleware Body]:', JSON.stringify(req.body).substring(0, 500));
    } catch (e) {
      console.error('[Error Middleware Body]: [Unserializable]');
    }
  }

  const statusCode = err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  
  const isPayloadTooLarge = err.type === 'entity.too.large' || statusCode === 413;
  
  res.status(statusCode).json({
    error: isPayloadTooLarge 
      ? 'Request payload exceeds the maximum 50MB limit. Please compress or remove large images/documents and try again.' 
      : (err.message || 'An unexpected server error occurred'),
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
