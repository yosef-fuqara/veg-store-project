const { StatusCodes } = require("http-status-codes");
const { unsubscribeMarketing } = require("../services/marketing-unsubscribe.service");
const { isUnsubscribeMessage } = require("../constants/marketing-keywords");

/**
 * Public unsubscribe by phone and/or email. Affects marketing only.
 * Returns a generic success response regardless of whether a record matched,
 * to avoid leaking which contacts exist.
 */
const unsubscribe = async (req, res, next) => {
  try {
    await unsubscribeMarketing({
      phone: req.body.phone,
      email: req.body.email,
      source: "unsubscribe_page"
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "UNSUBSCRIBED"
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Placeholder inbound WhatsApp/SMS webhook.
 *
 * Provider setup required (not wired by default):
 *  - Configure your WhatsApp/SMS provider (e.g. Twilio, 360dialog, Meta Cloud
 *    API) to POST inbound messages to:  POST {API_BASE}/unsubscribe/webhook
 *  - Map the provider payload to { from|phone, text|body, channel }.
 *  - Add provider signature verification before enabling in production.
 *
 * This endpoint only reacts to recognized unsubscribe keywords and never sends
 * messages itself, so it cannot interfere with existing order notifications.
 */
const inboundWebhook = async (req, res, next) => {
  try {
    const body = req.body || {};
    const text = body.text || body.body || "";
    const phone = body.from || body.phone || "";
    const channel = body.channel === "sms" ? "sms" : "whatsapp";

    if (!isUnsubscribeMessage(text)) {
      // Not an unsubscribe request — acknowledge so the provider does not retry.
      return res.status(StatusCodes.OK).json({ success: true, action: "ignored" });
    }

    await unsubscribeMarketing({
      phone,
      source: channel === "sms" ? "sms_reply" : "whatsapp_reply"
    });

    return res.status(StatusCodes.OK).json({ success: true, action: "unsubscribed" });
  } catch (error) {
    return next(error);
  }
};

module.exports = { unsubscribe, inboundWebhook };
