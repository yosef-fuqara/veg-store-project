const { StatusCodes } = require("http-status-codes");
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require("../constants/order");
const { getDeliveryFee } = require("../constants/delivery");
const AppError = require("../utils/app-error");

const buildOrderItemsFromPreview = (previewItems) =>
  previewItems.map((line) => ({
    product: line.product,
    name: line.name,
    price: line.unitPrice,
    quantity: line.quantity,
    unit: line.unit
  }));

const getInitialPaymentStatus = (method) => {
  if (method === PAYMENT_METHOD.BANK_TRANSFER) {
    return PAYMENT_STATUS.BANK_TRANSFER_PENDING;
  }
  return PAYMENT_STATUS.PENDING_PAYMENT;
};

const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.NEW]: [
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.CONFIRMED]: [
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.PREPARING]: [
    ORDER_STATUS.READY_FOR_DELIVERY,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.READY_FOR_DELIVERY]: [ORDER_STATUS.SENT_WITH_DELIVERY_COMPANY],
  [ORDER_STATUS.SENT_WITH_DELIVERY_COMPANY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: []
};

const assertOrderStatusTransition = (current, next) => {
  const allowed = ORDER_STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Invalid order status transition from ${current} to ${next}`,
      StatusCodes.BAD_REQUEST
    );
  }
};

module.exports = {
  getDeliveryFee,
  buildOrderItemsFromPreview,
  getInitialPaymentStatus,
  assertOrderStatusTransition
};
