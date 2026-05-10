/**
 * One-off migration: legacy category `name` string → `{ ar, he, en }` (same text in all three).
 *
 * Usage (from apps/api):
 *   npm run migrate:category-names-i18n
 *   node scripts/migrate-category-names-i18n.js
 *
 * Requires MONGO_URI in `.env` (or environment). Does not load full API env/JWT vars.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");

const uri = process.env.MONGO_URI;
if (!uri) {
  // eslint-disable-next-line no-console
  console.error("MONGO_URI is required");
  process.exit(1);
}

async function main() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  const col = mongoose.connection.collection("categories");
  const cursor = col.find({ name: { $type: "string" } });
  let updated = 0;
  for await (const doc of cursor) {
    const s = typeof doc.name === "string" ? doc.name.trim() : "";
    if (s.length < 2) {
      // eslint-disable-next-line no-console
      console.warn(`Skip category ${doc._id}: name too short for new schema`);
      continue;
    }
    await col.updateOne({ _id: doc._id }, { $set: { name: { ar: s, he: s, en: s } } });
    updated += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Migrated ${updated} categor(ies) from string name to { ar, he, en }.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
