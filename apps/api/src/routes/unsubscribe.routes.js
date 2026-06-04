const express = require("express");
const rateLimit = require("express-rate-limit");
const { unsubscribe, inboundWebhook } = require("../controllers/unsubscribe.controller");
const validate = require("../middlewares/validate.middleware");
const { unsubscribeSchema, inboundMessageSchema } = require("../validators/unsubscribe.validator");
const env = require("../config/env");

const router = express.Router();

const unsubscribeLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: Math.min(20, env.rateLimitMax),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
    code: "RATE_LIMITED"
  }
});

// Public unsubscribe (marketing only).
router.post("/", unsubscribeLimiter, validate(unsubscribeSchema), unsubscribe);

// Inbound WhatsApp/SMS webhook placeholder (keyword-based unsubscribe).
// See controller for provider setup notes. No-op unless a provider posts here.
router.post("/webhook", validate(inboundMessageSchema), inboundWebhook);

module.exports = router;
