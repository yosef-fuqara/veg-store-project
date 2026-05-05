const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");
const User = require("../models/user.model");
const { verifyAccessToken } = require("../services/token.service");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return next(
        new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, null, "UNAUTHENTICATED")
      );
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("-password");

    if (!user || !user.isActive) {
      return next(
        new AppError("Unauthorized", StatusCodes.UNAUTHORIZED, null, "UNAUTHENTICATED")
      );
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(
      new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED, null, "TOKEN_INVALID")
    );
  }
};

module.exports = { requireAuth };
