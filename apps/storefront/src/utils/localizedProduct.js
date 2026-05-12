/**
 * @param {unknown} value - string | { ar?, he?, en? } | null | undefined
 * @param {string} [currentLanguage] - e.g. 'he' | 'ar' | 'en' (BCP47 prefix ok)
 * @returns {string}
 */
export function getLocalizedText(value, currentLanguage) {
  if (value == null) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    const o = /** @type {Record<string, unknown>} */ (value);
    const pick = (key) => {
      if (!key) return "";
      const v = o[key];
      return typeof v === "string" ? v.trim() : "";
    };
    const lang =
      currentLanguage != null && currentLanguage !== ""
        ? String(currentLanguage).split("-")[0]
        : "";
    const primary = lang ? pick(lang) : "";
    return primary || pick("en") || pick("he") || pick("ar") || "";
  }

  return "";
}

/**
 * @param {{ name?: unknown } | null | undefined} product
 * @param {string} lang
 */
export function getLocalizedProductName(product, lang) {
  if (!product) return "";
  return getLocalizedText(product.name, lang);
}

/**
 * Space-joined lowercase string of all known name locales — for client-side substring search.
 * @param {{ name?: unknown } | null | undefined} product
 */
export function getProductNameSearchHaystack(product) {
  if (!product || typeof product !== "object") return "";
  const n = /** @type {{ name?: unknown }} */ (product).name;
  const parts = [];
  if (typeof n === "string" && n.trim()) {
    parts.push(n.trim());
  } else if (n && typeof n === "object" && !Array.isArray(n)) {
    const o = /** @type {Record<string, unknown>} */ (n);
    for (const k of ["he", "en", "ar"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) parts.push(v.trim());
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * @param {{ description?: unknown } | null | undefined} product
 * @param {string} lang
 */
export function getLocalizedProductDescription(product, lang) {
  if (!product) return "";
  return getLocalizedText(product.description, lang);
}

/**
 * @param {{ name?: unknown } | null | undefined} category
 * @param {string} lang
 */
export function getLocalizedCategoryName(category, lang) {
  if (!category) return "";
  return getLocalizedText(category.name, lang);
}
