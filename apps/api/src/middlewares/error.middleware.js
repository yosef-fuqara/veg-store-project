const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const AppError = require("../utils/app-error");

const inferApiCode = (err, statusCode) => {
  if (err.apiCode && typeof err.apiCode === "string") return err.apiCode;
  if (err.details?.fields?.length) return "VALIDATION_FAILED";
  if (err instanceof mongoose.Error.CastError) return "INVALID_OBJECT_ID";
  if (err instanceof mongoose.Error.ValidationError) return "MONGOOSE_VALIDATION";
  if (err.code === 11000) return "DUPLICATE_KEY";
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) return "INVALID_JSON_BODY";
  if (statusCode === StatusCodes.TOO_MANY_REQUESTS) return "RATE_LIMIT_EXCEEDED";
  if (statusCode === StatusCodes.UNAUTHORIZED) {
    const msg = (err.message || "").toLowerCase();
    if (msg.includes("invalid") || msg.includes("expired")) return "TOKEN_INVALID";
    return "UNAUTHENTICATED";
  }
  if (statusCode === StatusCodes.FORBIDDEN) return "FORBIDDEN";
  if (statusCode === StatusCodes.NOT_FOUND) return "NOT_FOUND";
  if (statusCode === StatusCodes.CONFLICT) return "CONFLICT";
  if (statusCode === StatusCodes.BAD_REQUEST) return "BAD_REQUEST";
  if (statusCode >= 500) return "INTERNAL_ERROR";
  return "UNKNOWN_ERROR";
};

const errorMiddleware = (err, req, res, next) => {
  if (err instanceof mongoose.Error.CastError) {
    err.statusCode = StatusCodes.BAD_REQUEST;
    err.message = `Invalid ${err.path || "id"}: ${String(err.value)}`;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    err.statusCode = StatusCodes.BAD_REQUEST;
    err.details = {
      fields: Object.entries(err.errors).map(([path, e]) => ({
        path,
        message: e.message
      }))
    };
    err.message = "Document validation failed";
  }

  if (err.code === 11000) {
    err.statusCode = StatusCodes.CONFLICT;
    const keys = err.keyValue ? Object.keys(err.keyValue) : [];
    err.message =
      keys.length > 0
        ? `Duplicate value for field(s): ${keys.join(", ")}`
        : "Duplicate field value";
    err.details = err.keyValue ? { keyValue: err.keyValue } : err.details;
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    err.statusCode = StatusCodes.BAD_REQUEST;
    err.message = "Invalid JSON in request body";
  }

  if (err.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
    err.message = err.message || "Too many requests, please try again later";
  }

  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const code = inferApiCode(err, statusCode);

  const response = {
    success: false,
    message: err.message || "Something went wrong",
    code
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== "production") {
    response.debug = {
      name: err.name,
      ...(err instanceof AppError ? {} : { cause: err.constructor?.name })
    };
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;
