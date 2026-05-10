const request = require("supertest");
const mongoose = require("mongoose");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createAdminUser,
  createCustomerUser,
  createCategory,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const { attachProductImage } = require("../helpers/product-multipart");

describe("Products", () => {
  it("GET /products returns 200", async () => {
    const res = await request(getApp()).get(apiUrl("/products"));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.products)).toBe(true);
  });

  it("GET /products excludes inactive products", async () => {
    await createProduct({ name: "InactiveOnly", isActive: false });
    const res = await request(getApp()).get(apiUrl("/products"));
    expect(res.status).toBe(200);
    expect(res.body.data.products.some((p) => p.name === "InactiveOnly")).toBe(false);
  });

  it("POST /products creates product as admin (multipart)", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const category = await createCategory();

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Tomato Box")
      .field("description", "Red and ripe")
      .field("price", "12.5")
      .field("category", String(category._id))
      .field("unit", "kg");

    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.data.product.name).toBe("Tomato Box");
    expect(res.body.data.product.imageUrl).toContain("test.invalid");
  });

  it("POST /products accepts trilingual JSON name (multipart)", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const category = await createCategory();
    const namePayload = JSON.stringify({
      ar: "طماطم",
      he: "עגבנייה",
      en: "Tomato"
    });

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", namePayload)
      .field("description", "Red and ripe")
      .field("price", "12.5")
      .field("category", String(category._id))
      .field("unit", "kg");

    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.data.product.name).toEqual({
      ar: "طماطم",
      he: "עגבנייה",
      en: "Tomato"
    });
  });

  it("POST /products creates product without description", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const category = await createCategory();

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "No Description Product")
      .field("price", "5")
      .field("category", String(category._id))
      .field("unit", "kg");

    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(201);
    expect(res.body.data.product.description).toBe("");
  });

  it("PATCH /products/:id clears description with empty string", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct({ name: "Desc Clear", description: "Was here" });

    const res = await request(getApp())
      .patch(apiUrl(`/products/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Desc Clear")
      .field("description", "");

    expect(res.status).toBe(200);
    expect(res.body.data.product.description).toBe("");
  });

  it("POST /products returns 404 for invalid category id", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const fakeId = new mongoose.Types.ObjectId();

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Xx")
      .field("description", "Yy")
      .field("price", "1")
      .field("category", String(fakeId))
      .field("unit", "kg");
    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/invalid category/i);
  });

  it("POST /products returns 404 when category is soft-deleted", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const category = await createCategory({ name: "Gone", slug: "gone-cat" });
    category.isDeleted = true;
    category.isActive = false;
    category.isFrozen = true;
    await category.save();

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Xx")
      .field("description", "Yy")
      .field("price", "1")
      .field("category", String(category._id))
      .field("unit", "kg");
    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(404);
  });

  it("POST /products returns 404 when category is frozen", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const category = await createCategory({ name: "Ice", slug: "ice-cat", isFrozen: true });

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Xx")
      .field("description", "Yy")
      .field("price", "1")
      .field("category", String(category._id))
      .field("unit", "kg");
    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(404);
  });

  it("PATCH /products/:id updates product without new image", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct({ name: "Orig" });

    const res = await request(getApp())
      .patch(apiUrl(`/products/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Updated Name")
      .field("description", "Updated product description here")
      .field("price", "9");

    expect(res.status).toBe(200);
    expect(res.body.data.product.name).toBe("Updated Name");
  });

  it("frozen product not returned on public GET /products/:id", async () => {
    const product = await createProduct({ name: "Frosty", isFrozen: true });
    const res = await request(getApp()).get(apiUrl(`/products/${product._id}`));
    expect(res.status).toBe(404);
  });

  it("soft-deleted product not returned publicly", async () => {
    const product = await createProduct({ name: "Gone", isDeleted: true, isActive: false });
    const res = await request(getApp()).get(apiUrl(`/products/${product._id}`));
    expect(res.status).toBe(404);
  });

  it("GET /products/:id returns 400 for invalid ObjectId", async () => {
    const res = await request(getApp()).get(apiUrl("/products/not-an-object-id"));
    expect(res.status).toBe(400);
  });

  it("customer receives 403 on POST /products", async () => {
    const customer = await createCustomerUser();
    const token = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const category = await createCategory();

    let req = request(getApp())
      .post(apiUrl("/products"))
      .set("Authorization", `Bearer ${token}`)
      .field("name", "Xx")
      .field("description", "Yy")
      .field("price", "1")
      .field("category", String(category._id))
      .field("unit", "kg");
    req = attachProductImage(req);

    const res = await req;
    expect(res.status).toBe(403);
  });
});

describe("Products — cart purchase rules", () => {
  it("cannot add frozen product to cart", async () => {
    const customer = await createCustomerUser();
    const token = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const product = await createProduct({ isFrozen: true });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    expect(res.status).toBe(404);
  });

  it("cannot add deleted product to cart", async () => {
    const customer = await createCustomerUser();
    const token = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const product = await createProduct({ isDeleted: true, isActive: false });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    expect(res.status).toBe(404);
  });
});
