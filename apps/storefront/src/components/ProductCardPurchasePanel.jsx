import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "../utils/formatPrice";
import {
  AMOUNT_PRESETS_ILS,
  COUNT_QUANTITY_PRESETS,
  buildAddToCartPayload,
  estimateKgFromAmount,
  estimateLineTotal,
  getPurchaseConfig
} from "../utils/productPurchase";
import { displayPricePerKg, formatKgDisplay } from "../utils/storefrontWeight";
import { formatApproxWeightQuantity } from "../utils/cartLineQuantity";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  panelBg: "#f6f9f7"
};

const shadowPrimary = "0 4px 14px rgba(30,107,60,0.30)";

const chipStyle = (active, disabled, compact) => ({
  padding: compact ? "5px 8px" : "6px 11px",
  borderRadius: "9999px",
  border: `1px solid ${active ? colors.primary : colors.border}`,
  background: active ? "#eef7f1" : colors.surface,
  color: active ? colors.primary : colors.textPrimary,
  fontSize: compact ? "11px" : "12px",
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.55 : 1,
  fontFamily: "inherit",
  lineHeight: 1.2
});

/**
 * @param {{
 *   product: object;
 *   lang: string;
 *   displayPrice: number;
 *   compact?: boolean;
 *   orderingDisabled?: boolean;
 *   lockedToAmount?: boolean;
 *   lockedToQuantity?: boolean;
 *   adding?: boolean;
 *   addButtonRef?: import('react').RefObject<HTMLButtonElement | null>;
 *   onAdd: (payload: { quantity: number } | { purchaseAmountIls: number }) => Promise<boolean>;
 * }} props
 */
const ProductCardPurchasePanel = ({
  product,
  lang,
  displayPrice,
  compact = false,
  orderingDisabled = false,
  lockedToAmount = false,
  lockedToQuantity = false,
  adding = false,
  addButtonRef,
  onAdd
}) => {
  const { t } = useTranslation(["home", "storeClosed"]);
  const config = getPurchaseConfig(product);
  const kgLabel = t("units.kg");
  const pricePerKg = displayPricePerKg(displayPrice, config.unit);

  const [expandedMode, setExpandedMode] = useState(null);
  const [weightKgInput, setWeightKgInput] = useState("");
  const [countInput, setCountInput] = useState("");
  const [amountInput, setAmountInput] = useState("");

  const toggleMode = (mode) => {
    if (orderingDisabled) return;
    if (mode === "quantity" && lockedToAmount) return;
    if (mode === "amount" && lockedToQuantity) return;
    setExpandedMode((prev) => (prev === mode ? null : mode));
  };

  const buyMode = expandedMode;
  const payload = buildAddToCartPayload(
    config,
    buyMode,
    { weightKgInput, countInput, amountInput },
    displayPrice,
    product
  );
  const lineTotal = estimateLineTotal(
    config,
    buyMode,
    { weightKgInput, countInput, amountInput },
    displayPrice,
    product
  );

  const parsedAmount = Number(amountInput);
  const estimatedKg =
    buyMode === "amount" && parsedAmount > 0
      ? estimateKgFromAmount(parsedAmount, displayPrice, product)
      : null;
  const estimatedKgStr =
    estimatedKg != null ? formatApproxWeightQuantity(estimatedKg, "kg") : null;

  const canConfirm = Boolean(payload) && !orderingDisabled && !adding;

  const handleConfirm = async () => {
    if (!canConfirm || !payload) return;
    await onAdd(payload);
    setExpandedMode(null);
    setWeightKgInput("");
    setCountInput("");
    setAmountInput("");
  };

  const showWeightBtn = config.supportsWeight;
  const showAmountBtn = config.supportsAmount;
  const showCountOnly = config.supportsCount && !config.supportsWeight && !config.supportsAmount;

  const modeBtnStyle = (active, disabled) => {
    if (disabled) {
      return {
        flex: config.supportsDualMode ? 1 : undefined,
        width: config.supportsDualMode ? undefined : "100%",
        minWidth: 0,
        padding: compact ? "7px 8px" : "8px 12px",
        borderRadius: compact ? "8px" : "9999px",
        border: `1px solid ${colors.border}`,
        background: colors.border,
        color: colors.textMuted,
        fontSize: compact ? "11px" : "13px",
        fontWeight: 600,
        cursor: "not-allowed",
        fontFamily: "inherit",
        opacity: 0.92,
        lineHeight: 1.25,
        boxShadow: "none"
      };
    }
    return {
      flex: config.supportsDualMode ? 1 : undefined,
      width: config.supportsDualMode ? undefined : "100%",
      minWidth: 0,
      padding: compact ? "7px 10px" : "8px 14px",
      borderRadius: compact ? "8px" : "9999px",
      border: "none",
      background: active ? colors.primaryHover : colors.primary,
      color: colors.textInverse,
      fontSize: compact ? "11px" : "13px",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
      lineHeight: 1.25,
      boxShadow: shadowPrimary,
      transition: "background 0.2s ease, box-shadow 0.2s ease"
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 4 : 6, marginTop: compact ? 4 : 8 }}>
      {(showWeightBtn || showAmountBtn) && (
        <div style={{ display: "flex", gap: compact ? 4 : 6, flexDirection: config.supportsDualMode ? "row" : "column" }}>
          {showWeightBtn && (
            <button
              type="button"
              onClick={() => toggleMode("quantity")}
              disabled={orderingDisabled || lockedToAmount}
              title={lockedToAmount ? t("purchaseModeLockedInCartAmount") : undefined}
              style={modeBtnStyle(expandedMode === "quantity", orderingDisabled || lockedToAmount)}
            >
              {t("buyByKg")}
            </button>
          )}
          {showAmountBtn && (
            <button
              type="button"
              onClick={() => toggleMode("amount")}
              disabled={orderingDisabled || lockedToQuantity}
              title={lockedToQuantity ? t("purchaseModeLockedInCartQuantity") : undefined}
              style={modeBtnStyle(expandedMode === "amount", orderingDisabled || lockedToQuantity)}
            >
              {t("buyByAmount")}
            </button>
          )}
        </div>
      )}

      {showCountOnly && (
        <button
          type="button"
          onClick={() => toggleMode("quantity")}
          disabled={orderingDisabled}
          style={modeBtnStyle(expandedMode === "quantity", orderingDisabled)}
        >
          {t("buyByQuantity")}
        </button>
      )}

      <AnimatePresence initial={false}>
        {expandedMode && (
          <motion.div
            key={expandedMode}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: compact ? "8px" : "10px",
                borderRadius: compact ? "8px" : "10px",
                border: `1px solid ${colors.border}`,
                background: colors.panelBg,
                display: "flex",
                flexDirection: "column",
                gap: compact ? 6 : 8
              }}
            >
              {expandedMode === "quantity" && config.supportsWeight && (
                <>
                  <span style={{ fontSize: compact ? "10px" : "11px", fontWeight: 600, color: colors.textMuted }}>
                    {t("weightQuantityLabel")}
                  </span>
                  <p style={{ margin: 0, fontSize: compact ? "10px" : "11px", color: colors.textSecondary, lineHeight: 1.35 }}>
                    {t("minimumOrderWeight", {
                      weight: formatKgDisplay(config.minimumOrderWeight),
                      unit: kgLabel
                    })}
                  </p>
                  <div style={{ display: "flex", gap: compact ? 4 : 6, flexWrap: "wrap" }}>
                    {config.weightPresets.map((chip) => {
                      const label = `${formatKgDisplay(chip)} ${kgLabel}`;
                      const active = weightKgInput === String(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          disabled={orderingDisabled}
                          onClick={() => !orderingDisabled && setWeightKgInput(String(chip))}
                          style={chipStyle(active, orderingDisabled, compact)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="number"
                    min={config.weightMin}
                    max={config.weightMax}
                    step={config.weightStep}
                    placeholder={t("weightCustomPlaceholder")}
                    value={weightKgInput}
                    disabled={orderingDisabled}
                    onChange={(e) => setWeightKgInput(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: compact ? "7px 9px" : "9px 11px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                      fontSize: compact ? "13px" : "14px",
                      background: colors.surface
                    }}
                  />
                </>
              )}

              {expandedMode === "quantity" && config.supportsCount && !config.supportsWeight && (
                <>
                  <span style={{ fontSize: compact ? "10px" : "11px", fontWeight: 600, color: colors.textMuted }}>
                    {t("quantityLabel")}
                  </span>
                  <div style={{ display: "flex", gap: compact ? 4 : 6, flexWrap: "wrap" }}>
                    {COUNT_QUANTITY_PRESETS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={orderingDisabled}
                        onClick={() => !orderingDisabled && setCountInput(String(chip))}
                        style={chipStyle(countInput === String(chip), orderingDisabled, compact)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={config.countMin}
                    max={config.countMax}
                    step={1}
                    value={countInput}
                    disabled={orderingDisabled}
                    onChange={(e) => setCountInput(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: compact ? "7px 9px" : "9px 11px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                      fontSize: compact ? "13px" : "14px",
                      background: colors.surface
                    }}
                  />
                </>
              )}

              {expandedMode === "amount" && config.supportsAmount && (
                <>
                  <span style={{ fontSize: compact ? "10px" : "11px", fontWeight: 600, color: colors.textMuted }}>
                    {t("amountPlaceholder")}
                  </span>
                  <div style={{ display: "flex", gap: compact ? 4 : 6, flexWrap: "wrap" }}>
                    {AMOUNT_PRESETS_ILS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        disabled={orderingDisabled}
                        onClick={() => !orderingDisabled && setAmountInput(String(chip))}
                        style={chipStyle(amountInput === String(chip), orderingDisabled, compact)}
                      >
                        ₪{chip}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    placeholder={t("amountPlaceholder")}
                    value={amountInput}
                    disabled={orderingDisabled}
                    onChange={(e) => setAmountInput(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: compact ? "7px 9px" : "9px 11px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                      fontSize: compact ? "13px" : "14px",
                      background: colors.surface
                    }}
                  />
                  {estimatedKgStr && (
                    <p style={{ margin: 0, fontSize: compact ? "10px" : "12px", color: colors.textSecondary, lineHeight: 1.35 }}>
                      {t("estimatedQtyApprox", { qty: estimatedKgStr, unit: kgLabel })}
                    </p>
                  )}
                </>
              )}

              {lineTotal != null && (
                <p style={{ margin: 0, fontSize: compact ? "12px" : "13px", fontWeight: 600, color: colors.textPrimary }}>
                  {t("estimatedLineTotal", { price: formatPrice(lineTotal, lang) })}
                </p>
              )}

              <button
                ref={addButtonRef}
                type="button"
                onClick={handleConfirm}
                disabled={!canConfirm}
                aria-busy={adding}
                style={{
                  width: "100%",
                  minHeight: compact ? "34px" : "40px",
                  borderRadius: "9999px",
                  border: "none",
                  background: canConfirm ? colors.primary : colors.border,
                  color: canConfirm ? colors.textInverse : colors.textMuted,
                  fontSize: compact ? "12px" : "14px",
                  fontWeight: 700,
                  cursor: canConfirm ? "pointer" : "not-allowed",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  fontFamily: "inherit",
                  boxShadow: canConfirm ? shadowPrimary : "none",
                  transition: "background 0.2s ease, box-shadow 0.2s ease"
                }}
              >
                {adding ? (
                  <Loader2
                    size={16}
                    strokeWidth={2.5}
                    style={{ animation: "spin 0.65s linear infinite" }}
                  />
                ) : null}
                {expandedMode === "amount" ? t("addByAmount") : t("addToCart")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductCardPurchasePanel;
