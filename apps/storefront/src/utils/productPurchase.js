import {
  buildQuarterKgPresets,
  displayPricePerKg,
  KG_MAX,
  KG_MIN,
  KG_STEP,
  isValidQuarterKg,
  isWeightBasedUnit,
  kgToStoredQuantity,
  roundToQuarterKg,
  storedQuantityToKg
} from "./storefrontWeight";

/** @typedef {'quantity' | 'amount'} BuyMode */

export const COUNT_QUANTITY_PRESETS = [1, 2, 3, 4, 5];
export const AMOUNT_PRESETS_ILS = [10, 20, 30, 50];
export const WEIGHT_KG_PRESETS = buildQuarterKgPresets(3);

/**
 * @param {{ unit?: string; allowPurchaseByAmount?: boolean }} product
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

  return {
    unit,
    allowByAmount,
    weightBased,
    supportsWeight,
    supportsAmount,
    supportsCount,
    supportsDualMode,
    weightStep: KG_STEP,
    weightMin: KG_MIN,
    weightMax: KG_MAX,
    countMin: 1,
    countMax: 100
  };
}

/**
 * @param {ReturnType<typeof getPurchaseConfig>} config
 * @param {BuyMode} buyMode
 * @param {{ weightKgInput: string; countInput: string; amountInput: string }} inputs
 * @param {number} unitPrice — effective price from product (per stored unit)
 */
export function buildAddToCartPayload(config, buyMode, inputs, unitPrice) {
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
    if (!isValidQuarterKg(kg)) return null;
    const roundedKg = roundToQuarterKg(kg);
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
 */
export function estimateLineTotal(config, buyMode, inputs, unitPrice) {
  const payload = buildAddToCartPayload(config, buyMode, inputs, unitPrice);
  if (!payload || !Number.isFinite(unitPrice) || unitPrice <= 0) return null;
  if ("purchaseAmountIls" in payload) return payload.purchaseAmountIls;
  if (config.supportsWeight) {
    const kg = storedQuantityToKg(payload.quantity, config.unit);
    return Math.round(displayPricePerKg(unitPrice, config.unit) * kg * 100) / 100;
  }
  return Math.round(payload.quantity * unitPrice * 100) / 100;
}
