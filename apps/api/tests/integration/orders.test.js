const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createCustomerUser,
  createAdminUser,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const { ORDER_STATUS } = require("../../src/constants/order");
const {
  LOCAL_DELIVERY_AREA,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_DELIVERY_FEE,
  LOCAL_FREE_DELIVERY_MIN,
  OUTSIDE_FREE_DELIVERY_MIN
} = require("../../src/constants/delivery");

const OUTSIDE_AREA = "nazareth";

const baseOrderPayload = {
  deliveryAddress: {
    street: "Main",
    building: "1"
  },
  deliveryArea: OUTSIDE_AREA,
  customerPhone: "0501234567",
  paymentMethod: "credit_card"
};

async function seedCart(token, productId, quantity = 1) {
  await request(getApp())
    .post(apiUrl("/cart/items"))
    .set("Authorization", `Bearer ${token}`)
    .send({ productId, quantity });
}

describe("Orders", () => {
  it("creates order from cart successfully", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ price: 20 });
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(baseOrderPayload);

    expect(res.status).toBe(201);
    // Outside area, subtotal 20 < 200 ⇒ delivery fee = OUTSIDE_DELIVERY_FEE.
    expect(res.body.data.order.subtotal).toBe(20);
    expect(res.body.data.order.deliveryFee).toBe(OUTSIDE_DELIVERY_FEE);
    expect(res.body.data.order.total).toBe(20 + OUTSIDE_DELIVERY_FEE);
    expect(res.body.data.order.items.length).toBe(1);
    expect(res.body.data.order.deliveryArea).toBe(OUTSIDE_AREA);

    const cart = await request(getApp()).get(apiUrl("/cart")).set("Authorization", `Bearer ${token}`);
    expect(cart.body.data.cart.items.length).toBe(0);
  });

  it("returns 400 when cart empty", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(baseOrderPayload);

    expect(res.status).toBe(400);
  });

  it("rejects unsupported delivery area with 400", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...baseOrderPayload, deliveryArea: "tel_aviv" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields missing", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({
        deliveryAddress: { street: "Y" },
        deliveryArea: OUTSIDE_AREA
      });

    expect(res.status).toBe(400);
  });

  describe("delivery fee rules", () => {
    it("local area subtotal under threshold charges LOCAL_DELIVERY_FEE", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({ price: 50 });
      await seedCart(token, String(product._id), 1);

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: LOCAL_DELIVERY_AREA });

      expect(res.status).toBe(201);
      expect(res.body.data.order.subtotal).toBe(50);
      expect(res.body.data.order.subtotal).toBeLessThan(LOCAL_FREE_DELIVERY_MIN);
      expect(res.body.data.order.deliveryFee).toBe(LOCAL_DELIVERY_FEE);
      expect(res.body.data.order.total).toBe(50 + LOCAL_DELIVERY_FEE);
    });

    it("local area subtotal at or above threshold is free", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({ price: 100 });
      await seedCart(token, String(product._id), 1);

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: LOCAL_DELIVERY_AREA });

      expect(res.status).toBe(201);
      expect(res.body.data.order.subtotal).toBeGreaterThanOrEqual(LOCAL_FREE_DELIVERY_MIN);
      expect(res.body.data.order.deliveryFee).toBe(0);
      expect(res.body.data.order.total).toBe(100);
    });

    it("outside allowed area subtotal under threshold charges OUTSIDE_DELIVERY_FEE", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({ price: 60 });
      await seedCart(token, String(product._id), 1);

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA });

      expect(res.status).toBe(201);
      expect(res.body.data.order.subtotal).toBeLessThan(OUTSIDE_FREE_DELIVERY_MIN);
      expect(res.body.data.order.deliveryFee).toBe(OUTSIDE_DELIVERY_FEE);
      expect(res.body.data.order.total).toBe(60 + OUTSIDE_DELIVERY_FEE);
    });

    it("outside allowed area subtotal at or above threshold is free", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({ price: 200 });
      await seedCart(token, String(product._id), 1);

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA });

      expect(res.status).toBe(201);
      expect(res.body.data.order.subtotal).toBeGreaterThanOrEqual(OUTSIDE_FREE_DELIVERY_MIN);
      expect(res.body.data.order.deliveryFee).toBe(0);
      expect(res.body.data.order.total).toBe(200);
    });

    it("backend ignores any delivery fee sent by client", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({ price: 60 });
      await seedCart(token, String(product._id), 1);

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA, deliveryFee: 0, total: 60 });

      expect(res.status).toBe(201);
      expect(res.body.data.order.deliveryFee).toBe(OUTSIDE_DELIVERY_FEE);
      expect(res.body.data.order.total).toBe(60 + OUTSIDE_DELIVERY_FEE);
    });
  });

  describe("preorder validation", () => {
    it("rejects preorder-only product without preferredDeliveryAt", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({
        price: 250,
        isPreorderOnly: true,
        minAdvanceHours: 24
      });
      await seedCart(token, String(product._id), 1);

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA });

      expect(res.status).toBe(400);
      expect(String(res.body?.message || "")).toMatch(/24 hours/i);
    });

    it("rejects preorder when preferredDeliveryAt is too soon", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({
        price: 250,
        isPreorderOnly: true,
        minAdvanceHours: 24
      });
      await seedCart(token, String(product._id), 1);

      const tooSoon = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // +1h
      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA, preferredDeliveryAt: tooSoon });

      expect(res.status).toBe(400);
      expect(String(res.body?.message || "")).toMatch(/24 hours/i);
    });

    it("accepts preorder when preferredDeliveryAt is far enough in the future", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({
        price: 250,
        isPreorderOnly: true,
        minAdvanceHours: 24
      });
      await seedCart(token, String(product._id), 1);

      const okTime = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(); // +26h
      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA, preferredDeliveryAt: okTime });

      expect(res.status).toBe(201);
      expect(res.body.data.order.hasPreorderItems).toBe(true);
      expect(res.body.data.order.preferredDeliveryAt).toBeTruthy();
    });

    it("non-preorder cart works without preferredDeliveryAt", async () => {
      const user = await createCustomerUser();
      const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
      const product = await createProduct({ price: 30 });
      await seedCart(token, String(product._id));

      const res = await request(getApp())
        .post(apiUrl("/orders"))
        .set("Authorization", `Bearer ${token}`)
        .send({ ...baseOrderPayload, deliveryArea: OUTSIDE_AREA });

      expect(res.status).toBe(201);
      expect(res.body.data.order.hasPreorderItems).toBe(false);
    });
  });

  describe("delivery areas endpoint", () => {
    it("exposes the allowed areas and pricing rules to the storefront", async () => {
      const res = await request(getApp()).get(apiUrl("/orders/delivery-areas"));
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.areas)).toBe(true);
      expect(res.body.data.localAreaKey).toBe(LOCAL_DELIVERY_AREA);
      expect(res.body.data.rules.localFreeDeliveryMin).toBe(LOCAL_FREE_DELIVERY_MIN);
      expect(res.body.data.rules.outsideFreeDeliveryMin).toBe(OUTSIDE_FREE_DELIVERY_MIN);
      expect(res.body.data.rules.localDeliveryFee).toBe(LOCAL_DELIVERY_FEE);
      expect(res.body.data.rules.outsideDeliveryFee).toBe(OUTSIDE_DELIVERY_FEE);
    });
  });

  it("customer lists and views own orders only", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const created = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(baseOrderPayload);
    const orderId = created.body.data.order._id;

    const list = await request(getApp()).get(apiUrl("/orders")).set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.orders.some((o) => String(o._id) === String(orderId))).toBe(true);

    const detail = await request(getApp())
      .get(apiUrl(`/orders/${orderId}`))
      .set("Authorization", `Bearer ${token}`);
    expect(detail.status).toBe(200);
  });

  it("customer cannot view another customer order", async () => {
    const a = await createCustomerUser();
    const b = await createCustomerUser();
    const tokenA = await loginAndGetAccessToken(a.email, DEFAULT_PASSWORD);
    const tokenB = await loginAndGetAccessToken(b.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    await seedCart(tokenA, String(product._id));
    const created = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${tokenA}`)
      .send(baseOrderPayload);
    const orderId = created.body.data.order._id;

    const res = await request(getApp())
      .get(apiUrl(`/orders/${orderId}`))
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(404);
  });

  it("admin lists all orders and views detail", async () => {
    const customer = await createCustomerUser();
    const cToken = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const admin = await createAdminUser();
    const aToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    await seedCart(cToken, String(product._id));
    const created = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${cToken}`)
      .send(baseOrderPayload);
    const orderId = created.body.data.order._id;

    const list = await request(getApp())
      .get(apiUrl("/orders/admin/all"))
      .set("Authorization", `Bearer ${aToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.orders.length).toBeGreaterThanOrEqual(1);

    const detail = await request(getApp())
      .get(apiUrl(`/orders/admin/${orderId}`))
      .set("Authorization", `Bearer ${aToken}`);
    expect(detail.status).toBe(200);
  });

  it("admin updates order status with valid transition", async () => {
    const customer = await createCustomerUser();
    const cToken = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const admin = await createAdminUser();
    const aToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    await seedCart(cToken, String(product._id));
    const created = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${cToken}`)
      .send(baseOrderPayload);
    const orderId = created.body.data.order._id;

    const res = await request(getApp())
      .patch(apiUrl(`/orders/admin/${orderId}/status`))
      .set("Authorization", `Bearer ${aToken}`)
      .send({ orderStatus: ORDER_STATUS.CONFIRMED });

    expect(res.status).toBe(200);
    expect(res.body.data.order.orderStatus).toBe(ORDER_STATUS.CONFIRMED);
  });

  it("admin invalid status transition returns 400", async () => {
    const customer = await createCustomerUser();
    const cToken = await loginAndGetAccessToken(customer.email, DEFAULT_PASSWORD);
    const admin = await createAdminUser();
    const aToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    const product = await createProduct();

    await seedCart(cToken, String(product._id));
    const created = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${cToken}`)
      .send(baseOrderPayload);
    const orderId = created.body.data.order._id;

    const res = await request(getApp())
      .patch(apiUrl(`/orders/admin/${orderId}/status`))
      .set("Authorization", `Bearer ${aToken}`)
      .send({ orderStatus: ORDER_STATUS.DELIVERED });

    expect(res.status).toBe(400);
  });

  it("returns 401 when admin routes used without token", async () => {
    const res = await request(getApp()).get(apiUrl("/orders/admin/all"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid order id param", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .get(apiUrl("/orders/not-valid-id"))
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it("customer receives 403 on admin order list", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .get(apiUrl("/orders/admin/all"))
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
