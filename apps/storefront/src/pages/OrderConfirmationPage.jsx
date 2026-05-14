import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import * as orderService from "../services/orderService";
import { formatPrice, formatChargedTotal } from "../utils/formatPrice";
import { formatQtyDisplay, formatApproxWeightQuantity } from "../utils/cartLineQuantity";
import { formatOrderDeliveryAreaLabel } from "../utils/deliveryAreaDisplay";
import { getLocalizedText } from "../utils/localizedProduct";

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
  successSurface: '#f0fdf4',
  successBorder:  '#bbf7d0',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
  warning:        '#92400e',
  warningSurface: '#fffbeb',
  warningBorder:  '#fde68a',
};

const pageStyle = {
  maxWidth: '760px',
  margin: '0 auto',
  padding: '40px 24px',
};

const paymentStatusMessage = (status, t) => {
  switch (status) {
    case "pending_payment":       return t("paymentStatusMessage.pending_payment");
    case "bank_transfer_pending": return t("paymentStatusMessage.bank_transfer_pending");
    case "paid":
    case "bank_transfer_approved": return t("paymentStatusMessage.paid");
    case "failed":    return t("paymentStatusMessage.failed");
    case "cancelled": return t("paymentStatusMessage.cancelled");
    default: return null;
  }
};

const confirmationTitleForPaymentStatus = (status, t) => {
  if (status === "paid" || status === "bank_transfer_approved") {
    return t("confirmationTitle");
  }
  if (status === "bank_transfer_pending" || status === "pending_payment") {
    return t("confirmationTitleAwaitingPayment");
  }
  return t("confirmationTitleOrderRecord");
};

const confirmationHeaderPresentation = (status) => {
  if (status === "paid" || status === "bank_transfer_approved") {
    return {
      surface: colors.successSurface,
      border: colors.successBorder,
      accent: colors.success,
      icon: "✓",
    };
  }
  if (status === "bank_transfer_pending" || status === "pending_payment") {
    return {
      surface: colors.warningSurface,
      border: colors.warningBorder,
      accent: colors.warning,
      icon: "⏳",
    };
  }
  if (status === "failed" || status === "cancelled") {
    return {
      surface: colors.errorSurface,
      border: colors.errorBorder,
      accent: colors.error,
      icon: "✕",
    };
  }
  return {
    surface: colors.primarySurface,
    border: colors.primaryBorder,
    accent: colors.primary,
    icon: "ℹ",
  };
};

const Skeleton = ({ height = 20, width = '100%' }) => (
  <motion.div
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
    style={{ width, height, background: colors.border, borderRadius: '6px' }}
  />
);

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '8px', padding: '8px 0', borderBottom: `1px solid ${colors.border}`, flexWrap: 'wrap' }}>
    <span style={{ fontSize: '14px', fontWeight: 500, color: colors.textSecondary, minWidth: '120px', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '14px', color: colors.textPrimary }}>{value}</span>
  </div>
);

const OrderConfirmationPage = () => {
  const { t, i18n } = useTranslation(["order", "cart", "home"]);
  const { t: tCheckout } = useTranslation("checkout");
  const lang = (i18n.language || "he").split("-")[0];
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err) {
      setOrder(null);
      setError(err.userMessage || t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section style={pageStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Skeleton height={36} width="60%" />
          <Skeleton height={20} width="40%" />
          <Skeleton height={20} width="55%" />
          <Skeleton height={20} width="45%" />
          <Skeleton height={20} width="50%" />
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 20px', fontSize: '24px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '16px' }}>
          {error || t("notFound")}
        </div>
        <Link to="/" style={{ color: colors.primary, fontWeight: 600 }}>{t("home")}</Link>
      </section>
    );
  }

  const statusNote = paymentStatusMessage(order.paymentStatus, t);
  const headerUi = confirmationHeaderPresentation(order.paymentStatus);
  const deliveryAddress = order.deliveryAddress
    ? [order.deliveryAddress.label, order.deliveryAddress.city, order.deliveryAddress.street, order.deliveryAddress.building, order.deliveryAddress.apartment, order.deliveryAddress.notes].filter(Boolean).join(", ")
    : "—";

  return (
    <section style={pageStyle}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Status header (tone follows payment status) */}
        <div style={{ background: headerUi.surface, border: `1px solid ${headerUi.border}`, borderRadius: '14px', padding: '28px 24px', marginBottom: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '12px', color: headerUi.accent }} aria-hidden>{headerUi.icon}</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: headerUi.accent }}>
            {confirmationTitleForPaymentStatus(order.paymentStatus, t)}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary, fontFamily: 'monospace' }}>
            {order._id}
          </p>
        </div>

        {/* Refresh status — placed directly under the confirmation header so the
            customer can quickly re-check the order status without scrolling. */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <motion.button
            type="button"
            onClick={load}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12 }}
            style={{
              width: '100%',
              maxWidth: '320px',
              padding: '12px 20px',
              borderRadius: '10px',
              border: `1.5px solid ${colors.primary}`,
              background: colors.surface,
              color: colors.primary,
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {t("refreshStatus")}
          </motion.button>
        </div>

        {/* Order details card */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
            {t("title")}
          </h2>
          <div style={{ marginTop: '4px' }}>
            <Row label={t("status")} value={t(`orderStatus.${order.orderStatus}`, { defaultValue: order.orderStatus })} />
            <Row label={t("payment")} value={t(`paymentStatus.${order.paymentStatus}`, { defaultValue: order.paymentStatus })} />
            <Row label={t("paymentMethod")} value={t(`paymentMethods.${order.paymentMethod}`, { defaultValue: order.paymentMethod })} />
            <Row label={t("phone")} value={order.customerPhone} />
          </div>

          {statusNote && (
            <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: colors.primarySurface, border: `1px solid ${colors.primaryBorder}`, color: colors.primary, fontSize: '14px', lineHeight: 1.5 }}>
              {statusNote}
            </div>
          )}

          {order.paymentMethod === "bank_transfer" && order.bankTransferProofUrl && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textSecondary, marginBottom: '8px' }}>
                {t("bankTransferProofTitle")}
              </div>
              <a
                href={order.bankTransferProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', maxWidth: '100%' }}
              >
                <img
                  src={order.bankTransferProofUrl}
                  alt={t("bankTransferProofAlt")}
                  style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '10px', border: `1px solid ${colors.border}`, objectFit: 'contain', background: colors.surfaceRaised }}
                />
              </a>
            </div>
          )}
        </div>

        {/* Delivery card */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
            {t("delivery")}
          </h2>
          <div style={{ marginTop: '4px' }}>
            <Row label={t("area")} value={formatOrderDeliveryAreaLabel(order, tCheckout, lang)} />
            <Row label="" value={deliveryAddress} />
          </div>

          {order.hasPreorderItems && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '9999px', background: colors.warningSurface, color: colors.warning, fontWeight: 600, fontSize: '12px', border: `1px solid ${colors.warningBorder}` }}>
                {t("preorderBadge")}
              </span>
              {order.preferredDeliveryAt && (
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                  <strong>{t("preferredAt")}:</strong> {new Date(order.preferredDeliveryAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {order.customRequest && (
            <div style={{ marginTop: '12px', fontSize: '14px', color: colors.textSecondary }}>
              <strong>{t("customRequest")}:</strong> {order.customRequest}
            </div>
          )}
          {order.notes && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: colors.textSecondary }}>
              <strong>{t("yourNotes")}:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Items + totals card */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: colors.textPrimary }}>
            {t("items")}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(order.items || []).map((item, index) => {
              const lineDisplay =
                typeof item.lineTotal === "number"
                  ? item.lineTotal
                  : Number(item.price) * Number(item.quantity);
              return (
              <div key={`${item.product}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '10px 0', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                  {getLocalizedText(item.name, lang)}
                  {item.purchaseMode === "amount" && item.requestedAmountIls != null ? (
                    <>
                      {" · "}
                      {item.unit === "kg" || item.unit === "gram" ? (
                        t("cart:purchaseByAmountLineDetail", {
                          unitPrice: formatPrice(item.price, lang),
                          unitLabel: t(`home:units.${item.unit}`),
                          weight: formatApproxWeightQuantity(item.quantity, item.unit)
                        })
                      ) : (
                        t("cart:purchaseByAmountNote", {
                          amount: formatPrice(item.requestedAmountIls, lang)
                        })
                      )}
                    </>
                  ) : (
                    <> × {formatQtyDisplay(item.quantity)}</>
                  )}
                  {item.wrap && (
                    <span
                      title={t("wrapBadge")}
                      style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', background: colors.successSurface, color: colors.success, border: `1px solid ${colors.successBorder}` }}
                    >
                      {t("wrapBadge")}{Number(item.wrapFee) > 0 ? ` (+${formatPrice(item.wrapFee, lang)})` : ""}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, flexShrink: 0 }}>
                  {formatPrice(lineDisplay, lang)}
                </span>
              </div>
            );
            })}
          </div>

          {/* Totals */}
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.textSecondary }}>
              <span>{t("subtotal")}</span>
              <span>{formatPrice(order.subtotal, lang)}</span>
            </div>
            {Number(order.wrapTotal) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.success }}>
                <span>{t("wrapFees")}</span>
                <span>{formatPrice(order.wrapTotal, lang)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: colors.textSecondary }}>
              <span>{t("deliveryFee")}</span>
              <span>{formatPrice(order.deliveryFee, lang)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: colors.textPrimary, paddingTop: '10px', borderTop: `1px solid ${colors.border}`, marginTop: '4px' }}>
              <span>{t("total")}</span>
              <span>{formatChargedTotal(order.total, lang)}</span>
            </div>
          </div>
        </div>

        {/* Bottom action — Continue shopping closes the flow after the user
            has reviewed the order status and details above. */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '320px',
              padding: '12px 24px',
              borderRadius: '10px',
              background: colors.primary,
              color: colors.textInverse,
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(30,107,60,0.30)',
            }}
          >
            {t("continueShopping")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default OrderConfirmationPage;
