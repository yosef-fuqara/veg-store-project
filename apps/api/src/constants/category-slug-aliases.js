/**
 * Import / catalog aliases → canonical category slug (lowercase).
 * Extend only; do not remap existing canonical slugs.
 */
const CATEGORY_SLUG_ALIASES = {
  mahashi: "ready-stuffed-vegetables",
  "ready-to-cook-stuffed-vegetables": "ready-stuffed-vegetables",
  "ready-stuffed": "ready-stuffed-vegetables",
  "ready stuffed": "ready-stuffed-vegetables",
  "ready stuffed vegetables": "ready-stuffed-vegetables",
  "stuffed vegetables": "ready-stuffed-vegetables",
  stuffed: "ready-stuffed-vegetables",
  "grape leaves": "ready-stuffed-vegetables",
  "grape-leaves": "ready-stuffed-vegetables",
  "محاشي": "ready-stuffed-vegetables",
  "محاشي جاهزة": "ready-stuffed-vegetables",
  "ממולאים": "ready-stuffed-vegetables",
  "ממולאים מוכנים": "ready-stuffed-vegetables"
};

/**
 * @param {string} raw
 * @returns {string}
 */
function normalizeCategorySlug(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  return CATEGORY_SLUG_ALIASES[lower] || CATEGORY_SLUG_ALIASES[trimmed] || lower;
}

module.exports = {
  CATEGORY_SLUG_ALIASES,
  normalizeCategorySlug
};
