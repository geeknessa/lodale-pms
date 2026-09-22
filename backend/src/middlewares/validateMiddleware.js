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
    if (error.errors) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({ error: 'Validation failed', details: formattedErrors });
    }
    return res.status(400).json({ error: 'Invalid input' });
  }
};
