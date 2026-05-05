const { StatusCodes } = require("http-status-codes");
const Product = require("../models/product.model");
const AppError = require("../utils/app-error");

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

const computeCartTotals = async (items) => {
  if (!items.length) {
    return { items: [], subtotal: 0 };
  }

  const ids = items.map((item) => item.product);
  const products = await Product.find(buildCartProductQuery(ids)).select(
    "name price salePrice unit stockStatus isActive isFrozen isDeleted"
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
    return {
      product: product._id,
      quantity: item.quantity,
      unitPriceSnapshot,
      productSnapshot: {
        id: product._id,
        name: product.name,
        unit: product.unit
      }
    };
  });

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
    0
  );

  return { items: normalizedItems, subtotal };
};

const buildCheckoutPreview = async (cartItems) => {
  const { items, subtotal } = await computeCartTotals(cartItems);

  return {
    items: items.map((item) => ({
      product: item.product,
      name: item.productSnapshot.name,
      unit: item.productSnapshot.unit,
      quantity: item.quantity,
      unitPrice: item.unitPriceSnapshot,
      lineTotal: item.quantity * item.unitPriceSnapshot
    })),
    subtotal
  };
};

module.exports = {
  computeCartTotals,
  buildCheckoutPreview,
  assertProductPurchasable,
  getEffectiveUnitPrice
};
