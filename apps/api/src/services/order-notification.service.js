const { notifyAdminOfNewOrder } = require("./whatsapp.service");
const { scheduleOrderStatusChange } = require("./order-email.service");

/**
 * Central entry for order notifications from controllers.
 * Channel rules live in order-email.service (email + WhatsApp idempotency) and whatsapp.service (providers).
 */
function notifyOrderCreated(order, user) {
  notifyAdminOfNewOrder(order, user).catch((err) => {
    // eslint-disable-next-line no-console
    console.warn("[order-notification] admin WhatsApp dispatch:", err?.message);
  });
}

function notifyOrderStatusChanged(orderId, newOrderStatus) {
  scheduleOrderStatusChange(orderId, newOrderStatus);
}

module.exports = {
  notifyOrderCreated,
  notifyOrderStatusChanged
};
