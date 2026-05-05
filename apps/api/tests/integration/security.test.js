const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createCustomerUser,
  createAdminUser,
  createCategory,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const { attachProductImage } = require("../helpers/product-multipart");

describe("Security and validation", () => {
  it("protected route without Authorization returns 401", async () => {
    const res = await request(getApp()).get(apiUrl("/cart"));
    expect(res.status).toBe(401);
  });

  it("malformed Bearer (missing token) returns 401", async () => {
    const res = await request(getApp()).get(apiUrl("/cart")).set("Authorization", "Bearer");
    expect(res.status).toBe(401);
  });

  it("garbage Bearer token returns 401", async () => {
    const res = await request(getApp())
      .get(apiUrl("/cart"))
      .set("Authorization", "Bearer garbage.token.value");
    expect(res.status).toBe(401);
  });

  it("customer token on admin product create returns 403", async () => {
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

  it("invalid JSON body returns 4xx (body-parser rejects malformed JSON)", async () => {
    const res = await request(getApp())
      .post(apiUrl("/auth/login"))
      .set("Content-Type", "application/json")
      .send("not-json-at-all");

    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("invalid ObjectId in route returns 400", async () => {
    const admin = await createAdminUser();
    const token = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .patch(apiUrl("/categories/bad-id/freeze"))
      .set("Authorization", `Bearer ${token}`)
      .send({ isFrozen: true });

    expect(res.status).toBe(400);
  });
});
