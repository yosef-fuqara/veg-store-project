const Joi = require("joi");
const { normalizeIsraeliMobile } = require("../utils/israeliMobilePhone");

/** Trims, validates, and replaces value with normalized local Israeli mobile (05xxxxxxxx). */
const israeliMobileString = Joi.string()
  .trim()
  .required()
  .custom((value) => {
    const normalized = normalizeIsraeliMobile(value);
    if (!normalized) {
      throw new Error("Please enter a valid Israeli mobile number");
    }
    return normalized;
  });

module.exports = { israeliMobileString };
