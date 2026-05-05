const bcrypt = require("bcryptjs");
const request = require("supertest");
const User = require("../../src/models/user.model");
const Category = require("../../src/models/category.model");
const Product = require("../../src/models/product.model");
const { USER_ROLES } = require("../../src/constants/roles");
const { PRODUCT_UNITS, PRODUCT_STOCK_STATUS } = require("../../src/constants/product");
const { getApp, apiUrl } = require("./test-app");

const DEFAULT_PASSWORD = "Password123!";

async function hashPassword(plain = DEFAULT_PASSWORD) {
  return bcrypt.hash(plain, 8);
}

async function createCustomerUser(overrides = {}) {
  const email = (
    overrides.email || `customer.${Date.now()}.${Math.random().toString(36).slice(2)}@test.com`
  ).toLowerCase();
  const plainPassword = overrides.password ?? DEFAULT_PASSWORD;
  const passwordHash =
    overrides.passwordHash !== undefined ? overrides.passwordHash : await hashPassword(plainPassword);

  const { password: _omit, passwordHash: _omit2, ...rest } = overrides;

  return User.create({
    name: "Test Customer",
    phone: "0501234567",
    email,
    password: passwordHash,
    role: USER_ROLES.CUSTOMER,
    ...rest,
    email,
    password: passwordHash,
    role: USER_ROLES.CUSTOMER
  });
}

async function createAdminUser(overrides = {}) {
  const email = (
    overrides.email || `admin.${Date.now()}.${Math.random().toString(36).slice(2)}@test.com`
  ).toLowerCase();
  const plainPassword = overrides.password ?? DEFAULT_PASSWORD;
  const passwordHash =
    overrides.passwordHash !== undefined ? overrides.passwordHash : await hashPassword(plainPassword);

  const { password: _omit, passwordHash: _omit2, ...rest } = overrides;

  return User.create({
    name: "Test Admin",
    phone: "0509876543",
    email,
    password: passwordHash,
    role: USER_ROLES.ADMIN,
    ...rest,
    email,
    password: passwordHash,
    role: USER_ROLES.ADMIN
  });
}

async function createCategory(overrides = {}) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return Category.create({
    name: overrides.name || `Category ${suffix}`,
    slug: overrides.slug || `category-${suffix}`,
    description: overrides.description || "Test category",
    ...overrides
  });
}

async function createProduct(overrides = {}) {
  const { category: categoryOverride, ...rest } = overrides;
  const categoryId = categoryOverride || (await createCategory())._id;

  return Product.create({
    name: `Product ${Date.now()}`,
    description: "Test product description",
    price: 10,
    imageUrl: "https://test.invalid/seed.jpg",
    imagePublicId: "seed_public_id",
    unit: PRODUCT_UNITS.KG,
    stockStatus: PRODUCT_STOCK_STATUS.IN_STOCK,
    isActive: true,
    isFrozen: false,
    isDeleted: false,
    ...rest,
    category: categoryId
  });
}

async function loginAndGetAccessToken(email, password = DEFAULT_PASSWORD) {
  const res = await request(getApp())
    .post(apiUrl("/auth/login"))
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body.data.tokens.accessToken;
}

async function registerCustomer(body) {
  return request(getApp()).post(apiUrl("/auth/register")).send(body);
}

module.exports = {
  DEFAULT_PASSWORD,
  createCustomerUser,
  createAdminUser,
  createCategory,
  createProduct,
  loginAndGetAccessToken,
  registerCustomer,
  hashPassword
};
