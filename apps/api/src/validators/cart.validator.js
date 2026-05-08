const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const addCartItemSchema = Joi.object({
  productId: Joi.string().pattern(objectIdRegex).required(),
  quantity: Joi.number().integer().min(1).max(100).default(1),
  wrap: Joi.boolean().optional()
});

// Both fields are optional individually so the customer can toggle the wrap
// service without changing the quantity, but at least one must be present so
// the request actually changes something.
const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).optional(),
  wrap: Joi.boolean().optional()
}).or("quantity", "wrap");

const cartItemParamSchema = Joi.object({
  productId: Joi.string().pattern(objectIdRegex).required()
});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamSchema
};
