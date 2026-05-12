const Joi = require("joi");

const localizedOptionalSchema = Joi.object({
  he: Joi.string().trim().max(200).allow("").optional(),
  en: Joi.string().trim().max(200).allow("").optional(),
  ar: Joi.string().trim().max(200).allow("").optional()
})
  .optional()
  .unknown(false);

const localizedMessageSchema = Joi.object({
  he: Joi.string().trim().max(2000).allow("").optional(),
  en: Joi.string().trim().max(2000).allow("").optional(),
  ar: Joi.string().trim().max(2000).allow("").optional()
})
  .optional()
  .unknown(false);

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const patchAdminStoreSettingsSchema = Joi.object({
  isStoreOpen: Joi.boolean().optional(),
  closedTitle: localizedOptionalSchema,
  closedMessage: localizedMessageSchema,
  reopenAt: Joi.alternatives().try(Joi.date(), Joi.valid(null)).optional(),
  showWhatsappButton: Joi.boolean().optional(),
  operatingHoursEnabled: Joi.boolean().optional(),
  operatingTimezone: Joi.string().trim().max(80).optional(),
  operatingOpenLocal: Joi.string().trim().pattern(HHMM_RE).optional(),
  operatingCloseLocal: Joi.string().trim().pattern(HHMM_RE).optional()
})
  .min(1)
  .unknown(false);

module.exports = {
  patchAdminStoreSettingsSchema
};
