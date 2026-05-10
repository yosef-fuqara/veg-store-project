/**
 * Storefront category bridge: fixed customer nav slots (labels + icons in CategoryNav)
 * are wired to admin/backend categories by slug (and legacy “combined” rules).
 *
 * Customer-facing copy lives in i18n (`home.categories.*`), not here.
 *
 * | Nav slot (i18n key) | Example label (he)     | Typical API slug (en name → slug) |
 * |--------------------|------------------------|-----------------------------------|
 * | fruits             | פירות                  | fruits, fruit                     |
 * | vegetables         | ירקות                  | vegetables, vegetable           |
 * | herbs              | עשבי תיבול             | herbs, herb                       |
 * | spices             | תבלינים                | spices, spice                     |
 * | platters           | מגשי פירות…            | platters, platter               |
 * | other              | מוצרים נוספים          | (not slug-mapped — complement)   |
 *
 * Adding a category in admin:
 * - Prefer English names so the API slug stays predictable (slug derives from `en`, then `ar`/`he`).
 * - To attach to a nav slot, use a slug listed below OR add the new slug to the right array.
 * - Categories whose slug is not listed are still mapped when their name/slug matches the keyword
 *   rules in `categoryFilter.js` (same as legacy matching), so e.g. "עשבי תיבול" is not stuck in "other".
 * - New storefront nav icons/labels require a UI change; only extend slug lists here for the same six slots.
 */

import {
  CATEGORY_NAV_IDS,
  categoryHaystack,
  inferPrimaryNavIdFromCategoryRecord,
  isLegacyCombinedHaystack,
  productMatchesCategoryNav,
} from "./categoryFilter";

/** @typedef {import('./categoryFilter').CategoryNavId} CategoryNavId */

/** Nav keys that map to concrete backend categories (not `other`). */
export const PRIMARY_NAV_IDS = /** @type {const} */ ([
  "fruits",
  "vegetables",
  "herbs",
  "spices",
  "platters",
]);

/**
 * Backend slug allowlists per nav slot (lowercase exact match on `category.slug`).
 * Keep in sync with how `apps/api` builds slugs from category names (English first).
 */
export const BACKEND_SLUGS_BY_NAV = {
  fruits: [
    "fruit",
    "fruits",
    "seed-fruits",
    "פירות",
  ],
  vegetables: [
    "vegetable",
    "vegetables",
    "veggie",
    "veggies",
    "seed-vegetables",
    "ירקות",
  ],
  herbs: ["herb", "herbs", "עשבי-תיבול"],
  spices: ["spice", "spices", "baharat", "תבלינים"],
  platters: ["platter", "platters", "sliced", "fruit-platter", "מגש", "מגשים"],
};

const OBJECT_ID_LIKE = /^[0-9a-fA-F]{24}$/;

/** @param {unknown} product */
export function getProductCategoryId(product) {
  if (!product || typeof product !== "object") return null;
  const cat = /** @type {{ category?: unknown }} */ (product).category;
  if (cat == null) return null;
  if (typeof cat === "string" && OBJECT_ID_LIKE.test(cat)) return String(cat);
  if (typeof cat === "object" && /** @type {{ _id?: unknown }} */ (cat)._id != null) {
    return String(/** @type {{ _id?: unknown }} */ (cat)._id);
  }
  return null;
}

/**
 * @param {Array<{ _id: string, slug?: string, name?: unknown }>} categories
 * @param {boolean} categoriesRequestOk
 */
export function buildNavCategoryResolution(categories, categoriesRequestOk) {
  /** @type {Record<string, Set<string>>} */
  const idsByNav = {};
  for (const id of CATEGORY_NAV_IDS) {
    idsByNav[id] = new Set();
  }

  const list = Array.isArray(categories) ? categories : [];

  for (const cat of list) {
    if (!cat || typeof cat !== "object") continue;
    const id = /** @type {{ _id?: unknown }} */ (cat)._id;
    if (id == null) continue;
    const idStr = String(id);
    const slug = typeof cat.slug === "string" ? cat.slug.trim().toLowerCase() : "";
    const hay = categoryHaystack(cat);

    if (isLegacyCombinedHaystack(hay) || isLegacyCombinedHaystack(slug)) {
      idsByNav.herbs.add(idStr);
      continue;
    }

    for (const navId of PRIMARY_NAV_IDS) {
      const allowed = BACKEND_SLUGS_BY_NAV[/** @type {keyof typeof BACKEND_SLUGS_BY_NAV} */ (navId)];
      if (allowed?.includes(slug)) {
        idsByNav[navId].add(idStr);
      }
    }
  }

  for (const cat of list) {
    if (!cat || typeof cat !== "object") continue;
    const id = /** @type {{ _id?: unknown }} */ (cat)._id;
    if (id == null) continue;
    const idStr = String(id);
    let inAnyPrimary = false;
    for (const navId of PRIMARY_NAV_IDS) {
      if (idsByNav[navId].has(idStr)) {
        inAnyPrimary = true;
        break;
      }
    }
    if (inAnyPrimary) continue;

    const inferred = inferPrimaryNavIdFromCategoryRecord(cat);
    if (inferred) {
      idsByNav[inferred].add(idStr);
    }
  }

  const primaryUnion = new Set();
  for (const navId of PRIMARY_NAV_IDS) {
    for (const x of idsByNav[navId]) primaryUnion.add(x);
  }

  /** @type {Record<string, boolean>} */
  const navHasResolvedIds = {};
  for (const navId of CATEGORY_NAV_IDS) {
    navHasResolvedIds[navId] = idsByNav[navId].size > 0;
  }

  const hasPrimaryMapping = primaryUnion.size > 0;

  return {
    categoriesRequestOk,
    hasPrimaryMapping,
    idsByNav,
    primaryUnion,
    navHasResolvedIds,
  };
}

/**
 * @param {unknown} product
 * @param {CategoryNavId} navId
 * @param {ReturnType<typeof buildNavCategoryResolution>} resolution
 */
export function productMatchesStorefrontCategoryNav(product, navId, resolution) {
  const {
    categoriesRequestOk,
    hasPrimaryMapping,
    idsByNav,
    primaryUnion,
    navHasResolvedIds,
  } = resolution;

  const catId = getProductCategoryId(product);
  const useIdLayer = categoriesRequestOk && hasPrimaryMapping;

  if (navId === "other") {
    if (!useIdLayer) {
      return productMatchesCategoryNav(product, "other");
    }
    if (!catId) return true;
    return !primaryUnion.has(catId);
  }

  // When the catalog is wired to backend categories, a product with a category
  // must appear only under nav slot(s) that map to that category _id — never
  // via keyword heuristics on the category text (avoids one DB category matching
  // multiple tabs, e.g. broad names or shared substrings).
  if (useIdLayer && catId) {
    return Boolean(idsByNav[navId]?.has(catId));
  }

  if (!categoriesRequestOk || !navHasResolvedIds[navId]) {
    return productMatchesCategoryNav(product, navId);
  }

  return false;
}
