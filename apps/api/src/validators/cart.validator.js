const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const MAX_PURCHASE_AMOUNT_ILS = 50000;

// Either integer quantity (classic) or purchase by ILS amount — never both.
const addCartItemSchema = Joi.alternatives().try(
  Joi.object({
    productId: Joi.string().pattern(objectIdRegex).required(),
    quantity: Joi.number().integer().min(1).max(100).required(),
    wrap: Joi.boolean().optional()
  }).unknown(false),
  Joi.object({
    productId: Joi.string().pattern(objectIdRegex).required(),
    purchaseAmountIls: Joi.number().positive().max(MAX_PURCHASE_AMOUNT_ILS).required(),
    wrap: Joi.boolean().optional()
  }).unknown(false)
);

// Both fields are optional individually so the customer can toggle the wrap
// service without changing the quantity, but at least one must be present so
// the request actually changes something.
const updateCartItemSchema = Joi.object({
  quantity: Joi.number().min(0.01).max(100000).optional(),
  purchaseAmountIls: Joi.number().positive().max(MAX_PURCHASE_AMOUNT_ILS).optional(),
  wrap: Joi.boolean().optional()
})
  .or("quantity", "wrap", "purchaseAmountIls")
  .nand("quantity", "purchaseAmountIls")
  .unknown(false);

const cartItemParamSchema = Joi.object({
  productId: Joi.string().pattern(objectIdRegex).required()
});

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamSchema
};
