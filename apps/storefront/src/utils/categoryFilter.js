/**
 * Client-side category matching for storefront UI only.
 * Matches API category slug and multilingual names against known shop groupings.
 */

/** @typedef {'fruits' | 'vegetables' | 'platters' | 'juices'} CategoryNavId */

/** @type {CategoryNavId[]} */
export const CATEGORY_NAV_IDS = ['fruits', 'vegetables', 'platters', 'juices'];

/** @param {unknown} category */
function categoryHaystack(category) {
  if (category == null) return '';
  const parts = [];
  if (typeof category === 'string') {
    parts.push(category);
    return parts.join(' ').toLowerCase();
  }
  if (typeof category !== 'object') return '';
  const c = /** @type {{ slug?: string, name?: unknown }} */ (category);
  if (typeof c.slug === 'string' && c.slug.trim()) parts.push(c.slug);
  const n = c.name;
  if (typeof n === 'string' && n.trim()) parts.push(n);
  else if (n && typeof n === 'object' && !Array.isArray(n)) {
    for (const k of ['he', 'en', 'ar']) {
      const v = /** @type {Record<string, unknown>} */ (n)[k];
      if (typeof v === 'string' && v.trim()) parts.push(v);
    }
  }
  return parts.join(' ').toLowerCase();
}

/** @type {Record<CategoryNavId, { slugs: string[], needles: string[] }>} */
const RULES = {
  fruits: {
    slugs: ['fruit', 'fruits', 'פירות', 'פרי'],
    needles: ['fruit', 'fruits', 'פירות', 'פרי', 'فواكه', 'فاكهة'],
  },
  vegetables: {
    slugs: ['vegetable', 'vegetables', 'veggie', 'veggies', 'ירקות', 'ירק'],
    needles: ['vegetable', 'vegetables', 'veggie', 'ירקות', 'ירק', 'خضار', 'خضروات'],
  },
  platters: {
    slugs: ['platter', 'platters', 'sliced', 'plate', 'מגש', 'מגשים'],
    needles: ['platter', 'platters', 'sliced', 'plate', 'מגש', 'لوحة', 'شرائح'],
  },
  juices: {
    slugs: ['juice', 'juices', 'drink', 'drinks', 'beverage', 'smoothie', 'מיץ', 'מיצים'],
    needles: ['juice', 'juices', 'drink', 'beverage', 'smoothie', 'מיץ', 'מיצים', 'عصير', 'مشروب', 'שתייה'],
  },
};

/**
 * @param {unknown} product
 * @param {CategoryNavId} navId
 */
export function productMatchesCategoryNav(product, navId) {
  const rule = RULES[navId];
  if (!rule || !product || typeof product !== 'object') return false;
  const cat = /** @type {{ category?: unknown }} */ (product).category;
  const hay = categoryHaystack(cat);
  if (!hay) return false;
  for (const s of rule.slugs) {
    if (hay.includes(s.toLowerCase())) return true;
  }
  for (const needle of rule.needles) {
    if (hay.includes(needle.toLowerCase())) return true;
  }
  return false;
}
