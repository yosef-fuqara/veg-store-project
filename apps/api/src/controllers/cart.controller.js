const { StatusCodes } = require("http-status-codes");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");
const {
  computeCartTotals,
  buildCheckoutPreview,
  assertProductPurchasable,
  getEffectiveUnitPrice
} = require("../services/cart.service");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

const formatCartResponse = async (cart) => {
  const { items, subtotal } = await computeCartTotals(cart.items);

  cart.items = items.map(({ product, quantity, unitPriceSnapshot }) => ({
    product,
    quantity,
    unitPriceSnapshot
  }));
  await cart.save();

  return {
    id: cart._id,
    user: cart.user,
    items: items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      unitPriceSnapshot: item.unitPriceSnapshot,
      productSnapshot: item.productSnapshot
    })),
    subtotal,
    updatedAt: cart.updatedAt
  };
};

const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const payload = await formatCartResponse(cart);
    return res.status(StatusCodes.OK).json({ success: true, data: { cart: payload } });
  } catch (error) {
    return next(error);
  }
};

const addCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      isFrozen: false,
      isDeleted: { $ne: true }
    }).select("price salePrice stockStatus");

    assertProductPurchasable(product);

    const unitPrice = getEffectiveUnitPrice(product);
    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => String(item.product) === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.unitPriceSnapshot = unitPrice;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        unitPriceSnapshot: unitPrice
      });
    }

    await cart.save();
    const payload = await formatCartResponse(cart);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Item added to cart", data: { cart: payload } });
  } catch (error) {
    return next(error);
  }
};

const updateCartItemQuantity = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find(
      (cartItem) => String(cartItem.product) === req.params.productId
    );
    if (!item) {
      throw new AppError("Cart item not found", StatusCodes.NOT_FOUND);
    }

    const product = await Product.findOne({
      _id: req.params.productId,
      isActive: true,
      isFrozen: false,
      isDeleted: { $ne: true }
    }).select("price salePrice stockStatus");

    assertProductPurchasable(product);

    item.quantity = req.body.quantity;
    item.unitPriceSnapshot = getEffectiveUnitPrice(product);
    await cart.save();

    const payload = await formatCartResponse(cart);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Cart item updated", data: { cart: payload } });
  } catch (error) {
    return next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const beforeCount = cart.items.length;
    cart.items = cart.items.filter(
      (cartItem) => String(cartItem.product) !== req.params.productId
    );

    if (cart.items.length === beforeCount) {
      throw new AppError("Cart item not found", StatusCodes.NOT_FOUND);
    }

    await cart.save();
    const payload = await formatCartResponse(cart);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Cart item removed", data: { cart: payload } });
  } catch (error) {
    return next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Cart cleared", data: { cart: { items: [], subtotal: 0 } } });
  } catch (error) {
    return next(error);
  }
};

const prepareCheckout = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    if (!cart.items.length) {
      throw new AppError("Cart is empty", StatusCodes.BAD_REQUEST);
    }

    const preview = await buildCheckoutPreview(cart.items);
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Checkout data revalidated",
      data: { checkout: preview }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  prepareCheckout
};
