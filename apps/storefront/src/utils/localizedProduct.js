const LANG_KEYS = ["he", "ar", "en"];

/**
 * @param {unknown} value - string | { he?, ar?, en? } | null | undefined
 * @param {string} lang - 'he' | 'ar' | 'en'
 */
function pickLocalized(value, lang) {
  if (value == null) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const o = /** @type {Record<string, unknown>} */ (value);
    const tryKeys = [lang, "he", "en", "ar"];
    for (const key of tryKeys) {
      const v = o[key];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    for (const k of LANG_KEYS) {
      const v = o[k];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    return "";
  }

  return String(value);
}

/**
 * @param {{ name?: unknown } | null | undefined} product
 * @param {string} lang
 */
export function getLocalizedProductName(product, lang) {
  if (!product) return "";
  return pickLocalized(product.name, lang);
}

/**
 * @param {{ description?: unknown } | null | undefined} product
 * @param {string} lang
 */
export function getLocalizedProductDescription(product, lang) {
  if (!product) return "";
  return pickLocalized(product.description, lang);
}

/**
 * @param {{ name?: unknown } | null | undefined} category
 * @param {string} lang
 */
export function getLocalizedCategoryName(category, lang) {
  if (!category) return "";
  return pickLocalized(category.name, lang);
}
