const Joi = require("joi");
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/order");
const { ALLOWED_DELIVERY_AREA_KEYS } = require("../constants/delivery");
const { israeliMobileString } = require("./phone.joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const orderIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

// City may be derived from delivery area on the server; street + house number are required.
const deliveryAddressSchema = Joi.object({
  label: Joi.string().trim().max(50).allow("").optional(),
  city: Joi.string().trim().max(80).allow("").optional(),
  street: Joi.string().trim().min(1).max(120).required(),
  houseNumber: Joi.string().trim().max(30).allow("").optional(),
  building: Joi.string().trim().max(50).allow("").optional(),
  apartment: Joi.string().trim().max(50).allow("").optional(),
  floor: Joi.string().trim().max(20).allow("").optional(),
  entrance: Joi.string().trim().max(20).allow("").optional(),
  notes: Joi.string().trim().max(500).allow("").optional(),
  fullAddress: Joi.string().trim().max(500).allow("").optional()
})
  .custom((value, helpers) => {
    const house =
      (typeof value.houseNumber === "string" && value.houseNumber.trim()) ||
      (typeof value.building === "string" && value.building.trim());
    if (!house) {
      return helpers.error("address.houseRequired");
    }
    return value;
  })
  .messages({
    "address.houseRequired": "HOUSE_NUMBER_REQUIRED"
  });

// ISO timestamp only allowed if at least one preorder item is in the cart.
// Backend validates the actual time threshold (>= minAdvanceHours).
const guestCartItemSchema = Joi.alternatives().try(
  Joi.object({
    product: Joi.string().pattern(objectIdRegex).required(),
    quantity: Joi.number().min(0.25).max(500).required(),
    wrap: Joi.boolean().optional()
  }).unknown(false),
  Joi.object({
    product: Joi.string().pattern(objectIdRegex).required(),
    purchaseAmountIls: Joi.number().positive().max(50000).required(),
    wrap: Joi.boolean().optional()
  }).unknown(false)
);

const guestCartItemsSchema = Joi.array().items(guestCartItemSchema).min(1).max(100);

const requiredAcceptTermsField = {
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      "any.only": "TERMS_NOT_ACCEPTED",
      "any.required": "TERMS_NOT_ACCEPTED",
      "boolean.base": "TERMS_NOT_ACCEPTED"
    })
};

// Optional consent fields for authenticated checkout (legal acceptance comes from account).
const optionalConsentFields = {
  acceptTerms: Joi.boolean().optional(),
  marketingConsent: Joi.boolean().optional(),
  saveDetailsConsent: Joi.boolean().optional(),
  joinCustomerClub: Joi.boolean().optional(),
  consentLanguage: Joi.string().valid("he", "ar", "en").optional()
};

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
  customRequest: Joi.string().trim().max(1000).allow("").optional(),
  ...optionalConsentFields
});

const guestCheckoutPreviewSchema = Joi.object({
  items: guestCartItemsSchema.required()
});

const createGuestOrderSchema = createOrderSchema.keys({
  customerName: Joi.string().trim().min(1).max(120).required(),
  customerEmail: Joi.string().trim().email().max(254).allow("").optional(),
  items: guestCartItemsSchema.required(),
  ...requiredAcceptTermsField
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
  guestCheckoutPreviewSchema,
  createGuestOrderSchema,
  updateOrderStatusSchema,
  adminOrderListQuerySchema,
  updateOrderPaymentStatusSchema
};
