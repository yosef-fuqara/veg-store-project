const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/app-error");

const DELIVERY_ZONES = {
  zone_a: 15,
  zone_b: 25,
  zone_c: 35
};

const DELIVERY_ZONE_KEYS = Object.keys(DELIVERY_ZONES);

const getDeliveryFee = (zone) => {
  if (!zone || typeof zone !== "string") {
    throw new AppError("Invalid delivery zone", StatusCodes.BAD_REQUEST);
  }

  const fee = DELIVERY_ZONES[zone];
  if (typeof fee !== "number") {
    throw new AppError("Unknown delivery zone", StatusCodes.BAD_REQUEST);
  }

  return fee;
};

module.exports = { DELIVERY_ZONES, DELIVERY_ZONE_KEYS, getDeliveryFee };
