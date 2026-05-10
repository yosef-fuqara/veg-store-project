const request = require("supertest");
const { getApp, apiUrl } = require("../helpers/test-app");
const {
  createCustomerUser,
  createProduct,
  loginAndGetAccessToken,
  DEFAULT_PASSWORD
} = require("../helpers/factories");

const orderPayload = {
  deliveryAddress: { street: "Main", building: "1" },
  deliveryArea: "eilabun",
  customerPhone: "0501234567",
  paymentMethod: "credit_card"
};

async function seedCart(token, productId) {
  await request(getApp())
    .post(apiUrl("/cart/items"))
    .set("Authorization", `Bearer ${token}`)
    .send({ productId, quantity: 1 });
}

describe("WhatsApp admin notification", () => {
  const ORIGINAL_FETCH = global.fetch;
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    Object.keys(process.env).forEach((key) => {
      if (!(key in ORIGINAL_ENV)) delete process.env[key];
    });
    Object.assign(process.env, ORIGINAL_ENV);
    jest.resetModules();
  });

  it("disabled: order succeeds and no provider call is made", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock;

    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ price: 30 });
    await seedCart(token, String(product._id));

    const res = await request(getApp())
      .post(apiUrl("/orders"))
      .set("Authorization", `Bearer ${token}`)
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("buildOrderMessage includes required fields", () => {
    jest.isolateModules(() => {
      const { buildOrderMessage } = require("../../src/services/whatsapp.service");
      const msg = buildOrderMessage(
        {
          _id: "order_123",
          customerPhone: "0509999999",
          deliveryArea: "nazareth",
          total: 270,
          paymentMethod: "credit_card",
          hasPreorderItems: true
        },
        { name: "Yossi" }
      );
      expect(msg).toMatch(/New order received/);
      expect(msg).toMatch(/order_123/);
      expect(msg).toMatch(/Yossi/);
      expect(msg).toMatch(/0509999999/);
      expect(msg).toMatch(/נצרת/);
      expect(msg).toMatch(/270/);
      expect(msg).toMatch(/credit_card/);
      expect(msg).toMatch(/preorder/i);
    });
  });

  it("notifyAdminOfNewOrder never throws (provider failure is swallowed)", async () => {
    process.env.WHATSAPP_NOTIFICATIONS_ENABLED = "true";
    process.env.WHATSAPP_PROVIDER = "meta_cloud";
    process.env.WHATSAPP_API_TOKEN = "tok";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "pnid";
    process.env.ADMIN_WHATSAPP_PHONE = "+972501234567";

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom"
    });

    let result;
    await jest.isolateModulesAsync(async () => {
      const { notifyAdminOfNewOrder } = require("../../src/services/whatsapp.service");
      result = await notifyAdminOfNewOrder(
        { _id: "order_x", total: 10, paymentMethod: "credit_card", deliveryArea: "nazareth" },
        { name: "Test" }
      );
    });

    expect(result).toEqual(expect.objectContaining({ ok: false }));
  });
});
