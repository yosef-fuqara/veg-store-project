import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import { formatPrice, formatChargedTotal } from "../utils/formatPrice";
import { getLocalizedProductName } from "../utils/localizedProduct";
import {
  formatQtyDisplay,
  formatApproxWeightQuantity,
  PURCHASE_AMOUNT_CART_STEP_ILS
} from "../utils/cartLineQuantity";

const colors = {
  primary:        '#1e6b3c',
  primarySurface: '#eef7f1',
  primaryBorder:  '#a3cfb4',
  surface:        '#ffffff',
  surfaceRaised:  '#f5f2ed',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
  textInverse:    '#ffffff',
  success:        '#166534',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
  warning:        '#92400e',
  warningSurface: '#fffbeb',
  warningBorder:  '#fde68a',
};

const shadowPrimary = '0 4px 14px rgba(30,107,60,0.30)';

const pageStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '40px 24px',
};

const CartPage = () => {
  const { cart, loading, error, refreshCart, updateItem, setWrap, removeItem, clear } = useCart();
  const { canOrderNow } = useStoreSettings();
  const { t, i18n } = useTranslation(["cart", "common", "home", "storeClosed"]);
  const lang = (i18n.language || "he").split("-")[0];

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const wrapPricePerKg = Number(cart.wrapPricePerKg) || 2;
  const wrapTotal = Number(cart.wrapTotal) || 0;
  const subtotal = Number(cart.subtotal) || 0;
  const payableTotal =
    typeof cart.payableTotal === "number" ? cart.payableTotal : Math.floor(subtotal + wrapTotal + Number.EPSILON);
  const anyWrapAvailable = cart.items.some((item) => item.productSnapshot?.wrapAvailable);

  return (
    <section style={pageStyle}>
      <h1 style={{ margin: '0 0 24px', fontSize: '30px', lineHeight: '36px', fontWeight: 700, color: colors.textPrimary }}>
        {t("cart:title")}
      </h1>

      {!canOrderNow ? (
        <div
          role="status"
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 12,
            background: colors.warningSurface,
            border: `1px solid ${colors.warningBorder}`,
            color: colors.warning,
            fontSize: 15,
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          {t("cannotOrderNow", { ns: "storeClosed" })}
        </div>
      ) : null}

      <AnimatePresence>
        {error && (
          <motion.div
            key="cart-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px' }}>
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {anyWrapAvailable && (
        <div role="note" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.primarySurface, border: `1px solid ${colors.primaryBorder}`, color: colors.primary, fontSize: '14px', lineHeight: 1.5, marginBottom: '20px' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>{t("cart:wrap.sectionTitle")}</strong>
          <span style={{ display: 'block', marginBottom: '4px' }}>{t("cart:wrap.explanation")}</span>
          <span style={{ fontSize: '12px', color: colors.success }}>{t("cart:wrap.priceHint", { price: wrapPricePerKg })}</span>
        </div>
      )}

      {cart.items.length === 0 ? (
        <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t("cart:empty")}</p>
      ) : (
        <div>
          {cart.items.map((item) => {
            const lineTotal =
              typeof item.lineProductSubtotal === 'number'
                ? item.lineProductSubtotal
                : item.quantity * item.unitPriceSnapshot;
            const wrapAvailable = Boolean(item.productSnapshot?.wrapAvailable);
            const wrapFee = Number(item.wrapFee) || 0;
            const unit = item.productSnapshot?.unit;
            const allowFrac =
              Boolean(item.productSnapshot?.allowPurchaseByAmount) &&
              (unit === 'kg' || unit === 'gram');
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
            const isAmountLine = item.purchaseMode === 'amount' && item.requestedAmountIls != null;
            const showApproxWeight = isAmountLine && (unit === 'kg' || unit === 'gram');
            const unitLabel =
              unit === 'kg' || unit === 'gram' || unit === 'unit' || unit === 'box'
                ? t(`home:units.${unit}`)
                : unit || '';
            const atMinPurchaseAmount = isAmountLine && Number(item.requestedAmountIls) <= 1 + 1e-9;
            const thumbUrl =
              typeof item.productSnapshot?.imageUrl === 'string' ? item.productSnapshot.imageUrl.trim() : '';
            return (
              <div
                key={item.product}
                style={{ padding: '16px 0', borderBottom: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                {/* Name + line total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '10px',
                        background: colors.surfaceRaised,
                        border: `1px solid ${colors.border}`,
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt=""
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      ) : null}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
                        {getLocalizedProductName({ name: item.productSnapshot?.name }, lang) || String(item.product)}
                      </div>
                      {isAmountLine && (
                        <div style={{ fontSize: '12px', color: colors.primary, marginTop: '4px', fontWeight: 600 }}>
                          {t('cart:purchaseByAmountBadge', { amount: formatPrice(item.requestedAmountIls, lang) })}
                        </div>
                      )}
                      <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '2px' }}>
                        {isAmountLine ? (
                          showApproxWeight ? (
                            t('cart:purchaseByAmountLineDetail', {
                              unitPrice: formatPrice(item.unitPriceSnapshot, lang),
                              unitLabel,
                              weight: formatApproxWeightQuantity(item.quantity, unit)
                            })
                          ) : (
                            t('cart:purchaseByAmountNote', {
                              amount: formatPrice(item.requestedAmountIls, lang)
                            })
                          )
                        ) : (
                          <>
                            {formatQtyDisplay(item.quantity)} × {formatPrice(item.unitPriceSnapshot, lang)}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: colors.textPrimary, flexShrink: 0 }}>
                    {formatPrice(lineTotal, lang)}
                  </span>
                </div>

                {/* Quantity stepper + remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${colors.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      onClick={() =>
                        isAmountLine ? bumpPurchaseAmount(-PURCHASE_AMOUNT_CART_STEP_ILS) : bumpQty(-step)
                      }
                      disabled={loading || (isAmountLine && atMinPurchaseAmount)}
                      style={{ width: '32px', height: '32px', border: 'none', borderInlineEnd: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                      {isAmountLine
                        ? formatPrice(item.requestedAmountIls, lang)
                        : formatQtyDisplay(item.quantity)}
                    </span>
                    <button
                      onClick={() =>
                        isAmountLine ? bumpPurchaseAmount(PURCHASE_AMOUNT_CART_STEP_ILS) : bumpQty(step)
                      }
                      disabled={loading}
                      style={{ width: '32px', height: '32px', border: 'none', borderInlineStart: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, fontSize: '18px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product)}
                    disabled={loading}
                    style={{ padding: '0 12px', height: '32px', borderRadius: '10px', border: `1px solid ${colors.errorBorder}`, background: colors.errorSurface, color: colors.error, fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    {t("cart:remove")}
                  </button>
                </div>

                {/* Wrap toggle */}
                {wrapAvailable && (
                  <label title={t("cart:wrap.explanation")} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px', color: colors.success, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(item.wrap)}
                      disabled={loading}
                      onChange={(event) => setWrap(item.product, event.target.checked)}
                    />
                    <span>
                      {t("cart:wrap.toggleLabel")}{" "}
                      <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                        ({t("cart:wrap.priceHint", { price: wrapPricePerKg })})
                      </span>
                    </span>
                    {item.wrap ? (
                      <span style={{ marginInlineStart: 'auto', fontWeight: 600 }}>
                        {t("cart:wrap.lineFee", { amount: formatPrice(wrapFee, lang) })}
                      </span>
                    ) : null}
                  </label>
                )}
              </div>
            );
          })}

          {/* Totals */}
          <div style={{ marginTop: '20px', marginInlineStart: 'auto', padding: '16px', background: colors.surfaceRaised, borderRadius: '10px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.textSecondary }}>
              <span>{t("cart:subtotal")}</span>
              <span>{formatPrice(subtotal, lang)}</span>
            </div>
            {wrapTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.success }}>
                <span>{t("cart:wrap.summaryLabel")}</span>
                <span>{formatPrice(wrapTotal, lang)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: colors.textPrimary, paddingTop: '8px', marginTop: '4px', borderTop: `1px solid ${colors.border}` }}>
              <span>{t("cart:payableTotalLabel")}</span>
              <span>{formatChargedTotal(payableTotal, lang)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <motion.button
          type="button"
          onClick={() => clear()}
          disabled={loading || cart.items.length === 0}
          whileHover={!loading && cart.items.length > 0 ? { scale: 1.02 } : {}}
          whileTap={!loading && cart.items.length > 0 ? { scale: 0.96 } : {}}
          transition={{ duration: 0.12 }}
          style={{
            padding: '10px 20px', borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            background: 'transparent', color: colors.textSecondary,
            fontSize: '14px', fontWeight: 500,
            cursor: (loading || cart.items.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (loading || cart.items.length === 0) ? 0.5 : 1,
          }}
        >
          {t("cart:clearCart")}
        </motion.button>

        {cart.items.length === 0 ? (
          <button type="button" disabled style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: colors.border, color: colors.textMuted, fontSize: '15px', fontWeight: 600, cursor: 'not-allowed' }}>
            {t("cart:proceedToCheckout")}
          </button>
        ) : !canOrderNow ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
            <button
              type="button"
              disabled
              title={t("cannotOrderNow", { ns: "storeClosed" })}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: colors.border,
                color: colors.textMuted,
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'not-allowed',
              }}
            >
              {t("cart:proceedToCheckout")}
            </button>
          </div>
        ) : (
          <Link
            to="/checkout"
            state={{ scrollToDelivery: true }}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 24px', borderRadius: '10px', background: colors.primary, color: colors.textInverse, fontSize: '15px', fontWeight: 600, textDecoration: 'none', boxShadow: shadowPrimary }}
          >
            {t("cart:proceedToCheckout")}
            {payableTotal > 0 ? <> ({formatChargedTotal(payableTotal, lang)})</> : null}
          </Link>
        )}
      </div>
    </section>
  );
};

export default CartPage;
