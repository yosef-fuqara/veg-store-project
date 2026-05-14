import i18n from "../i18n/index.js";

/**
 * @param {unknown} value - string | { ar?, he?, en? } | null | undefined
 * @param {string} [currentLanguage] - e.g. 'he' | 'en' (also accepts 'ar' for locale object keys on entities)
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

    /** @type {string[]} */
    const chain = [];
    if (lang) chain.push(lang);
    for (const k of ["en", "he", "ar"]) {
      if (k !== lang) chain.push(k);
    }
    for (const k of chain) {
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
  }
  return "en";
}

/**
 * Active admin UI language (en | he), aligned with react-i18next.
 * @returns {"en" | "he"}
 */
export function getActiveAdminLanguage() {
  try {
    if (i18n?.language) {
      const b = String(i18n.language).split("-")[0].toLowerCase();
      if (b === "he") return "he";
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
  const p = /** @type {{ name?: unknown; nameLocales?: unknown; sku?: unknown }} */ (product);
  const rawName = p.nameLocales != null ? p.nameLocales : p.name;
  const lg = lang != null && lang !== "" ? lang : getActiveAdminLanguage();
  const s = getLocalizedText(rawName, lg);
  if (s) return s;
  const sku = p.sku != null && String(p.sku).trim() ? String(p.sku).trim() : "";
  if (sku) return sku;
  return unnamedProductLabel();
}

/**
 * Lowercase haystack of all localized product name strings + SKU — for search.
 * @param {{ name?: unknown; nameLocales?: unknown; sku?: unknown } | null | undefined} product
 */
export function getAdminProductSearchHaystack(product) {
  if (!product || typeof product !== "object") return "";
  const p = /** @type {{ name?: unknown; nameLocales?: unknown; sku?: unknown }} */ (product);
  const n = p.nameLocales != null ? p.nameLocales : p.name;
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
  const sku = p.sku != null ? String(p.sku) : "";
  if (sku.trim()) parts.push(sku.trim());
  return parts.join(" ").toLowerCase();
}
