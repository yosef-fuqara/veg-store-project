/**
 * Backfill product.name { ar, he, en } from products-to-import.json by matching image filename.
 *
 * From apps/api:
 *   npm run backfill:product-names
 *
 * Optional:
 *   BACKFILL_DRY_RUN=1  — print plan only
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Product = require("../src/models/product.model");

const CATALOG_PATH = path.join(__dirname, "products-to-import.json");

function basenameFromUrl(url) {
  if (typeof url !== "string" || !url.trim()) return "";
  try {
    const decoded = decodeURIComponent(url.trim());
    const parts = decoded.split(/[/\\]/);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

function normalizeImageKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function namesEqual(a, b) {
  const aa = a && typeof a === "object" ? a : { ar: a, he: a, en: a };
  const bb = b && typeof b === "object" ? b : { ar: b, he: b, en: b };
  return ["ar", "he", "en"].every((k) => String(aa[k] || "").trim() === String(bb[k] || "").trim());
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    // eslint-disable-next-line no-console
    console.error("MONGO_URI is required");
    process.exit(1);
  }

  const dry = String(process.env.BACKFILL_DRY_RUN || "") === "1";
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const products = catalog.products;
  if (!Array.isArray(products) || !products.length) {
    throw new Error("products-to-import.json: missing products array");
  }

  /** @type {Map<string, { ar: string, he: string, en: string }>} */
  const byImage = new Map();
  for (const p of products) {
    if (!p?.image || !p?.name) continue;
    byImage.set(normalizeImageKey(p.image), p.name);
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  const cursor = Product.find({ isDeleted: { $ne: true } }).cursor();
  let scanned = 0;
  let updated = 0;
  let unmatched = 0;

  for await (const doc of cursor) {
    scanned += 1;
    const fromUrl = basenameFromUrl(doc.imageUrl);
    const fromPublic = basenameFromUrl(doc.imagePublicId);
    const key = normalizeImageKey(fromUrl || fromPublic);
    const catalogName = key ? byImage.get(key) : null;

    if (!catalogName) {
      unmatched += 1;
      continue;
    }

    if (namesEqual(doc.name, catalogName)) {
      continue;
    }

    if (dry) {
      // eslint-disable-next-line no-console
      console.log(`[dry-run] ${doc._id} ${key} →`, catalogName);
    } else {
      doc.name = catalogName;
      await doc.save();
    }
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `Scanned ${scanned} product(s); ${dry ? "would update" : "updated"} ${updated}; unmatched ${unmatched}.`
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.message || err);
  process.exitCode = 1;
});
