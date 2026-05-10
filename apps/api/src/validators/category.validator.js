const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const categoryIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

const categoryLocaleNameSchema = Joi.object({
  ar: Joi.string().trim().min(2).max(80).required(),
  he: Joi.string().trim().min(2).max(80).required(),
  en: Joi.string().trim().min(2).max(80).required()
});

const createCategorySchema = Joi.object({
  name: categoryLocaleNameSchema.required(),
  description: Joi.string().trim().max(500).allow("").optional(),
  isActive: Joi.boolean().optional(),
  isFrozen: Joi.boolean().optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.alternatives()
    .try(Joi.string().trim().min(2).max(80), categoryLocaleNameSchema)
    .optional(),
  description: Joi.string().trim().max(500).allow("").optional()
})
  .or("name", "description")
  .required();

const freezeCategorySchema = Joi.object({
  isFrozen: Joi.boolean().required()
});

module.exports = {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
  freezeCategorySchema
};
