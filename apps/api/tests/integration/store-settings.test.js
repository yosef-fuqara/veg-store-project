const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createCustomerUser,
  createAdminUser,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");
const Order = require("../../src/models/order.model");

const OUTSIDE_AREA = "eilabun";

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

describe("Store settings", () => {
  it("GET /store-settings returns defaults with success", async () => {
    const res = await request(getApp()).get(apiUrl("/store-settings"));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.settings).toMatchObject({
      isStoreOpen: true,
      showWhatsappButton: true,
      canOrderNow: true,
      storeClosedReason: null,
      operatingHoursEnabled: false
    });
    expect(res.body.data.settings.closedTitle).toMatchObject({
      he: expect.any(String),
      en: expect.any(String),
      ar: expect.any(String)
    });
    expect(res.body.data.settings.reopenAt).toBeNull();
  });

  it("admin can PATCH store-settings and GET reflects changes", async () => {
    const admin = await createAdminUser();
    const adminToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);

    const patchRes = await request(getApp())
      .patch(apiUrl("/admin/store-settings"))
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        isStoreOpen: false,
        closedTitle: { he: "סגורים", en: "Closed", ar: "مغلق" },
        showWhatsappButton: false
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.settings.isStoreOpen).toBe(false);
    expect(patchRes.body.data.settings.closedTitle.he).toBe("סגורים");
    expect(patchRes.body.data.settings.showWhatsappButton).toBe(false);

    const pub = await request(getApp()).get(apiUrl("/store-settings"));
    expect(pub.status).toBe(200);
    expect(pub.body.data.settings.isStoreOpen).toBe(false);
    expect(pub.body.data.settings.closedTitle.he).toBe("סגורים");
  });

  it("rejects PATCH /admin/store-settings without admin token", async () => {
    const res = await request(getApp()).patch(apiUrl("/admin/store-settings")).send({ isStoreOpen: false });
    expect(res.status).toBe(401);
  });

  it("blocks order creation when store is closed", async () => {
    const admin = await createAdminUser();
    const adminToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    await request(getApp())
      .patch(apiUrl("/admin/store-settings"))
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isStoreOpen: false });

    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ price: 20 });
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(baseOrderPayload);

    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      success: false,
      message: "החנות סגורה זמנית",
      code: "STORE_CLOSED"
    });

    const count = await Order.countDocuments({ user: user._id });
    expect(count).toBe(0);

    const cart = await request(getApp()).get(apiUrl("/cart")).set("Authorization", `Bearer ${token}`);
    expect(cart.body.data.cart.items.length).toBe(1);
  });

  it("allows orders again after admin reopens store", async () => {
    const admin = await createAdminUser();
    const adminToken = await loginAndGetAccessToken(admin.email, DEFAULT_PASSWORD);
    await request(getApp())
      .patch(apiUrl("/admin/store-settings"))
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ isStoreOpen: true });

    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ price: 20 });
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(baseOrderPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
