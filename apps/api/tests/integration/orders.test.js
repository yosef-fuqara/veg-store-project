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

const orderPayload = {
  deliveryAddress: {
    city: "Tel Aviv",
    street: "Herzl",
    building: "1"
  },
  deliveryZone: "zone_a",
  customerPhone: "0501234567",
  paymentMethod: "credit_card"
};

async function seedCart(token, productId) {
  await request(getApp())
    .post(apiUrl("/cart/items"))
    .set("Authorization", `Bearer ${token}`)
    .send({ productId, quantity: 1 });
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
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.order.total).toBe(20 + 15);
    expect(res.body.data.order.items.length).toBe(1);

    const cart = await request(getApp()).get(apiUrl("/cart")).set("Authorization", `Bearer ${token}`);
    expect(cart.body.data.cart.items.length).toBe(0);
  });

  it("returns 400 when cart empty", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(orderPayload);

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid delivery zone", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send({ ...orderPayload, deliveryZone: "zone_invalid" });

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
        deliveryAddress: { city: "X", street: "Y" },
        deliveryZone: "zone_a"
      });

    expect(res.status).toBe(400);
  });

  it("customer lists and views own orders only", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct();
    await seedCart(token, String(product._id));

    const created = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(orderPayload);
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
      .send(orderPayload);
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
      .send(orderPayload);
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
      .send(orderPayload);
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
      .send(orderPayload);
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
