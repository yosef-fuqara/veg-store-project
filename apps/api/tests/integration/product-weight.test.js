const request = require("supertest");
const mongoose = require("mongoose");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createCustomerUser,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const Product = require("../../src/models/product.model");
const Order = require("../../src/models/order.model");
const { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } = require("../../src/constants/order");

describe("Product weight rules (0.5 kg steps)", () => {
  it("existing products without stored fields resolve minimumOrderWeight = 1", async () => {
    const product = await createProduct({ unit: "kg" });
    await Product.updateOne({ _id: product._id }, { $unset: { minimumOrderWeight: "", weightStep: "" } });
    const fresh = await Product.findById(product._id).lean();
    expect(fresh.minimumOrderWeight).toBeUndefined();

    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);

    const ok = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    expect(ok.status).toBe(200);

    const bad = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 0.5 });

    expect(bad.status).toBe(400);
  });

  it("minimumOrderWeight = 1 allows 1, 1.5, 2", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ unit: "kg", minimumOrderWeight: 1, price: 20 });

    for (const qty of [1, 1.5, 2]) {
      const res = await request(getApp())
        .post(apiUrl("/cart/items"))
        .set("Authorization", `Bearer ${token}`)
        .send({ productId: String(product._id), quantity: qty });
      expect(res.status).toBe(200);
      expect(res.body.data.cart.items[0].quantity).toBe(qty);
      await request(getApp())
        .delete(apiUrl(`/cart/items/${product._id}`))
        .set("Authorization", `Bearer ${token}`);
    }
  });

  it("minimumOrderWeight = 1 rejects 0.5", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ unit: "kg", minimumOrderWeight: 1 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 0.5 });

    expect(res.status).toBe(400);
  });

  it("rejects quarter-step values such as 1.25", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ unit: "kg", minimumOrderWeight: 1 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1.25 });

    expect(res.status).toBe(400);
  });

  it("minimumOrderWeight = 0.5 allows 0.5", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ unit: "kg", minimumOrderWeight: 0.5, price: 20 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].quantity).toBe(0.5);
  });

  it("minimumOrderWeight = 2 rejects 1.5", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ unit: "kg", minimumOrderWeight: 2 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1.5 });

    expect(res.status).toBe(400);
  });

  it("does not modify historical order line quantities", async () => {
    const product = await createProduct({ unit: "kg" });
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(),
      items: [
        {
          product: product._id,
          name: "Legacy quarter kg line",
          price: 10,
          quantity: 0.25,
          unit: "kg",
          lineTotal: 2.5
        }
      ],
      subtotal: 2.5,
      wrapTotal: 0,
      deliveryFee: 0,
      total: 2.5,
      deliveryAddress: { city: "Test", street: "Test St" },
      deliveryArea: "tel_aviv",
      customerPhone: "0501234567",
      paymentMethod: PAYMENT_METHOD.CREDIT_CARD,
      paymentStatus: PAYMENT_STATUS.PENDING_PAYMENT,
      orderStatus: ORDER_STATUS.NEW
    });

    const saved = await Order.findById(order._id).lean();
    expect(saved.items[0].quantity).toBe(0.25);
  });
});
