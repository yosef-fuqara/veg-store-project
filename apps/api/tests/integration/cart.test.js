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

  it("updates purchaseAmountIls while keeping amount mode", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({
      price: 7,
      allowPurchaseByAmount: true
    });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 50 });

    const patch = await request(getApp())
      .patch(apiUrl(`/cart/items/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .send({ purchaseAmountIls: 55 });

    expect(patch.status).toBe(200);
    expect(patch.body.data.cart.items[0].purchaseMode).toBe("amount");
    expect(patch.body.data.cart.items[0].requestedAmountIls).toBe(55);
    const expectedQty = Math.round((55 / 7) * 10000) / 10000;
    expect(patch.body.data.cart.items[0].quantity).toBe(expectedQty);
  });

  it("returns 400 when PATCH sends both quantity and purchaseAmountIls", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ allowPurchaseByAmount: true });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 10 });

    const patch = await request(getApp())
      .patch(apiUrl(`/cart/items/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2, purchaseAmountIls: 20 });

    expect(patch.status).toBe(400);
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

  it("returns 400 when purchase by amount is not allowed on product", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ allowPurchaseByAmount: false, price: 10 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 10 });

    expect(res.status).toBe(400);
  });

  it("adds by purchaseAmountIls using effective sale price", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({
      allowPurchaseByAmount: true,
      price: 10,
      salePrice: 5
    });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].quantity).toBe(2);
    expect(res.body.data.cart.items[0].purchaseMode).toBe("amount");
    expect(res.body.data.cart.items[0].requestedAmountIls).toBe(10);
  });

  it("keeps per-line subtotals precise but payableTotal floors goods+wrap to whole ₪", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ price: 19.99 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].lineProductSubtotal).toBe(59.97);
    expect(res.body.data.cart.subtotal).toBe(59.97);
    expect(res.body.data.cart.payableTotal).toBe(59);
  });

  it("merges a second purchase by amount into one amount line (sums requested ₪)", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({
      allowPurchaseByAmount: true,
      price: 10
    });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 10 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 10 });

    expect(res.status).toBe(200);
    expect(res.body.data.cart.items.length).toBe(1);
    expect(res.body.data.cart.items[0].quantity).toBe(2);
    expect(res.body.data.cart.items[0].purchaseMode).toBe("amount");
    expect(res.body.data.cart.items[0].requestedAmountIls).toBe(20);
  });

  it("returns 400 when adding by amount while the product is already in cart by quantity", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ allowPurchaseByAmount: true, price: 10 });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 25 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CART_ADD_AMOUNT_BLOCKED_QUANTITY_LINE");
  });

  it("returns 400 when adding by quantity while the product is already in cart by amount", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ allowPurchaseByAmount: true, price: 10 });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 10 });

    const res = await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("CART_ADD_QUANTITY_BLOCKED_AMOUNT_LINE");
  });

  it("returns 400 when PATCH quantity on an amount-mode line", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ allowPurchaseByAmount: true, price: 7 });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), purchaseAmountIls: 50 });

    const patch = await request(getApp())
      .patch(apiUrl(`/cart/items/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 2 });

    expect(patch.status).toBe(400);
    expect(patch.body.code).toBe("CART_UPDATE_QUANTITY_BLOCKED_AMOUNT_LINE");
  });

  it("returns 400 when PATCH purchaseAmountIls on a quantity-mode line", async () => {
    const user = await createCustomerUser();
    const token = await loginAndGetAccessToken(user.email, DEFAULT_PASSWORD);
    const product = await createProduct({ allowPurchaseByAmount: true, price: 7 });

    await request(getApp())
      .post(apiUrl("/cart/items"))
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: String(product._id), quantity: 2 });

    const patch = await request(getApp())
      .patch(apiUrl(`/cart/items/${product._id}`))
      .set("Authorization", `Bearer ${token}`)
      .send({ purchaseAmountIls: 50 });

    expect(patch.status).toBe(400);
    expect(patch.body.code).toBe("CART_UPDATE_AMOUNT_BLOCKED_QUANTITY_LINE");
  });
});
