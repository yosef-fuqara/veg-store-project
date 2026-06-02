import {
  formatKgDisplay,
  isWeightBasedUnit,
  storedQuantityToKg,
  KG_STEP,
  KG_MIN,
} from "./storefrontWeight";

/** Display quantity for classic cart lines (whole units or short fractions). */
export function formatQtyDisplay(q) {
  const n = Number(q);
  if (!Number.isFinite(n)) return String(q);
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

/** Weight lines always show kg on the storefront. */
export function formatCartWeightDisplay(quantity, unit) {
  const kg = storedQuantityToKg(quantity, unit);
  if (!Number.isFinite(kg) || kg <= 0) return "";
  return formatKgDisplay(kg);
}

/**
 * For "purchase by ₪" lines, quantity is derived weight — show kg approximation.
 */
export function formatApproxWeightQuantity(quantity, unit) {
  if (isWeightBasedUnit(unit)) {
    return formatCartWeightDisplay(quantity, unit);
  }
  const q = Number(quantity);
  if (!Number.isFinite(q) || q <= 0) return "";
  if (Math.abs(q - Math.round(q)) < 1e-9) return String(Math.round(q));
  return String(Math.round(q * 10) / 10);
}

/** Step when adjusting a purchase-by-amount line in the cart (₪). */
export const PURCHASE_AMOUNT_CART_STEP_ILS = 5;

/** Quantity step in kg for cart +/- on weight lines. */
export function weightCartQuantityStep(_unit) {
  return KG_STEP;
}

export function weightCartQuantityMin(_unit) {
  return KG_MIN;
}
