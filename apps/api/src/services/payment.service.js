const { StatusCodes } = require("http-status-codes");
const Order = require("../models/order.model");
const Payment = require("../models/payment.model");
const PAYMENT_SOURCE = Payment.PAYMENT_SOURCE;
const AppError = require("../utils/app-error");
const env = require("../config/env");
const { PAYMENT_STATUS, PAYMENT_METHOD } = require("../constants/order");
const { getPaymentProvider } = require("./payment/get-payment-provider");
const {
  scheduleOnlinePaymentPaid,
  scheduleBankTransferAdminDecision
} = require("./order-email.service");

const RAW_PAYLOAD_MAX_CHARS = 16000;

const ONLINE_WEBHOOK_TRANSITIONS = {
  [PAYMENT_STATUS.PENDING_PAYMENT]: [
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED
  ]
};

const BANK_TRANSFER_ADMIN_TRANSITIONS = {
  [PAYMENT_STATUS.BANK_TRANSFER_PENDING]: [
    PAYMENT_STATUS.BANK_TRANSFER_APPROVED,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED
  ]
};

const OUTCOME_TO_STATUS = {
  succeeded: PAYMENT_STATUS.PAID,
  failed: PAYMENT_STATUS.FAILED,
  cancelled: PAYMENT_STATUS.CANCELLED
};

function assertOnlineWebhookPaymentTransition(current, next) {
  const allowed = ONLINE_WEBHOOK_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Invalid payment status transition from ${current} to ${next}`,
      StatusCodes.BAD_REQUEST
    );
  }
}

function assertBankTransferAdminTransition(current, next) {
  const allowed = BANK_TRANSFER_ADMIN_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new AppError(
      `Invalid bank transfer payment status transition from ${current} to ${next}`,
      StatusCodes.BAD_REQUEST
    );
  }
}

function capRawPayload(obj) {
  if (obj === undefined || obj === null) {
    return undefined;
  }
  try {
    const s = JSON.stringify(obj);
    if (s.length <= RAW_PAYLOAD_MAX_CHARS) {
      return JSON.parse(s);
    }
    return { _truncated: true, preview: s.slice(0, RAW_PAYLOAD_MAX_CHARS) };
  } catch {
    return { _nonSerializable: true };
  }
}

async function handleWebhook(req) {
  const provider = getPaymentProvider();
  provider.verifyWebhookRequest(req, env.paymentWebhookSecret);
  const event = provider.parseWebhookPayload(req.body);

  const existing = await Payment.findOne({
    provider: env.paymentProvider,
    providerEventId: event.providerEventId
  }).lean();

  if (existing) {
    return { duplicate: true, orderId: existing.order };
  }

  const order = await Order.findById(event.orderId);
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.paymentMethod === PAYMENT_METHOD.BANK_TRANSFER) {
    throw new AppError(
      "Webhook cannot update bank transfer orders; use admin payment approval",
      StatusCodes.BAD_REQUEST
    );
  }

  if (order.paymentMethod !== PAYMENT_METHOD.CREDIT_CARD && order.paymentMethod !== PAYMENT_METHOD.BIT) {
    throw new AppError("Unsupported payment method for online webhook", StatusCodes.BAD_REQUEST);
  }

  if (order.paymentStatus !== PAYMENT_STATUS.PENDING_PAYMENT) {
    throw new AppError(
      "Order is not awaiting online payment",
      StatusCodes.BAD_REQUEST
    );
  }

  const nextStatus = OUTCOME_TO_STATUS[event.outcome];
  assertOnlineWebhookPaymentTransition(order.paymentStatus, nextStatus);

  const processedAt = new Date();
  const rawPayload = capRawPayload(event.rawPayload);

  try {
    await Payment.create({
      order: order._id,
      user: order.user,
      provider: env.paymentProvider,
      providerEventId: event.providerEventId,
      source: PAYMENT_SOURCE.WEBHOOK,
      outcome: event.outcome,
      amountSnapshot: order.total,
      rawPayload,
      processedAt
    });
  } catch (err) {
    if (err.code === 11000) {
      return { duplicate: true, orderId: order._id };
    }
    throw err;
  }

  order.paymentStatus = nextStatus;
  await order.save();

  if (nextStatus === PAYMENT_STATUS.PAID) {
    scheduleOnlinePaymentPaid(order._id);
  }

  return { duplicate: false, order };
}

async function adminUpdateBankTransferPayment(orderId, body) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError("Order not found", StatusCodes.NOT_FOUND);
  }

  if (order.paymentMethod !== PAYMENT_METHOD.BANK_TRANSFER) {
    throw new AppError(
      "Payment status can only be updated by admin for bank transfer orders",
      StatusCodes.BAD_REQUEST
    );
  }

  if (order.paymentStatus !== PAYMENT_STATUS.BANK_TRANSFER_PENDING) {
    throw new AppError(
      "Order is not awaiting bank transfer approval",
      StatusCodes.BAD_REQUEST
    );
  }

  const nextStatus = body.paymentStatus;
  assertBankTransferAdminTransition(order.paymentStatus, nextStatus);

  const processedAt = new Date();
  const providerEventId = `admin:${String(order._id)}:${processedAt.getTime()}`;

  await Payment.create({
    order: order._id,
    user: order.user,
    provider: env.paymentProvider,
    providerEventId,
    source: PAYMENT_SOURCE.ADMIN,
    outcome: nextStatus,
    amountSnapshot: order.total,
    rawPayload: capRawPayload({ previousStatus: order.paymentStatus, nextStatus }),
    processedAt,
    notes: body.notes || undefined
  });

  order.paymentStatus = nextStatus;
  await order.save();

  scheduleBankTransferAdminDecision(order._id, nextStatus);

  return order;
}

module.exports = {
  handleWebhook,
  adminUpdateBankTransferPayment,
  assertOnlineWebhookPaymentTransition,
  assertBankTransferAdminTransition
};
