class AppError extends Error {
  constructor(message, statusCode = 500, details = null, apiCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.apiCode = apiCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
