const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const addCartItemSchema = Joi.object({
  productId: Joi.string().pattern(objectIdRegex).required(),
  quantity: Joi.number().integer().min(1).max(100).default(1)
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(100).required()
});

const cartItemParamSchema = Joi.object({
  productId: Joi.string().pattern(objectIdRegex).required()
});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamSchema
};
