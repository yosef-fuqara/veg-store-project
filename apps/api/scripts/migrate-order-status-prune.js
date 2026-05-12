/**
 * One-off: map removed orderStatus values to the current enum so documents match the schema.
 *
 * Mappings:
 *   seen -> new
 *   preparing -> confirmed
 *   ready_for_delivery -> sent_with_delivery_company
 *
 * Usage (from apps/api, with MONGO_URI in .env):
 *   npm run migrate:order-status-prune
 *   node scripts/migrate-order-status-prune.js
 *
 * Does not send email or touch application logic — only `orders` collection updates.
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
  const col = mongoose.connection.collection("orders");

  const map = [
    { from: "seen", to: "new" },
    { from: "preparing", to: "confirmed" },
    { from: "ready_for_delivery", to: "sent_with_delivery_company" }
  ];

  let total = 0;
  for (const { from, to } of map) {
    const res = await col.updateMany({ orderStatus: from }, { $set: { orderStatus: to } });
    // eslint-disable-next-line no-console
    console.info(`orderStatus ${from} -> ${to}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    total += res.modifiedCount || 0;
  }

  // eslint-disable-next-line no-console
  console.info(`Done. Total modified: ${total}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
