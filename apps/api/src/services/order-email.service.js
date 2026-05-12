const Order = require("../models/order.model");
const User = require("../models/user.model");
const env = require("../config/env");
const { sendEmail, isMailConfigured } = require("./mail.service");
const {
  sendTransactionalWhatsAppToCustomer,
  buildCustomerOrderStatusMessage
} = require("./whatsapp.service");
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/order");

/** Customer-facing order lifecycle emails only (maps from admin orderStatus). */
const ORDER_NOTIFY_EVENT = {
  /** Store accepted the order (was: ORDER_RECEIVED / ORDER_CONFIRMED). */
  ORDER_CONFIRMED: "ORDER_CONFIRMED",
  ORDER_SENT_WITH_DELIVERY: "ORDER_SENT_WITH_DELIVERY",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_CANCELLED: "ORDER_CANCELLED"
};

const KEYS = {
  BANK_TRANSFER_SUBMITTED: "bank_transfer_submitted",
  ADMIN_BANK_TRANSFER_ALERT: "admin_bank_transfer_alert",
  PAYMENT_ONLINE_PAID: "payment_online_paid",
  PAYMENT_ONLINE_FAILED: "payment_online_failed",
  BANK_TRANSFER_APPROVED: "bank_transfer_approved",
  BANK_TRANSFER_REJECTED: "bank_transfer_rejected",
  /** @deprecated Prefer orderNotifyEvent; kept for legacy idempotency checks. */
  orderStatus: (status) => `order_status:${status}`,
  orderNotifyEvent: (eventId) => `order_notify:${eventId}`,
  /** WhatsApp idempotency (stored in same emailNotifications Mixed map). */
  WA_ORDER_SENT_WITH_DELIVERY: "wa_notify:ORDER_SENT_WITH_DELIVERY",
  WA_ORDER_DELIVERED: "wa_notify:ORDER_DELIVERED",
  WA_ORDER_CANCELLED: "wa_notify:ORDER_CANCELLED"
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

async function sendCustomerOnce(orderId, key, build, legacyKeys = []) {
  const order = await Order.findById(orderId).lean();
  if (!order) {
    return;
  }
  const sent =
    alreadySent(order, key) || legacyKeys.some((legacyKey) => alreadySent(order, legacyKey));
  if (sent) {
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

async function sendCustomerWhatsappOnce(orderId, waKey, buildMessage) {
  const order = await Order.findById(orderId).lean();
  if (!order) {
    return;
  }
  if (alreadySent(order, waKey)) {
    return;
  }
  const message = buildMessage(order);
  const result = await sendTransactionalWhatsAppToCustomer({
    customerPhone: order.customerPhone,
    message
  });
  if (result?.ok) {
    await markSent(orderId, waKey);
  }
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

/** Webhook: payment failed or cancelled by provider */
function scheduleOnlinePaymentFailed(orderId) {
  safeRun("onlinePaymentFailed", async () => {
    await sendCustomerOnce(orderId, KEYS.PAYMENT_ONLINE_FAILED, (order) => ({
      subject: "Payment was not completed",
      text: `We could not complete your online payment for this order.\n\n${orderSummaryLine(order)}\n\nIf you still want the order, try placing it again or contact the store.`,
      html: `<p>We could not complete your online payment for this order.</p><p>${orderSummaryLine(
        order
      )}</p><p>If you still want the order, try placing it again or contact the store.</p>`
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

const ORDER_STATUS_TO_NOTIFY_EVENT = {
  [ORDER_STATUS.CONFIRMED]: ORDER_NOTIFY_EVENT.ORDER_CONFIRMED,
  [ORDER_STATUS.SENT_WITH_DELIVERY_COMPANY]: ORDER_NOTIFY_EVENT.ORDER_SENT_WITH_DELIVERY,
  [ORDER_STATUS.DELIVERED]: ORDER_NOTIFY_EVENT.ORDER_DELIVERED,
  [ORDER_STATUS.CANCELLED]: ORDER_NOTIFY_EVENT.ORDER_CANCELLED
};

const NOTIFY_EVENT_MESSAGES = {
  [ORDER_NOTIFY_EVENT.ORDER_CONFIRMED]: {
    subject: "Your order has been received",
    text: "Your order has been received by the store.",
    html: "<p>Your order has been received by the store.</p>"
  }
};

/** Prevents duplicate confirmed email after migrating from `order_status:confirmed`. */
const LEGACY_ORDER_CONFIRMED_KEYS = [KEYS.orderStatus(ORDER_STATUS.CONFIRMED)];

/**
 * Order status notifications: email for confirmed only; WhatsApp for sent / delivered / cancelled.
 */
function scheduleOrderStatusChange(orderId, newOrderStatus) {
  safeRun("orderStatusChange", async () => {
    try {
      const notifyEvent = ORDER_STATUS_TO_NOTIFY_EVENT[newOrderStatus];
      if (!notifyEvent) {
        return;
      }

      if (newOrderStatus === ORDER_STATUS.CONFIRMED) {
        const order = await Order.findById(orderId).lean();
        if (!order) {
          return;
        }
        if (
          order?.paymentMethod === PAYMENT_METHOD.BANK_TRANSFER &&
          alreadySent(order, KEYS.BANK_TRANSFER_APPROVED)
        ) {
          logSkip("confirmed email already covered by bank transfer approval");
          return;
        }
        const msg = NOTIFY_EVENT_MESSAGES[ORDER_NOTIFY_EVENT.ORDER_CONFIRMED];
        const key = KEYS.orderNotifyEvent(ORDER_NOTIFY_EVENT.ORDER_CONFIRMED);
        const legacyKeys = LEGACY_ORDER_CONFIRMED_KEYS;
        await sendCustomerOnce(
          orderId,
          key,
          (o) => ({
            subject: msg.subject,
            text: `${msg.text}\n\n${orderSummaryLine(o)}`,
            html: `${msg.html}<p>${orderSummaryLine(o)}</p>`
          }),
          legacyKeys
        );
        return;
      }

      if (newOrderStatus === ORDER_STATUS.SENT_WITH_DELIVERY_COMPANY) {
        await sendCustomerWhatsappOnce(orderId, KEYS.WA_ORDER_SENT_WITH_DELIVERY, (o) =>
          buildCustomerOrderStatusMessage(o, "on_the_way")
        );
        return;
      }
      if (newOrderStatus === ORDER_STATUS.DELIVERED) {
        await sendCustomerWhatsappOnce(orderId, KEYS.WA_ORDER_DELIVERED, (o) =>
          buildCustomerOrderStatusMessage(o, "delivered")
        );
        return;
      }
      if (newOrderStatus === ORDER_STATUS.CANCELLED) {
        await sendCustomerWhatsappOnce(orderId, KEYS.WA_ORDER_CANCELLED, (o) =>
          buildCustomerOrderStatusMessage(o, "cancelled")
        );
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[order-email] orderStatusChange:`, err?.message || err);
    }
  });
}

module.exports = {
  scheduleBankTransferOrderCreated,
  scheduleOnlinePaymentPaid,
  scheduleOnlinePaymentFailed,
  scheduleBankTransferAdminDecision,
  scheduleOrderStatusChange,
  KEYS
};
