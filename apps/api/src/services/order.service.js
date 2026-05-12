const { StatusCodes } = require("http-status-codes");
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHOD } = require("../constants/order");
const {
  calculateDeliveryFee,
  getDeliveryArea,
  isAllowedDeliveryArea
} = require("../constants/delivery");
const AppError = require("../utils/app-error");

const roundHalfUp = (value, decimalPlaces) => {
  const f = 10 ** decimalPlaces;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};

const buildOrderItemsFromPreview = (previewItems) =>
  previewItems.map((line) => ({
    product: line.product,
    name: line.name,
    price: line.unitPrice,
    quantity: line.quantity,
    unit: line.unit,
    purchaseMode: line.purchaseMode || "quantity",
    requestedAmountIls: line.requestedAmountIls,
    lineTotal:
      typeof line.lineTotal === "number"
        ? line.lineTotal
        : roundHalfUp(Number(line.quantity) * Number(line.unitPrice), 2),
    isPreorderOnly: Boolean(line.isPreorderOnly),
    minAdvanceHours: Number(line.minAdvanceHours) || 0,
    wrap: Boolean(line.wrap),
    wrapFee: Number(line.wrapFee) || 0
  }));

const getInitialPaymentStatus = (method) => {
  if (method === PAYMENT_METHOD.BANK_TRANSFER) {
    return PAYMENT_STATUS.BANK_TRANSFER_PENDING;
  }
  return PAYMENT_STATUS.PENDING_PAYMENT;
};

const ORDER_STATUS_TRANSITIONS = {
  [ORDER_STATUS.NEW]: [
    ORDER_STATUS.SEEN,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED
  ],
  [ORDER_STATUS.SEEN]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
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

const assertDeliveryAreaAllowed = (areaKey) => {
  if (!isAllowedDeliveryArea(areaKey)) {
    throw new AppError(
      "Unsupported delivery area",
      StatusCodes.BAD_REQUEST
    );
  }
};

/**
 * Validate that any preorder-only items in the cart can be prepared in time.
 *
 * If at least one item is preorder-only, the customer must provide
 * `preferredDeliveryAt` and it must be at least `minAdvanceHours` from now
 * (defaulting to 24h, taking the strictest item's requirement).
 */
const assertPreorderTiming = (previewItems, preferredDeliveryAt) => {
  const preorderItems = previewItems.filter((line) => line.isPreorderOnly);
  if (preorderItems.length === 0) {
    return { hasPreorderItems: false, preferredDeliveryAt: null };
  }

  if (!preferredDeliveryAt) {
    throw new AppError(
      "This product requires at least 24 hours advance notice.",
      StatusCodes.BAD_REQUEST
    );
  }

  const target = new Date(preferredDeliveryAt);
  if (Number.isNaN(target.getTime())) {
    throw new AppError(
      "Invalid preferred delivery time.",
      StatusCodes.BAD_REQUEST
    );
  }

  const requiredHours = preorderItems.reduce(
    (max, line) => Math.max(max, Number(line.minAdvanceHours) || 24),
    24
  );
  const minMs = requiredHours * 60 * 60 * 1000;
  const diffMs = target.getTime() - Date.now();
  if (diffMs < minMs) {
    throw new AppError(
      `This product requires at least ${requiredHours} hours advance notice.`,
      StatusCodes.BAD_REQUEST
    );
  }

  return { hasPreorderItems: true, preferredDeliveryAt: target };
};

module.exports = {
  calculateDeliveryFee,
  getDeliveryArea,
  buildOrderItemsFromPreview,
  getInitialPaymentStatus,
  assertOrderStatusTransition,
  assertDeliveryAreaAllowed,
  assertPreorderTiming
};
