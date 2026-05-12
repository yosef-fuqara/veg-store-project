/** Display quantity for classic cart lines (whole units or short fractions). */
export function formatQtyDisplay(q) {
  const n = Number(q);
  if (!Number.isFinite(n)) return String(q);
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(Math.round(n * 1000) / 1000);
}

/**
 * For "purchase by ₪" lines, quantity is derived weight — show a short, human
 * approximation instead of long decimals (e.g. 7.143 kg).
 */
export function formatApproxWeightQuantity(quantity, unit) {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q <= 0) return "";
  if (unit === "gram") return String(Math.round(q));
  const rounded = Math.round(q * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(1);
}

/** Step size when adjusting a purchase-by-amount line in the cart (₪). */
export const PURCHASE_AMOUNT_CART_STEP_ILS = 5;
