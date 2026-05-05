const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const placeholderWebhookSchema = Joi.object({
  orderId: Joi.string().pattern(objectIdRegex).required(),
  providerEventId: Joi.string().trim().min(1).max(200).required(),
  outcome: Joi.string().valid("succeeded", "failed", "cancelled").required()
});

module.exports = {
  placeholderWebhookSchema
};
