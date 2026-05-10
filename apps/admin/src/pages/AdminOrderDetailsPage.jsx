import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useToast } from "../features/toast/ToastContext";
import {
  getAdminOrderById,
  getDeliveryAreas,
  updateAdminOrderPaymentStatus,
  updateAdminOrderStatus
} from "../services/orderService";
import { getLocalizedText } from "../utils/localizedDisplayName";
import { resolveAdminDeliveryAreaLabel } from "../utils/deliveryAreaLabel";

const ORDER_STATUS_OPTIONS = [
  "new", "confirmed", "preparing", "ready_for_delivery",
  "sent_with_delivery_company", "delivered", "cancelled"
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
  preparing:                 { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
  ready_for_delivery:        { bg: '#ecfccb', color: '#3f6212', border: '#bef264' },
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

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const Pill = ({ value, palette }) => {
  const s = palette[value] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 12px', borderRadius: '9999px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
      textTransform: 'capitalize',
    }}>
      {String(value || '—').replaceAll('_', ' ')}
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
      setError(err.userMessage || "Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    if (!order) return null;
    return {
      subtotal: formatCurrency(order.subtotal),
      wrapTotal: formatCurrency(order.wrapTotal || 0),
      deliveryFee: formatCurrency(order.deliveryFee),
      total: formatCurrency(order.total),
    };
  }, [order]);

  const handleOrderStatusUpdate = async () => {
    if (!order || !nextOrderStatus || nextOrderStatus === order.orderStatus) return;
    setUpdating(true);
    try {
      const updated = await updateAdminOrderStatus(order._id, nextOrderStatus);
      setOrder(updated);
      setNextOrderStatus(updated.orderStatus || "");
      showToast("Order status updated.");
    } catch (err) {
      const msg = err.userMessage || "Failed to update order status";
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
      showToast("Payment status updated.");
    } catch (err) {
      const msg = err.userMessage || "Failed to update payment status";
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
          Retry
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ color: colors.textMuted, fontSize: '14px' }}>Order not found.</div>
    );
  }

  const deliveryAddress = [
    order.deliveryAddress?.city,
    order.deliveryAddress?.street,
    order.deliveryAddress?.building && `No. ${order.deliveryAddress.building}`,
    order.deliveryAddress?.apartment && `Apt ${order.deliveryAddress.apartment}`,
    order.deliveryAddress?.notes,
  ].filter(Boolean).join(', ');

  return (
    <div style={{ maxWidth: '840px' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.3px' }}>
            Order Details
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
            Refresh
          </button>
          <Link
            to="/orders"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textPrimary, fontSize: '13px', fontWeight: 500, textDecoration: 'none' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            All Orders
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
            Preorder
          </span>
          <span style={{ fontSize: '14px', color: colors.warning }}>
            Contains items requiring advance preparation.
          </span>
          {order.preferredDeliveryAt && (
            <span style={{ fontSize: '13px', color: colors.warning, fontWeight: 500 }}>
              Preferred: {formatDate(order.preferredDeliveryAt)}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>

        {/* Customer info */}
        <Card>
          <CardTitle>Customer</CardTitle>
          <InfoRow label="Name">{order.user?.name || '—'}</InfoRow>
          <InfoRow label="Email">{order.user?.email || '—'}</InfoRow>
          <InfoRow label="Phone">{order.user?.phone || order.customerPhone || '—'}</InfoRow>
          <InfoRow label="Order placed">{formatDate(order.createdAt)}</InfoRow>
          <InfoRow label="Last updated">{formatDate(order.updatedAt)}</InfoRow>
          {order.notes && <InfoRow label="Customer notes">{order.notes}</InfoRow>}
          {order.customRequest && <InfoRow label="Custom request">{order.customRequest}</InfoRow>}
        </Card>

        {/* Items */}
        <Card>
          <CardTitle>Items</CardTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Product', 'Qty', 'Unit Price', 'Line Total'].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'start', fontSize: '12px', fontWeight: 600, color: colors.textSecondary, background: colors.bg, borderBottom: `1px solid ${colors.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, idx) => (
                <tr key={`${item.product || getLocalizedText(item.name, "en")}-${idx}`} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                  <td style={{ padding: '10px 10px', fontSize: '14px', color: colors.textPrimary }}>
                    <span>{getLocalizedText(item.name, "en")}</span>
                    {item.isPreorderOnly && (
                      <span style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: colors.warningBg, color: colors.warning, border: `1px solid ${colors.warningBorder}` }}>
                        Preorder
                      </span>
                    )}
                    {item.wrap && (
                      <span style={{ marginInlineStart: '6px', padding: '1px 6px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600, background: colors.successBg, color: colors.success, border: `1px solid ${colors.successBorder}` }}>
                        Wrap{Number(item.wrapFee) > 0 ? ` (+${formatCurrency(item.wrapFee)})` : ''}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '13px', color: colors.textSecondary }}>
                    {item.quantity} {item.unit}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '13px', color: colors.textSecondary }}>
                    {formatCurrency(item.price)}
                  </td>
                  <td style={{ padding: '10px 10px', fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '280px', marginInlineStart: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.textSecondary }}>
              <span>Subtotal</span><span>{totals?.subtotal}</span>
            </div>
            {Number(order.wrapTotal) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.success }}>
                <span>Wrap fees</span><span>{totals?.wrapTotal}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.textSecondary }}>
              <span>Delivery fee</span><span>{totals?.deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: colors.textPrimary, paddingTop: '10px', borderTop: `1px solid ${colors.border}`, marginTop: '4px' }}>
              <span>Total</span><span>{totals?.total}</span>
            </div>
          </div>
        </Card>

        {/* Delivery */}
        <Card>
          <CardTitle>Delivery</CardTitle>
          <InfoRow label="Area">{resolveAdminDeliveryAreaLabel(order, deliveryAreaCatalog?.areas)}</InfoRow>
          {deliveryAddress && <InfoRow label="Address">{deliveryAddress}</InfoRow>}
          {order.deliveryAddress?.label && <InfoRow label="Address label">{order.deliveryAddress.label}</InfoRow>}
          {order.preferredDeliveryAt && (
            <InfoRow label="Preferred delivery">{formatDate(order.preferredDeliveryAt)}</InfoRow>
          )}
        </Card>

        {/* Payment & status management */}
        <Card>
          <CardTitle>Payment & Status</CardTitle>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Order status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}>Order Status</div>
              <Pill value={order.orderStatus} palette={ORDER_STATUS_STYLES} />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <select
                  value={nextOrderStatus}
                  onChange={(e) => setNextOrderStatus(e.target.value)}
                  style={{ ...selectStyle, flex: 1 }}
                >
                  {ORDER_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
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
                  Update
                </button>
              </div>
            </div>

            {/* Payment status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: colors.textSecondary }}>Payment Status</div>
              <Pill value={order.paymentStatus} palette={PAYMENT_STATUS_STYLES} />
              <div style={{ fontSize: '12px', color: colors.textMuted }}>
                Method: {order.paymentMethod || '—'}
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
                      <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>
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
                  Update
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrderDetailsPage;
