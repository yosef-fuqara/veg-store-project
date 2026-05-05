const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const { createAdminUser, DEFAULT_PASSWORD } = require("../helpers/factories");
const { attachProductImage } = require("../helpers/product-multipart");

describe("Seed bootstrap flow", () => {
  it("creates users, categories and products end-to-end", async () => {
    const app = getApp();

    // 1) Register a customer through public auth API.
    const customerEmail = `seed.customer.${Date.now()}@test.com`;
    const registerRes = await request(app).post(apiUrl("/auth/register")).send({
      name: "Seed Customer",
      phone: "0501234567",
      email: customerEmail,
      password: DEFAULT_PASSWORD
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.user.role).toBe("customer");
    const customerToken = registerRes.body.data.tokens.accessToken;
    expect(customerToken).toBeDefined();

    // 2) Create + login admin (factory creates admin directly in DB for tests).
    const admin = await createAdminUser();
    const adminLoginRes = await request(app).post(apiUrl("/auth/login")).send({
      email: admin.email,
      password: DEFAULT_PASSWORD
    });
    expect(adminLoginRes.status).toBe(200);
    const adminToken = adminLoginRes.body.data.tokens.accessToken;
    expect(adminToken).toBeDefined();

    // 3) Create categories as admin.
    const categoriesToCreate = [
      { name: "Seed Vegetables", description: "Vegetable category" },
      { name: "Seed Fruits", description: "Fruit category" }
    ];

    const createdCategories = [];
    for (const payload of categoriesToCreate) {
      const categoryRes = await request(app)
        .post(apiUrl("/categories"))
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload);

      expect(categoryRes.status).toBe(201);
      expect(categoryRes.body.data.category._id).toBeDefined();
      createdCategories.push(categoryRes.body.data.category);
    }

    // 4) Create products as admin (multipart + image required).
    const productsToCreate = [
      {
        name: "Seed Tomato",
        description: "Fresh seeded tomato",
        price: "11.9",
        salePrice: "9.9",
        category: createdCategories[0]._id,
        unit: "kg",
        stockStatus: "in_stock",
        isFeatured: "true"
      },
      {
        name: "Seed Apple Box",
        description: "Sweet apples in box",
        price: "24",
        category: createdCategories[1]._id,
        unit: "box",
        stockStatus: "in_stock",
        isFeatured: "false"
      }
    ];

    const createdProducts = [];
    for (const payload of productsToCreate) {
      let req = request(app)
        .post(apiUrl("/products"))
        .set("Authorization", `Bearer ${adminToken}`);

      Object.entries(payload).forEach(([key, value]) => {
        req = req.field(key, String(value));
      });
      req = attachProductImage(req);

      const productRes = await req;
      expect(productRes.status).toBe(201);
      expect(productRes.body.data.product._id).toBeDefined();
      createdProducts.push(productRes.body.data.product);
    }

    // 5) Verify data appears in public and admin lists.
    const publicCategoriesRes = await request(app).get(apiUrl("/categories"));
    expect(publicCategoriesRes.status).toBe(200);
    const publicCategoryNames = publicCategoriesRes.body.data.categories.map((c) => c.name);
    expect(publicCategoryNames).toEqual(
      expect.arrayContaining(createdCategories.map((c) => c.name))
    );

    const publicProductsRes = await request(app).get(apiUrl("/products"));
    expect(publicProductsRes.status).toBe(200);
    const publicProductNames = publicProductsRes.body.data.products.map((p) => p.name);
    expect(publicProductNames).toEqual(expect.arrayContaining(createdProducts.map((p) => p.name)));

    const adminProductsRes = await request(app)
      .get(apiUrl("/products/admin/all"))
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminProductsRes.status).toBe(200);
    const adminProductNames = adminProductsRes.body.data.products.map((p) => p.name);
    expect(adminProductNames).toEqual(expect.arrayContaining(createdProducts.map((p) => p.name)));

    // 6) Basic customer auth check to ensure seeded customer token works.
    const meRes = await request(app)
      .get(apiUrl("/auth/me"))
      .set("Authorization", `Bearer ${customerToken}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(customerEmail.toLowerCase());
  });
});
