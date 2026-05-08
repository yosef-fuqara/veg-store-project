const PRODUCT_UNITS = {
  KG: "kg",
  GRAM: "gram",
  UNIT: "unit",
  BOX: "box"
};

const PRODUCT_STOCK_STATUS = {
  IN_STOCK: "in_stock",
  OUT_OF_STOCK: "out_of_stock"
};

// Optional cling-film wrapping service: produce sold by the kilogram can be
// arranged in a container and wrapped to keep it fresh and clean. Pricing is
// a flat per-kg surcharge billed on top of the item price.
const WRAP_PRICE_PER_KG = 2;

// Only kg-based products (vegetables and fruits sold by weight) are eligible
// for the wrap service; other units (single-unit, gram, pre-packed boxes)
// don't fit the workflow.
const WRAP_ALLOWED_UNITS = [PRODUCT_UNITS.KG];

const isWrapAllowedForUnit = (unit) => WRAP_ALLOWED_UNITS.includes(unit);

module.exports = {
  PRODUCT_UNITS,
  PRODUCT_STOCK_STATUS,
  WRAP_PRICE_PER_KG,
  WRAP_ALLOWED_UNITS,
  isWrapAllowedForUnit
};
