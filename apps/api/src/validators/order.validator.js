const Joi = require("joi");
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/order");
const { ALLOWED_DELIVERY_AREA_KEYS } = require("../constants/delivery");
const { israeliMobileString } = require("./phone.joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const orderIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

// City is optional from the client: the backend derives it from the selected
// delivery area. If the client sends one, we accept it for compatibility.
const deliveryAddressSchema = Joi.object({
  label: Joi.string().trim().max(50).allow("").optional(),
  city: Joi.string().trim().max(80).allow("").optional(),
  street: Joi.string().trim().min(1).max(120).required(),
  building: Joi.string().trim().max(50).allow("").optional(),
  apartment: Joi.string().trim().max(50).allow("").optional(),
  notes: Joi.string().trim().max(500).allow("").optional()
});

// ISO timestamp only allowed if at least one preorder item is in the cart.
// Backend validates the actual time threshold (>= minAdvanceHours).
const createOrderSchema = Joi.object({
  deliveryAddress: deliveryAddressSchema.required(),
  deliveryArea: Joi.string()
    .valid(...ALLOWED_DELIVERY_AREA_KEYS)
    .required(),
  customerPhone: israeliMobileString,
  notes: Joi.string().trim().max(1000).allow("").optional(),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHOD))
    .required(),
  preferredDeliveryAt: Joi.date().iso().optional(),
  customRequest: Joi.string().trim().max(1000).allow("").optional()
});

const updateOrderStatusSchema = Joi.object({
  orderStatus: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required()
});

const adminOrderListQuerySchema = Joi.object({
  orderStatus: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .optional()
});

const updateOrderPaymentStatusSchema = Joi.object({
  paymentStatus: Joi.string()
    .valid(
      PAYMENT_STATUS.BANK_TRANSFER_APPROVED,
      PAYMENT_STATUS.FAILED,
      PAYMENT_STATUS.CANCELLED
    )
    .required(),
  notes: Joi.string().trim().max(2000).allow("").optional()
});

module.exports = {
  orderIdParamSchema,
  createOrderSchema,
  updateOrderStatusSchema,
  adminOrderListQuerySchema,
  updateOrderPaymentStatusSchema
};
