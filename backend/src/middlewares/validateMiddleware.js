export const validate = (schemaOrSchemas) => (req, res, next) => {
  try {
    const isSingleSchema = schemaOrSchemas && schemaOrSchemas._def;
    
    if (isSingleSchema) {
      req.body = schemaOrSchemas.parse(req.body);
    } else {
      if (schemaOrSchemas.body) {
        req.body = schemaOrSchemas.body.parse(req.body);
      }
      if (schemaOrSchemas.query) {
        req.query = schemaOrSchemas.query.parse(req.query);
      }
      if (schemaOrSchemas.params) {
        req.params = schemaOrSchemas.params.parse(req.params);
      }
    }
    next();
  } catch (error) {
    const issues = error.issues || error.errors;
    if (issues) {
      const formattedErrors = issues.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      const firstIssue = formattedErrors.length > 0 
        ? `${formattedErrors[0].field ? formattedErrors[0].field + ': ' : ''}${formattedErrors[0].message}`
        : 'Validation failed';
      return res.status(400).json({ 
        error: `Validation failed: ${firstIssue}`, 
        message: `Validation failed: ${firstIssue}`,
        details: formattedErrors 
      });
    }
    console.error('Validation Error Details:', error);
    return res.status(400).json({
      error: error?.message || 'Invalid input',
      message: error?.message || 'Invalid input',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
};
