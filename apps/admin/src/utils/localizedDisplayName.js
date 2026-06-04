import i18n from "../i18n/index.js";

const FALLBACK_LANG_ORDER = ["ar", "he", "en"];

/**
 * @param {unknown} value - string | { ar?, he?, en? } | null | undefined
 * @param {string} [currentLanguage] - e.g. 'he' | 'en' | 'ar'
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
        ? String(currentLanguage).split("-")[0].toLowerCase()
        : "";

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

function preferredBrowserLanguage() {
  if (typeof navigator !== "undefined" && navigator.language) {
    const p = String(navigator.language).split("-")[0].toLowerCase();
    if (p === "he") return "he";
    if (p === "ar") return "ar";
  }
  return "en";
}

/**
 * Active admin UI language (en | he | ar), aligned with react-i18next.
 * @returns {"en" | "he" | "ar"}
 */
export function getActiveAdminLanguage() {
  try {
    if (i18n?.language) {
      const b = String(i18n.language).split("-")[0].toLowerCase();
      if (b === "he") return "he";
      if (b === "ar") return "ar";
      if (b === "en") return "en";
    }
  } catch {
    /* i18n not ready */
  }
  return preferredBrowserLanguage();
}

function unnamedProductLabel() {
  try {
    const s = i18n.t("common:unnamedProduct", { defaultValue: "" });
    if (typeof s === "string" && s.trim()) return s.trim();
  } catch {
    /* ignore */
  }
  return "Unnamed product";
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
 * Admin list label for product or category names (API may return string or { ar, he, en }).
 * Uses the selected admin language with locale fallbacks; non-product empty → em dash.
 * @param {unknown} name
 * @returns {string}
 */
export function pickLocalizedName(name) {
  const s = getLocalizedText(name, getActiveAdminLanguage());
  return s || "—";
}

/**
 * @param {{ name?: unknown; nameLocales?: unknown; sku?: unknown } | null | undefined} product
 * @param {string} [lang] - defaults to active admin language
 * @returns {string}
 */
export function pickLocalizedProductName(product, lang) {
  if (!product || typeof product !== "object") return unnamedProductLabel();
  const rawName = extractProductNameSource(product);
  const lg = lang != null && lang !== "" ? lang : getActiveAdminLanguage();
  const s = getLocalizedText(rawName, lg);
  if (s) return s;
  const p = /** @type {{ sku?: unknown }} */ (product);
  const sku = p.sku != null && String(p.sku).trim() ? String(p.sku).trim() : "";
  if (sku) return sku;
  return unnamedProductLabel();
}

/**
 * @param {{ ar?: string; he?: string; en?: string }} name
 * @returns {string[]}
 */
export function missingProductNameLocales(name) {
  if (!name || typeof name !== "object" || Array.isArray(name)) return ["ar", "he", "en"];
  const o = /** @type {Record<string, unknown>} */ (name);
  return ["ar", "he", "en"].filter((k) => {
    const v = o[k];
    return typeof v !== "string" || v.trim().length < 2;
  });
}

/**
 * Lowercase haystack of all localized product name strings + SKU — for search.
 * @param {{ name?: unknown; nameLocales?: unknown; sku?: unknown } | null | undefined} product
 */
export function getAdminProductSearchHaystack(product) {
  if (!product || typeof product !== "object") return "";
  const n = extractProductNameSource(product);
  const parts = [];
  if (typeof n === "string" && n.trim()) {
    parts.push(n.trim());
  } else if (n && typeof n === "object" && !Array.isArray(n)) {
    const o = /** @type {Record<string, unknown>} */ (n);
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) parts.push(v.trim());
    }
  }
  const p = /** @type {{ sku?: unknown; code?: unknown }} */ (product);
  const sku = p.sku != null ? String(p.sku) : "";
  if (sku.trim()) parts.push(sku.trim());
  const code = p.code != null ? String(p.code) : "";
  if (code.trim()) parts.push(code.trim());
  return parts.join(" ").toLowerCase();
}

/** Alias aligned with storefront/API naming. */
export const getLocalizedProductName = pickLocalizedProductName;
