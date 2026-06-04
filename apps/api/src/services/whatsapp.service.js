const env = require("../config/env");
const { resolveDeliveryAreaLabel } = require("../constants/delivery");
const { normalizeIsraeliMobile } = require("../utils/israeliMobilePhone");

const truthy = (value) =>
  typeof value === "string" && ["1", "true", "yes", "on"].includes(value.toLowerCase());

/** Last 4 digits only — safe for logs. */
function maskPhoneForLog(digitsOrRaw) {
  const d = String(digitsOrRaw || "").replace(/\D/g, "");
  if (!d.length) {
    return "(empty)";
  }
  if (d.length < 4) {
    return "****";
  }
  return `***${d.slice(-4)}`;
}

function getProviderCredentialGaps() {
  const provider = String(env.whatsappProvider || "").toLowerCase();
  if (!provider) {
    return ["provider_unset"];
  }
  if (provider === "meta_cloud") {
    const gaps = [];
    if (!env.whatsappApiToken) {
      gaps.push("api_token");
    }
    if (!env.whatsappPhoneNumberId) {
      gaps.push("phone_number_id");
    }
    return gaps;
  }
  if (provider === "twilio") {
    const gaps = [];
    if (!env.whatsappTwilioAccountSid) {
      gaps.push("account_sid");
    }
    if (!env.whatsappApiToken) {
      gaps.push("auth_token");
    }
    if (!env.whatsappTwilioFrom) {
      gaps.push("from_number");
    }
    return gaps;
  }
  if (provider === "log") {
    return [];
  }
  return ["unknown_provider"];
}

function describeWhatsAppSkipReason() {
  if (!truthy(env.whatsappNotificationsEnabled)) {
    return "notifications_flag_off";
  }
  const gaps = getProviderCredentialGaps();
  if (gaps.length) {
    return `provider_not_ready:${gaps.join(",")}`;
  }
  if (!env.adminWhatsappPhone) {
    return "admin_phone_unset";
  }
  if (!toWaApiDigits(env.adminWhatsappPhone)) {
    return "admin_phone_invalid";
  }
  return null;
}

/**
 * Provider + feature flag; does not require admin destination (used for customer messages).
 */
const isWhatsAppProviderReady = () => {
  if (!truthy(env.whatsappNotificationsEnabled)) {
    return false;
  }
  const provider = String(env.whatsappProvider || "").toLowerCase();
  if (!provider) {
    return false;
  }
  if (provider === "meta_cloud") {
    return Boolean(env.whatsappApiToken && env.whatsappPhoneNumberId);
  }
  if (provider === "twilio") {
    return Boolean(
      env.whatsappTwilioAccountSid && env.whatsappApiToken && env.whatsappTwilioFrom
    );
  }
  if (provider === "log") {
    return true;
  }
  return false;
};

const isWhatsAppEnabled = () =>
  isWhatsAppProviderReady() && Boolean(env.adminWhatsappPhone);

/**
 * Twilio expects addresses like `whatsapp:+14155238886`. Env may include `whatsapp:`
 * or omit `+`; this normalizes safely for the Messages API.
 * @param {string} raw
 * @returns {string}
 */
function toTwilioWhatsAppParty(raw) {
  const s0 = String(raw || "").trim();
  if (!s0) {
    return "";
  }
  const inner = s0.replace(/^whatsapp:/i, "").replace(/\s/g, "");
  if (!inner) {
    return "";
  }
  const e164 = inner.startsWith("+") ? inner : `+${inner}`;
  const digitsOnly = e164.replace(/^\+/, "").replace(/\D/g, "");
  if (!digitsOnly.length) {
    return "";
  }
  return `whatsapp:${e164}`;
}

/**
 * Digits without "+" for Meta / Twilio WhatsApp APIs.
 * @param {unknown} input
 * @returns {string | null}
 */
function toWaApiDigits(input) {
  if (input == null || input === "") {
    return null;
  }
  const raw = String(input).trim();
  const local = normalizeIsraeliMobile(raw);
  if (local) {
    return `972${local.slice(1)}`;
  }
  const compact = raw.replace(/\s/g, "");
  if (compact.startsWith("+")) {
    const d = compact.slice(1).replace(/\D/g, "");
    return d.length ? d : null;
  }
  const digitsOnly = compact.replace(/\D/g, "");
  return digitsOnly.length ? digitsOnly : null;
}

const { formatDeliveryAddressLine } = require("../utils/structured-address");
const { getLocalizedProductName, normalizeLang } = require("../utils/product-name");

function orderDisplayLanguage(order) {
  return normalizeLang(order?.orderLegalSnapshot?.acceptedLanguage) || "he";
}

function formatOrderLineName(line, order) {
  const lang = orderDisplayLanguage(order);
  const localized = getLocalizedProductName(line, lang, { warnInDev: false });
  return localized || line?.name || "-";
}

const buildOrderMessage = (order, user) => {
  const orderId = String(order?._id || "");
  const customerName = user?.name || order?.customerName || "-";
  const customerPhone = order?.customerPhone || user?.phone || "-";
  const area = resolveDeliveryAreaLabel(order?.deliveryArea, order?.deliveryAddress?.city, "he");
  const addressLine = formatDeliveryAddressLine(order?.deliveryAddress);
  const total = typeof order?.total === "number" ? order.total : 0;
  const paymentMethod = order?.paymentMethod || "-";
  const orderStatus = order?.orderStatus || "-";
  const adminBaseUrl = env.adminBaseUrl;
  const adminLink = adminBaseUrl ? `${adminBaseUrl.replace(/\/$/, "")}/orders/${orderId}` : "";

  const lines = [
    "New order received",
    `Order ID: ${orderId}`,
    `Customer: ${customerName}`,
    `Phone: ${customerPhone}`,
    `Delivery area: ${area}`,
    ...(addressLine ? [`Address: ${addressLine}`] : []),
    `Total: ${total} ILS`,
    `Payment: ${paymentMethod}`,
    `Status: ${orderStatus}`
  ];
  const itemLines = (order?.items || [])
    .slice(0, 4)
    .map(
      (line) => `${formatOrderLineName(line, order)} x${line.quantity}${line.unit ? ` ${line.unit}` : ""}`
    );
  if (itemLines.length) {
    lines.push(`Items: ${itemLines.join("; ")}`);
  }
  if (order?.hasPreorderItems) {
    lines.push("⚠ Contains preorder/custom platter items");
  }
  const wrapTotal = typeof order?.wrapTotal === "number" ? order.wrapTotal : 0;
  if (wrapTotal > 0) {
    const wrappedItems = (order.items || [])
      .filter((line) => line?.wrap)
      .map((line) => `${formatOrderLineName(line, order)} x${line.quantity}${line.unit ? ` ${line.unit}` : ""}`);
    lines.push(`Wrap fees: ${wrapTotal} ILS`);
    if (wrappedItems.length) {
      lines.push(`Wrap (cling-film): ${wrappedItems.join(", ")}`);
    }
  }
  if (adminLink) {
    lines.push(`Admin: ${adminLink}`);
  }
  return lines.join("\n");
};

function buildCustomerOrderStatusMessage(order, kind) {
  const id = String(order?._id || "");
  if (kind === "on_the_way") {
    return `Your order is on the way. Order #${id}`;
  }
  if (kind === "delivered") {
    return `Your order has been delivered. Order #${id}`;
  }
  if (kind === "cancelled") {
    return `Your order was cancelled. Order #${id}`;
  }
  return `Order update #${id}`;
}

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
  if (!res?.ok) {
    const text = res ? await res.text().catch(() => "") : "";
    const status = res?.status ?? "no_response";
    throw new Error(`Meta WhatsApp Cloud API error ${status}: ${text}`);
  }
};

const sendViaTwilio = async ({ toWaDigits, message }) => {
  const accountSid = env.whatsappTwilioAccountSid;
  const authToken = env.whatsappApiToken;
  const fromNumber = env.whatsappTwilioFrom;
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio WhatsApp credentials are incomplete");
  }
  const fromParty = toTwilioWhatsAppParty(fromNumber);
  const toParty = toTwilioWhatsAppParty(toWaDigits);
  if (!fromParty || !toParty) {
    throw new Error("Twilio WhatsApp From or To address is invalid");
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const params = new URLSearchParams({
    From: fromParty,
    To: toParty,
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
  if (!res?.ok) {
    const text = res ? await res.text().catch(() => "") : "";
    const status = res?.status ?? "no_response";
    throw new Error(`Twilio API error ${status}: ${text}`);
  }
};

async function dispatchWhatsAppText({ toWaDigits, message }) {
  const provider = String(env.whatsappProvider || "").toLowerCase();
  if (!toWaDigits || !message) {
    throw new Error("WhatsApp send requires destination and message");
  }
  // eslint-disable-next-line no-console
  console.info(
    `[whatsapp] dispatch provider=${provider || "(unset)"} to=${maskPhoneForLog(toWaDigits)}`
  );
  if (provider === "meta_cloud") {
    await sendViaMetaCloud({ to: toWaDigits, message });
  } else if (provider === "twilio") {
    await sendViaTwilio({ toWaDigits, message });
  } else if (provider === "log") {
    // eslint-disable-next-line no-console
    console.info("[whatsapp] log provider message preview:", message.split("\n")[0]);
  } else {
    throw new Error(`Unknown WhatsApp provider "${provider}"`);
  }
  // eslint-disable-next-line no-console
  console.info(`[whatsapp] dispatch success provider=${provider} to=${maskPhoneForLog(toWaDigits)}`);
}

/**
 * Low-level transactional send; never throws to caller.
 */
async function sendTransactionalWhatsApp({ toWaDigits, message }) {
  try {
    if (!isWhatsAppProviderReady()) {
      // eslint-disable-next-line no-console
      console.info("[whatsapp] provider disabled or incomplete; skipping message send");
      return { ok: false, reason: "disabled_or_incomplete" };
    }
    if (!toWaDigits || !message) {
      return { ok: false, reason: "invalid_input" };
    }
    await dispatchWhatsAppText({ toWaDigits, message });
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[whatsapp] transactional send failed:", err?.message);
    return { ok: false, error: err?.message };
  }
}

async function sendTransactionalWhatsAppToCustomer({ customerPhone, message }) {
  const digits = toWaApiDigits(customerPhone);
  if (!digits) {
    // eslint-disable-next-line no-console
    console.info("[whatsapp] skip customer message: could not normalize phone");
    return { ok: false, reason: "bad_phone" };
  }
  return sendTransactionalWhatsApp({ toWaDigits: digits, message });
}

/**
 * Notify the business owner of a new order via WhatsApp.
 *
 * Failure here MUST NEVER throw to the caller; we log a safe message and
 * resolve with `{ ok: false }` so order creation always succeeds even when
 * notifications are misconfigured or the provider is down.
 */
const notifyAdminOfNewOrder = async (order, user) => {
  const orderId = String(order?._id || "");
  try {
    // eslint-disable-next-line no-console
    console.info(`[whatsapp] admin new-order notification start orderId=${orderId}`);

    const skipReason = describeWhatsAppSkipReason();
    if (skipReason) {
      // eslint-disable-next-line no-console
      console.info(
        `[whatsapp] admin notification skipped orderId=${orderId} reason=${skipReason} provider=${String(env.whatsappProvider || "").toLowerCase() || "(unset)"}`
      );
      return { ok: false, reason: skipReason };
    }

    const toWaDigits = toWaApiDigits(env.adminWhatsappPhone);
    if (!toWaDigits) {
      // eslint-disable-next-line no-console
      console.warn(
        `[whatsapp] admin phone could not be normalized orderId=${orderId} masked=${maskPhoneForLog(env.adminWhatsappPhone)}`
      );
      return { ok: false, reason: "bad_admin_phone" };
    }

    const message = buildOrderMessage(order, user);
    // eslint-disable-next-line no-console
    console.info(
      `[whatsapp] sending admin new-order orderId=${orderId} provider=${String(env.whatsappProvider || "").toLowerCase()} adminTo=${maskPhoneForLog(toWaDigits)}`
    );
    await dispatchWhatsAppText({ toWaDigits, message });
    // eslint-disable-next-line no-console
    console.info(`[whatsapp] admin new-order sent orderId=${orderId}`);
    return { ok: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[whatsapp] admin new-order failed orderId=${orderId}:`,
      err?.message
    );
    return { ok: false, error: err?.message };
  }
};

function logWhatsAppStartupDiagnostics() {
  const provider = String(env.whatsappProvider || "").toLowerCase() || "(unset)";
  const skipReason = describeWhatsAppSkipReason();
  const adminDigits = env.adminWhatsappPhone ? toWaApiDigits(env.adminWhatsappPhone) : null;
  // eslint-disable-next-line no-console
  console.info(
    "[whatsapp] startup:",
    JSON.stringify({
      notificationsFlag: truthy(env.whatsappNotificationsEnabled),
      provider,
      providerReady: isWhatsAppProviderReady(),
      adminPhoneConfigured: Boolean(env.adminWhatsappPhone),
      adminPhoneNormalized: Boolean(adminDigits),
      adminPhoneMasked: adminDigits ? maskPhoneForLog(adminDigits) : null,
      adminNotificationsEnabled: isWhatsAppEnabled(),
      skipReason: skipReason || null,
      credentialGaps: getProviderCredentialGaps()
    })
  );
}

module.exports = {
  notifyAdminOfNewOrder,
  isWhatsAppEnabled,
  isWhatsAppProviderReady,
  buildOrderMessage,
  buildCustomerOrderStatusMessage,
  toWaApiDigits,
  toTwilioWhatsAppParty,
  sendTransactionalWhatsApp,
  sendTransactionalWhatsAppToCustomer,
  logWhatsAppStartupDiagnostics,
  maskPhoneForLog,
  describeWhatsAppSkipReason
};
