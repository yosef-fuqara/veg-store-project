/**
 * One-off bootstrap script for the exhaustive Postman collection
 * (`poostman/veg-store.postman_collection.json`).
 *
 * Responsibilities:
 *   1. Upsert an admin user in MongoDB (the public `/auth/register` endpoint
 *      can only create customers, so admins must be seeded out-of-band).
 *   2. Drop a 1x1 PNG into `poostman/sample-product.png`. The collection's
 *      product create/update requests reference it via the `sampleImagePath`
 *      Postman variable.
 *   3. Print a summary block the user copies into the Postman environment.
 *
 * Usage:
 *   npm run seed:postman
 *   npm run seed:postman -- --email admin@local.test --password Admin12345!
 *
 * Idempotent: running multiple times only updates the admin password / role
 * and rewrites the sample image.
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const env = require("../src/config/env");
const { connectDatabase } = require("../src/config/db");
const User = require("../src/models/user.model");
const { USER_ROLES } = require("../src/constants/roles");

const DEFAULT_ADMIN_EMAIL = "admin@local.test";
const DEFAULT_ADMIN_PASSWORD = "Admin12345!";
const DEFAULT_ADMIN_NAME = "Postman Admin";
const DEFAULT_ADMIN_PHONE = "0500000001";

const SAMPLE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--email" || arg === "-e") {
      out.email = argv[++i];
    } else if (arg === "--password" || arg === "-p") {
      out.password = argv[++i];
    } else if (arg === "--name" || arg === "-n") {
      out.name = argv[++i];
    } else if (arg === "--phone") {
      out.phone = argv[++i];
    } else if (arg === "--help" || arg === "-h") {
      out.help = true;
    }
  }
  return out;
}

function printHelp() {
  console.log(`Postman seed script

Options:
  --email,    -e   Admin email    (default: ${DEFAULT_ADMIN_EMAIL})
  --password, -p   Admin password (default: ${DEFAULT_ADMIN_PASSWORD})
  --name,     -n   Admin name     (default: ${DEFAULT_ADMIN_NAME})
  --phone          Admin phone    (default: ${DEFAULT_ADMIN_PHONE})
  --help,     -h   Show this help
`);
}

async function upsertAdmin({ email, password, name, phone }) {
  const lowerEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await User.findOne({ email: lowerEmail });
  if (existing) {
    existing.password = passwordHash;
    existing.role = USER_ROLES.ADMIN;
    existing.isActive = true;
    if (name) existing.name = name;
    if (phone) existing.phone = phone;
    await existing.save();
    return { user: existing, created: false };
  }

  const user = await User.create({
    name: name || DEFAULT_ADMIN_NAME,
    phone: phone || DEFAULT_ADMIN_PHONE,
    email: lowerEmail,
    password: passwordHash,
    role: USER_ROLES.ADMIN,
    isActive: true
  });
  return { user, created: true };
}

function writeSampleImage() {
  const repoRoot = path.resolve(__dirname, "..", "..", "..");
  const targetDir = path.join(repoRoot, "poostman");
  const targetPath = path.join(targetDir, "sample-product.png");

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, Buffer.from(SAMPLE_PNG_BASE64, "base64"));
  return targetPath;
}

function printSummary({ admin, password, sampleImagePath }) {
  const baseUrl = `http://localhost:${env.port}${env.apiBasePath}`;
  const webhookSecret = env.paymentWebhookSecret || "(not configured)";

  console.log("\n=================================================");
  console.log("Postman seed complete");
  console.log("=================================================");
  console.log("Copy these values into the Postman environment");
  console.log("(`poostman/veg-store.postman_environment.json`):\n");
  console.log(`  baseUrl         = ${baseUrl}`);
  console.log(`  adminEmail      = ${admin.email}`);
  console.log(`  adminPassword   = ${password}`);
  console.log(`  webhookSecret   = ${webhookSecret}`);
  console.log(`  sampleImagePath = ${sampleImagePath}`);
  console.log("\nNotes:");
  console.log("  - Admin user is ready to log in via POST /auth/login.");
  console.log("  - Sample image was written to disk; Postman uploads it as");
  console.log("    the product image (form-data field `image`).");
  console.log("  - Make sure the API is running before importing the");
  console.log("    collection (`npm run dev`).\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const email = (args.email || process.env.POSTMAN_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim();
  const password = args.password || process.env.POSTMAN_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const name = args.name || process.env.POSTMAN_ADMIN_NAME;
  const phone = args.phone || process.env.POSTMAN_ADMIN_PHONE;

  if (password.length < 8) {
    throw new Error("Admin password must be at least 8 characters long.");
  }

  console.log(`Connecting to MongoDB at ${env.mongoUri.replace(/\/\/[^@]+@/, "//***@")} ...`);
  await connectDatabase();

  try {
    const { user: admin, created } = await upsertAdmin({ email, password, name, phone });
    console.log(`${created ? "Created" : "Updated"} admin user: ${admin.email}`);

    const sampleImagePath = writeSampleImage();
    console.log(`Wrote sample product image to: ${sampleImagePath}`);

    printSummary({ admin, password, sampleImagePath });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("seed-postman failed:", err.message || err);
  process.exitCode = 1;
  mongoose.disconnect().catch(() => {});
});
