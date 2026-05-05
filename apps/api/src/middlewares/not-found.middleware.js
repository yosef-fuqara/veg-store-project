const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

const notFoundMiddleware = (req, res, next) => {
  next(
    new AppError(
      `Route ${req.originalUrl} not found`,
      StatusCodes.NOT_FOUND,
      null,
      "ROUTE_NOT_FOUND"
    )
  );
};

module.exports = notFoundMiddleware;
