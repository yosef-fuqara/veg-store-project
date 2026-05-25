const { notifyAdminOfNewOrder } = require("./whatsapp.service");
const { scheduleOrderStatusChange } = require("./order-email.service");

/**
 * Central entry for order notifications from controllers.
 * Channel rules live in order-email.service (email + WhatsApp idempotency) and whatsapp.service (providers).
 */
function notifyOrderCreated(order, user) {
  const orderId = String(order?._id || "");
  // eslint-disable-next-line no-console
  console.info(`[order-notification] enqueue admin WhatsApp for orderId=${orderId}`);
  notifyAdminOfNewOrder(order, user)
    .then((result) => {
      if (result?.ok) {
        // eslint-disable-next-line no-console
        console.info(`[order-notification] admin WhatsApp finished ok orderId=${orderId}`);
      } else {
        // eslint-disable-next-line no-console
        console.info(
          `[order-notification] admin WhatsApp finished without send orderId=${orderId} reason=${result?.reason || result?.error || "unknown"}`
        );
      }
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn(
        `[order-notification] admin WhatsApp unexpected error orderId=${orderId}:`,
        err?.message
      );
    });
}

function notifyOrderStatusChanged(orderId, newOrderStatus) {
  scheduleOrderStatusChange(orderId, newOrderStatus);
}

module.exports = {
  notifyOrderCreated,
  notifyOrderStatusChanged
};
