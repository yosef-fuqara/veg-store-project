/**
 * @param {unknown} value - string | { ar?, he?, en? } | null | undefined
 * @param {string} [currentLanguage] - e.g. 'he' | 'ar' | 'en'
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

function preferredAdminLanguage() {
  if (typeof navigator !== "undefined" && navigator.language) {
    const p = String(navigator.language).split("-")[0].toLowerCase();
    if (p === "he" || p === "ar" || p === "en") return p;
  }
  return "en";
}

/**
 * Admin list/fallback label for product or category names (API may return string or { ar, he, en }).
 * Uses the browser language when ar/he/en; otherwise falls back to English.
 * @param {unknown} name
 * @returns {string}
 */
export function pickLocalizedName(name) {
  const s = getLocalizedText(name, preferredAdminLanguage());
  return s || "—";
}
