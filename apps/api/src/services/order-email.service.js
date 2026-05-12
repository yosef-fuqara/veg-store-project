const Order = require("../models/order.model");
const User = require("../models/user.model");
const env = require("../config/env");
const { sendEmail, isMailConfigured } = require("./mail.service");
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/order");

const KEYS = {
  BANK_TRANSFER_SUBMITTED: "bank_transfer_submitted",
  ADMIN_BANK_TRANSFER_ALERT: "admin_bank_transfer_alert",
  PAYMENT_ONLINE_PAID: "payment_online_paid",
  BANK_TRANSFER_APPROVED: "bank_transfer_approved",
  BANK_TRANSFER_REJECTED: "bank_transfer_rejected",
  orderStatus: (status) => `order_status:${status}`
};

const logSkip = (reason) => {
  if (env.nodeEnv === "development") {
    // eslint-disable-next-line no-console
    console.info(`[order-email] skip: ${reason}`);
  }
};

const safeRun = (label, fn) => {
  void (async () => {
    try {
      await fn();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[order-email] ${label}:`, err?.message || err);
    }
  })();
};

const alreadySent = (order, key) => Boolean(order?.emailNotifications?.[key]);

const markSent = async (orderId, key) => {
  await Order.updateOne(
    { _id: orderId },
    { $set: { [`emailNotifications.${key}`]: new Date() } }
  );
};

const getCustomerEmail = async (order) => {
  const user = await User.findById(order.user).select("email").lean();
  return user?.email || "";
};

async function sendCustomerOnce(orderId, key, build) {
  const order = await Order.findById(orderId).lean();
  if (!order || alreadySent(order, key)) {
    return;
  }
  if (!isMailConfigured()) {
    logSkip("mail not configured");
    return;
  }
  const to = await getCustomerEmail(order);
  if (!to) {
    logSkip("customer has no email");
    return;
  }
  const { subject, text, html } = build(order);
  await sendEmail({ to, subject, text, html });
  await markSent(orderId, key);
}

async function sendAdminOnce(orderId, key, build) {
  const order = await Order.findById(orderId).lean();
  if (!order || alreadySent(order, key)) {
    return;
  }
  if (!isMailConfigured()) {
    logSkip("mail not configured");
    return;
  }
  const to = env.adminEmail;
  if (!to) {
    logSkip("ADMIN_EMAIL not set");
    return;
  }
  const { subject, text, html } = build(order);
  await sendEmail({ to, subject, text, html });
  await markSent(orderId, key);
}

const orderSummaryLine = (order) =>
  `Order #${order._id} — total ${order.total} ILS — ${order.paymentMethod || ""}`;

/** Bank transfer: right after order is created */
function scheduleBankTransferOrderCreated(orderId) {
  safeRun("bankTransferCreated", async () => {
    await sendCustomerOnce(orderId, KEYS.BANK_TRANSFER_SUBMITTED, (order) => ({
      subject: "Bank transfer request received",
      text: `Your bank transfer request was received and is waiting for admin approval.\n\n${orderSummaryLine(order)}`,
      html: `<p>Your bank transfer request was received and is waiting for admin approval.</p><p>${orderSummaryLine(
        order
      )}</p>`
    }));

    await sendAdminOnce(orderId, KEYS.ADMIN_BANK_TRANSFER_ALERT, (order) => ({
      subject: "New bank transfer order waiting for approval",
      text: `New bank transfer order waiting for approval.\n\n${orderSummaryLine(order)}`,
      html: `<p>New bank transfer order waiting for approval.</p><p>${orderSummaryLine(order)}</p>`
    }));
  });
}

/** Credit card / Bit: only after webhook marks payment paid (non-duplicate path) */
function scheduleOnlinePaymentPaid(orderId) {
  safeRun("onlinePaymentPaid", async () => {
    await sendCustomerOnce(orderId, KEYS.PAYMENT_ONLINE_PAID, (order) => ({
      subject: "Order confirmed — payment received",
      text: `Your payment was confirmed successfully. Your order is confirmed.\n\n${orderSummaryLine(order)}`,
      html: `<p>Your payment was confirmed successfully. Your order is confirmed.</p><p>${orderSummaryLine(order)}</p>`
    }));
  });
}

/** Admin approved or rejected bank transfer payment */
function scheduleBankTransferAdminDecision(orderId, nextPaymentStatus) {
  safeRun("bankTransferAdminDecision", async () => {
    if (nextPaymentStatus === PAYMENT_STATUS.BANK_TRANSFER_APPROVED) {
      await sendCustomerOnce(orderId, KEYS.BANK_TRANSFER_APPROVED, (order) => ({
        subject: "Payment approved",
        text: `Your payment was approved and your order is confirmed.\n\n${orderSummaryLine(order)}`,
        html: `<p>Your payment was approved and your order is confirmed.</p><p>${orderSummaryLine(order)}</p>`
      }));
      return;
    }
    if (nextPaymentStatus === PAYMENT_STATUS.FAILED || nextPaymentStatus === PAYMENT_STATUS.CANCELLED) {
      await sendCustomerOnce(orderId, KEYS.BANK_TRANSFER_REJECTED, (order) => ({
        subject: "Payment not approved",
        text: `Your payment was rejected / your order was not approved.\n\n${orderSummaryLine(order)}`,
        html: `<p>Your payment was rejected / your order was not approved.</p><p>${orderSummaryLine(order)}</p>`
      }));
    }
  });
}

const ORDER_STATUS_MESSAGES = {
  [ORDER_STATUS.CONFIRMED]: {
    subject: "Order status: confirmed",
    text: "Your order status is now: confirmed.",
    html: "<p>Your order status is now: <strong>confirmed</strong>.</p>"
  },
  [ORDER_STATUS.PREPARING]: {
    subject: "Order status: preparing",
    text: "Your order status is now: preparing.",
    html: "<p>Your order status is now: <strong>preparing</strong>.</p>"
  },
  [ORDER_STATUS.READY_FOR_DELIVERY]: {
    subject: "Order status: ready for delivery",
    text: "Your order status is now: ready for delivery.",
    html: "<p>Your order status is now: <strong>ready for delivery</strong>.</p>"
  },
  [ORDER_STATUS.SENT_WITH_DELIVERY_COMPANY]: {
    subject: "Order status: sent with delivery company",
    text: "Your order status is now: sent with delivery company.",
    html: "<p>Your order status is now: <strong>sent with delivery company</strong>.</p>"
  },
  [ORDER_STATUS.DELIVERED]: {
    subject: "Order status: delivered",
    text: "Your order status is now: delivered.",
    html: "<p>Your order status is now: <strong>delivered</strong>.</p>"
  },
  [ORDER_STATUS.CANCELLED]: {
    subject: "Order status: cancelled",
    text: "Your order status is now: cancelled.",
    html: "<p>Your order status is now: <strong>cancelled</strong>.</p>"
  }
};

function scheduleOrderStatusChange(orderId, newOrderStatus) {
  safeRun("orderStatusChange", async () => {
    const msg = ORDER_STATUS_MESSAGES[newOrderStatus];
    if (!msg) {
      return;
    }
    const key = KEYS.orderStatus(newOrderStatus);
    if (newOrderStatus === ORDER_STATUS.CONFIRMED) {
      const order = await Order.findById(orderId).lean();
      if (
        order?.paymentMethod === PAYMENT_METHOD.BANK_TRANSFER &&
        alreadySent(order, KEYS.BANK_TRANSFER_APPROVED)
      ) {
        logSkip("confirmed email already covered by bank transfer approval");
        return;
      }
    }
    await sendCustomerOnce(orderId, key, (order) => ({
      subject: msg.subject,
      text: `${msg.text}\n\n${orderSummaryLine(order)}`,
      html: `${msg.html}<p>${orderSummaryLine(order)}</p>`
    }));
  });
}

module.exports = {
  scheduleBankTransferOrderCreated,
  scheduleOnlinePaymentPaid,
  scheduleBankTransferAdminDecision,
  scheduleOrderStatusChange,
  KEYS
};
