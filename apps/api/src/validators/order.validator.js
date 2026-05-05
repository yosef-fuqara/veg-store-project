const Joi = require("joi");
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/order");
const { DELIVERY_ZONE_KEYS } = require("../constants/delivery");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const orderIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

const deliveryAddressSchema = Joi.object({
  label: Joi.string().trim().max(50).allow("").optional(),
  city: Joi.string().trim().min(1).max(80).required(),
  street: Joi.string().trim().min(1).max(120).required(),
  building: Joi.string().trim().max(50).allow("").optional(),
  apartment: Joi.string().trim().max(50).allow("").optional(),
  notes: Joi.string().trim().max(500).allow("").optional()
});

const createOrderSchema = Joi.object({
  deliveryAddress: deliveryAddressSchema.required(),
  deliveryZone: Joi.string()
    .valid(...DELIVERY_ZONE_KEYS)
    .required(),
  customerPhone: Joi.string().trim().min(7).max(20).required(),
  notes: Joi.string().trim().max(1000).allow("").optional(),
  paymentMethod: Joi.string()
    .valid(...Object.values(PAYMENT_METHOD))
    .required()
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
