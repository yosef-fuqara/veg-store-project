const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, null, "UNAUTHENTICATED")
    );
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError("Forbidden", StatusCodes.FORBIDDEN, null, "FORBIDDEN"));
  }

  return next();
};

module.exports = { requireRole };
