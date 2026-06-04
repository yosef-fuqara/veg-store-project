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
        ? String(currentLanguage).split("-")[0].toLowerCase()
        : "";
    if (lang) {
      const primary = pick(lang);
      if (primary) return primary;
    }
    for (const k of ["ar", "he", "en"]) {
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

const warnedMissing = new Set();

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

function unnamedProductLabel() {
  return "Unnamed product";
}

function maybeWarnMissingTranslation(productOrItem, lang, rawName) {
  if (typeof import.meta !== "undefined" && import.meta.env && !import.meta.env.DEV) return;
  const normalized = lang != null && lang !== "" ? String(lang).split("-")[0].toLowerCase() : "";
  if (!normalized || !["ar", "he", "en"].includes(normalized)) return;

  const locales =
    rawName && typeof rawName === "object" && !Array.isArray(rawName)
      ? /** @type {Record<string, string>} */ (rawName)
      : null;
  if (locales && typeof locales[normalized] === "string" && locales[normalized].trim()) return;

  const id =
    productOrItem && typeof productOrItem === "object"
      ? String(
          /** @type {{ _id?: unknown; product?: unknown; id?: unknown }} */ (productOrItem)._id ||
            /** @type {{ product?: unknown }} */ (productOrItem).product ||
            /** @type {{ id?: unknown }} */ (productOrItem).id ||
            ""
        )
      : "";
  const key = `${id}:${normalized}`;
  if (warnedMissing.has(key)) return;
  warnedMissing.add(key);
  // eslint-disable-next-line no-console
  console.warn(`Missing product ${normalized} name${id ? ` for productId: ${id}` : ""}`);
}

/**
 * @param {unknown} productOrItem - product, cart line, order line, or checkout preview row
 * @param {string} lang
 * @returns {string}
 */
export function getLocalizedProductName(productOrItem, lang) {
  const raw = extractProductNameSource(productOrItem);
  const resolved = getLocalizedText(raw, lang);
  if (resolved) {
    maybeWarnMissingTranslation(productOrItem, lang, raw);
    return resolved;
  }

  if (productOrItem && typeof productOrItem === "object") {
    const legacy = /** @type {{ name?: unknown }} */ (productOrItem).name;
    if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  }

  return unnamedProductLabel();
}

/**
 * Space-joined lowercase string of all known name locales — for client-side substring search.
 * @param {{ name?: unknown } | null | undefined} product
 */
export function getProductNameSearchHaystack(product) {
  if (!product || typeof product !== "object") return "";
  const raw = extractProductNameSource(product);
  const parts = [];
  if (typeof raw === "string" && raw.trim()) {
    parts.push(raw.trim());
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = /** @type {Record<string, unknown>} */ (raw);
    for (const k of ["ar", "he", "en"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) parts.push(v.trim());
    }
  }
  return parts.join(" ").toLowerCase();
}

/**
 * @param {string} lang
 * @returns {"rtl" | "ltr"}
 */
export function textDirectionForLang(lang) {
  const base = lang != null && lang !== "" ? String(lang).split("-")[0].toLowerCase() : "he";
  return base === "en" ? "ltr" : "rtl";
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
  if (typeof category === "string") return category.trim();
  return getLocalizedText(category.name ?? category, lang);
}
