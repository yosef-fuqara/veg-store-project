import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Trash2, X } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../features/cart/CartContext";
import { useCartDrawer } from "../features/cart/CartDrawerContext";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import { useCartVisualFeedback } from "../features/cart/CartVisualFeedbackContext";
import { formatPrice, formatChargedTotal } from "../utils/formatPrice";
import { getLocalizedProductName } from "../utils/localizedProduct";
import {
  formatQtyDisplay,
  formatApproxWeightQuantity,
  PURCHASE_AMOUNT_CART_STEP_ILS
} from "../utils/cartLineQuantity";
import { WhatsAppFabCircle } from "./WhatsAppFloat";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  surface: "#ffffff",
  surfaceRaised: "#f5f2ed",
  border: "#e8e3dc",
  bg: "#faf8f5",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  success: "#166534",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca",
};

const shadowLg = "0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)";
const shadowPrimary = "0 4px 14px rgba(30,107,60,0.30)";

const CartIconGlyph = ({ size = 22 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

/** Pulse target for “add to cart” fly animation — same refs as nav cart buttons. */
const CartAnchorPulse = ({ bumpKey, anchorRef, inlineFlexStyle, children }) => {
  if (bumpKey === 0) {
    return (
      <span ref={anchorRef} style={inlineFlexStyle}>
        {children}
      </span>
    );
  }
  return (
    <motion.span
      key={`fab-cart-pulse-${bumpKey}`}
      ref={anchorRef}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.12, 1] }}
      transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
      style={inlineFlexStyle}
    >
      {children}
    </motion.span>
  );
};

export function CartDrawerHost() {
  const { user, initializing } = useAuth();
  const { open, openCartDrawer, closeCartDrawer } = useCartDrawer();
  const location = useLocation();
  const { cart, loading, error, refreshCart, updateItem, setWrap, removeItem } = useCart();
  const { t, i18n } = useTranslation(["cart", "nav", "common", "home", "storeClosed"]);
  const { canOrderNow } = useStoreSettings();
  const lang = (i18n.language || "he").split("-")[0];

  const { fabCartAnchorRef, cartBumpKey } = useCartVisualFeedback();
  const dir = lang === "he" || lang === "ar" ? "rtl" : "ltr";
  const drawerSlideFrom = dir === "rtl" ? "-100%" : "100%";

  useEffect(() => {
    if (open && user && !initializing) {
      refreshCart();
    }
  }, [open, user, initializing, refreshCart]);

  useEffect(() => {
    closeCartDrawer();
  }, [location.pathname, closeCartDrawer]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeCartDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeCartDrawer]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const wrapTotal = Number(cart.wrapTotal) || 0;
  const subtotal = Number(cart.subtotal) || 0;
  const payableTotal =
    typeof cart.payableTotal === "number"
      ? cart.payableTotal
      : Math.floor(subtotal + wrapTotal + Number.EPSILON);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="cart-drawer-backdrop"
              type="button"
              aria-label={t("cart:drawerClose")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeCartDrawer}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                backdropFilter: "blur(2px)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                zIndex: 200,
              }}
            />
            <motion.aside
              key="cart-drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-drawer-title"
              initial={{ x: drawerSlideFrom }}
              animate={{ x: 0 }}
              exit={{ x: drawerSlideFrom }}
              transition={{ type: "tween", duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              dir={dir}
              style={{
                position: "fixed",
                top: 0,
                bottom: 0,
                insetInlineEnd: 0,
                width: "min(100vw - 32px, 420px)",
                maxWidth: "100%",
                background: colors.bg,
                boxShadow: shadowLg,
                zIndex: 201,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
              }}
            >
              <header
                style={{
                  flexShrink: 0,
                  padding: "16px 18px",
                  borderBottom: `1px solid ${colors.border}`,
                  background: colors.surface,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h2
                    id="cart-drawer-title"
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: colors.textPrimary,
                      lineHeight: 1.2,
                    }}
                  >
                    {t("cart:drawerTitle")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  aria-label={t("cart:drawerClose")}
                  style={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: colors.textPrimary,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={22} strokeWidth={2} aria-hidden />
                </button>
              </header>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 18px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {!user && !initializing ? (
                  <div
                    style={{
                      padding: "20px 16px",
                      borderRadius: 12,
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ margin: "0 0 14px", fontSize: 15, color: colors.textSecondary, lineHeight: 1.5 }}>
                      {t("cart:drawerSignInHint")}
                    </p>
                    <Link
                      to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
                      onClick={closeCartDrawer}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "10px 22px",
                        borderRadius: 9999,
                        background: colors.primary,
                        color: colors.textInverse,
                        fontSize: 14,
                        fontWeight: 600,
                        textDecoration: "none",
                        boxShadow: shadowPrimary,
                      }}
                    >
                      {t("nav:login")}
                    </Link>
                  </div>
                ) : initializing ? (
                  <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>{t("common:loading")}</p>
                ) : (
                  <>
                    {error ? (
                      <div
                        role="alert"
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: colors.errorSurface,
                          border: `1px solid ${colors.errorBorder}`,
                          color: colors.error,
                          fontSize: 14,
                        }}
                      >
                        {error}
                      </div>
                    ) : null}

                    {cart.items.length === 0 ? (
                      <p style={{ color: colors.textMuted, fontSize: 15, margin: 0 }}>{t("cart:empty")}</p>
                    ) : (
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                        {cart.items.map((item) => {
                          const lineTotal =
                            typeof item.lineProductSubtotal === "number"
                              ? item.lineProductSubtotal
                              : item.quantity * item.unitPriceSnapshot;
                          const wrapAvailable = Boolean(item.productSnapshot?.wrapAvailable);
                          const wrapFee = Number(item.wrapFee) || 0;
                          const unit = item.productSnapshot?.unit;
                          const allowFrac =
                            Boolean(item.productSnapshot?.allowPurchaseByAmount) && (unit === "kg" || unit === "gram");
                          const step = allowFrac ? 0.25 : 1;
                          const minQ = allowFrac ? 0.01 : 1;
                          const maxQ = allowFrac ? 500 : 100;
                          const bumpQty = (delta) => {
                            const n = Number(item.quantity);
                            const nextRaw = allowFrac ? Math.round((n + delta) * 10000) / 10000 : n + delta;
                            const next = Math.min(maxQ, Math.max(minQ, nextRaw));
                            updateItem(item.product, { quantity: next });
                          };
                          const bumpPurchaseAmount = (delta) => {
                            const cur = Number(item.requestedAmountIls);
                            const nextRaw = Math.round((cur + delta) * 100) / 100;
                            const next = Math.min(50000, Math.max(1, nextRaw));
                            updateItem(item.product, { purchaseAmountIls: next });
                          };
                          const isAmountLine = item.purchaseMode === "amount" && item.requestedAmountIls != null;
                          const showApproxWeight = isAmountLine && (unit === "kg" || unit === "gram");
                          const unitLabel =
                            unit === "kg" || unit === "gram" || unit === "unit" || unit === "box"
                              ? t(`home:units.${unit}`)
                              : unit || "";
                          const atMinPurchaseAmount = isAmountLine && Number(item.requestedAmountIls) <= 1 + 1e-9;
                          const thumbUrl =
                            typeof item.productSnapshot?.imageUrl === "string"
                              ? item.productSnapshot.imageUrl.trim()
                              : "";

                          return (
                            <li
                              key={item.product}
                              style={{
                                padding: "14px 0",
                                borderBottom: `1px solid ${colors.border}`,
                                display: "grid",
                                gridTemplateColumns: "56px 1fr auto",
                                gap: 12,
                                alignItems: "start",
                              }}
                            >
                              <div
                                style={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 10,
                                  background: colors.surfaceRaised,
                                  border: `1px solid ${colors.border}`,
                                  flexShrink: 0,
                                  overflow: "hidden",
                                }}
                              >
                                {thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt=""
                                    draggable={false}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary, lineHeight: 1.3 }}>
                                  {getLocalizedProductName({ name: item.productSnapshot?.name }, lang) || String(item.product)}
                                </div>
                                {isAmountLine ? (
                                  <div style={{ fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: 600 }}>
                                    {t("cart:purchaseByAmountBadge", { amount: formatPrice(item.requestedAmountIls, lang) })}
                                  </div>
                                ) : null}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                                  <div
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      border: `1px solid ${colors.border}`,
                                      borderRadius: 10,
                                      overflow: "hidden",
                                      background: colors.surface,
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        isAmountLine
                                          ? bumpPurchaseAmount(-PURCHASE_AMOUNT_CART_STEP_ILS)
                                          : bumpQty(-step)
                                      }
                                      disabled={loading || (isAmountLine && atMinPurchaseAmount)}
                                      style={{
                                        width: 30,
                                        height: 30,
                                        border: "none",
                                        borderInlineEnd: `1px solid ${colors.border}`,
                                        background: colors.surface,
                                        color: colors.textPrimary,
                                        fontSize: 16,
                                        cursor: loading ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      −
                                    </button>
                                    <span
                                      style={{
                                        minWidth: 32,
                                        textAlign: "center",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: colors.textPrimary,
                                      }}
                                    >
                                      {isAmountLine
                                        ? formatPrice(item.requestedAmountIls, lang)
                                        : formatQtyDisplay(item.quantity)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        isAmountLine
                                          ? bumpPurchaseAmount(PURCHASE_AMOUNT_CART_STEP_ILS)
                                          : bumpQty(step)
                                      }
                                      disabled={loading}
                                      style={{
                                        width: 30,
                                        height: 30,
                                        border: "none",
                                        borderInlineStart: `1px solid ${colors.border}`,
                                        background: colors.surface,
                                        color: colors.textPrimary,
                                        fontSize: 16,
                                        cursor: loading ? "not-allowed" : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span style={{ fontSize: 13, color: colors.textSecondary }}>
                                    {isAmountLine ? (
                                      showApproxWeight ? (
                                        t("cart:purchaseByAmountLineDetail", {
                                          unitPrice: formatPrice(item.unitPriceSnapshot, lang),
                                          unitLabel,
                                          weight: formatApproxWeightQuantity(item.quantity, unit),
                                        })
                                      ) : (
                                        t("cart:purchaseByAmountNote", {
                                          amount: formatPrice(item.requestedAmountIls, lang),
                                        })
                                      )
                                    ) : (
                                      <>
                                        {formatQtyDisplay(item.quantity)} ×{" "}
                                        {formatPrice(item.unitPriceSnapshot, lang)}
                                      </>
                                    )}
                                  </span>
                                </div>
                                {wrapAvailable ? (
                                  <label
                                    title={t("cart:wrap.explanation")}
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      alignItems: "center",
                                      fontSize: 12,
                                      color: colors.success,
                                      cursor: "pointer",
                                      marginTop: 8,
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(item.wrap)}
                                      disabled={loading}
                                      onChange={(event) => setWrap(item.product, event.target.checked)}
                                    />
                                    <span>{t("cart:wrap.toggleLabel")}</span>
                                    {item.wrap ? (
                                      <span style={{ fontWeight: 600 }}>{t("cart:wrap.lineFee", { amount: formatPrice(wrapFee, lang) })}</span>
                                    ) : null}
                                  </label>
                                ) : null}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.product)}
                                  disabled={loading}
                                  aria-label={t("cart:remove")}
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    border: "none",
                                    background: colors.surfaceRaised,
                                    color: colors.textMuted,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Trash2 size={18} strokeWidth={2} aria-hidden />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {user && cart.items.length > 0 ? (
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: 8,
                          borderTop: `1px solid ${colors.border}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: 14,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: colors.textPrimary }}>{t("cart:subtotal")}</span>
                          <span style={{ fontSize: 17, fontWeight: 700, color: colors.primary }}>{formatPrice(subtotal, lang)}</span>
                        </div>
                        {wrapTotal > 0 ? (
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: colors.success }}>
                            <span>{t("cart:wrap.summaryLabel")}</span>
                            <span>{formatPrice(wrapTotal, lang)}</span>
                          </div>
                        ) : null}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>
                          <span>{t("cart:payableTotalLabel")}</span>
                          <span>{formatChargedTotal(payableTotal, lang)}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                          <Link
                            to="/cart"
                            onClick={closeCartDrawer}
                            style={{ fontSize: 13, fontWeight: 600, color: colors.textSecondary }}
                          >
                            {t("cart:drawerViewFullCart")}
                          </Link>
                          {!canOrderNow ? (
                            <span
                              title={t("cannotOrderNow", { ns: "storeClosed" })}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px 28px",
                                borderRadius: 9999,
                                background: colors.border,
                                color: colors.textMuted,
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                whiteSpace: "nowrap",
                                cursor: "not-allowed",
                              }}
                            >
                              {t("cart:drawerCheckout")}
                            </span>
                          ) : (
                            <Link
                              to="/checkout"
                              state={{ scrollToDelivery: true }}
                              onClick={closeCartDrawer}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "12px 28px",
                                borderRadius: 9999,
                                background: colors.primary,
                                color: colors.textInverse,
                                fontSize: 14,
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                textDecoration: "none",
                                boxShadow: shadowPrimary,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {t("cart:drawerCheckout")}
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "max(24px, env(safe-area-inset-bottom, 0px))",
          zIndex: 120,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingLeft: "max(24px, env(safe-area-inset-left, 0px))",
          paddingRight: "max(24px, env(safe-area-inset-right, 0px))",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      >
        <span style={{ pointerEvents: "auto", display: "flex", flexShrink: 0 }}>
          <WhatsAppFabCircle />
        </span>
        <motion.button
          type="button"
          onClick={openCartDrawer}
          aria-label={t("cart:drawerOpen")}
          aria-expanded={open}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 9999,
            border: "none",
            background: colors.primary,
            color: colors.textInverse,
            cursor: "pointer",
            boxShadow: shadowPrimary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            pointerEvents: "auto",
          }}
        >
          <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CartAnchorPulse
              bumpKey={cartBumpKey}
              anchorRef={fabCartAnchorRef}
              inlineFlexStyle={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <CartIconGlyph size={24} />
            </CartAnchorPulse>
          </span>
        </motion.button>
      </div>
    </>
  );
}
