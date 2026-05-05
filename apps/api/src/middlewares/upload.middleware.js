const multer = require("multer");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new AppError("Only image uploads are allowed", StatusCodes.BAD_REQUEST));
    }

    return cb(null, true);
  }
});

const handleUploadErrors = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError("Image exceeds maximum size of 3MB", StatusCodes.BAD_REQUEST)
      );
    }

    return next(new AppError(err.message, StatusCodes.BAD_REQUEST));
  }

  return next(err);
};

module.exports = { upload, handleUploadErrors };
