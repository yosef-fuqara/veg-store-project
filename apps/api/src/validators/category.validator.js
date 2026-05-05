const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const categoryIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  description: Joi.string().trim().max(500).allow("").optional()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
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
