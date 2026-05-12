import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { useCartVisualFeedback } from "../features/cart/CartVisualFeedbackContext";
import { formatPrice } from "../utils/formatPrice";
import { formatApproxWeightQuantity } from "../utils/cartLineQuantity";
import {
  getLocalizedProductDescription,
  getLocalizedProductName,
  getLocalizedText
} from "../utils/localizedProduct";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  success: "#166534",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca",
  warning: "#92400e",
  warningSurface: "#fffbeb",
  warningBorder: "#fde68a"
};

const UNIT_KEYS = {
  kg: "units.kg",
  gram: "units.gram",
  unit: "units.unit",
  box: "units.box"
};

const shadow = {
  sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  primary: "0 4px 14px rgba(30,107,60,0.30)"
};

const cardVariants = {
  rest: {
    y: 0,
    boxShadow: shadow.sm
  },
  hover: {
    y: -4,
    boxShadow: shadow.md
  }
};

const imgVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.06 }
};

const imgVariantsNoHover = {
  rest: { scale: 1 },
  hover: { scale: 1 }
};

function isProductUnavailable(product) {
  if (!product) return true;
  if (product.isOutOfStock === true) return true;
  if (product.stockStatus === "out_of_stock") return true;
  const rawInv = product.stock ?? product.quantity;
  if (rawInv != null && rawInv !== "") {
    const n = Number(rawInv);
    if (!Number.isNaN(n) && n <= 0) return true;
  }
  return product.stockStatus !== "in_stock";
}

const ProductCard = ({ product, lang, orderingDisabled = false }) => {
  const { t } = useTranslation(["home", "storeClosed"]);
  const { addItem, cart } = useCart();
  const { notifyProductAddedToCart } = useCartVisualFeedback();
  const addButtonRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [buyMode, setBuyMode] = useState("quantity");
  const [qtyInput, setQtyInput] = useState("1");
  const [amountInput, setAmountInput] = useState("10");

  const id = product._id;
  const name = getLocalizedProductName(product, lang);
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl : "";
  const unit = typeof product.unit === "string" ? product.unit : "";
  const unitLabel = UNIT_KEYS[unit] ? t(UNIT_KEYS[unit]) : unit;

  const price = Number(product.price);
  const salePrice =
    product.salePrice != null && product.salePrice !== "" ? Number(product.salePrice) : null;
  const hasSale =
    salePrice != null && !Number.isNaN(salePrice) && !Number.isNaN(price) && salePrice < price;
  const displayPrice = hasSale ? salePrice : price;

  const inStock = !isProductUnavailable(product);
  const isPreorder = Boolean(product.isPreorderOnly);
  const minAdvHours = Number(product.minAdvanceHours) || 24;
  const rawCategoryLabel =
    product.category?.name ?? (typeof product.category === "string" ? product.category : "");
  const categoryName = getLocalizedText(rawCategoryLabel, lang);
  const isFeatured = Boolean(product.isFeatured || product.featured);
  const allowByAmount = Boolean(product.allowPurchaseByAmount);

  const existingLine = useMemo(
    () => cart.items.find((it) => String(it.product) === String(id)),
    [cart.items, id]
  );
  const lockedToAmount = Boolean(
    existingLine?.purchaseMode === "amount" && existingLine?.requestedAmountIls != null
  );
  const lockedToQuantity = Boolean(existingLine) && !lockedToAmount;

  useEffect(() => {
    if (!allowByAmount || !id) return;
    if (lockedToAmount) setBuyMode("amount");
    else if (lockedToQuantity) setBuyMode("quantity");
  }, [allowByAmount, id, lockedToAmount, lockedToQuantity]);

  const parsedQty = Math.min(100, Math.max(1, Math.floor(Number(qtyInput)) || 1));
  const parsedAmount = Math.max(0, Number(amountInput));
  const estimatedQtyStr =
    buyMode === "amount" && parsedAmount > 0 && displayPrice > 0
      ? formatApproxWeightQuantity(parsedAmount / displayPrice, unit)
      : null;

  const canAdd = inStock && !!id && !adding && !orderingDisabled;
  const handleAdd = async () => {
    if (!canAdd || adding) return;
    setAdding(true);
    try {
      let ok = false;
      if (allowByAmount && buyMode === "amount") {
        if (!parsedAmount || parsedAmount <= 0) {
          setAdding(false);
          return;
        }
        ok = await addItem(String(id), 1, { purchaseAmountIls: parsedAmount });
      } else {
        const q = allowByAmount && buyMode === "quantity" ? parsedQty : 1;
        ok = await addItem(String(id), q);
      }
      if (ok && addButtonRef.current) {
        notifyProductAddedToCart({
          fromRect: addButtonRef.current.getBoundingClientRect(),
          imageUrl
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const addDisabled =
    !canAdd ||
    (allowByAmount && buyMode === "amount" && (!parsedAmount || parsedAmount <= 0));

  const tabBtn = (active, onClick, label, disabled = false, title) => (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={{
        flex: 1,
        padding: "6px 8px",
        borderRadius: "8px",
        border: active ? `1px solid ${colors.primary}` : `1px solid ${colors.border}`,
        background: active ? "#eef7f1" : colors.surface,
        color: active ? colors.primary : colors.textSecondary,
        fontSize: "12px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.5 : 1
      }}
    >
      {label}
    </button>
  );

  const description = getLocalizedProductDescription(product, lang).trim();
  const hasStoreDescription = Boolean(description);
  const descTriggerRef = useRef(null);
  const hoverDescLeaveTimerRef = useRef(null);
  const [canHoverFinePointer, setCanHoverFinePointer] = useState(false);
  const [hoverDescriptionOpen, setHoverDescriptionOpen] = useState(false);
  const [touchDescriptionOpen, setTouchDescriptionOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCanHoverFinePointer(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const clearHoverDescLeaveTimer = () => {
    if (hoverDescLeaveTimerRef.current != null) {
      clearTimeout(hoverDescLeaveTimerRef.current);
      hoverDescLeaveTimerRef.current = null;
    }
  };

  const openHoverDescription = () => {
    if (!hasStoreDescription || !canHoverFinePointer) return;
    clearHoverDescLeaveTimer();
    setHoverDescriptionOpen(true);
  };

  const scheduleCloseHoverDescription = () => {
    if (!canHoverFinePointer) return;
    clearHoverDescLeaveTimer();
    hoverDescLeaveTimerRef.current = window.setTimeout(() => {
      setHoverDescriptionOpen(false);
      hoverDescLeaveTimerRef.current = null;
    }, 200);
  };

  useEffect(() => {
    if (!touchDescriptionOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setTouchDescriptionOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [touchDescriptionOpen]);

  useEffect(() => () => clearHoverDescLeaveTimer(), []);

  const showDescOnImage =
    hasStoreDescription &&
    ((canHoverFinePointer && hoverDescriptionOpen) ||
      (!canHoverFinePointer && touchDescriptionOpen));

  const categoryLabelEl = categoryName ? (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        color: colors.textMuted
      }}
    >
      {categoryName}
    </span>
  ) : null;

  const titleEl = (
    <h3
      style={{
        margin: 0,
        fontSize: "16px",
        fontWeight: 700,
        color: colors.textPrimary,
        lineHeight: 1.3
      }}
    >
      {name || "—"}
    </h3>
  );

  const imageArea = (
    <div
      style={{
        position: "relative",
        aspectRatio: "4/3",
        flexShrink: 0,
        overflow: "hidden",
        borderTopLeftRadius: "14px",
        borderTopRightRadius: "14px"
      }}
    >
      <motion.div
        variants={inStock ? imgVariants : imgVariantsNoHover}
        transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          width: "100%",
          height: "100%",
          opacity: inStock ? 1 : 0.72,
          filter: inStock ? "none" : "grayscale(0.35)",
          transition: "opacity 0.35s ease, filter 0.35s ease"
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 50%, #eef7f1 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px"
            }}
          >
            🥬
          </div>
        )}
      </motion.div>

      {!inStock && (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              background:
                "linear-gradient(180deg, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0.62) 100%)",
              pointerEvents: "none",
              transition: "opacity 0.35s ease"
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              padding: "12px"
            }}
          >
            <span
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.94)",
                color: colors.textPrimary,
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                textAlign: "center",
                lineHeight: 1.25,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(30,107,60,0.12)",
                maxWidth: "92%"
              }}
            >
              {t("outOfStock")}
            </span>
          </div>
        </>
      )}

      {isFeatured && (
        <span
          style={{
            position: "absolute",
            top: "10px",
            insetInlineStart: "10px",
            zIndex: 2,
            padding: "3px 10px",
            borderRadius: "9999px",
            background: colors.primary,
            color: colors.textInverse,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            boxShadow: "0 2px 8px rgba(30,107,60,0.35)"
          }}
        >
          {t("featuredBadge", { defaultValue: "Featured" })}
        </span>
      )}

      {hasSale && (
        <span
          style={{
            position: "absolute",
            top: "10px",
            insetInlineEnd: "10px",
            zIndex: 2,
            padding: "3px 10px",
            borderRadius: "9999px",
            background: colors.errorSurface,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.8px",
            textTransform: "uppercase"
          }}
        >
          {t("saleBadge")}
        </span>
      )}

      {showDescOnImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 8,
            background: "linear-gradient(180deg, rgba(22,28,22,0.5) 0%, rgba(12,18,12,0.78) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 14px",
            pointerEvents: canHoverFinePointer ? "none" : "auto"
          }}
        >
          <p
            style={{
              margin: 0,
              color: colors.textInverse,
              fontSize: "14px",
              fontWeight: 500,
              lineHeight: 1.5,
              textAlign: "center",
              maxHeight: "100%",
              overflowY: "auto",
              textShadow: "0 2px 12px rgba(0,0,0,0.55)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {description}
          </p>
        </motion.div>
      )}
    </div>
  );

  return (
    <motion.article
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      variants={cardVariants}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: colors.surface,
        borderRadius: "14px",
        border: `1px solid ${colors.border}`,
        overflow: "visible",
        display: "flex",
        flexDirection: "column",
        willChange: "transform",
        height: "100%"
      }}
    >
      {hasStoreDescription ? (
        <div
          ref={descTriggerRef}
          onMouseEnter={openHoverDescription}
          onMouseLeave={scheduleCloseHoverDescription}
          onClick={(e) => {
            if (!canHoverFinePointer) {
              e.stopPropagation();
              setTouchDescriptionOpen((v) => !v);
            }
          }}
          onKeyDown={(e) => {
            if (canHoverFinePointer) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setTouchDescriptionOpen((v) => !v);
            }
          }}
          role={!canHoverFinePointer ? "button" : undefined}
          tabIndex={!canHoverFinePointer ? 0 : undefined}
          aria-label={t("productDescriptionHint")}
          aria-expanded={!canHoverFinePointer ? touchDescriptionOpen : undefined}
          style={{
            outline: "none",
            cursor: canHoverFinePointer ? "help" : "pointer"
          }}
        >
          {imageArea}
          <div
            style={{
              padding: "14px 16px 0",
              display: "flex",
              flexDirection: "column",
              gap: "5px"
            }}
          >
            {categoryLabelEl}
            {titleEl}
          </div>
        </div>
      ) : (
        imageArea
      )}

      <div
        style={{
          padding: hasStoreDescription ? "5px 16px 16px" : "14px 16px 16px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          borderBottomLeftRadius: "14px",
          borderBottomRightRadius: "14px"
        }}
      >
        {!hasStoreDescription && (
          <>
            {categoryLabelEl}
            {titleEl}
          </>
        )}

        {isPreorder && (
          <span
            title={t("preorderHint", { hours: minAdvHours })}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "9999px",
              fontSize: "11px",
              fontWeight: 600,
              background: colors.warningSurface,
              color: colors.warning,
              border: `1px solid ${colors.warningBorder}`
            }}
          >
            {t("preorderBadge")}
          </span>
        )}

        <div style={{ marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "7px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "21px", fontWeight: 700, color: colors.primary, lineHeight: 1 }}>
              {formatPrice(displayPrice, lang)}
            </span>
            {hasSale && (
              <span
                style={{ fontSize: "13px", color: colors.textMuted, textDecoration: "line-through" }}
              >
                {formatPrice(price, lang)}
              </span>
            )}
          </div>
          {unitLabel && (
            <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
              / {unitLabel}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {allowByAmount && inStock && !!id && (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {tabBtn(
              buyMode === "quantity",
              () => setBuyMode("quantity"),
              t("buyByQuantity"),
              lockedToAmount || orderingDisabled,
              lockedToAmount
                ? t("purchaseModeLockedInCartAmount")
                : orderingDisabled
                  ? t("cannotOrderNow", { ns: "storeClosed" })
                  : undefined
            )}
            {tabBtn(
              buyMode === "amount",
              () => setBuyMode("amount"),
              t("buyByAmount"),
              lockedToQuantity || orderingDisabled,
              lockedToQuantity
                ? t("purchaseModeLockedInCartQuantity")
                : orderingDisabled
                  ? t("cannotOrderNow", { ns: "storeClosed" })
                  : undefined
            )}
          </div>
        )}

        {allowByAmount && buyMode === "quantity" && inStock && !!id && (
          <div style={{ marginTop: "8px" }}>
            <label style={{ fontSize: "11px", color: colors.textMuted, display: "block", marginBottom: "4px" }}>
              {t("quantityLabel")}
            </label>
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={qtyInput}
              disabled={orderingDisabled}
              onChange={(e) => setQtyInput(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "8px 10px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                fontSize: "14px"
              }}
            />
          </div>
        )}

        {allowByAmount && buyMode === "amount" && inStock && !!id && (
          <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {[10, 20, 50].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={orderingDisabled}
                  onClick={() => !orderingDisabled && setAmountInput(String(chip))}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "9999px",
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: orderingDisabled ? "not-allowed" : "pointer",
                    opacity: orderingDisabled ? 0.55 : 1
                  }}
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
                padding: "8px 10px",
                borderRadius: "8px",
                border: `1px solid ${colors.border}`,
                fontSize: "14px"
              }}
            />
            {estimatedQtyStr && unitLabel && (
              <div style={{ fontSize: "12px", color: colors.textSecondary, lineHeight: 1.4 }}>
                {t("estimatedQtyApprox", { qty: estimatedQtyStr, unit: unitLabel })}
              </div>
            )}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            marginTop: "10px",
            gap: 6
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px"
            }}
          >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                flexShrink: 0,
                background: inStock ? colors.success : colors.error,
                boxShadow: inStock
                  ? "0 0 0 3px rgba(22,101,52,0.12)"
                  : "0 0 0 3px rgba(153,27,27,0.12)"
              }}
            />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: inStock ? colors.success : colors.error
              }}
            >
              {inStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>

          <motion.button
            ref={addButtonRef}
            type="button"
            onClick={handleAdd}
            disabled={addDisabled}
            title={orderingDisabled ? t("cannotOrderNow", { ns: "storeClosed" }) : undefined}
            aria-disabled={addDisabled}
            aria-busy={adding}
            whileHover={!addDisabled ? { scale: 1.05, background: colors.primaryHover } : {}}
            whileTap={!addDisabled ? { scale: 0.93 } : {}}
            transition={{ duration: 0.12 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "8px 15px",
              borderRadius: "9999px",
              border: "none",
              background: !addDisabled ? colors.primary : colors.border,
              color: !addDisabled ? colors.textInverse : colors.textMuted,
              fontSize: "13px",
              fontWeight: 600,
              cursor: !addDisabled ? "pointer" : "not-allowed",
              boxShadow: !addDisabled ? shadow.primary : "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
              opacity: inStock && !!id ? 1 : 0.92,
              transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease"
            }}
          >
            {adding ? (
              <motion.span
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.65, ease: "linear" }}
                style={{ display: "inline-flex", lineHeight: 0 }}
              >
                <Loader2 size={15} strokeWidth={2.5} />
              </motion.span>
            ) : (
              inStock &&
              !!id && <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span>
            )}
            {inStock
              ? allowByAmount && buyMode === "amount"
                ? t("addByAmount")
                : t("addToCart")
              : t("outOfStock")}
          </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
