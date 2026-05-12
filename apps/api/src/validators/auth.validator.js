const Joi = require("joi");
const { israeliMobileString } = require("./phone.joi");

const passwordSchema = Joi.string().min(8).max(128).required();

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  phone: israeliMobileString,
  email: Joi.string().trim().email().required(),
  password: passwordSchema
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
