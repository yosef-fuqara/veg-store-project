const Joi = require("joi");
const { israeliMobileString } = require("./phone.joi");
const { passwordSchema } = require("./auth.validator");
const { ALLOWED_DELIVERY_AREA_KEYS } = require("../constants/delivery");

const addressFields = {
  label: Joi.string().trim().max(50).allow(""),
  city: Joi.string().trim().min(1).max(120).required(),
  cityKey: Joi.string()
    .trim()
    .valid(...ALLOWED_DELIVERY_AREA_KEYS)
    .required()
    .messages({
      "any.only": "UNSUPPORTED_DELIVERY_CITY",
      "any.required": "CITY_MUST_BE_FROM_LIST"
    }),
  cityId: Joi.string().trim().max(80).allow("").optional(),
  citySlug: Joi.string().trim().max(80).allow("").optional(),
  street: Joi.string().trim().min(1).max(120).required(),
  houseNumber: Joi.string().trim().max(30).allow(""),
  building: Joi.string().trim().max(50).allow(""),
  apartment: Joi.string().trim().max(50).allow(""),
  floor: Joi.string().trim().max(20).allow(""),
  entrance: Joi.string().trim().max(20).allow(""),
  notes: Joi.string().trim().max(500).allow(""),
  fullAddress: Joi.string().trim().max(500).allow("")
};

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80),
  phone: israeliMobileString,
  email: Joi.string().trim().email(),
  preferredLanguage: Joi.string().valid("he", "ar", "en").allow(null)
}).min(1);

const updateMarketingConsentSchema = Joi.object({
  // Either key may be sent; at least one boolean is required.
  marketingConsentWhatsApp: Joi.boolean(),
  marketingConsent: Joi.boolean(),
  consentLanguage: Joi.string().valid("he", "ar", "en").optional()
}).or("marketingConsentWhatsApp", "marketingConsent");

const customerClubJoinSchema = Joi.object({
  consentLanguage: Joi.string().valid("he", "ar", "en").optional()
});

const savedDetailsConsentSchema = Joi.object({
  saveForNextOrder: Joi.boolean().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).max(128).required(),
  newPassword: passwordSchema
});

const addressBodySchema = Joi.object(addressFields).custom((value, helpers) => {
  const house =
    (typeof value.houseNumber === "string" && value.houseNumber.trim()) ||
    (typeof value.building === "string" && value.building.trim());
  if (!house) {
    return helpers.error("address.houseRequired");
  }
  return value;
});

const addressPatchSchema = Joi.object({
  label: Joi.string().trim().max(50).allow(""),
  city: Joi.string().trim().min(1).max(120),
  cityKey: Joi.string()
    .trim()
    .valid(...ALLOWED_DELIVERY_AREA_KEYS)
    .messages({ "any.only": "UNSUPPORTED_DELIVERY_CITY" }),
  cityId: Joi.string().trim().max(80).allow("").optional(),
  citySlug: Joi.string().trim().max(80).allow("").optional(),
  street: Joi.string().trim().min(1).max(120),
  houseNumber: Joi.string().trim().max(30).allow(""),
  building: Joi.string().trim().max(50).allow(""),
  apartment: Joi.string().trim().max(50).allow(""),
  floor: Joi.string().trim().max(20).allow(""),
  entrance: Joi.string().trim().max(20).allow(""),
  notes: Joi.string().trim().max(500).allow(""),
  fullAddress: Joi.string().trim().max(500).allow("")
}).min(1);

const addressIdParamSchema = Joi.object({
  addressId: Joi.string().hex().length(24).required()
});

const favoriteProductIdParamSchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
});

module.exports = {
  updateProfileSchema,
  updateMarketingConsentSchema,
  customerClubJoinSchema,
  savedDetailsConsentSchema,
  changePasswordSchema,
  addressBodySchema,
  addressPatchSchema,
  addressIdParamSchema,
  favoriteProductIdParamSchema
};
