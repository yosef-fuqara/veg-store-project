const Joi = require("joi");
const { PRODUCT_UNITS, PRODUCT_STOCK_STATUS } = require("../constants/product");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const productIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().min(2).max(2000).required(),
  price: Joi.number().min(0).required(),
  salePrice: Joi.number().min(0).optional(),
  category: Joi.string().pattern(objectIdRegex).required(),
  unit: Joi.string()
    .valid(...Object.values(PRODUCT_UNITS))
    .required(),
  stockStatus: Joi.string()
    .valid(...Object.values(PRODUCT_STOCK_STATUS))
    .optional(),
  isFeatured: Joi.boolean().optional(),
  isPreorderOnly: Joi.boolean().optional(),
  minAdvanceHours: Joi.number().integer().min(0).max(720).optional(),
  preparationNotes: Joi.string().trim().max(1000).allow("").optional()
}).custom((value, helper) => {
  if (typeof value.salePrice === "number" && value.salePrice > value.price) {
    return helper.message("salePrice must be less than or equal to price");
  }

  return value;
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  description: Joi.string().trim().min(2).max(2000).optional(),
  price: Joi.number().min(0).optional(),
  salePrice: Joi.number().min(0).allow(null).optional(),
  category: Joi.string().pattern(objectIdRegex).optional(),
  unit: Joi.string()
    .valid(...Object.values(PRODUCT_UNITS))
    .optional(),
  stockStatus: Joi.string()
    .valid(...Object.values(PRODUCT_STOCK_STATUS))
    .optional(),
  isFeatured: Joi.boolean().optional(),
  isPreorderOnly: Joi.boolean().optional(),
  minAdvanceHours: Joi.number().integer().min(0).max(720).optional(),
  preparationNotes: Joi.string().trim().max(1000).allow("").optional()
})
  .or(
    "name",
    "description",
    "price",
    "salePrice",
    "category",
    "unit",
    "stockStatus",
    "isFeatured",
    "isPreorderOnly",
    "minAdvanceHours",
    "preparationNotes"
  )
  .custom((value, helper) => {
    if (
      typeof value.salePrice === "number" &&
      typeof value.price === "number" &&
      value.salePrice > value.price
    ) {
      return helper.message("salePrice must be less than or equal to price");
    }

    return value;
  });

const freezeProductSchema = Joi.object({
  isFrozen: Joi.boolean().required()
});

const publicProductQuerySchema = Joi.object({
  category: Joi.string().pattern(objectIdRegex).optional(),
  search: Joi.string().trim().max(120).optional()
});

module.exports = {
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  freezeProductSchema,
  publicProductQuerySchema
};
