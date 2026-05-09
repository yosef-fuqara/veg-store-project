import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../services/orderService";

const colors = {
  primary:      '#1e6b3c',
  bg:           '#faf8f5',
  surface:      '#ffffff',
  border:       '#e8e3dc',
  borderLight:  '#f0ece6',
  textPrimary:  '#1c1917',
  textSecondary:'#57534e',
  textMuted:    '#a8a29e',
  error:        '#991b1b',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
};

const ORDER_STATUS_OPTIONS = ['all', 'new', 'confirmed', 'preparing', 'ready_for_delivery', 'sent_with_delivery_company', 'delivered', 'cancelled'];

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
  pending_payment:       { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  paid:                  { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  failed:                { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  cancelled:             { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  bank_transfer_pending: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  bank_transfer_approved:{ bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
};

const Pill = ({ value, palette }) => {
  const s = palette[value] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  const label = String(value || '—').replaceAll('_', ' ');
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'capitalize',
    }}>
      {label}
    </span>
  );
};

const formatCurrency = (v) => {
  if (typeof v !== 'number') return '—';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(v);
};

const formatDate = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('en-IL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const customerText = (order) => {
  const u = order?.user;
  if (!u) return '—';
  return u.name || u.email || u.phone || '—';
};

const shortId = (id) => String(id || '').slice(-6).toUpperCase();

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter === 'all' ? {} : { orderStatus: statusFilter };
      setOrders(await getAdminOrders(query));
    } catch (err) {
      setError(err.userMessage || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = orders.filter((order) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      String(order._id || '').toLowerCase().includes(q) ||
      customerText(order).toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '10px',
            border: `1px solid ${colors.border}`, background: colors.surface,
            color: colors.textPrimary, fontSize: '13px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
        <div style={{ textAlign: 'end' }}>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
            Orders
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.textMuted }}>
            Monitor and process customer orders
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button type="button" onClick={load} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${colors.errorBorder}`, background: 'transparent', color: colors.error, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {/* Table card */}
      <div style={{ background: colors.surface, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Toolbar */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.borderLight}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Filter */}
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                border: `1px solid ${colors.border}`, background: colors.surface,
                color: colors.textPrimary, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filter
              {statusFilter !== 'all' && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.primary, display: 'inline-block' }} />
              )}
            </button>
            {filterOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, zIndex: 20,
                background: colors.surface, borderRadius: '10px', border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: '200px',
              }}>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { setStatusFilter(opt); setFilterOpen(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'start',
                      padding: '9px 14px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: statusFilter === opt ? 600 : 400,
                      background: statusFilter === opt ? colors.bg : 'transparent',
                      color: statusFilter === opt ? colors.primary : colors.textPrimary,
                    }}
                  >
                    {opt === 'all' ? 'All statuses' : opt.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', insetInlineStart: '11px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="...Search order number or customer"
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingInlineStart: '34px', paddingInlineEnd: '12px',
                paddingTop: '7px', paddingBottom: '7px',
                borderRadius: '8px', border: `1px solid ${colors.border}`,
                background: colors.surface, fontSize: '13px', color: colors.textPrimary, outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '14px' }}>
            Loading orders...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '14px' }}>
            No orders found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Actions', 'Status', 'Payment', 'Total', 'Date', 'Customer', '# Order'].map((h) => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'start',
                    fontSize: '12px', fontWeight: 600, color: colors.textSecondary,
                    background: colors.bg, borderBottom: `1px solid ${colors.border}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order._id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <Link
                      to={`/orders/${order._id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '5px 12px', borderRadius: '7px',
                        border: `1px solid ${colors.border}`, background: colors.surface,
                        fontSize: '12px', fontWeight: 500, color: colors.textPrimary, textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      View
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  </td>

                  {/* Order Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <Pill value={order.orderStatus} palette={ORDER_STATUS_STYLES} />
                  </td>

                  {/* Payment */}
                  <td style={{ padding: '12px 16px' }}>
                    <Pill value={order.paymentStatus} palette={PAYMENT_STATUS_STYLES} />
                  </td>

                  {/* Total */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
                      {formatCurrency(order.total)}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                      {formatDate(order.createdAt)}
                    </span>
                  </td>

                  {/* Customer */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '13px', color: colors.textPrimary }}>
                      {customerText(order)}
                    </span>
                  </td>

                  {/* Order # */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <Link
                        to={`/orders/${order._id}`}
                        style={{ fontSize: '13px', fontWeight: 600, color: colors.primary, textDecoration: 'none', fontFamily: 'monospace' }}
                      >
                        #{shortId(order._id)}
                      </Link>
                      {order.hasPreorderItems && (
                        <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: '9999px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontSize: '10px', fontWeight: 600 }}>
                          Preorder
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
