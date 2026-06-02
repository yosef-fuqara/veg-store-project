/** Customer-facing weight is always shown and entered in kilograms. */

export const QUARTER_KG = 0.25;
export const KG_STEP = 0.25;
export const KG_MIN = 0.25;
export const KG_MAX = 500;

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
  if (usesGramStorage(unit) && q >= 250 && Math.abs(q / 250 - Math.round(q / 250)) < 1e-6) {
    return q / 1000;
  }
  return q;
}

export function kgToStoredQuantity(kg, _unit) {
  const k = Number(kg);
  if (!Number.isFinite(k)) return 0;
  return Math.round(k * 10000) / 10000;
}

export function isValidQuarterKg(kg) {
  const k = Number(kg);
  if (!Number.isFinite(k) || k < KG_MIN || k > KG_MAX) return false;
  const quarters = k / KG_STEP;
  return Math.abs(quarters - Math.round(quarters)) < 1e-6;
}

export function roundToQuarterKg(kg) {
  return Math.round(Number(kg) / KG_STEP) * KG_STEP;
}

/** Human-readable kg for UI (e.g. 0.5, 1, 1.25). */
export function formatKgDisplay(kg) {
  const k = roundToQuarterKg(kg);
  if (Number.isInteger(k)) return String(k);
  const s = k.toFixed(2).replace(/\.?0+$/, "");
  return s;
}

export function buildQuarterKgPresets(max = 3) {
  const presets = [];
  for (let v = KG_MIN; v <= max + 1e-9; v += KG_STEP) {
    presets.push(Math.round(v * 100) / 100);
  }
  return presets;
}
