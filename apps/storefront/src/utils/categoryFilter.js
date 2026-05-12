/**
 * Client-side category matching for storefront UI only.
 * Matches API category slug and multilingual names against known shop groupings.
 */

/** @typedef {'fruits' | 'vegetables' | 'herbs' | 'spices' | 'platters' | 'pickles' | 'natural-juices' | 'other'} CategoryNavId */

/** @type {CategoryNavId[]} */
export const CATEGORY_NAV_IDS = ['fruits', 'vegetables', 'herbs', 'spices', 'platters', 'pickles', 'natural-juices', 'other'];

/** @param {unknown} category */
export function categoryHaystack(category) {
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

/** @type {Record<'fruits' | 'vegetables' | 'herbs' | 'spices' | 'platters' | 'pickles' | 'natural-juices', { slugs: string[], needles: string[] }>} */
const RULES = {
  fruits: {
    slugs: ['fruit', 'fruits', 'פירות', 'פרי'],
    needles: ['fruit', 'fruits', 'פירות', 'פרי', 'فواكه', 'فاكهة'],
  },
  vegetables: {
    slugs: ['vegetable', 'vegetables', 'veggie', 'veggies', 'ירקות', 'ירק'],
    needles: ['vegetable', 'vegetables', 'veggie', 'ירקות', 'ירק', 'خضار', 'خضروات'],
  },
  herbs: {
    slugs: ['herb', 'herbs', 'עשבי-תיבול', 'עשבי תיבול'],
    needles: [
      'herb',
      'herbs',
      'cilantro',
      'parsley',
      'basil',
      'mint',
      'dill',
      'rosemary',
      'thyme',
      'oregano',
      'chives',
      'sage',
      'עשבי תיבול',
      'כוסברה',
      'נענע',
      'שמיר',
      'פטרוזיליה',
      'בזיליקום',
      'רוזמרין',
      'אורגנו',
      'תימין',
      'בצל ירוק',
      'אסטור',
      'أعشاب',
      'بقدونس',
      'نعناع',
      'ريحان',
      'شبت',
      'زعتر',
      'حبق',
      // Legacy combined category (until DB migration reassigns products)
      'herbs & spices',
      'herbs and spices',
      'עשבי תיבול ותבלינים',
      'أعشاب وتوابل',
    ],
  },
  spices: {
    slugs: ['spice', 'spices', 'baharat', 'بهارات', 'תבלינים'],
    needles: [
      'spice',
      'spices',
      'seasoning',
      'תבלין',
      'תבלינים',
      'بهارات',
      'توابل',
      'baharat',
      'bahar',
      'cumin',
      'paprika',
      'cinnamon',
      'turmeric',
      'curry powder',
      'nutmeg',
      'clove',
      'cardamom',
      'sumac',
      'zaatar',
      "za'atar",
    ],
  },
  platters: {
    slugs: ['platter', 'platters', 'sliced', 'plate', 'מגש', 'מגשים'],
    needles: ['platter', 'platters', 'sliced', 'plate', 'מגש', 'لوحة', 'شرائح'],
  },
  pickles: {
    slugs: ['pickle', 'pickles', 'חמוצים', 'מלפפונים-חמוצים'],
    needles: [
      'pickle',
      'pickles',
      'pickled',
      'fermented',
      'חמוצים',
      'מלפפון חמוץ',
      'כרוב כבוש',
      'מלפפון כבוש',
      'مخللات',
      'مخلل',
    ],
  },
  'natural-juices': {
    slugs: ['natural-juice', 'natural-juices', 'fresh-juice', 'fresh-juices', 'מיצים-טבעיים', 'عصائر-طبيعية'],
    needles: [
      'natural juice',
      'natural juices',
      'fresh juice',
      'fresh juices',
      'squeezed juice',
      'squeezed juices',
      'orange juice',
      'lemon juice',
      'pomegranate juice',
      'concentrated fresh juice',
      'מיץ',
      'מיצים',
      'מיצים טבעיים',
      'מיץ לימון',
      'מיץ רימונים',
      'מיץ תפוזים',
      'عصير',
      'عصائر',
      'عصائر طبيعية',
      'عصير ليمون',
      'عصير رمان',
      'عصير برتقال',
    ],
  },
};

/**
 * @param {string} hay
 * @param {{ slugs: string[], needles: string[] }} rule
 */
function haystackMatchesRule(hay, rule) {
  for (const s of rule.slugs) {
    if (hay.includes(s.toLowerCase())) return true;
  }
  for (const needle of rule.needles) {
    if (hay.includes(needle.toLowerCase())) return true;
  }
  return false;
}

/**
 * When a DB category slug is not in the storefront slug allowlist, map the category document
 * to one primary nav using the same keyword rules as legacy filtering (single nav; tie-break by order).
 * @param {unknown} category
 * @returns {'fruits' | 'vegetables' | 'herbs' | 'spices' | 'platters' | 'pickles' | 'natural-juices' | null}
 */
export function inferPrimaryNavIdFromCategoryRecord(category) {
  const hay = categoryHaystack(category);
  if (!hay) return null;
  if (isLegacyCombinedHaystack(hay)) return "herbs";

  const slug =
    category && typeof category === "object" && typeof /** @type {{ slug?: string }} */ (category).slug === "string"
      ? /** @type {{ slug?: string }} */ (category).slug.trim().toLowerCase()
      : "";
  if (slug && isLegacyCombinedHaystack(slug)) return "herbs";

  /** @type {Array<'fruits' | 'vegetables' | 'herbs' | 'spices' | 'platters' | 'pickles' | 'natural-juices'>} */
  const hits = [];
  for (const navId of /** @type {const} */ ([
    "fruits",
    "vegetables",
    "herbs",
    "spices",
    "platters",
    "pickles",
    "natural-juices",
  ])) {
    const rule = RULES[navId];
    if (navId === "spices" && isLegacyCombinedHaystack(hay)) continue;
    if (haystackMatchesRule(hay, rule)) hits.push(navId);
  }
  if (hits.length === 1) return hits[0];
  if (hits.length > 1) {
    const order = /** @type {const} */ ([
      "herbs",
      "spices",
      "pickles",
      "natural-juices",
      "vegetables",
      "fruits",
      "platters",
    ]);
    for (const navId of order) {
      if (hits.includes(navId)) return navId;
    }
  }
  return null;
}

/** Combined legacy category should map to Herbs nav only (not Spices), until DB migration splits rows. */
export function isLegacyCombinedHaystack(hay) {
  if (!hay) return false;
  return (
    hay.includes('herbs-spices')
    || hay.includes('herbs-and-spices')
    || hay.includes('herb-spice')
    || hay.includes('spices-and-herbs')
    || hay.includes('spices-herbs')
    || hay.includes('herbs & spices')
    || hay.includes('herbs and spices')
    || hay.includes('עשבי תיבול ותבלינים')
    || hay.includes('أعشاب وتوابل')
  );
}

/**
 * @param {unknown} product
 * @param {CategoryNavId} navId
 */
export function productMatchesCategoryNav(product, navId) {
  if (!product || typeof product !== 'object') return false;
  const cat = /** @type {{ category?: unknown }} */ (product).category;
  const hay = categoryHaystack(cat);

  if (navId === 'other') {
    if (!hay) return true;
    return (
      !haystackMatchesRule(hay, RULES.fruits)
      && !haystackMatchesRule(hay, RULES.vegetables)
      && !haystackMatchesRule(hay, RULES.herbs)
      && !haystackMatchesRule(hay, RULES.spices)
      && !haystackMatchesRule(hay, RULES.platters)
      && !haystackMatchesRule(hay, RULES.pickles)
      && !haystackMatchesRule(hay, RULES['natural-juices'])
    );
  }

  const rule = RULES[/** @type {'fruits' | 'vegetables' | 'herbs' | 'spices' | 'platters' | 'pickles' | 'natural-juices'} */ (navId)];
  if (!rule) return false;
  if (!hay) return false;
  if (navId === 'spices' && isLegacyCombinedHaystack(hay)) return false;
  return haystackMatchesRule(hay, rule);
}
