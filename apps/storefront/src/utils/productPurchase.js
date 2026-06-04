import {
  buildWeightKgPresets,
  displayPricePerKg,
  KG_MAX,
  isValidProductWeightKg,
  isWeightBasedUnit,
  kgToStoredQuantity,
  resolveProductWeightRules,
  roundToWeightStep,
  snapDerivedWeightKgForAmount,
  storedQuantityToKg
} from "./storefrontWeight";

/** @typedef {'quantity' | 'amount'} BuyMode */

export const COUNT_QUANTITY_PRESETS = [1, 2, 3, 4, 5];
export const AMOUNT_PRESETS_ILS = [10, 20, 30, 50];

/**
 * @param {{ unit?: string; allowPurchaseByAmount?: boolean; minimumOrderWeight?: number; weightStep?: number }} product
 */
export function getPurchaseConfig(product) {
  const unit = typeof product?.unit === "string" ? product.unit : "";
  const allowByAmount = Boolean(product?.allowPurchaseByAmount);
  const weightBased = isWeightBasedUnit(unit);
  const supportsAmount = allowByAmount;
  const supportsWeight = weightBased;
  const supportsCount = !weightBased;
  const supportsDualMode =
    (supportsWeight && supportsAmount) || (supportsCount && supportsAmount);
  const { minimumOrderWeight, weightStep } = resolveProductWeightRules(product);

  return {
    unit,
    allowByAmount,
    weightBased,
    supportsWeight,
    supportsAmount,
    supportsCount,
    supportsDualMode,
    weightStep,
    weightMin: minimumOrderWeight,
    weightMax: KG_MAX,
    minimumOrderWeight,
    countMin: 1,
    countMax: 100,
    weightPresets: weightBased ? buildWeightKgPresets(product, 3) : []
  };
}

/**
 * @param {ReturnType<typeof getPurchaseConfig>} config
 * @param {BuyMode} buyMode
 * @param {{ weightKgInput: string; countInput: string; amountInput: string }} inputs
 * @param {number} unitPrice — effective price from product (per stored unit)
 * @param {{ minimumOrderWeight?: number; weightStep?: number }} [product] — for weight validation
 */
export function buildAddToCartPayload(config, buyMode, inputs, unitPrice, product = {}) {
  if (config.supportsDualMode && buyMode == null) return null;

  const mode =
    buyMode ??
    (config.supportsAmount && !config.supportsWeight && !config.supportsCount
      ? "amount"
      : "quantity");

  if (mode === "amount") {
    if (!config.supportsAmount) return null;
    const amount = Number(inputs.amountInput);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return { purchaseAmountIls: amount };
  }

  if (config.supportsWeight) {
    const kg = Number(inputs.weightKgInput);
    const rulesProduct = { minimumOrderWeight: config.minimumOrderWeight, weightStep: config.weightStep, ...product };
    if (!isValidProductWeightKg(kg, rulesProduct)) return null;
    const roundedKg = roundToWeightStep(kg, rulesProduct);
    return { quantity: kgToStoredQuantity(roundedKg, config.unit) };
  }

  const count = Math.floor(Number(inputs.countInput));
  if (!Number.isFinite(count) || count < config.countMin || count > config.countMax) return null;
  return { quantity: count };
}

/**
 * @param {ReturnType<typeof getPurchaseConfig>} config
 * @param {BuyMode | null} buyMode
 * @param {{ weightKgInput: string; countInput: string; amountInput: string }} inputs
 * @param {number} unitPrice
 * @param {{ minimumOrderWeight?: number; weightStep?: number; unit?: string }} [product]
 */
export function estimateLineTotal(config, buyMode, inputs, unitPrice, product = {}) {
  const payload = buildAddToCartPayload(config, buyMode, inputs, unitPrice, product);
  if (!payload || !Number.isFinite(unitPrice) || unitPrice <= 0) return null;
  if ("purchaseAmountIls" in payload) return payload.purchaseAmountIls;
  if (config.supportsWeight) {
    const kg = storedQuantityToKg(payload.quantity, config.unit);
    return Math.round(displayPricePerKg(unitPrice, config.unit) * kg * 100) / 100;
  }
  return Math.round(payload.quantity * unitPrice * 100) / 100;
}

/** Estimated kg from ₪ amount; null if below minimum or invalid step. */
export function estimateKgFromAmount(amountIls, unitPrice, product) {
  const amount = Number(amountIls);
  const price = displayPricePerKg(unitPrice, product?.unit || "kg");
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(price) || price <= 0) {
    return null;
  }
  const rawKg = amount / price;
  const snapped = snapDerivedWeightKgForAmount(rawKg, product);
  if (!isValidProductWeightKg(snapped, product)) return null;
  return snapped;
}
