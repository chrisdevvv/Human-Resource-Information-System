const validateRequest = (schema = {}) => {
  return (req, res, next) => {
    try {
      const details = [];
      const targets = ["params", "query", "body"];

      for (const target of targets) {
        const validator = schema[target];
        if (!validator) continue;

        const { error, value } = validator.validate(req[target], {
          abortEarly: false,
          convert: true,
          stripUnknown: true,
        });

        if (error) {
          for (const item of error.details) {
            details.push({
              field: item.path.join("."),
              message: item.message,
              source: target,
            });
          }
        } else {
          req[target] = value;
        }
      }

      if (details.length > 0) {
        return res.status(400).json({
          message: "Validation failed",
          errors: details,
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({ message: "Validation middleware error" });
    }
  };
};

module.exports = { validateRequest };