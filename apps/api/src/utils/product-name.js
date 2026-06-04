const LANG_KEYS = ["ar", "he", "en"];

const FALLBACK_LANG_ORDER = ["ar", "he", "en"];

/**
 * @param {unknown} lang
 * @returns {"ar" | "he" | "en" | ""}
 */
function normalizeLang(lang) {
  if (lang == null || lang === "") return "";
  const base = String(lang).split("-")[0].toLowerCase();
  return LANG_KEYS.includes(base) ? /** @type {"ar" | "he" | "en"} */ (base) : "";
}

/**
 * Pick localized string: selected language, then ar → he → en.
 * @param {unknown} value
 * @param {string} [currentLanguage]
 * @returns {string}
 */
function getLocalizedText(value, currentLanguage) {
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
    const lang = normalizeLang(currentLanguage);
    if (lang) {
      const primary = pick(lang);
      if (primary) return primary;
    }
    for (const k of FALLBACK_LANG_ORDER) {
      const s = pick(k);
      if (s) return s;
    }
    for (const v of Object.values(o)) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  }

  return "";
}

/**
 * @param {unknown} entity
 * @returns {unknown}
 */
function extractProductNameSource(entity) {
  if (entity == null || typeof entity !== "object") return "";
  const o = /** @type {Record<string, unknown>} */ (entity);

  if (o.nameLocales != null) return o.nameLocales;

  const snap = o.productSnapshot;
  if (snap && typeof snap === "object" && !Array.isArray(snap)) {
    const snapName = /** @type {{ name?: unknown }} */ (snap).name;
    if (snapName != null) return snapName;
  }

  if (o.nameAr != null || o.nameHe != null || o.nameEn != null) {
    return {
      ar: typeof o.nameAr === "string" ? o.nameAr : "",
      he: typeof o.nameHe === "string" ? o.nameHe : "",
      en: typeof o.nameEn === "string" ? o.nameEn : ""
    };
  }

  if (o.name != null) return o.name;
  return "";
}

/**
 * @param {unknown} productOrItem
 * @param {string} [language]
 * @param {{ productId?: string; warnInDev?: boolean }} [options]
 * @returns {string}
 */
function getLocalizedProductName(productOrItem, language, options = {}) {
  const raw = extractProductNameSource(productOrItem);
  const resolved = getLocalizedText(raw, language);
  if (resolved) {
    maybeWarnMissingTranslation(productOrItem, language, raw, options);
    return resolved;
  }
  return "";
}

/**
 * @param {{ name?: unknown } | null | undefined} category
 * @param {string} [language]
 * @returns {string}
 */
function getLocalizedCategoryName(category, language) {
  if (!category) return "";
  return getLocalizedText(category.name, language);
}

/**
 * @param {unknown} productOrItem
 * @param {string} [language]
 * @param {unknown} rawName
 * @param {{ productId?: string; warnInDev?: boolean }} options
 */
function maybeWarnMissingTranslation(productOrItem, language, rawName, options) {
  if (process.env.NODE_ENV === "production") return;
  if (options.warnInDev === false) return;

  const lang = normalizeLang(language);
  if (!lang) return;

  const locales = toProductNameLocales(rawName);
  if (locales[lang]) return;

  const id =
    options.productId ||
    (productOrItem && typeof productOrItem === "object"
      ? String(
          /** @type {{ _id?: unknown; product?: unknown; id?: unknown }} */ (productOrItem)._id ||
            /** @type {{ product?: unknown }} */ (productOrItem).product ||
            /** @type {{ id?: unknown }} */ (productOrItem).id ||
            ""
        )
      : "");

  // eslint-disable-next-line no-console
  console.warn(
    `Missing product ${lang} name${id ? ` for productId: ${id}` : ""}`
  );
}

/**
 * Single display string for legacy order rows: English first, then any locale.
 * @param {unknown} name
 * @returns {string}
 */
function resolveProductNameString(name) {
  if (name == null) return "";
  if (typeof name === "string") {
    return name.trim();
  }
  if (typeof name === "object" && !Array.isArray(name)) {
    const en = typeof name.en === "string" ? name.en.trim() : "";
    if (en) return en;
    for (const k of LANG_KEYS) {
      const v = name[k];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
  }
  return "";
}

/**
 * Normalizes stored name (legacy string or locale object) to { ar, he, en } for APIs.
 * @param {unknown} name
 * @returns {{ ar: string, he: string, en: string }}
 */
function toProductNameLocales(name) {
  if (name == null) return { ar: "", he: "", en: "" };
  if (typeof name === "string") {
    const s = name.trim();
    return { ar: s, he: s, en: s };
  }
  if (typeof name === "object" && !Array.isArray(name)) {
    const ar = typeof name.ar === "string" ? name.ar.trim() : "";
    const he = typeof name.he === "string" ? name.he.trim() : "";
    const en = typeof name.en === "string" ? name.en.trim() : "";
    return { ar, he, en };
  }
  return { ar: "", he: "", en: "" };
}

/**
 * Lowercase haystack of all localized product name strings — for search.
 * @param {unknown} productOrItem
 * @returns {string}
 */
function getProductNameSearchHaystack(productOrItem) {
  const raw = extractProductNameSource(productOrItem);
  const locales = toProductNameLocales(raw);
  const parts = [];
  for (const k of LANG_KEYS) {
    if (locales[k]) parts.push(locales[k]);
  }
  return parts.join(" ").toLowerCase();
}

module.exports = {
  LANG_KEYS,
  normalizeLang,
  getLocalizedText,
  getLocalizedProductName,
  getLocalizedCategoryName,
  extractProductNameSource,
  resolveProductNameString,
  toProductNameLocales,
  getProductNameSearchHaystack
};
