import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../features/toast/ToastContext";
import {
  getAdminOrderById,
  getDeliveryAreas,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus
} from "../services/orderService";
import { getLocalizedText } from "../utils/localizedDisplayName";
import { resolveAdminDeliveryAreaLabel } from "../utils/deliveryAreaLabel";
import { formatAdminOrderStatusLabel, formatAdminPaymentStatusLabel } from "../utils/adminOrderStatusLabel";
import { useAdminLanguage } from "../i18n/useAdminLanguage";

const ORDER_STATUS_OPTIONS = [
  "new", "confirmed", "sent_with_delivery_company", "delivered", "cancelled"
];

const PAYMENT_STATUS_OPTIONS = ["bank_transfer_approved", "failed", "cancelled"];

const colors = {
  primary:       '#1e6b3c',
  bg:            '#faf8f5',
  surface:       '#ffffff',
  border:        '#e8e3dc',
  borderLight:   '#f0ece6',
  textPrimary:   '#1c1917',
  textSecondary: '#57534e',
  textMuted:     '#a8a29e',
  textInverse:   '#ffffff',
  error:         '#991b1b',
  errorBg:       '#fef2f2',
  errorBorder:   '#fecaca',
  warning:       '#92400e',
  warningBg:     '#fffbeb',
  warningBorder: '#fde68a',
  success:       '#166534',
  successBg:     '#dcfce7',
  successBorder: '#bbf7d0',
};

const ORDER_STATUS_STYLES = {
  new:                       { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  confirmed:                 { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  sent_with_delivery_company:{ bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  delivered:                 { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  cancelled:                 { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

const PAYMENT_STATUS_STYLES = {
  pending_payment:        { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  paid:                   { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  failed:                 { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  cancelled:              { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  bank_transfer_pending:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  bank_transfer_approved: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(value);
};

const formatChargedCurrency = (value) => {
  if (typeof value !== 'number') return '—';
  const whole = Math.floor(value);
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(whole);
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Pill = ({ value, palette, kind = "order" }) => {
  const s = palette[value] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  const label = kind === "payment" ? formatAdminPaymentStatusLabel(value) : formatAdminOrderStatusLabel(value);
  const textTransform = /[\u0590-\u05FF]/.test(label) ? 'none' : 'capitalize';
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: '9999px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
      textTransform,
    }}>
      {label}
    </span>
  );
};

const InfoRow = ({ label, children }) => (
  <div style={{ display: 'flex', gap: '12px', padding: '9px 0', borderBottom: `1px solid ${colors.borderLight}`, alignItems: 'flex-start' }}>
    <span style={{ fontSize: '13px', fontWeight: 500, color: colors.textMuted, minWidth: '140px', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '14px', color: colors.textPrimary }}>{children}</span>
  </div>
);

const Card = ({ children, style }) => (
  <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '14px', padding: '24px', ...style }}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {children}
  </h3>
);

const selectStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: `1.5px solid #e8e3dc`,
  fontSize: '13px',
  color: '#1c1917',
  background: '#ffffff',
  outline: 'none',
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const AdminOrderDetailsPage = () => {
  const { id } = useParams();
  const { showToast } = useToast();
  const { t } = useTranslation(["orders", "common"]);
  const { lang } = useAdminLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [nextOrderStatus, setNextOrderStatus] = useState("");
  const [nextPaymentStatus, setNextPaymentStatus] = useState("");
  const [deliveryAreaCatalog, setDeliveryAreaCatalog] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDeliveryAreas()
      .then((data) => {
        if (!cancelled) setDeliveryAreaCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setDeliveryAreaCatalog(null);
      });
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminOrderById(id);
      setOrder(data);
      setNextOrderStatus(data?.orderStatus || "");
      setNextPaymentStatus(data?.paymentStatus || "");
    } catch (err) {
      setError(err.userMessage || t("orders:details.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: formatCurrency(order.subtotal),
      wrapTotal: formatCurrency(order.wrapTotal || 0),
      deliveryFee: formatCurrency(order.deliveryFee),
      total: formatChargedCurrency(order.total),
    };
  }, [order]);

  const handleOrderStatusUpdate = async () => {
    if (!order || !nextOrderStatus || nextOrderStatus === order.orderStatus) return;
    setUpdating(true);
    try {
      const updated = await updateAdminOrderStatus(order._id, nextOrderStatus);
      setOrder(updated);
      setNextOrderStatus(updated.orderStatus || "");
      showToast(t("orders:details.toasts.orderStatusUpdated"));
    } catch (err) {
      const msg = err.userMessage || t("orders:details.toasts.orderStatusFailed");
      showToast(msg, "error");
    } finally {
      setUpdating(false);
    }
  };

  const handlePaymentStatusUpdate = async () => {
    if (!order || !nextPaymentStatus || nextPaymentStatus === order.paymentStatus) return;
    setUpdating(true);
    try {
      const updated = await updateAdminOrderPaymentStatus(order._id, nextPaymentStatus);
      setOrder(updated);
      setNextPaymentStatus(updated.paymentStatus || "");
      showToast(t("orders:details.toasts.paymentStatusUpdated"));
    } catch (err) {
      const msg = err.userMessage || t("orders:details.toasts.paymentStatusFailed");
      showToast(msg, "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div style={{ height: '36px', width: '260px', background: colors.border, borderRadius: '8px', marginBottom: '28px' }} />
        {[120, 200, 160, 180].map((h, i) => (
          <div key={i} style={{ height: h, background: colors.border, borderRadius: '14px', marginBottom: '16px' }} />
        ))}
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
        <button type="button" onClick={load} style={{ padding: '8px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
          {t("common:retry")}
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ color: colors.textMuted, fontSize: '14px' }}>{t("orders:details.notFound")}</div>
    );
  }

  const deliveryAddress = [
    order.deliveryAddress?.city,
    order.deliveryAddress?.street,
    order.deliveryAddress?.building && `${t("orders:details.delivery.buildingPrefix")} ${order.deliveryAddress.building}`,
    order.deliveryAddress?.apartment && `${t("orders:details.delivery.apartmentPrefix")} ${order.deliveryAddress.apartment}`,
    order.deliveryAddress?.notes,
  ].filter(Boolean).join(', ');

  return (
    <div style={{ maxWidth: '840px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.3px' }}>
            {t("orders:details.pageTitle")}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textMuted, fontFamily: 'monospace' }}>
            #{String(order._id).slice(-8).toUpperCase()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={load}
            disabled={loading || updating}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            {t("common:refresh")}
          </button>
          <Link
            to="/orders"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {t("orders:details.allOrders")}
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: '8px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Preorder banner */}
      {order.hasPreorderItems && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '12px 16px', borderRadius: '10px', background: colors.warningBg, border: `1px solid ${colors.warningBorder}`, marginBottom: '16px' }}>
          <span style={{ padding: '2px 10px', borderRadius: '9999px', background: '#fef3c7', color: colors.warning, fontSize: '12px', fontWeight: 700, border: `1px solid ${colors.warningBorder}` }}>
            {t("orders:details.preorderBadge")}
          </span>
          <span style={{ fontSize: '14px', color: colors.warning }}>
            {t("orders:details.preorderBanner")}
          </span>
          {order.preferredDeliveryAt && (
            <span style={{ fontSize: '13px', color: colors.warning, fontWeight: 500 }}>
              {t("orders:details.preferredLabel", { value: formatDate(order.preferredDeliveryAt) })}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>

        {/* Customer info */}
        <Card>
          <CardTitle>{t("orders:details.cards.customer")}</CardTitle>
          <InfoRow label={t("orders:details.customer.name")}>{order.user?.name || '—'}</InfoRow>
          <InfoRow label={t("orders:details.customer.email")}>{order.user?.email || '—'}</InfoRow>
          <InfoRow label={t("orders:details.customer.phone")}>{order.user?.phone || order.customerPhone || '—'}</InfoRow>
          <InfoRow label={t("orders:details.customer.orderPlaced")}>{formatDate(order.createdAt)}</InfoRow>
          <InfoRow label={t("orders:details.customer.lastUpdated")}>{formatDate(order.updatedAt)}</InfoRow>
          {order.notes && <InfoRow label={t("orders:details.customer.customerNotes")}>{order.notes}</InfoRow>}
          {order.customRequest && <InfoRow label={t("orders:details.customer.customRequest")}>{order.customRequest}</InfoRow>}
        </Card>

        {/* Items */}
        <Card>
          <CardTitle>{t("orders:details.cards.items")}</CardTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[
                  t("orders:details.itemsTable.product"),
                  t("orders:details.itemsTable.qty"),
                  t("orders:details.itemsTable.unitPrice"),
                  t("orders:details.itemsTable.lineTotal")
                ].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'start', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={`${item.product || getLocalizedText(item.name, lang)}-${idx}`} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: '10px 10px', fontSize: '14px', color: colors.textPrimary }}>
                    <span>{getLocalizedText(item.name, lang)}</span>
                    {item.isPreorderOnly && (
                      <span style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: colors.warningBg, color: colors.warning, border: `1px solid ${colors.warningBorder}` }}>
                        {t("orders:details.itemBadges.preorder")}
                      </span>
                    )}
                    {item.wrap && (
                      <span style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}>
                        {Number(item.wrapFee) > 0
                          ? t("orders:details.itemBadges.wrapWithFee", { fee: formatCurrency(item.wrapFee) })
                          : t("orders:details.itemBadges.wrap")}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '13px', color: colors.textSecondary }}>
                    <div>{item.quantity} {item.unit}</div>
                    {item.purchaseMode === 'amount' && item.requestedAmountIls != null && (
                      <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                        {t("orders:details.requestedAmount", { value: formatCurrency(item.requestedAmountIls) })}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '13px', color: colors.textSecondary }}>
                    {formatCurrency(item.price)}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                    {formatCurrency(
                      typeof item.lineTotal === 'number'
                        ? item.lineTotal
                        : Number(item.price) * Number(item.quantity)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px', marginInlineStart: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.textSecondary }}>
              <span>{t("orders:details.totals.subtotal")}</span><span>{totals?.subtotal}</span>
            </div>
            {Number(order.wrapTotal) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.success }}>
                <span>{t("orders:details.totals.wrapFees")}</span><span>{totals?.wrapTotal}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.textSecondary }}>
              <span>{t("orders:details.totals.deliveryFee")}</span><span>{totals?.deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: colors.textPrimary, paddingTop: '10px', borderTop: `1px solid ${colors.border}`, marginTop: '4px' }}>
              <span>{t("orders:details.totals.total")}</span><span>{totals?.total}</span>
            </div>
          </div>
        </Card>

        {/* Delivery */}
        <Card>
          <CardTitle>{t("orders:details.cards.delivery")}</CardTitle>
          <InfoRow label={t("orders:details.delivery.area")}>{resolveAdminDeliveryAreaLabel(order, deliveryAreaCatalog?.areas)}</InfoRow>
          {deliveryAddress && <InfoRow label={t("orders:details.delivery.address")}>{deliveryAddress}</InfoRow>}
          {order.deliveryAddress?.label && <InfoRow label={t("orders:details.delivery.addressLabel")}>{order.deliveryAddress.label}</InfoRow>}
          {order.preferredDeliveryAt && (
            <InfoRow label={t("orders:details.delivery.preferredDelivery")}>{formatDate(order.preferredDeliveryAt)}</InfoRow>
          )}
        </Card>

        {/* Payment & status management */}
        <Card>
          <CardTitle>{t("orders:details.cards.paymentStatus")}</CardTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Order status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}>{t("orders:details.payment.orderStatus")}</div>
              <Pill value={order.orderStatus} palette={ORDER_STATUS_STYLES} />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <select
                  value={nextOrderStatus}
                  onChange={(e) => setNextOrderStatus(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{formatAdminOrderStatusLabel(s)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleOrderStatusUpdate}
                  disabled={updating || nextOrderStatus === order.orderStatus}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    background: (updating || nextOrderStatus === order.orderStatus) ? colors.border : colors.primary,
                    color: (updating || nextOrderStatus === order.orderStatus) ? colors.textMuted : colors.textInverse,
                    fontSize: '13px', fontWeight: 600, cursor: (updating || nextOrderStatus === order.orderStatus) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap', fontFamily: 'inherit',
                  }}
                >
                  {t("orders:details.payment.update")}
                </button>
              </div>
            </div>

            {/* Payment status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}>{t("orders:details.payment.paymentStatus")}</div>
              <Pill value={order.paymentStatus} palette={PAYMENT_STATUS_STYLES} kind="payment" />
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                {t("orders:details.payment.methodPrefix")} {order.paymentMethod || '—'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <select
                  value={nextPaymentStatus}
                  onChange={(e) => setNextPaymentStatus(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  {[order.paymentStatus, ...PAYMENT_STATUS_OPTIONS]
                    .filter((v, i, arr) => v && arr.indexOf(v) === i)
                    .map((s) => (
                      <option key={s} value={s}>{formatAdminPaymentStatusLabel(s)}</option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handlePaymentStatusUpdate}
                  disabled={updating || nextPaymentStatus === order.paymentStatus}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    background: (updating || nextPaymentStatus === order.paymentStatus) ? colors.border : colors.primary,
                    color: (updating || nextPaymentStatus === order.paymentStatus) ? colors.textMuted : colors.textInverse,
                    fontSize: '13px', fontWeight: 600, cursor: (updating || nextPaymentStatus === order.paymentStatus) ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap', fontFamily: 'inherit',
                  }}
                >
                  {t("orders:details.payment.update")}
                </button>
              </div>
            </div>
          </div>

          {order.paymentMethod === "bank_transfer" && order.bankTransferProofUrl && (
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${colors.borderLight}` }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.textSecondary, marginBottom: "10px" }}>
                {t("orders:details.payment.bankProofTitle")}
              </div>
              <a href={order.bankTransferProofUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", maxWidth: "100%" }}>
                <img
                  src={order.bankTransferProofUrl}
                  alt={t("orders:details.payment.bankProofAlt")}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "360px",
                    borderRadius: "10px",
                    border: `1px solid ${colors.border}`,
                    objectFit: "contain",
                    background: colors.bg
                  }}
                />
              </a>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminOrderDetailsPage;
