const { StatusCodes } = require("http-status-codes");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");
const {
  computeCartTotals,
  buildCheckoutPreview,
  assertProductPurchasable,
  getEffectiveUnitPrice,
  deriveQuantityFromPurchaseAmount,
  assertQuantityAllowedForProduct,
  PURCHASE_MODE_QUANTITY,
  PURCHASE_MODE_AMOUNT,
  floorPayableIls
} = require("../services/cart.service");
const { isWrapAllowedForUnit, WRAP_PRICE_PER_KG } = require("../constants/product");

const PRODUCT_CART_FIELDS = "price salePrice stockStatus unit allowPurchaseByAmount";

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

const formatCartResponse = async (cart) => {
  const { items, subtotal, wrapTotal } = await computeCartTotals(cart.items);

  // Persist the normalized rows (incl. coerced wrap flag) so a stale toggle
  // for a now-non-kg product can't sneak back on a future request.
  cart.items = items.map(
    ({ product, quantity, unitPriceSnapshot, wrap, purchaseMode, requestedAmountIls }) => ({
      product,
      quantity,
      unitPriceSnapshot,
      wrap,
      purchaseMode,
      requestedAmountIls
    })
  );
  await cart.save();

  return {
    id: cart._id,
    user: cart.user,
    items: items.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      unitPriceSnapshot: item.unitPriceSnapshot,
      wrap: item.wrap,
      wrapFee: item.wrapFee,
      purchaseMode: item.purchaseMode,
      requestedAmountIls: item.requestedAmountIls,
      lineProductSubtotal: item.lineProductSubtotal,
      productSnapshot: item.productSnapshot
    })),
    subtotal,
    wrapTotal,
    payableTotal: floorPayableIls(subtotal + wrapTotal),
    wrapPricePerKg: WRAP_PRICE_PER_KG,
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

const lineIsPurchaseByAmount = (line) =>
  line &&
  line.purchaseMode === PURCHASE_MODE_AMOUNT &&
  typeof line.requestedAmountIls === "number" &&
  Number.isFinite(line.requestedAmountIls) &&
  line.requestedAmountIls > 0;

const mergeIntoQuantityLine = (line, addQuantity, unitPrice) => {
  line.quantity = roundSafeSum(line.quantity, addQuantity);
  line.unitPriceSnapshot = unitPrice;
  line.purchaseMode = PURCHASE_MODE_QUANTITY;
  line.requestedAmountIls = undefined;
};

/** Second (or further) add-by-amount on the same product: sum requested ₪ and re-derive weight. */
const mergeIntoAmountLine = (line, addPurchaseAmountIls, unitPrice, product) => {
  const prev = lineIsPurchaseByAmount(line) ? Number(line.requestedAmountIls) : 0;
  const nextRequested = roundHalfUpNum(prev + Number(addPurchaseAmountIls), 2);
  const { quantity: derivedQty } = deriveQuantityFromPurchaseAmount(
    nextRequested,
    unitPrice,
    product
  );
  assertQuantityAllowedForProduct(product, derivedQty);
  line.quantity = derivedQty;
  line.unitPriceSnapshot = unitPrice;
  line.purchaseMode = PURCHASE_MODE_AMOUNT;
  line.requestedAmountIls = nextRequested;
};

const roundSafeSum = (a, b) => roundHalfUpNum(Number(a) + Number(b), 4);

const roundHalfUpNum = (value, decimalPlaces) => {
  const f = 10 ** decimalPlaces;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};

const addCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, purchaseAmountIls, wrap } = req.body;
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
      isFrozen: false,
      isDeleted: { $ne: true }
    }).select(PRODUCT_CART_FIELDS);

    assertProductPurchasable(product);

    const unitPrice = getEffectiveUnitPrice(product);
    const wrapRequested = typeof wrap === "boolean" ? wrap : undefined;
    const wrapAllowed = isWrapAllowedForUnit(product.unit);
    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find((item) => String(item.product) === productId);

    const byAmount = typeof purchaseAmountIls === "number";

    if (byAmount) {
      const { quantity: derivedQty } = deriveQuantityFromPurchaseAmount(
        purchaseAmountIls,
        unitPrice,
        product
      );
      assertQuantityAllowedForProduct(product, derivedQty);

      if (existingItem) {
        if (!lineIsPurchaseByAmount(existingItem)) {
          throw new AppError(
            "This product is already in the cart by quantity. Remove the line or finish checkout before buying by amount.",
            StatusCodes.BAD_REQUEST,
            null,
            "CART_ADD_AMOUNT_BLOCKED_QUANTITY_LINE"
          );
        }
        mergeIntoAmountLine(existingItem, purchaseAmountIls, unitPrice, product);
        if (wrapRequested !== undefined) {
          existingItem.wrap = wrapAllowed && wrapRequested;
        }
      } else {
        cart.items.push({
          product: product._id,
          quantity: derivedQty,
          unitPriceSnapshot: unitPrice,
          purchaseMode: PURCHASE_MODE_AMOUNT,
          requestedAmountIls: purchaseAmountIls,
          wrap: wrapAllowed && Boolean(wrapRequested)
        });
      }
    } else {
      assertQuantityAllowedForProduct(product, quantity);

      if (existingItem) {
        if (lineIsPurchaseByAmount(existingItem)) {
          throw new AppError(
            "This product is already in the cart by amount. Remove the line or finish checkout before buying by quantity.",
            StatusCodes.BAD_REQUEST,
            null,
            "CART_ADD_QUANTITY_BLOCKED_AMOUNT_LINE"
          );
        }
        mergeIntoQuantityLine(existingItem, quantity, unitPrice);
        if (wrapRequested !== undefined) {
          existingItem.wrap = wrapAllowed && wrapRequested;
        }
      } else {
        cart.items.push({
          product: product._id,
          quantity,
          unitPriceSnapshot: unitPrice,
          purchaseMode: PURCHASE_MODE_QUANTITY,
          requestedAmountIls: undefined,
          wrap: wrapAllowed && Boolean(wrapRequested)
        });
      }
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
    }).select(PRODUCT_CART_FIELDS);

    assertProductPurchasable(product);

    const isAmountLine = lineIsPurchaseByAmount(item);

    if (typeof req.body.quantity === "number" && isAmountLine) {
      throw new AppError(
        "This line was added by amount. Remove the item to switch to quantity, or adjust the amount only.",
        StatusCodes.BAD_REQUEST,
        null,
        "CART_UPDATE_QUANTITY_BLOCKED_AMOUNT_LINE"
      );
    }

    if (typeof req.body.purchaseAmountIls === "number" && !isAmountLine) {
      throw new AppError(
        "This line is by quantity. Remove the item to switch to buying by amount.",
        StatusCodes.BAD_REQUEST,
        null,
        "CART_UPDATE_AMOUNT_BLOCKED_QUANTITY_LINE"
      );
    }

    if (typeof req.body.purchaseAmountIls === "number") {
      if (!product.allowPurchaseByAmount) {
        throw new AppError(
          "This product does not support buying by money amount",
          StatusCodes.BAD_REQUEST
        );
      }
      const unitPrice = getEffectiveUnitPrice(product);
      const { quantity: derivedQty } = deriveQuantityFromPurchaseAmount(
        req.body.purchaseAmountIls,
        unitPrice,
        product
      );
      assertQuantityAllowedForProduct(product, derivedQty);
      item.quantity = derivedQty;
      item.purchaseMode = PURCHASE_MODE_AMOUNT;
      item.requestedAmountIls = req.body.purchaseAmountIls;
    }

    if (typeof req.body.quantity === "number") {
      assertQuantityAllowedForProduct(product, req.body.quantity);
      item.quantity = req.body.quantity;
      item.purchaseMode = PURCHASE_MODE_QUANTITY;
      item.requestedAmountIls = undefined;
    }
    if (typeof req.body.wrap === "boolean") {
      // Wrap is silently dropped for non-kg products so the customer is never
      // surprised by a wrap charge on something we can't actually wrap.
      item.wrap = isWrapAllowedForUnit(product.unit) && req.body.wrap;
    }
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
      .json({ success: true, message: "Item removed", data: { cart: payload } });
  } catch (error) {
    return next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Cart cleared",
      data: {
        cart: {
          items: [],
          subtotal: 0,
          wrapTotal: 0,
          payableTotal: 0,
          wrapPricePerKg: WRAP_PRICE_PER_KG
        }
      }
    });
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
