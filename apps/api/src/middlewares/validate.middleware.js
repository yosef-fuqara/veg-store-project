const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

const validate = (schema, target = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return next(
      new AppError(
        "Validation failed",
        StatusCodes.BAD_REQUEST,
        {
          fields: error.details.map((d) => ({
            message: d.message,
            path: d.path.join(".")
          }))
        },
        "VALIDATION_FAILED"
      )
    );
  }

  req[target] = value;
  return next();
};

module.exports = validate;
