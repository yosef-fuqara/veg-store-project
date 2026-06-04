import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { useCartVisualFeedback } from "../features/cart/CartVisualFeedbackContext";
import { useGuestAccountPrompt } from "../features/cart/GuestAccountPromptContext";
import { isGuestCartEmptyForPrompt } from "../utils/guestAccountPromptSession";
import { formatPrice } from "../utils/formatPrice";
import {
  getLocalizedCategoryName,
  getLocalizedProductDescription,
  getLocalizedProductName,
  textDirectionForLang
} from "../utils/localizedProduct";
import ProductCardPurchasePanel from "./ProductCardPurchasePanel";
import FavoriteProductButton from "./account/FavoriteProductButton";
import { displayPricePerKg, isWeightBasedUnit } from "../utils/storefrontWeight";

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

const cardVariantsCompact = {
  rest: { y: 0, boxShadow: shadow.sm },
  hover: { y: 0, boxShadow: shadow.sm }
};

const titleClampStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  wordBreak: "break-word"
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

const ProductCard = ({ product, lang, orderingDisabled = false, compact = false }) => {
  const { t } = useTranslation(["home", "storeClosed"]);
  const { addItem, cart } = useCart();
  const { notifyProductAddedToCart } = useCartVisualFeedback();
  const { maybeShowGuestAccountPrompt } = useGuestAccountPrompt();
  const addButtonRef = useRef(null);
  const flyImageRef = useRef(null);
  const [adding, setAdding] = useState(false);

  const id = product._id;
  const name = getLocalizedProductName(product, lang);
  const nameDir = textDirectionForLang(lang);
  const imageUrl = typeof product.imageUrl === "string" ? product.imageUrl : "";
  const unit = typeof product.unit === "string" ? product.unit : "";
  const price = Number(product.price);
  const salePrice =
    product.salePrice != null && product.salePrice !== "" ? Number(product.salePrice) : null;
  const hasSale =
    salePrice != null && !Number.isNaN(salePrice) && !Number.isNaN(price) && salePrice < price;
  const displayPrice = hasSale ? salePrice : price;
  const weightBased = isWeightBasedUnit(unit);
  const unitLabel = weightBased ? t("units.kg") : UNIT_KEYS[unit] ? t(UNIT_KEYS[unit]) : unit;
  const priceForDisplay = weightBased ? displayPricePerKg(displayPrice, unit) : displayPrice;

  const inStock = !isProductUnavailable(product);
  const isPreorder = Boolean(product.isPreorderOnly);
  const minAdvHours = Number(product.minAdvanceHours) || 24;
  const categoryName = getLocalizedCategoryName(product.category, lang);
  const isFeatured = Boolean(product.isFeatured || product.featured);

  const existingLine = useMemo(
    () => cart.items.find((it) => String(it.product) === String(id)),
    [cart.items, id]
  );
  const lockedToAmount = Boolean(
    existingLine?.purchaseMode === "amount" && existingLine?.requestedAmountIls != null
  );
  const lockedToQuantity = Boolean(existingLine) && !lockedToAmount;

  const handleConfirmAdd = async (payload) => {
    if (!id) return false;
    const wasGuestEmptyCart = isGuestCartEmptyForPrompt(cart.items);
    setAdding(true);
    try {
      let ok = false;
      if ("purchaseAmountIls" in payload) {
        ok = await addItem(String(id), 1, { purchaseAmountIls: payload.purchaseAmountIls });
      } else {
        ok = await addItem(String(id), payload.quantity);
      }
      if (ok) {
        const flyEl = flyImageRef.current || addButtonRef.current;
        if (flyEl) {
          notifyProductAddedToCart({
            fromRect: flyEl.getBoundingClientRect(),
            imageUrl
          });
        }
        if (wasGuestEmptyCart) {
          maybeShowGuestAccountPrompt();
        }
      }
      return ok;
    } finally {
      setAdding(false);
    }
  };

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

  const categoryLabelEl =
    categoryName && !compact ? (
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
      dir={nameDir}
      style={{
        margin: 0,
        fontSize: compact ? "11px" : "16px",
        fontWeight: compact ? 600 : 700,
        color: colors.textPrimary,
        lineHeight: compact ? 1.25 : 1.3,
        ...(compact ? titleClampStyle : {})
      }}
    >
      {name || "—"}
    </h3>
  );

  const cardRadius = compact ? "10px" : "14px";
  const contentPadBottom = compact ? "6px 8px 8px" : "14px 16px 16px";
  const contentPadTopOnly = compact ? "6px 8px 0" : "14px 16px 0";
  const contentGapMid = compact ? "3px 8px 0" : "5px 16px 0";

  const imageArea = (
    <div
      ref={flyImageRef}
      style={{
        position: "relative",
        aspectRatio: compact ? "1" : "4/3",
        flexShrink: 0,
        overflow: "hidden",
        borderTopLeftRadius: cardRadius,
        borderTopRightRadius: cardRadius
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
              fontSize: compact ? "22px" : "40px"
            }}
          >
            🥬
          </div>
        )}
      </motion.div>

      <FavoriteProductButton productId={id} />

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
              padding: compact ? "4px" : "12px"
            }}
          >
            <span
              style={{
                padding: compact ? "3px 6px" : "6px 14px",
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.94)",
                color: colors.textPrimary,
                fontSize: compact ? "8px" : "12px",
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

      {isFeatured && !compact && (
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
            top: compact ? "4px" : "10px",
            insetInlineEnd: compact ? "4px" : "10px",
            zIndex: 2,
            padding: compact ? "2px 5px" : "3px 10px",
            borderRadius: "9999px",
            background: colors.errorSurface,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
            fontSize: compact ? "7px" : "10px",
            fontWeight: 700,
            letterSpacing: compact ? "0.4px" : "0.8px",
            textTransform: "uppercase",
            lineHeight: 1.2
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
      whileHover={compact ? undefined : "hover"}
      whileTap={{ scale: compact ? 0.98 : 0.985 }}
      variants={compact ? cardVariantsCompact : cardVariants}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: colors.surface,
        borderRadius: cardRadius,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        willChange: compact ? "auto" : "transform",
        height: "100%",
        minWidth: 0
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
              padding: contentPadTopOnly,
              display: "flex",
              flexDirection: "column",
              gap: compact ? "3px" : "5px"
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
          padding: hasStoreDescription ? contentGapMid : contentPadBottom,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: compact ? "3px" : "5px",
          borderBottomLeftRadius: cardRadius,
          borderBottomRightRadius: cardRadius,
          minWidth: 0
        }}
      >
        {!hasStoreDescription && (
          <>
            {categoryLabelEl}
            {titleEl}
          </>
        )}

        {isPreorder && !compact && (
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

        <div style={{ marginTop: compact ? "2px" : "4px", minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: compact ? "4px" : "7px",
              flexWrap: "wrap",
              minWidth: 0
            }}
          >
            <span
              style={{
                fontSize: compact ? "12px" : "21px",
                fontWeight: 700,
                color: colors.primary,
                lineHeight: 1
              }}
            >
              {formatPrice(priceForDisplay, lang)}
            </span>
            {hasSale && !compact && (
              <span
                style={{ fontSize: "13px", color: colors.textMuted, textDecoration: "line-through" }}
              >
                {formatPrice(price, lang)}
              </span>
            )}
          </div>
          {unitLabel && !compact && (
            <div style={{ fontSize: "11px", color: colors.textMuted, marginTop: "2px" }}>
              / {unitLabel}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            marginTop: compact ? "6px" : "10px",
            gap: compact ? 4 : 6
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: compact ? "column" : "row",
              justifyContent: compact ? "stretch" : "space-between",
              alignItems: compact ? "stretch" : "center",
              gap: compact ? "6px" : "8px"
            }}
          >
          {!compact && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
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
          )}

          {!inStock && (
            <span
              style={{
                fontSize: compact ? "11px" : "13px",
                fontWeight: 600,
                color: colors.textMuted,
                textAlign: compact ? "center" : "end",
                width: compact ? "100%" : "auto",
                marginInlineStart: compact ? 0 : "auto"
              }}
            >
              {t("outOfStock")}
            </span>
          )}
          </div>
        </div>

        {inStock && !!id && (
          <ProductCardPurchasePanel
            product={product}
            lang={lang}
            displayPrice={displayPrice}
            compact={compact}
            orderingDisabled={orderingDisabled}
            lockedToAmount={lockedToAmount}
            lockedToQuantity={lockedToQuantity}
            adding={adding}
            addButtonRef={addButtonRef}
            onAdd={handleConfirmAdd}
          />
        )}
      </div>
    </motion.article>
  );
};

export default ProductCard;
