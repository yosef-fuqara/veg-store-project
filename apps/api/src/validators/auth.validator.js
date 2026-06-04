const Joi = require("joi");
const { israeliMobileString } = require("./phone.joi");

const passwordSchema = Joi.string().min(8).max(128).required();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  phone: israeliMobileString,
  email: Joi.string().trim().email().required(),
  password: passwordSchema,
  // Required acceptance of Terms of Use + Privacy Policy.
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      "any.only": "TERMS_NOT_ACCEPTED",
      "any.required": "TERMS_NOT_ACCEPTED",
      "boolean.base": "TERMS_NOT_ACCEPTED"
    }),
  // Legacy flag (kept for backward compatibility) + new structured consents.
  marketingConsentWhatsApp: Joi.boolean().default(false),
  marketingConsent: Joi.boolean().default(false),
  saveDetailsConsent: Joi.boolean().default(false),
  joinCustomerClub: Joi.boolean().default(false),
  consentLanguage: Joi.string().valid("he", "ar", "en").optional()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required()
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(1).max(512).required(),
  newPassword: passwordSchema
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordSchema
};
