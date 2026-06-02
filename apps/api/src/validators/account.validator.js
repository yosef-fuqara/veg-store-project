const Joi = require("joi");
const { israeliMobileString } = require("./phone.joi");
const { passwordSchema } = require("./auth.validator");

const addressFields = {
  label: Joi.string().trim().max(50).allow(""),
  city: Joi.string().trim().min(1).max(120).required(),
  street: Joi.string().trim().min(1).max(120).required(),
  building: Joi.string().trim().max(50).allow(""),
  apartment: Joi.string().trim().max(50).allow(""),
  notes: Joi.string().trim().max(500).allow("")
};

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80),
  phone: israeliMobileString,
  email: Joi.string().trim().email(),
  preferredLanguage: Joi.string().valid("he", "ar", "en").allow(null)
}).min(1);

const updateMarketingConsentSchema = Joi.object({
  marketingConsentWhatsApp: Joi.boolean().required()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).max(128).required(),
  newPassword: passwordSchema
});

const addressBodySchema = Joi.object(addressFields);

const addressPatchSchema = Joi.object({
  label: Joi.string().trim().max(50).allow(""),
  city: Joi.string().trim().min(1).max(120),
  street: Joi.string().trim().min(1).max(120),
  building: Joi.string().trim().max(50).allow(""),
  apartment: Joi.string().trim().max(50).allow(""),
  notes: Joi.string().trim().max(500).allow("")
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
  changePasswordSchema,
  addressBodySchema,
  addressPatchSchema,
  addressIdParamSchema,
  favoriteProductIdParamSchema
};
