/**
 * Bulk-create products via the same HTTP flow as the admin UI:
 * POST /products (multipart: image + fields), Cloudinary upload on the server.
 *
 * From apps/api (requires .env like the API):
 *   1. Set products-to-import.json → settings.lemonJuiceCategorySlug + pomegranateJuiceCategorySlug
 *      (slugs from GET /categories / admin), or set IMPORT_LEMON_JUICE_SLUG / IMPORT_POM_JUICE_SLUG.
 *   2. npm run import:products
 *
 * Optional env:
 *   IMPORT_API_BASE_URL=http://localhost:5000/api/v1
 *   IMPORT_ACCESS_TOKEN=...  (admin JWT; skips login)
 *   IMPORT_ADMIN_EMAIL + IMPORT_ADMIN_PASSWORD  (if no token)
 *   IMPORT_MINT_ADMIN_JWT=1  (local dev only: load admin from MongoDB by IMPORT_ADMIN_EMAIL and sign JWT; no password)
 *   IMPORT_DRY_RUN=1  (validate + print plan only)
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const env = require("../src/config/env");

const PHOTOS_DIR = path.join(__dirname, "..", "..", "..", "photos");
const CATALOG_PATH = path.join(__dirname, "products-to-import.json");

function baseUrl() {
  const override = process.env.IMPORT_API_BASE_URL;
  if (override) return override.replace(/\/$/, "");
  const port = env.port;
  const basePath = env.apiBasePath.replace(/\/$/, "");
  return `http://127.0.0.1:${port}${basePath}`;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    const msg = body?.message || body?.error || text || res.statusText;
    throw new Error(`${res.status} ${url}: ${msg}`);
  }
  return body;
}

async function getAccessToken(base) {
  const token = process.env.IMPORT_ACCESS_TOKEN;
  if (token) return token.trim();

  const email = (process.env.IMPORT_ADMIN_EMAIL || "").trim();
  const password = process.env.IMPORT_ADMIN_PASSWORD;

  if (String(process.env.IMPORT_MINT_ADMIN_JWT || "") === "1") {
    if (!email) {
      throw new Error("IMPORT_ADMIN_EMAIL is required when IMPORT_MINT_ADMIN_JWT=1");
    }
    const mongoose = require("mongoose");
    const { connectDatabase } = require("../src/config/db");
    const User = require("../src/models/user.model");
    const { signAccessToken } = require("../src/services/token.service");
    await connectDatabase();
    try {
      const user = await User.findOne({
        email: email.toLowerCase(),
        role: "admin",
        isActive: true
      });
      if (!user) {
        throw new Error(`No active admin user found for ${email}`);
      }
      return signAccessToken(user);
    } finally {
      await mongoose.disconnect();
    }
  }

  if (!email || !password) {
    throw new Error(
      "Set IMPORT_ACCESS_TOKEN, or IMPORT_MINT_ADMIN_JWT=1 + IMPORT_ADMIN_EMAIL, or IMPORT_ADMIN_EMAIL + IMPORT_ADMIN_PASSWORD"
    );
  }

  const data = await fetchJson(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const access = data?.data?.tokens?.accessToken;
  if (!access) throw new Error("Login response missing accessToken");
  return access;
}

async function loadCategoryIdsBySlug(base) {
  const data = await fetchJson(`${base}/categories`, {
    headers: { Accept: "application/json" }
  });
  const categories = data?.data?.categories;
  if (!Array.isArray(categories)) throw new Error("Unexpected categories response");

  /** @type {Record<string, string>} */
  const map = {};
  for (const c of categories) {
    if (c && typeof c.slug === "string" && c._id) {
      map[c.slug.trim().toLowerCase()] = String(c._id);
    }
  }
  return map;
}

function resolveJuiceSlug(settings, which) {
  if (which === "__JUICE_LEMON__") {
    return (
      settings.lemonJuiceCategorySlug ||
      process.env.IMPORT_LEMON_JUICE_SLUG ||
      ""
    ).trim();
  }
  if (which === "__JUICE_POM__") {
    return (
      settings.pomegranateJuiceCategorySlug ||
      process.env.IMPORT_POM_JUICE_SLUG ||
      ""
    ).trim();
  }
  return which;
}

function resolveCategorySlug(raw, settings) {
  const resolved = resolveJuiceSlug(settings, raw);
  if (!resolved) {
    throw new Error(
      `Missing slug for ${raw}. Set settings in products-to-import.json or IMPORT_LEMON_JUICE_SLUG / IMPORT_POM_JUICE_SLUG.`
    );
  }
  return resolved.toLowerCase();
}

function mimeForImagePath(absPath) {
  const ext = path.extname(absPath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

async function createProduct(base, accessToken, categoryId, product, absImagePath) {
  const buf = fs.readFileSync(absImagePath);
  const blob = new Blob([buf], { type: mimeForImagePath(absImagePath) });
  const form = new FormData();
  form.append("image", blob, path.basename(absImagePath));
  form.append("name", JSON.stringify(product.name));
  form.append("price", String(product.price));
  form.append("category", categoryId);
  form.append("unit", product.unit);
  form.append("stockStatus", "in_stock");
  form.append("isFeatured", "false");
  if (product.description && String(product.description).trim()) {
    form.append("description", String(product.description).trim());
  }

  return fetchJson(`${base}/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form
  });
}

async function main() {
  const base = baseUrl();
  const dry = String(process.env.IMPORT_DRY_RUN || "") === "1";

  const catalogRaw = fs.readFileSync(CATALOG_PATH, "utf8");
  const catalog = JSON.parse(catalogRaw);
  const settings = catalog.settings || {};
  const products = catalog.products;
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("products-to-import.json: missing products array");
  }

  const slugToId = dry ? {} : await loadCategoryIdsBySlug(base);
  if (!dry) {
    // eslint-disable-next-line no-console
    console.log(`API: ${base}  (${products.length} products)`);
  }

  const accessToken = dry ? "" : await getAccessToken(base);

  let ok = 0;
  for (let i = 0; i < products.length; i += 1) {
    const p = products[i];
    const imageName = p.image;
    if (!imageName) throw new Error(`Row ${i}: missing image`);

    const slug = resolveCategorySlug(p.categorySlug, settings);
    const categoryId = dry ? "(dry-run)" : slugToId[slug];
    if (!dry && !categoryId) {
      const available = Object.keys(slugToId).sort().join(", ");
      throw new Error(
        `Unknown category slug "${slug}" for ${imageName}. Known slugs: ${available}`
      );
    }

    const absImage = path.join(PHOTOS_DIR, imageName);
    if (!fs.existsSync(absImage)) {
      throw new Error(`Image not found: ${absImage}`);
    }

    if (dry) {
      // eslint-disable-next-line no-console
      console.log(`[dry-run] ${i + 1}/${products.length} ${imageName} → slug ${slug}`);
      ok += 1;
      continue;
    }

    // eslint-disable-next-line no-console
    console.log(`POST ${i + 1}/${products.length} ${imageName}…`);
    await createProduct(base, accessToken, categoryId, p, absImage);
    ok += 1;
  }

  // eslint-disable-next-line no-console
  console.log(`Done. Created ${ok} product(s).`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.message || err);
  process.exitCode = 1;
});
