const AppError = require("./app-error");
const { StatusCodes } = require("http-status-codes");
const { PRODUCT_UNITS } = require("../constants/product");
const {
  ALLOWED_MINIMUM_ORDER_WEIGHTS,
  DEFAULT_MINIMUM_ORDER_WEIGHT,
  DEFAULT_WEIGHT_STEP,
  MAX_PRODUCT_WEIGHT_KG
} = require("../constants/product-weight");

const INTEGRAL_WEIGHT_EPS = 1e-6;
const HALF_KG = 0.5;
/** Legacy cart rows stored quantity in grams (500 g = 0.5 kg). */
const HALF_GRAM = 500;

const isMultipleOf = (value, step) => {
  const ratio = Number(value) / step;
  return Math.abs(ratio - Math.round(ratio)) <= INTEGRAL_WEIGHT_EPS;
};

const resolveMinimumOrderWeight = (product) => {
  const raw = Number(product?.minimumOrderWeight);
  if (Number.isFinite(raw) && ALLOWED_MINIMUM_ORDER_WEIGHTS.includes(raw)) {
    return raw;
  }
  return DEFAULT_MINIMUM_ORDER_WEIGHT;
};

const resolveWeightStep = (product) => {
  const raw = Number(product?.weightStep);
  if (Number.isFinite(raw) && raw > 0 && isMultipleOf(raw, HALF_KG)) {
    return raw;
  }
  return DEFAULT_WEIGHT_STEP;
};

const resolveProductWeightRules = (product) => ({
  minimumOrderWeight: resolveMinimumOrderWeight(product),
  weightStep: resolveWeightStep(product)
});

const roundHalfUp = (value, decimalPlaces) => {
  const f = 10 ** decimalPlaces;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
};

/**
 * Cart stores weight in kg. For legacy gram-unit rows, accept either:
 * - kg half-kg steps (new format)
 * - gram half-kg steps (legacy format, e.g. 500, 1000)
 */
const coerceCartWeightQuantityKg = (product, quantity) => {
  const q = Number(quantity);
  if (!Number.isFinite(q)) return q;

  if (product.unit !== PRODUCT_UNITS.GRAM) return q;

  if (q >= HALF_GRAM && isMultipleOf(q, HALF_GRAM)) {
    return roundHalfUp(q / 1000, 4);
  }

  return q;
};

const isValidProductWeightKg = (product, quantityKg) => {
  const q = coerceCartWeightQuantityKg(product, quantityKg);
  if (!Number.isFinite(q) || q > MAX_PRODUCT_WEIGHT_KG) return false;

  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);
  if (q < minimumOrderWeight) return false;
  if (!isMultipleOf(q, weightStep)) return false;

  // Reject legacy quarter-kg values (0.25, 0.75, 1.25, …) when step is 0.5
  if (weightStep === HALF_KG && !isMultipleOf(q, HALF_KG)) {
    return false;
  }

  return true;
};

/** Nearest valid grid weight for amount-derived kg (display + wrap; billing stays in ₪). */
const snapDerivedWeightKgForAmount = (rawKg, product) => {
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);
  const k = Number(rawKg);
  if (!Number.isFinite(k)) return minimumOrderWeight;
  const offset = k - minimumOrderWeight;
  const steps = Math.round(offset / weightStep);
  const snapped = minimumOrderWeight + steps * weightStep;
  const clamped = Math.max(minimumOrderWeight, snapped);
  return roundHalfUp(clamped, 4);
};

const assertProductWeightAllowed = (product, quantityKg) => {
  const q = coerceCartWeightQuantityKg(product, quantityKg);
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);

  if (!Number.isFinite(q) || q > MAX_PRODUCT_WEIGHT_KG) {
    throw new AppError("Invalid weight for this product", StatusCodes.BAD_REQUEST);
  }

  if (q < minimumOrderWeight) {
    throw new AppError(
      `Quantity must be at least ${minimumOrderWeight} kg`,
      StatusCodes.BAD_REQUEST
    );
  }

  if (!isMultipleOf(q, weightStep)) {
    throw new AppError(
      `Weight must be in steps of ${weightStep} kg`,
      StatusCodes.BAD_REQUEST
    );
  }
};

module.exports = {
  HALF_KG,
  HALF_GRAM,
  resolveMinimumOrderWeight,
  resolveWeightStep,
  resolveProductWeightRules,
  coerceCartWeightQuantityKg,
  snapDerivedWeightKgForAmount,
  isValidProductWeightKg,
  assertProductWeightAllowed,
  isMultipleOf
};
