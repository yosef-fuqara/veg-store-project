/**
 * Ensure storefront/public Category rows exist (public GET /categories + admin dropdown).
 *
 * - Creates canonical slugs: fruits, vegetables, herbs, spices, platters, pickles,
 *   natural-juices (nav slot "other" has no DB row).
 * - Updates an existing category when it already uses that slug, a known alias, or the same localized name.
 * - Idempotent: safe to run multiple times.
 *
 * Usage (from apps/api, requires `.env` like other API scripts):
 *   npm run seed:storefront-categories
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/db");
const Category = require("../src/models/category.model");

/** Align storefront-mapped slugs with BACKEND_SLUGS_BY_NAV, plus standalone public categories. */
const CANONICAL = [
  {
    slug: "fruits",
    aliases: ["fruit", "fruits", "seed-fruits", "פירות"],
    name: { ar: "فواكه", he: "פירות", en: "Fruits" },
    description: "Fruits"
  },
  {
    slug: "vegetables",
    aliases: ["vegetable", "vegetables", "veggie", "veggies", "seed-vegetables", "ירקות"],
    name: { ar: "خضروات", he: "ירקות", en: "Vegetables" },
    description: "Vegetables"
  },
  {
    slug: "herbs",
    aliases: ["herb", "herbs", "fresh-herbs", "עשבי-תיבול"],
    name: { ar: "أعشاب", he: "עשבי תיבול", en: "Herbs" },
    description: "Herbs"
  },
  {
    slug: "spices",
    aliases: ["spice", "spices", "baharat", "תבלינים"],
    name: { ar: "بهارات", he: "תבלינים", en: "Spices" },
    description: "Spices"
  },
  {
    slug: "platters",
    aliases: ["platter", "platters", "sliced", "fruit-platter", "מגש", "מגשים"],
    name: { ar: "صواني فواكه", he: "מגשים", en: "Platters" },
    description: "Platters"
  },
  {
    slug: "pickles",
    aliases: ["pickle", "pickles", "חמוצים", "מלפפונים-חמוצים", "مخللات", "مخلل"],
    name: { ar: "مخللات", he: "חמוצים", en: "Pickles" },
    description: "Pickles and fermented vegetables"
  },
  {
    slug: "natural-juices",
    aliases: [
      "natural-juice",
      "natural-juices",
      "fresh-juice",
      "fresh-juices",
      "squeezed-juice",
      "squeezed-juices",
      "juice",
      "juices",
      "מיצים-טבעיים",
      "מיצים",
      "عصائر-طبيعية",
      "عصائر"
    ],
    name: { ar: "عصائر طبيعية", he: "מיצים טבעיים", en: "Natural Juices" },
    description: "Natural squeezed and concentrated fresh juice products"
  }
];

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function lookupConditionsFor(def) {
  const slugSet = unique([def.slug, ...def.aliases].map((s) => String(s).toLowerCase()));
  const names = unique(Object.values(def.name).map((s) => String(s).trim()));

  return [
    { slug: { $in: slugSet } },
    ...Object.entries(def.name).map(([locale, value]) => ({ [`name.${locale}`]: value })),
    { name: { $in: names } }
  ];
}

async function findExistingCategory(def) {
  const $or = lookupConditionsFor(def);

  return (
    (await Category.findOne({ isDeleted: false, slug: def.slug }).select("slug _id")) ||
    (await Category.findOne({ isDeleted: false, $or }).select("slug _id")) ||
    (await Category.findOne({ slug: def.slug }).select("slug _id isDeleted")) ||
    (await Category.findOne({ $or }).select("slug _id isDeleted"))
  );
}

async function main() {
  await connectDatabase();

  try {
    for (const def of CANONICAL) {
      const existing = await findExistingCategory(def);

      if (existing) {
        existing.slug = def.slug;
        existing.name = def.name;
        existing.description = def.description || "";
        existing.isActive = true;
        existing.isFrozen = false;
        existing.isDeleted = false;
        await existing.save();
        // eslint-disable-next-line no-console
        console.log(`Updated category slug="${existing.slug}" (${existing._id})`);
        continue;
      }

      const created = await Category.create({
        slug: def.slug,
        name: def.name,
        description: def.description || "",
        isActive: true,
        isFrozen: false
      });
      // eslint-disable-next-line no-console
      console.log(`Created category slug="${created.slug}" (${created._id})`);
    }

    // eslint-disable-next-line no-console
    console.log("seed:storefront-categories finished.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("seed:storefront-categories failed:", err.message || err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
