const request = require("supertest");
const mongoose = require("mongoose");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createCustomerUser,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const { PRODUCT_STOCK_STATUS } = require("../../src/constants/product");

describe("Cart", () => {
  it("returns 401 without auth", async () => {
    const res = await request(getApp()).get(apiUrl("/cart"));
    expect(res.status).toBe(401);
  });

  it("adds item successfully", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items.length).toBe(1);
    expect(res.body.data.cart.items[0].quantity).toBe(2);
  });

  it("returns 400 when productId missing", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(400);
  });

  it("returns 404 when product not found", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(fakeId), quantity: 1 });

    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid quantity (0)", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 0 });

    expect(res.status).toBe(400);
  });

  it("updates quantity and removes item", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    const patch = await request(getApp())
      .patch(apiUrl(`/cart/items/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(patch.status).toBe(200);
    expect(patch.body.data.cart.items[0].quantity).toBe(5);

    const del = await request(getApp())
      .delete(apiUrl(`/cart/items/${product._id}`))
      .set("Authorization", `Bearer ${token}`);

    expect(del.status).toBe(200);
    expect(del.body.data.cart.items.length).toBe(0);
  });

  it("clears cart", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    const res = await request(getApp())
      .delete(apiUrl("/cart"))
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items.length).toBe(0);
  });

  it("returns 400 when product is out of stock", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ stockStatus: PRODUCT_STOCK_STATUS.OUT_OF_STOCK });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    expect(res.status).toBe(400);
  });
});
