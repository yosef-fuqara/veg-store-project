const request = require("supertest");
const mongoose = require("mongoose");
const { getApp, apiUrl, getEnv } = require("../helpers/test-app");
const {
  createCustomerUser,
  createAdminUser,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const { PAYMENT_METHOD } = require("../../src/constants/order");

const addressOrderBase = {
  deliveryAddress: {
    street: "Herzl",
    building: "1"
  },
  deliveryArea: "nazareth",
  customerPhone: "0501234567"
};

async function seedCart(token, productId) {
  await request(getApp())
    .post(apiUrl("/cart/items"))
    .set("Authorization", `Bearer ${token}`)
    .send({ productId, quantity: 1 });
}

describe("Payments (Phase 8)", () => {
  it("credit_card order starts as pending_payment", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    expect(res.status).toBe(201);
    expect(res.body.data.order.paymentStatus).toBe("pending_payment");
    expect(res.body.data.order.paymentMethod).toBe("credit_card");
  });

  it("bit order starts as pending_payment", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.BIT });

    expect(res.status).toBe(201);
    expect(res.body.data.order.paymentStatus).toBe("pending_payment");
  });

  it("webhook returns 401 with bad secret", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", "wrong-secret")
      .send({
        orderId: order.body.data.order._id,
        providerEventId: "evt_bad_secret",
        outcome: "succeeded"
      });

    expect(res.status).toBe(401);
  });

  it("webhook succeeded sets order to paid", async () => {
    const env = getEnv();
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_ok_${Date.now()}`,
        outcome: "succeeded"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.duplicate).toBe(false);
    expect(res.body.data.order.paymentStatus).toBe("paid");
  });

  it("webhook failed sets payment failed", async () => {
    const env = getEnv();
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_fail_${Date.now()}`,
        outcome: "failed"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.order.paymentStatus).toBe("failed");
  });

  it("webhook cancelled sets payment cancelled", async () => {
    const env = getEnv();
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_cancel_${Date.now()}`,
        outcome: "cancelled"
      });

    expect(res.status).toBe(200);
    expect(res.body.data.order.paymentStatus).toBe("cancelled");
  });

  it("replay same providerEventId is idempotent", async () => {
    const env = getEnv();
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const body = {
      orderId: order.body.data.order._id,
      providerEventId: `evt_idem_${Date.now()}`,
      outcome: "succeeded"
    };

    const first = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send(body);
    expect(first.status).toBe(200);
    expect(first.body.data.duplicate).toBe(false);

    const second = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send(body);
    expect(second.status).toBe(200);
    expect(second.body.data.duplicate).toBe(true);
  });

  it("webhook unknown orderId returns 404", async () => {
    const env = getEnv();
    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: String(new mongoose.Types.ObjectId()),
        providerEventId: `evt_missing_${Date.now()}`,
        outcome: "succeeded"
      });

    expect(res.status).toBe(404);
  });

  it("webhook on bank_transfer order returns 400", async () => {
    const env = getEnv();
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.BANK_TRANSFER });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_bank_${Date.now()}`,
        outcome: "succeeded"
      });

    expect(res.status).toBe(400);
  });

  it("webhook when order not pending_payment returns 400", async () => {
    const env = getEnv();
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_first_${Date.now()}`,
        outcome: "succeeded"
      });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", env.paymentWebhookSecret)
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_second_${Date.now()}`,
        outcome: "succeeded"
      });

    expect(res.status).toBe(400);
  });

  it("admin approves bank_transfer order", async () => {
    const customer = await createCustomerUser();
    const cToken = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const admin = await createAdminUser();
    const aToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(cToken, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${cToken}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.BANK_TRANSFER });

    const res = await request(getApp())
      .patch(apiUrl(`/orders/admin/${order.body.data.order._id}/payment-status`))
      .set("Authorization", `Bearer ${aToken}`)
      .send({ paymentStatus: "bank_transfer_approved", notes: "Wire confirmed" });

    expect(res.status).toBe(200);
    expect(res.body.data.order.paymentStatus).toBe("bank_transfer_approved");
  });

  it("customer cannot approve bank transfer (403)", async () => {
    const customer = await createCustomerUser();
    const token = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.BANK_TRANSFER });

    const res = await request(getApp())
      .patch(apiUrl(`/orders/admin/${order.body.data.order._id}/payment-status`))
      .set("Authorization", `Bearer ${token}`)
      .send({ paymentStatus: "bank_transfer_approved" });

    expect(res.status).toBe(403);
  });

  it("admin cannot patch payment on credit_card order", async () => {
    const customer = await createCustomerUser();
    const cToken = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const admin = await createAdminUser();
    const aToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(cToken, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${cToken}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const res = await request(getApp())
      .patch(apiUrl(`/orders/admin/${order.body.data.order._id}/payment-status`))
      .set("Authorization", `Bearer ${aToken}`)
      .send({ paymentStatus: "bank_transfer_approved" });

    expect(res.status).toBe(400);
  });

  it("returns 500 when payment webhook secret empty (misconfiguration)", async () => {
    const env = getEnv();
    const prev = env.paymentWebhookSecret;
    env.paymentWebhookSecret = "";

    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const order = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...addressOrderBase, paymentMethod: PAYMENT_METHOD.CREDIT_CARD });

    const res = await request(getApp())
      .post(apiUrl("/payments/webhook"))
      .set("x-payment-webhook-secret", "anything")
      .send({
        orderId: order.body.data.order._id,
        providerEventId: `evt_nosec_${Date.now()}`,
        outcome: "succeeded"
      });

    env.paymentWebhookSecret = prev;
    expect(res.status).toBe(500);
  });
});
