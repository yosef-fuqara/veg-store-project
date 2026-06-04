const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

/**
 * Multipart order creates send `deliveryAddress` as a JSON string.
 * This middleware normalizes it to an object before Joi validation.
 */
const parseOrderCreateBody = (req, _res, next) => {
  try {
    const addr = req.body?.deliveryAddress;
    if (addr && typeof addr === "string") {
      req.body.deliveryAddress = JSON.parse(addr);
    }
    const items = req.body?.items;
    if (items && typeof items === "string") {
      req.body.items = JSON.parse(items);
    }
    if (req.body?.preferredDeliveryAt === "") {
      delete req.body.preferredDeliveryAt;
    }
    if (req.body?.customerEmail === "") {
      delete req.body.customerEmail;
    }
  } catch {
    return next(
      new AppError("Invalid deliveryAddress (expected JSON object)", StatusCodes.BAD_REQUEST)
    );
  }
  return next();
};

module.exports = parseOrderCreateBody;
