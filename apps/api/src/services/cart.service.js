const { StatusCodes } = require("http-status-codes");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");
const { WRAP_PRICE_PER_KG, isWrapAllowedForUnit, PRODUCT_UNITS } = require("../constants/product");
const {
  resolveProductNameString,
  toProductNameLocales
} = require("../utils/product-name");

const PURCHASE_MODE_QUANTITY = "quantity";
const PURCHASE_MODE_AMOUNT = "amount";

const MAX_CART_LINE_QUANTITY = 10000;
const MIN_CART_LINE_QUANTITY = 0.01;
const MAX_CLASSIC_INTEGER_QTY = 100;
const INTEGRAL_EPS = 1e-4;

const buildCartProductQuery = (ids) => ({
  _id: { $in: ids },
  isActive: true,
  isFrozen: false,
  isDeleted: { $ne: true }
});

const assertProductPurchasable = (product) => {
  if (!product) {
    throw new AppError("Product not found", StatusCodes.NOT_FOUND);
  }

  if (product.stockStatus === "out_of_stock") {
    throw new AppError("Product is out of stock", StatusCodes.BAD_REQUEST);
  }
};

const getEffectiveUnitPrice = (product) => {
  const base = product.price;
  const sale = product.salePrice;
  if (typeof sale === "number" && !Number.isNaN(sale) && sale >= 0 && sale <= base) {
    return sale;
  }
  return base;
};

/** Half-up rounding for money (2 dp) and similar. */
const roundHalfUp = (value, decimalPlaces) => {
  const f = 10 ** decimalPlaces;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};

const roundQuantityFromAmount = (rawQuantity) => roundHalfUp(rawQuantity, 4);

/** Weight quantity is stored in kg; legacy gram-unit products still price per gram. */
const lineProductSubtotal = (quantity, unitPrice, unit) => {
  const q = Number(quantity);
  const p = Number(unitPrice);
  const factor = unit === PRODUCT_UNITS.GRAM ? 1000 : 1;
  return roundHalfUp(q * factor * p, 2);
};

/** Final amount to charge in whole ₪ (truncate downward). Used only for order/cart payable totals, not per line. */
const floorPayableIls = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n + Number.EPSILON);
};

const allowsFractionalQuantityByUnit = (unit) =>
  unit === PRODUCT_UNITS.KG || unit === PRODUCT_UNITS.GRAM;

const QUARTER_KG = 0.25;
const QUARTER_GRAM = 250;
const INTEGRAL_WEIGHT_EPS = 1e-6;

const isMultipleOf = (value, step) => {
  const ratio = Number(value) / step;
  return Math.abs(ratio - Math.round(ratio)) <= INTEGRAL_WEIGHT_EPS;
};

const isValidQuarterKg = (value) =>
  Number.isFinite(value) &&
  value >= QUARTER_KG &&
  value <= MAX_CART_LINE_QUANTITY &&
  isMultipleOf(value, QUARTER_KG);

/**
 * Cart stores weight in kg. For legacy gram-unit rows, accept either:
 * - kg quarter steps (new format)
 * - gram quarter steps (legacy format, e.g. 250, 500, 750)
 */
const coerceCartWeightQuantityKg = (product, quantity) => {
  const q = Number(quantity);
  if (!Number.isFinite(q)) return q;

  if (product.unit !== PRODUCT_UNITS.GRAM) return q;

  if (q >= QUARTER_GRAM && isMultipleOf(q, QUARTER_GRAM)) {
    return roundHalfUp(q / 1000, 4);
  }
  if (isValidQuarterKg(q)) {
    return q;
  }

  return q;
};

const assertWeightQuantityAllowed = (product, quantityKg) => {
  const q = coerceCartWeightQuantityKg(product, quantityKg);
  if (!Number.isFinite(q) || q < QUARTER_KG || q > MAX_CART_LINE_QUANTITY) {
    throw new AppError("Invalid weight for this product", StatusCodes.BAD_REQUEST);
  }
  if (!isMultipleOf(q, QUARTER_KG)) {
    throw new AppError("Weight must be in steps of 0.25 kg", StatusCodes.BAD_REQUEST);
  }
};

const assertQuantityAllowedForProduct = (product, quantity, purchaseMode = PURCHASE_MODE_QUANTITY) => {
  let q = Number(quantity);
  if (
    allowsFractionalQuantityByUnit(product.unit) &&
    purchaseMode === PURCHASE_MODE_QUANTITY
  ) {
    q = coerceCartWeightQuantityKg(product, q);
  }
  if (!Number.isFinite(q) || q < MIN_CART_LINE_QUANTITY || q > MAX_CART_LINE_QUANTITY) {
    throw new AppError("Invalid quantity for this product", StatusCodes.BAD_REQUEST);
  }

  if (allowsFractionalQuantityByUnit(product.unit)) {
    // Quarter-kg increments are enforced only for classic "quantity" purchases.
    // For "amount" (₪) purchases we derive quantity from money and accept any
    // fractional result (existing behavior relies on this).
    if (purchaseMode === PURCHASE_MODE_QUANTITY) {
      assertWeightQuantityAllowed(product, q);
    }
    return;
  }

  if (!Number.isInteger(q)) {
    throw new AppError("Quantity must be a whole number for this product", StatusCodes.BAD_REQUEST);
  }

  if (q < 1 || q > MAX_CLASSIC_INTEGER_QTY) {
    throw new AppError("Quantity must be between 1 and 100", StatusCodes.BAD_REQUEST);
  }
};

/**
 * Derive sellable quantity from a money basket using the effective unit price.
 * For unit/box, quantity must be integral (≥ 1) after rounding to 4 dp.
 */
const deriveQuantityFromPurchaseAmount = (purchaseAmountIls, effectiveUnitPrice, product) => {
  if (!product.allowPurchaseByAmount) {
    throw new AppError(
      "This product does not support buying by money amount",
      StatusCodes.BAD_REQUEST
    );
  }

  const amount = Number(purchaseAmountIls);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("purchaseAmountIls must be positive", StatusCodes.BAD_REQUEST);
  }

  const unitPrice = Number(effectiveUnitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    throw new AppError("Product price is invalid", StatusCodes.BAD_REQUEST);
  }

  const rawQuantity = roundQuantityFromAmount(amount / unitPrice);
  const quantity =
    product.unit === PRODUCT_UNITS.GRAM ? roundHalfUp(rawQuantity / 1000, 4) : rawQuantity;

  if (quantity < MIN_CART_LINE_QUANTITY || quantity > MAX_CART_LINE_QUANTITY) {
    throw new AppError("Calculated quantity is out of allowed range", StatusCodes.BAD_REQUEST);
  }

  const unit = product.unit;
  if (unit === PRODUCT_UNITS.UNIT || unit === PRODUCT_UNITS.BOX) {
    const rounded = Math.round(quantity);
    if (Math.abs(quantity - rounded) > INTEGRAL_EPS || rounded < 1) {
      throw new AppError(
        "For this product, the amount must match a whole number of units",
        StatusCodes.BAD_REQUEST
      );
    }
    return { quantity: rounded };
  }

  return { quantity };
};

// Compute the wrap surcharge for a single line. The wrap toggle is only
// honored when the product is sold by the kilogram; for any other unit we
// return zero even if the cart row still has wrap=true (e.g. after the admin
// changed the unit on an existing product).
const computeLineWrapFee = ({ quantity, wrap, unit }) => {
  if (!wrap) return 0;
  if (!isWrapAllowedForUnit(unit)) return 0;
  return Number(quantity) * WRAP_PRICE_PER_KG;
};

const normalizeCartLineMeta = (item, product, unitPriceSnapshot) => {
  const mode = item.purchaseMode === PURCHASE_MODE_AMOUNT ? PURCHASE_MODE_AMOUNT : PURCHASE_MODE_QUANTITY;
  const requested =
    mode === PURCHASE_MODE_AMOUNT && typeof item.requestedAmountIls === "number"
      ? item.requestedAmountIls
      : undefined;

  if (mode === PURCHASE_MODE_AMOUNT) {
    if (!product.allowPurchaseByAmount) {
      throw new AppError(
        "This product no longer supports buying by money amount. Please update your cart.",
        StatusCodes.BAD_REQUEST
      );
    }
    if (requested == null || !Number.isFinite(requested) || requested <= 0) {
      throw new AppError("Cart line is invalid. Please remove the item and add it again.", StatusCodes.BAD_REQUEST);
    }
    const { quantity: derivedQty } = deriveQuantityFromPurchaseAmount(
      requested,
      unitPriceSnapshot,
      product
    );
    const quantity = allowsFractionalQuantityByUnit(product.unit)
      ? coerceCartWeightQuantityKg(product, derivedQty)
      : derivedQty;
    return {
      quantity,
      purchaseMode: PURCHASE_MODE_AMOUNT,
      requestedAmountIls: requested
    };
  }

  let quantity = Number(item.quantity);
  if (allowsFractionalQuantityByUnit(product.unit)) {
    quantity = coerceCartWeightQuantityKg(product, quantity);
  }

  return {
    quantity,
    purchaseMode: PURCHASE_MODE_QUANTITY,
    requestedAmountIls: undefined
  };
};

const computeCartTotals = async (items) => {
  if (!items.length) {
    return { items: [], subtotal: 0, wrapTotal: 0 };
  }

  const ids = items.map((item) => item.product);
  const products = await Product.find(buildCartProductQuery(ids)).select(
    "name price salePrice unit imageUrl stockStatus isActive isFrozen isDeleted isPreorderOnly minAdvanceHours allowPurchaseByAmount"
  );
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const normalizedItems = items.map((item) => {
    const product = productMap.get(String(item.product));
    if (!product) {
      throw new AppError(
        "One or more products are unavailable. Please refresh your cart.",
        StatusCodes.BAD_REQUEST
      );
    }

    assertProductPurchasable(product);
    const unitPriceSnapshot = getEffectiveUnitPrice(product);
    const wrapAvailable = isWrapAllowedForUnit(product.unit);
    const wrap = wrapAvailable && Boolean(item.wrap);

    const { quantity, purchaseMode, requestedAmountIls } = normalizeCartLineMeta(
      item,
      product,
      unitPriceSnapshot
    );

    assertQuantityAllowedForProduct(product, quantity, purchaseMode);

    const wrapFee = computeLineWrapFee({
      quantity,
      wrap,
      unit: product.unit
    });
    const lineSubtotal = lineProductSubtotal(quantity, unitPriceSnapshot, product.unit);
    return {
      product: product._id,
      quantity,
      unitPriceSnapshot,
      purchaseMode,
      requestedAmountIls,
      lineProductSubtotal: lineSubtotal,
      wrap,
      wrapFee,
      productSnapshot: {
        id: product._id,
        name: product.name,
        unit: product.unit,
        imageUrl: typeof product.imageUrl === "string" ? product.imageUrl.trim() : "",
        isPreorderOnly: Boolean(product.isPreorderOnly),
        minAdvanceHours: Number(product.minAdvanceHours) || 0,
        wrapAvailable,
        wrapPricePerKg: WRAP_PRICE_PER_KG,
        allowPurchaseByAmount: Boolean(product.allowPurchaseByAmount)
      }
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineProductSubtotal, 0);
  const wrapTotal = normalizedItems.reduce((sum, item) => sum + item.wrapFee, 0);

  return { items: normalizedItems, subtotal, wrapTotal };
};

const buildCheckoutPreview = async (cartItems) => {
  const { items, subtotal, wrapTotal } = await computeCartTotals(cartItems);

  return {
    items: items.map((item) => ({
      product: item.product,
      name: resolveProductNameString(item.productSnapshot.name),
      nameLocales: toProductNameLocales(item.productSnapshot.name),
      unit: item.productSnapshot.unit,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
      lineTotal: item.lineProductSubtotal,
      purchaseMode: item.purchaseMode,
      requestedAmountIls: item.requestedAmountIls,
      isPreorderOnly: item.productSnapshot.isPreorderOnly,
      minAdvanceHours: item.productSnapshot.minAdvanceHours,
      wrap: item.wrap,
      wrapFee: item.wrapFee,
      wrapAvailable: item.productSnapshot.wrapAvailable,
      wrapPricePerKg: item.productSnapshot.wrapPricePerKg,
      imageUrl: item.productSnapshot.imageUrl || ""
    })),
    subtotal,
    wrapTotal,
    payableSubtotalAndWrap: floorPayableIls(subtotal + wrapTotal),
    wrapPricePerKg: WRAP_PRICE_PER_KG,
    hasPreorderItems: items.some((item) => item.productSnapshot.isPreorderOnly)
  };
};

module.exports = {
  PURCHASE_MODE_QUANTITY,
  PURCHASE_MODE_AMOUNT,
  computeCartTotals,
  buildCheckoutPreview,
  floorPayableIls,
  assertProductPurchasable,
  getEffectiveUnitPrice,
  computeLineWrapFee,
  deriveQuantityFromPurchaseAmount,
  assertQuantityAllowedForProduct,
  coerceCartWeightQuantityKg,
  lineProductSubtotal,
  roundQuantityFromAmount
};
