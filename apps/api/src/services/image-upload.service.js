const { Readable } = require("stream");
const { StatusCodes } = require("http-status-codes");
const cloudinary = require("../config/cloudinary");
const AppError = require("../utils/app-error");

const uploadBufferToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError(
              "Image upload failed",
              StatusCodes.BAD_GATEWAY,
              error ? { providerError: error.message } : null
            )
          );
        }

        return resolve(result);
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });

const destroyCloudinaryImage = async (publicId) => {
  if (!publicId) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
};

module.exports = { uploadBufferToCloudinary, destroyCloudinaryImage };
