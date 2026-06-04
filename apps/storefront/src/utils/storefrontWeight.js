/** Customer-facing weight is always shown and entered in kilograms. */

export const HALF_KG = 0.5;
export const DEFAULT_WEIGHT_STEP = 0.5;
export const DEFAULT_MINIMUM_ORDER_WEIGHT = 1;
export const KG_MAX = 500;

const ALLOWED_MINIMUM_ORDER_WEIGHTS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
const INTEGRAL_EPS = 1e-6;

export function isWeightBasedUnit(unit) {
  return unit === "kg" || unit === "gram";
}

/** Legacy admin unit: price is per gram; cart quantities are still stored in kg. */
export function usesGramStorage(unit) {
  return unit === "gram";
}

export function displayPricePerKg(unitPrice, unit) {
  const p = Number(unitPrice);
  if (!Number.isFinite(p)) return 0;
  return usesGramStorage(unit) ? p * 1000 : p;
}

/** Cart weight lines are in kg; legacy gram-unit rows may still hold gram totals for amount-derived qty. */
export function storedQuantityToKg(quantity, unit) {
  const q = Number(quantity);
  if (!Number.isFinite(q)) return 0;
  if (usesGramStorage(unit) && q >= 500 && Math.abs(q / 500 - Math.round(q / 500)) < 1e-6) {
    return q / 1000;
  }
  return q;
}

export function kgToStoredQuantity(kg, _unit) {
  const k = Number(kg);
  if (!Number.isFinite(k)) return 0;
  return Math.round(k * 10000) / 10000;
}

export function resolveMinimumOrderWeight(product) {
  const raw = Number(product?.minimumOrderWeight);
  if (Number.isFinite(raw) && ALLOWED_MINIMUM_ORDER_WEIGHTS.includes(raw)) {
    return raw;
  }
  return DEFAULT_MINIMUM_ORDER_WEIGHT;
}

export function resolveWeightStep(product) {
  const raw = Number(product?.weightStep);
  if (Number.isFinite(raw) && raw > 0 && isMultipleOf(raw, DEFAULT_WEIGHT_STEP)) {
    return raw;
  }
  return DEFAULT_WEIGHT_STEP;
}

export function resolveProductWeightRules(product) {
  return {
    minimumOrderWeight: resolveMinimumOrderWeight(product),
    weightStep: resolveWeightStep(product)
  };
}

function isMultipleOf(value, step) {
  const ratio = Number(value) / step;
  return Math.abs(ratio - Math.round(ratio)) <= INTEGRAL_EPS;
}

export function isValidProductWeightKg(kg, product) {
  const k = Number(kg);
  if (!Number.isFinite(k) || k > KG_MAX) return false;
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);
  if (k < minimumOrderWeight) return false;
  return isMultipleOf(k, weightStep);
}

export function roundToWeightStep(kg, product) {
  const { weightStep } = resolveProductWeightRules(product);
  return Math.round(Number(kg) / weightStep) * weightStep;
}

export function snapWeightKgUp(kg, product) {
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);
  const k = Number(kg);
  if (!Number.isFinite(k)) return minimumOrderWeight;
  const steps = Math.ceil((Math.max(k, minimumOrderWeight) - minimumOrderWeight) / weightStep);
  return Math.round((minimumOrderWeight + steps * weightStep) * 100) / 100;
}

/** Match server: nearest valid weight for ₪-derived quantity (estimate only). */
export function snapDerivedWeightKgForAmount(rawKg, product) {
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);
  const k = Number(rawKg);
  if (!Number.isFinite(k)) return minimumOrderWeight;
  const offset = k - minimumOrderWeight;
  const steps = Math.round(offset / weightStep);
  const snapped = minimumOrderWeight + steps * weightStep;
  return Math.round(Math.max(minimumOrderWeight, snapped) * 100) / 100;
}

/** Human-readable kg for UI (e.g. 0.5, 1, 1.5). */
export function formatKgDisplay(kg) {
  const k = Number(kg);
  if (!Number.isFinite(k)) return "";
  if (Number.isInteger(k)) return String(k);
  const s = k.toFixed(2).replace(/\.?0+$/, "");
  return s;
}

/** Preset chips from product minimum up to maxKg (default 3 kg above minimum). */
export function buildWeightKgPresets(product, maxKg = 3) {
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);
  const presets = [];
  const limit = minimumOrderWeight + maxKg;
  for (let v = minimumOrderWeight; v <= limit + 1e-9; v += weightStep) {
    presets.push(Math.round(v * 100) / 100);
  }
  return presets;
}
