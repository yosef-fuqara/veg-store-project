import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAdminOrders } from "../services/orderService";
import { formatAdminOrderStatusLabel, formatAdminPaymentStatusLabel } from "../utils/adminOrderStatusLabel";
import { useAdminLanguage } from "../i18n/useAdminLanguage";

const colors = {
  primary:      '#1e6b3c',
  primaryHover: '#165430',
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

const ORDER_STATUS_OPTIONS = ['all', 'new', 'confirmed', 'sent_with_delivery_company', 'delivered', 'cancelled'];

const ORDER_STATUS_STYLES = {
  new:                       { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  confirmed:                 { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
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

const Pill = ({ value, palette, kind = "order" }) => {
  const s = palette[value] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
  const label = kind === "payment" ? formatAdminPaymentStatusLabel(value) : formatAdminOrderStatusLabel(value);
  const textTransform = /[\u0590-\u05FF]/.test(label) ? 'none' : 'capitalize';
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', textTransform,
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

const interactiveBtn = {
  transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s',
};

/** LTR: anchor id left, actions right. RTL: actions on the inline-start (right) side. */
const ORDER_TABLE_COLS_LTR = ["orderId", "customer", "date", "total", "payment", "status", "actions"];
const ORDER_TABLE_COLS_RTL = ["actions", "status", "payment", "total", "date", "customer", "orderId"];

const ORDER_COL_HEADER_KEY = {
  orderId: "orders:list.tableHeaders.orderNumber",
  customer: "orders:list.tableHeaders.customer",
  date: "orders:list.tableHeaders.date",
  total: "orders:list.tableHeaders.total",
  payment: "orders:list.tableHeaders.payment",
  status: "orders:list.tableHeaders.status",
  actions: "orders:list.tableHeaders.actions"
};

const AdminOrdersPage = () => {
  const { t } = useTranslation(["orders", "common"]);
  const { isRtl } = useAdminLanguage();
  const orderTableCols = isRtl ? ORDER_TABLE_COLS_RTL : ORDER_TABLE_COLS_LTR;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [hoverRowId, setHoverRowId] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const filterRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = statusFilter === 'all' ? {} : { orderStatus: statusFilter };
      setOrders(await getAdminOrders(query));
    } catch (err) {
      setError(err.userMessage || t('orders:list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

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

  const searchInputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    paddingInlineStart: '34px',
    paddingInlineEnd: '12px',
    paddingTop: '8px',
    paddingBottom: '8px',
    borderRadius: '10px',
    border: `1.5px solid ${searchFocused ? colors.primary : colors.border}`,
    background: colors.surface,
    fontSize: '14px',
    color: colors.textPrimary,
    outline: 'none',
    boxShadow: searchFocused ? '0 0 0 3px rgba(30,107,60,0.12)' : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <style>{`
        @keyframes adminOrdersSkeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes adminOrdersSpin {
          to { transform: rotate(360deg); }
        }
        .admin-orders-skel { animation: adminOrdersSkeletonPulse 1.4s ease-in-out infinite; }
        .admin-orders-filter-btn:focus-visible,
        .admin-orders-refresh:focus-visible,
        .admin-orders-view:focus-visible,
        .admin-orders-retry:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .admin-orders-dd-item:hover { background: ${colors.bg}; }
        .admin-orders-dd-item:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: -2px; }
      `}</style>

      {/* Page header — order children so title sits at reading-start under both LTR and RTL */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {isRtl ? (
          <>
            <div style={{ textAlign: 'start', flex: '1 1 200px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
                {t('orders:list.pageTitle')}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.5 }}>
                {t('orders:list.pageSubtitle')}
              </p>
            </div>
            <button
              type="button"
              className="admin-orders-refresh"
              onClick={load}
              disabled={loading}
              aria-label={loading ? t('orders:list.refreshingAria') : t('orders:list.refreshAria')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.textPrimary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                ...interactiveBtn,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={loading ? { animation: 'adminOrdersSpin 0.9s linear infinite' } : undefined}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {loading ? t('orders:list.refreshing') : t('orders:list.refresh')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="admin-orders-refresh"
              onClick={load}
              disabled={loading}
              aria-label={loading ? t('orders:list.refreshingAria') : t('orders:list.refreshAria')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: colors.textPrimary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                ...interactiveBtn,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={loading ? { animation: 'adminOrdersSpin 0.9s linear infinite' } : undefined}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              {loading ? t('orders:list.refreshing') : t('orders:list.refresh')}
            </button>
            <div style={{ textAlign: 'end', flex: '1 1 200px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
                {t('orders:list.pageTitle')}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.5 }}>
                {t('orders:list.pageSubtitle')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ minWidth: 0 }}>{error}</span>
          <button type="button" onClick={load} className="admin-orders-retry" style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.errorBorder}`, background: 'transparent', color: colors.error, cursor: 'pointer', fontSize: '12px', fontWeight: 600, ...interactiveBtn }}>
            {t('common:retry')}
          </button>
        </div>
      )}

      {/* Table card */}
      <div style={{ background: colors.surface, borderRadius: '14px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', maxWidth: '100%' }}>

        {/* Toolbar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${colors.borderLight}`,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
        }}>
          {/* Filter */}
          <div style={{ position: 'relative', flexShrink: 0 }} ref={filterRef}>
            <button
              type="button"
              className="admin-orders-filter-btn"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${filterOpen ? colors.primary : colors.border}`,
                background: filterOpen ? colors.bg : colors.surface,
                color: colors.textPrimary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                ...interactiveBtn,
              }}
              onMouseEnter={(e) => { if (!filterOpen) e.currentTarget.style.background = colors.bg; }}
              onMouseLeave={(e) => { if (!filterOpen) e.currentTarget.style.background = colors.surface; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {t('common:filter')}
              {statusFilter !== 'all' && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.primary, display: 'inline-block' }} />
              )}
            </button>
            {filterOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                insetInlineStart: 0,
                zIndex: 20,
                background: colors.surface,
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                minWidth: '220px',
                maxWidth: 'min(320px, calc(100vw - 48px))',
                maxHeight: 'min(320px, 50vh)',
                overflowY: 'auto',
              }}>
                {ORDER_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="admin-orders-dd-item"
                    onClick={() => { setStatusFilter(opt); setFilterOpen(false); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'start',
                      padding: '10px 16px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: statusFilter === opt ? 600 : 400,
                      background: statusFilter === opt ? colors.bg : 'transparent',
                      color: statusFilter === opt ? colors.primary : colors.textPrimary,
                      transition: 'background 0.12s',
                    }}
                  >
                    {opt === 'all' ? t('common:allStatuses') : formatAdminOrderStatusLabel(opt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', insetInlineStart: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('orders:list.searchPlaceholder')}
              aria-label={t('orders:list.searchAria')}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={searchInputStyle}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '8px 0 16px' }} aria-busy="true" aria-live="polite">
            <div style={{ padding: '12px 20px 8px', fontSize: '12px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t('common:loadingDots')}
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse' }}>
                <tbody>
                  {Array.from({ length: 6 }).map((_, r) => (
                    <tr key={r} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      {Array.from({ length: 7 }).map((__, c) => (
                        <td key={c} style={{ padding: '14px 16px' }}>
                          <div
                            className="admin-orders-skel"
                            style={{
                              height: 14,
                              width: c === 0 ? '48%' : c === 6 ? '56%' : '64%',
                              maxWidth: '100%',
                              background: colors.borderLight,
                              borderRadius: '6px',
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: colors.textMuted }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: colors.bg,
              border: `1px solid ${colors.borderLight}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
              {t('orders:list.empty.title')}
            </div>
            <div style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
              {search || statusFilter !== 'all'
                ? t('orders:list.empty.withSearch')
                : t('orders:list.empty.withoutSearch')}
            </div>
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%',
            }}
          >
            <table dir={isRtl ? "rtl" : "ltr"} style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {orderTableCols.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'start',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: colors.textSecondary,
                        background: colors.bg,
                        borderBottom: `1px solid ${colors.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t(ORDER_COL_HEADER_KEY[col])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order._id}
                    style={{
                      borderBottom: `1px solid ${colors.borderLight}`,
                      background: hoverRowId === order._id ? colors.bg : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={() => setHoverRowId(order._id)}
                    onMouseLeave={() => setHoverRowId('')}
                  >
                    {orderTableCols.map((col) => {
                      if (col === 'actions') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <Link
                              to={`/orders/${order._id}`}
                              className="admin-orders-view"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: `1px solid ${colors.border}`,
                                background: colors.surface,
                                fontSize: '12px',
                                fontWeight: 500,
                                color: colors.textPrimary,
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                                ...interactiveBtn,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.borderColor = colors.primary; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; e.currentTarget.style.borderColor = colors.border; }}
                            >
                              {t('orders:list.view')}
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRtl ? 'scaleX(-1)' : undefined }} aria-hidden>
                                <polyline points="9 18 15 12 9 6"/>
                              </svg>
                            </Link>
                          </td>
                        );
                      }
                      if (col === 'status') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <Pill value={order.orderStatus} palette={ORDER_STATUS_STYLES} />
                          </td>
                        );
                      }
                      if (col === 'payment') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <Pill value={order.paymentStatus} palette={PAYMENT_STATUS_STYLES} kind="payment" />
                          </td>
                        );
                      }
                      if (col === 'total') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
                              {formatCurrency(order.total)}
                            </span>
                          </td>
                        );
                      }
                      if (col === 'date') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                              {formatDate(order.createdAt)}
                            </span>
                          </td>
                        );
                      }
                      if (col === 'customer') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', maxWidth: '200px', verticalAlign: 'middle' }}>
                            <span style={{ fontSize: '13px', color: colors.textPrimary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={customerText(order)}>
                              {customerText(order)}
                            </span>
                          </td>
                        );
                      }
                      if (col === 'orderId') {
                        return (
                          <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <Link
                                to={`/orders/${order._id}`}
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: colors.primary,
                                  textDecoration: 'none',
                                  fontFamily: 'ui-monospace, monospace',
                                  borderRadius: '6px',
                                  padding: '2px 4px',
                                  transition: 'background 0.12s, color 0.12s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; e.currentTarget.style.color = colors.primaryHover; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.primary; }}
                              >
                                #{shortId(order._id)}
                              </Link>
                              {order.hasPreorderItems && (
                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '9999px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontSize: '10px', fontWeight: 600 }}>
                                  {t('orders:list.preorder')}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }
                      return null;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Result count footer */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${colors.borderLight}`,
            fontSize: '12px',
            color: colors.textMuted,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center',
          }}>
            {t('orders:list.footer', { count: filtered.length })}
            {statusFilter !== 'all' && ` · ${formatAdminOrderStatusLabel(statusFilter)}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
