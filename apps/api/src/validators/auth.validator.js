const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  phone: Joi.string().trim().min(7).max(20).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required()
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(128).required()
});

module.exports = { registerSchema, loginSchema };
