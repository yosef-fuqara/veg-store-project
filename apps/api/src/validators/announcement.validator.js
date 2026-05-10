const Joi = require("joi");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const announcementIdParamSchema = Joi.object({
  id: Joi.string().pattern(objectIdRegex).required()
});

const ctaSchema = Joi.object({
  text: Joi.object({
    he: Joi.string().trim().max(80).allow("").optional(),
    en: Joi.string().trim().max(80).allow("").optional(),
    ar: Joi.string().trim().max(80).allow("").optional()
  }).optional(),
  type: Joi.string().valid("none", "product", "category", "custom").required(),
  productId: Joi.string().pattern(objectIdRegex).allow(null, "").optional(),
  categoryId: Joi.string().pattern(objectIdRegex).allow(null, "").optional(),
  url: Joi.string().trim().max(2000).allow("").optional()
}).custom((value, helpers) => {
  const { type } = value;
  const pid = value.productId != null && value.productId !== "" ? String(value.productId) : "";
  const cid = value.categoryId != null && value.categoryId !== "" ? String(value.categoryId) : "";
  const hasPid = objectIdRegex.test(pid);
  const hasCid = objectIdRegex.test(cid);
  const urlStr = typeof value.url === "string" ? value.url.trim() : "";

  if (type === "none") {
    if (hasPid || hasCid || urlStr) {
      return helpers.error("any.invalid", { message: "CTA type none must not set product, category, or url" });
    }
    return value;
  }
  if (type === "product") {
    if (!hasPid) {
      return helpers.error("any.invalid", { message: "product CTA requires productId" });
    }
    if (hasCid) {
      return helpers.error("any.invalid", { message: "product CTA must not set categoryId" });
    }
    if (urlStr) {
      return helpers.error("any.invalid", { message: "product CTA must not set url" });
    }
    return value;
  }
  if (type === "category") {
    if (!hasCid) {
      return helpers.error("any.invalid", { message: "category CTA requires categoryId" });
    }
    if (hasPid) {
      return helpers.error("any.invalid", { message: "category CTA must not set productId" });
    }
    if (urlStr) {
      return helpers.error("any.invalid", { message: "category CTA must not set url" });
    }
    return value;
  }
  if (type === "custom") {
    if (hasPid || hasCid) {
      return helpers.error("any.invalid", { message: "custom CTA must not set productId or categoryId" });
    }
    if (!urlStr) {
      return helpers.error("any.invalid", { message: "custom CTA requires a non-empty url" });
    }
    const lower = urlStr.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
      return helpers.error("any.invalid", { message: "Invalid URL scheme" });
    }
    if (urlStr.startsWith("/") || /^https?:\/\//i.test(urlStr)) {
      return { ...value, url: urlStr };
    }
    if (/^[\w-]+(\/[\w-./?#&=%]*)?$/i.test(urlStr)) {
      return { ...value, url: `/${urlStr}` };
    }
    return helpers.error("any.invalid", { message: "URL must be a path or http(s) link" });
  }
  return value;
});

const createAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required(),
  message: Joi.string().trim().min(1).max(2000).required(),
  buttonText: Joi.string().trim().max(80).allow("").optional(),
  buttonLink: Joi.string().trim().max(2000).allow("").optional(),
  cta: ctaSchema.optional(),
  isActive: Joi.boolean().optional(),
  startsAt: Joi.date().iso().required(),
  endsAt: Joi.date().iso().optional(),
  durationHours: Joi.number().positive().max(8760).optional()
})
  .custom((value, helpers) => {
    const hasEnd = value.endsAt != null;
    const hasDur = value.durationHours != null;
    if (!hasEnd && !hasDur) {
      return helpers.error("any.custom", {
        message: "Provide exactly one of endsAt or durationHours"
      });
    }
    if (hasEnd && hasDur) {
      return helpers.error("any.custom", {
        message: "Provide exactly one of endsAt or durationHours"
      });
    }
    if (hasEnd && new Date(value.endsAt) <= new Date(value.startsAt)) {
      return helpers.error("any.custom", { message: "endsAt must be after startsAt" });
    }
    return value;
  })
  .unknown(false);

const updateAnnouncementSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).optional(),
  message: Joi.string().trim().min(1).max(2000).optional(),
  buttonText: Joi.string().trim().max(80).allow("").optional(),
  buttonLink: Joi.string().trim().max(2000).allow("").optional(),
  cta: ctaSchema.optional(),
  isActive: Joi.boolean().optional(),
  removeImage: Joi.boolean().optional(),
  startsAt: Joi.date().iso().optional(),
  endsAt: Joi.date().iso().optional(),
  durationHours: Joi.number().positive().max(8760).optional()
})
  .min(1)
  .custom((value, helpers) => {
    const hasEnd = value.endsAt != null;
    const hasDur = value.durationHours != null;
    if (hasEnd && hasDur) {
      return helpers.error("any.custom", {
        message: "Provide at most one of endsAt or durationHours"
      });
    }
    const startRef = value.startsAt;
    if (hasEnd && startRef && new Date(value.endsAt) <= new Date(startRef)) {
      return helpers.error("any.custom", { message: "endsAt must be after startsAt" });
    }
    return value;
  })
  .unknown(false);

const setActiveSchema = Joi.object({
  isActive: Joi.boolean().required()
}).unknown(false);

module.exports = {
  announcementIdParamSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  setActiveSchema
};
