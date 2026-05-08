const env = require("../config/env");

const truthy = (value) =>
  typeof value === "string" && ["1", "true", "yes", "on"].includes(value.toLowerCase());

const isWhatsAppEnabled = () =>
  truthy(env.whatsappNotificationsEnabled) &&
  Boolean(env.adminWhatsappPhone) &&
  Boolean(env.whatsappProvider);

const buildOrderMessage = (order, user) => {
  const orderId = String(order?._id || "");
  const customerName = user?.name || order?.customerName || "-";
  const customerPhone = order?.customerPhone || user?.phone || "-";
  const area = order?.deliveryArea || "-";
  const total = typeof order?.total === "number" ? order.total : 0;
  const paymentMethod = order?.paymentMethod || "-";
  const adminBaseUrl = env.adminBaseUrl;
  const adminLink = adminBaseUrl ? `${adminBaseUrl.replace(/\/$/, "")}/orders/${orderId}` : "";

  const lines = [
    "New order received",
    `Order ID: ${orderId}`,
    `Customer: ${customerName}`,
    `Phone: ${customerPhone}`,
    `Delivery area: ${area}`,
    `Total: ${total} ILS`,
    `Payment: ${paymentMethod}`
  ];
  if (order?.hasPreorderItems) {
    lines.push("⚠ Contains preorder/custom platter items");
  }
  if (adminLink) {
    lines.push(`Admin: ${adminLink}`);
  }
  return lines.join("\n");
};

const sendViaMetaCloud = async ({ to, message }) => {
  const url = `https://graph.facebook.com/v20.0/${env.whatsappPhoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message }
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappApiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Meta WhatsApp Cloud API error ${res.status}: ${text}`);
  }
};

const sendViaTwilio = async ({ to, message }) => {
  const accountSid = env.whatsappTwilioAccountSid;
  const authToken = env.whatsappApiToken;
  const fromNumber = env.whatsappTwilioFrom;
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio WhatsApp credentials are incomplete");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: `whatsapp:${fromNumber}`,
    To: `whatsapp:${to}`,
    Body: message
  });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio API error ${res.status}: ${text}`);
  }
};

/**
 * Notify the business owner of a new order via WhatsApp.
 *
 * Failure here MUST NEVER throw to the caller; we log a safe message and
 * resolve with `{ ok: false }` so order creation always succeeds even when
 * notifications are misconfigured or the provider is down.
 */
const notifyAdminOfNewOrder = async (order, user) => {
  try {
    if (!isWhatsAppEnabled()) {
      // eslint-disable-next-line no-console
      console.info("[whatsapp] notifications disabled or not configured; skipping");
      return { ok: false, reason: "disabled" };
    }

    const provider = String(env.whatsappProvider || "").toLowerCase();
    const to = env.adminWhatsappPhone;
    const message = buildOrderMessage(order, user);

    if (provider === "meta_cloud") {
      await sendViaMetaCloud({ to, message });
    } else if (provider === "twilio") {
      await sendViaTwilio({ to, message });
    } else if (provider === "log") {
      // eslint-disable-next-line no-console
      console.info("[whatsapp] log provider; would send:", message);
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[whatsapp] unknown provider "${provider}"; skipping`);
      return { ok: false, reason: "unknown_provider" };
    }
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[whatsapp] failed to send admin notification:", err?.message);
    return { ok: false, error: err?.message };
  }
};

module.exports = {
  notifyAdminOfNewOrder,
  isWhatsAppEnabled,
  buildOrderMessage
};
