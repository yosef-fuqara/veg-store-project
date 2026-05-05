/**
 * Placeholder payment provider for development and tests.
 * Uses JSON webhooks verified with header x-payment-webhook-secret.
 *
 * Real gateways (Stripe, Tranzila, etc.) should implement the same exports:
 * verifyWebhookRequest, parseWebhookPayload. They often need express.raw()
 * on the webhook route only — mount that router before express.json() in app.js.
 */
const crypto = require("crypto");
const { StatusCodes } = require("http-status-codes");
const AppError = require("../../../utils/app-error");

const PROVIDER_NAME = "placeholder";

function timingSafeEqualStr(a, b) {
  const ha = crypto.createHash("sha256").update(String(a), "utf8").digest();
  const hb = crypto.createHash("sha256").update(String(b), "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

function verifyWebhookRequest(req, secret) {
  if (!secret) {
    throw new AppError("Payment webhook is not configured", StatusCodes.INTERNAL_SERVER_ERROR);
  }
  const headerVal = req.get("x-payment-webhook-secret");
  if (!headerVal || !timingSafeEqualStr(headerVal, secret)) {
    throw new AppError("Invalid webhook secret", StatusCodes.UNAUTHORIZED);
  }
}

/**
 * @param {object} payload - Already validated by Joi (orderId, providerEventId, outcome).
 * @returns {{ orderId: string, providerEventId: string, outcome: string, rawPayload: object }}
 */
function parseWebhookPayload(payload) {
  return {
    orderId: payload.orderId,
    providerEventId: payload.providerEventId,
    outcome: payload.outcome,
    rawPayload: payload
  };
}

module.exports = {
  PROVIDER_NAME,
  verifyWebhookRequest,
  parseWebhookPayload
};
