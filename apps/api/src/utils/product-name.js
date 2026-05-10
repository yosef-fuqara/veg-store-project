const LANG_KEYS = ["ar", "he", "en"];

/**
 * Single display string for orders / receipts: English first, then any locale.
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

module.exports = {
  resolveProductNameString,
  toProductNameLocales
};
