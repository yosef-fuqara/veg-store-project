/**
 * Split legacy "Herbs & spices" (combined) category into two: `herbs` + `spices`.
 *
 * - Ensures active categories with slugs `herbs` and `spices` exist (creates if missing).
 * - Finds legacy combined rows by multilingual names / slug patterns.
 * - Renames each legacy slug to free `herbs` / `spices` if needed, reassigns products, then soft-deletes legacy.
 * - Product reassignment: names/descriptions scanned for spice keywords; otherwise → Herbs. No product documents deleted.
 *
 * Usage (from apps/api, requires `.env` with MONGO_URI + JWT secrets like other API scripts):
 *   npm run migrate:split-herbs-spices
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/db");
const Category = require("../src/models/category.model");
const Product = require("../src/models/product.model");

const HERBS_NAME = { ar: "أعشاب", he: "עשבי תיבול", en: "Herbs" };
const SPICES_NAME = { ar: "بهارات", he: "תבלינים", en: "Spices" };

function lowerHay(parts) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function categoryNameHaystack(cat) {
  const n = cat.name;
  const parts = [cat.slug || ""];
  if (typeof n === "string") parts.push(n);
  else if (n && typeof n === "object") {
    for (const k of ["en", "he", "ar"]) {
      if (typeof n[k] === "string") parts.push(n[k]);
    }
  }
  return lowerHay(parts);
}

function isLegacyCombinedCategory(cat) {
  const hay = categoryNameHaystack(cat);
  const slug = (cat.slug || "").toLowerCase();

  if (
    hay.includes("herbs & spices") ||
    hay.includes("herbs and spices") ||
    hay.includes("herbs & spice") ||
    hay.includes("עשבי תיבול ותבלינים") ||
    hay.includes("أعشاب وتوابل")
  ) {
    return true;
  }

  if (
    slug.includes("herbs-spices") ||
    slug.includes("herbs-and-spices") ||
    slug.includes("herb-spice") ||
    slug.includes("spices-and-herbs") ||
    slug.includes("spices-herbs")
  ) {
    return true;
  }

  return false;
}

function collectProductHaystack(p) {
  const parts = [];
  const n = p.name;
  if (typeof n === "string") parts.push(n);
  else if (n && typeof n === "object") {
    for (const k of ["en", "he", "ar"]) {
      if (typeof n[k] === "string") parts.push(n[k]);
    }
  }
  if (typeof p.description === "string") parts.push(p.description);
  return lowerHay(parts);
}

const SPICE_NEEDLES = [
  "cumin",
  "paprika",
  "cinnamon",
  "turmeric",
  "curry",
  "nutmeg",
  "clove",
  "cardamom",
  "coriander seed",
  "black pepper",
  "white pepper",
  "chili",
  "chilli",
  "cayenne",
  "zaatar",
  "za'atar",
  "sumac",
  "allspice",
  "ginger powder",
  "garlic powder",
  "onion powder",
  "fennel seed",
  "anise",
  "caraway",
  "mustard seed",
  "bay leaf",
  "smoked paprika",
  "garam masala",
  "mixed spice",
  "seasoning mix",
  "כמון",
  "פפריקה",
  "קינמון",
  "כורכום",
  "צילי",
  "פלפל שחור",
  "פלפל לבן",
  "הל",
  "זעפרן",
  "תערובת תבלינים",
  "בהרט",
  "كمون",
  "بابريكا",
  "قرفة",
  "كركم",
  "فلفل أسود",
  "هيل",
  "زعفران",
  "شطة",
  "توابل مشكلة"
];

function productLooksLikeSpice(p) {
  const hay = collectProductHaystack(p);
  return SPICE_NEEDLES.some((n) => hay.includes(n.toLowerCase()));
}

async function softDeleteCategoryDoc(cat) {
  cat.isDeleted = true;
  cat.isActive = false;
  cat.isFrozen = true;
  await cat.save();
}

async function main() {
  await connectDatabase();

  try {
    const allActive = await Category.find({ isDeleted: false });
    const legacyList = allActive.filter(isLegacyCombinedCategory);

    for (const leg of legacyList) {
      const oldSlug = leg.slug;
      leg.slug = `archive-${oldSlug}-${leg._id.toString().slice(-6)}`;
      await leg.save();
      // eslint-disable-next-line no-console
      console.log(`Renamed legacy category slug "${oldSlug}" → "${leg.slug}" (${leg._id})`);
    }

    let herbsCat = await Category.findOne({ slug: "herbs", isDeleted: false });
    if (!herbsCat) {
      herbsCat = await Category.create({
        slug: "herbs",
        name: HERBS_NAME,
        description: "Herbs"
      });
      // eslint-disable-next-line no-console
      console.log(`Created category slug=herbs (${herbsCat._id})`);
    }

    let spicesCat = await Category.findOne({ slug: "spices", isDeleted: false });
    if (!spicesCat) {
      spicesCat = await Category.create({
        slug: "spices",
        name: SPICES_NAME,
        description: "Spices"
      });
      // eslint-disable-next-line no-console
      console.log(`Created category slug=spices (${spicesCat._id})`);
    }

    const legacyIds = legacyList.map((l) => l._id);

    if (legacyIds.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No legacy combined category matched. Herbs/spices slugs are present. Nothing to migrate.");
      return;
    }

    const products = await Product.find({ category: { $in: legacyIds }, isDeleted: false });
    let toHerbs = 0;
    let toSpices = 0;

    for (const p of products) {
      const targetId = productLooksLikeSpice(p) ? spicesCat._id : herbsCat._id;
      if (String(targetId) === String(spicesCat._id)) toSpices += 1;
      else toHerbs += 1;
      p.category = targetId;
      await p.save();
    }

    for (const leg of legacyList) {
      await softDeleteCategoryDoc(leg);
      // eslint-disable-next-line no-console
      console.log(`Soft-deleted legacy category ${leg._id} (${leg.slug})`);
    }

    // eslint-disable-next-line no-console
    console.log(
      `Migrated ${products.length} product(s): ${toHerbs} → herbs, ${toSpices} → spices (keyword heuristic; review in admin if needed).`
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("migrate:split-herbs-spices failed:", err.message || err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
