const Joi = require("joi");

// Public unsubscribe: phone and/or email; at least one required.
const unsubscribeSchema = Joi.object({
  phone: Joi.string().trim().max(20).allow("").optional(),
  email: Joi.string().trim().email().max(254).allow("").optional()
})
  .or("phone", "email")
  .messages({
    "object.missing": "PHONE_OR_EMAIL_REQUIRED"
  });

// Inbound WhatsApp/SMS webhook (provider-agnostic placeholder shape).
const inboundMessageSchema = Joi.object({
  from: Joi.string().trim().max(40).optional(),
  phone: Joi.string().trim().max(40).optional(),
  text: Joi.string().allow("").max(2000).optional(),
  body: Joi.string().allow("").max(2000).optional(),
  channel: Joi.string().valid("whatsapp", "sms").optional()
}).unknown(true);

module.exports = { unsubscribeSchema, inboundMessageSchema };
