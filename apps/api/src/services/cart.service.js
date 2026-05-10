const { StatusCodes } = require("http-status-codes");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");
const { WRAP_PRICE_PER_KG, isWrapAllowedForUnit } = require("../constants/product");
const {
  resolveProductNameString,
  toProductNameLocales
} = require("../utils/product-name");

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

// Compute the wrap surcharge for a single line. The wrap toggle is only
// honored when the product is sold by the kilogram; for any other unit we
// return zero even if the cart row still has wrap=true (e.g. after the admin
// changed the unit on an existing product).
const computeLineWrapFee = ({ quantity, wrap, unit }) => {
  if (!wrap) return 0;
  if (!isWrapAllowedForUnit(unit)) return 0;
  return Number(quantity) * WRAP_PRICE_PER_KG;
};

const computeCartTotals = async (items) => {
  if (!items.length) {
    return { items: [], subtotal: 0, wrapTotal: 0 };
  }

  const ids = items.map((item) => item.product);
  const products = await Product.find(buildCartProductQuery(ids)).select(
    "name price salePrice unit stockStatus isActive isFrozen isDeleted isPreorderOnly minAdvanceHours"
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
    // Coerce the stored wrap flag against the *current* product unit so a
    // unit change by the admin can't end up charging the customer for a
    // service that no longer applies.
    const wrap = wrapAvailable && Boolean(item.wrap);
    const wrapFee = computeLineWrapFee({
      quantity: item.quantity,
      wrap,
      unit: product.unit
    });
    return {
      product: product._id,
      quantity: item.quantity,
      unitPriceSnapshot,
      wrap,
      wrapFee,
      productSnapshot: {
        id: product._id,
        name: product.name,
        unit: product.unit,
        isPreorderOnly: Boolean(product.isPreorderOnly),
        minAdvanceHours: Number(product.minAdvanceHours) || 0,
        wrapAvailable,
        wrapPricePerKg: WRAP_PRICE_PER_KG
      }
    };
  });

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
    0
  );
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
      lineTotal: item.quantity * item.unitPriceSnapshot,
      isPreorderOnly: item.productSnapshot.isPreorderOnly,
      minAdvanceHours: item.productSnapshot.minAdvanceHours,
      wrap: item.wrap,
      wrapFee: item.wrapFee,
      wrapAvailable: item.productSnapshot.wrapAvailable,
      wrapPricePerKg: item.productSnapshot.wrapPricePerKg
    })),
    subtotal,
    wrapTotal,
    wrapPricePerKg: WRAP_PRICE_PER_KG,
    hasPreorderItems: items.some((item) => item.productSnapshot.isPreorderOnly)
  };
};

module.exports = {
  computeCartTotals,
  buildCheckoutPreview,
  assertProductPurchasable,
  getEffectiveUnitPrice,
  computeLineWrapFee
};
