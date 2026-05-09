import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteProduct, getAdminProducts, setProductFrozen } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";

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
  textInverse:  '#ffffff',
  error:        '#991b1b',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
};

const STATUS_STYLES = {
  active:   { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', label: 'Active' },
  inactive: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'Inactive' },
  frozen:   { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd', label: 'Frozen' },
  deleted:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Deleted' },
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(value);
};

const pickLocalizedName = (name) => {
  if (!name) return '—';
  if (typeof name === 'string') return name;
  return name.en || name.he || name.ar || '—';
};

const pickSubtitle = (name) => {
  if (!name || typeof name === 'string') return '';
  return [name.he, name.ar].filter(Boolean).join(' | ');
};

const getProductState = (p) => {
  if (p.isDeleted) return 'deleted';
  if (p.isFrozen) return 'frozen';
  if (p.isActive) return 'active';
  return 'inactive';
};

const Pill = ({ bg, color, border, children }) => (
  <span style={{
    display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
    background: bg, color, border: `1px solid ${border}`,
    fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

const FILTER_OPTIONS = ['all', 'active', 'inactive', 'frozen', 'deleted'];

const interactiveBtn = {
  transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s',
};

const AdminProductsPage = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState('');
  const [hoverRowId, setHoverRowId] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const filterRef = useRef(null);
  const menuRef = useRef(null);
  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getAdminProducts());
    } catch (err) {
      setError(err.userMessage || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId('');
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== 'all' && getProductState(p) !== statusFilter) return false;
      if (!q) return true;
      const name = pickLocalizedName(p.name).toLowerCase();
      return name.includes(q) || String(p.sku || '').toLowerCase().includes(q);
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((safePage - 1) * pageSize, safePage * pageSize), [filtered, safePage]);

  const handleToggleFreeze = async (product) => {
    setBusyId(product._id);
    setMenuId('');
    try {
      await setProductFrozen(product._id, !product.isFrozen);
      showToast(product.isFrozen ? 'Product unfrozen.' : 'Product frozen.');
      await load();
    } catch (err) {
      showToast(err.userMessage || 'Action failed', 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${pickLocalizedName(product.name)}"?`)) return;
    setBusyId(product._id);
    setMenuId('');
    try {
      await deleteProduct(product._id);
      showToast('Product deleted.');
      await load();
    } catch (err) {
      showToast(err.userMessage || 'Delete failed', 'error');
    } finally {
      setBusyId('');
    }
  };

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
        @keyframes adminProductsSkeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes adminProductsSpin {
          to { transform: rotate(360deg); }
        }
        .admin-products-skel { animation: adminProductsSkeletonPulse 1.4s ease-in-out infinite; }
        .admin-products-filter-btn:focus-visible,
        .admin-products-add:focus-visible,
        .admin-products-menu:focus-visible,
        .admin-products-page:focus-visible,
        .admin-products-retry:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .admin-products-dd-item:hover { background: ${colors.bg}; }
        .admin-products-dd-item:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: -2px; }
        .admin-products-dd-item-danger:hover { background: ${colors.errorBg}; }
      `}</style>

      {/* Page header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <Link
          to="/products/new"
          className="admin-products-add"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '10px',
            background: colors.primary,
            color: colors.textInverse,
            fontSize: '14px',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(30,107,60,0.30)',
            ...interactiveBtn,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryHover; e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,107,60,0.32)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.boxShadow = '0 2px 8px rgba(30,107,60,0.25)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </Link>
        <div style={{ textAlign: 'end', flex: '1 1 200px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
            Products
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.5 }}>
            Manage your fruit and vegetable inventory
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ minWidth: 0 }}>{error}</span>
          <button type="button" onClick={load} className="admin-products-retry" style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.errorBorder}`, background: 'transparent', color: colors.error, cursor: 'pointer', fontSize: '12px', fontWeight: 600, ...interactiveBtn }}>
            Retry
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
              className="admin-products-filter-btn"
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
              Filter
              {statusFilter !== 'all' && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.primary, display: 'inline-block', marginInlineStart: '2px' }} />
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
                minWidth: '160px',
                maxWidth: 'min(280px, calc(100vw - 48px))',
              }}>
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="admin-products-dd-item"
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
                    {opt === 'all' ? 'All statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
              placeholder="Search products…"
              aria-label="Search products"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={searchInputStyle}
            />
          </div>
        </div>

        {/* Table content */}
        {loading ? (
          <div style={{ padding: '8px 0 16px' }} aria-busy="true" aria-live="polite">
            <div style={{ padding: '12px 20px 8px', fontSize: '12px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Loading
            </div>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse' }}>
                <tbody>
                  {Array.from({ length: 6 }).map((_, r) => (
                    <tr key={r} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      {Array.from({ length: 7 }).map((__, c) => (
                        <td key={c} style={{ padding: '14px 16px' }}>
                          <div
                            className="admin-products-skel"
                            style={{
                              height: c === 6 ? 40 : 14,
                              width: c === 6 ? 40 : c === 0 ? '32%' : '72%',
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
        ) : paged.length === 0 ? (
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
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, marginBottom: '6px' }}>
              No products found
            </div>
            <div style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'Add your first product to get started.'}
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
            <table style={{ width: '100%', minWidth: '880px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Actions', 'Status', 'Stock', 'Price', 'Category', 'Product Name', 'Image'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'start',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.textSecondary,
                      background: colors.bg,
                      borderBottom: `1px solid ${colors.border}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((product) => {
                  const name = pickLocalizedName(product.name);
                  const subtitle = pickSubtitle(product.name);
                  const state = getProductState(product);
                  const stateStyle = STATUS_STYLES[state] || STATUS_STYLES.inactive;
                  const inStock = product.stockStatus === 'in_stock';
                  const category = product.category?.name ?? (typeof product.category === 'string' ? product.category : '');
                  const price = typeof product.price === 'number' ? product.price : null;
                  const salePrice = typeof product.salePrice === 'number' ? product.salePrice : null;
                  const isBusy = busyId === product._id;
                  const rowHover = hoverRowId === product._id;

                  return (
                    <tr
                      key={product._id}
                      style={{
                        borderBottom: `1px solid ${colors.borderLight}`,
                        background: rowHover ? colors.bg : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={() => setHoverRowId(product._id)}
                      onMouseLeave={() => setHoverRowId('')}
                    >

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', position: 'relative', verticalAlign: 'middle' }}>
                        <div ref={menuId === product._id ? menuRef : null} style={{ display: 'inline-block' }}>
                          <button
                            type="button"
                            className="admin-products-menu"
                            onClick={() => setMenuId(menuId === product._id ? '' : product._id)}
                            disabled={isBusy}
                            aria-expanded={menuId === product._id}
                            aria-haspopup="true"
                            aria-label={isBusy ? 'Working…' : `Actions for ${name}`}
                            style={{
                              background: menuId === product._id ? colors.borderLight : 'none',
                              border: 'none',
                              cursor: isBusy ? 'not-allowed' : 'pointer',
                              fontSize: '20px',
                              color: menuId === product._id ? colors.textPrimary : colors.textMuted,
                              padding: '4px 8px',
                              borderRadius: '8px',
                              lineHeight: 1,
                              opacity: isBusy ? 0.5 : 1,
                              transition: 'background 0.15s, color 0.15s, opacity 0.15s',
                            }}
                            onMouseEnter={(e) => { if (!isBusy && menuId !== product._id) { e.currentTarget.style.background = colors.borderLight; e.currentTarget.style.color = colors.textPrimary; } }}
                            onMouseLeave={(e) => { if (menuId !== product._id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textMuted; } }}
                          >
                            {isBusy ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ animation: 'adminProductsSpin 0.9s linear infinite', display: 'block' }}>
                                <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                              </svg>
                            ) : '⋮'}
                          </button>
                          {menuId === product._id && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              insetInlineStart: 0,
                              zIndex: 20,
                              background: colors.surface,
                              borderRadius: '10px',
                              border: `1px solid ${colors.border}`,
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              overflow: 'hidden',
                              minWidth: '160px',
                              maxWidth: 'min(260px, calc(100vw - 48px))',
                            }}>
                              <Link
                                to={`/products/${product._id}/edit`}
                                onClick={() => setMenuId('')}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '10px 16px',
                                  fontSize: '13px',
                                  color: colors.textPrimary,
                                  textDecoration: 'none',
                                  transition: 'background 0.12s',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
                              </Link>
                              {!product.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleFreeze(product)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '13px',
                                    color: colors.textPrimary,
                                    cursor: 'pointer',
                                    textAlign: 'start',
                                    transition: 'background 0.12s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                  {product.isFrozen ? 'Unfreeze' : 'Freeze'}
                                </button>
                              )}
                              {!product.isDeleted && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(product)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '10px 16px',
                                    border: 'none',
                                    background: 'none',
                                    fontSize: '13px',
                                    color: colors.error,
                                    cursor: 'pointer',
                                    textAlign: 'start',
                                    transition: 'background 0.12s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.errorBg; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <Pill bg={stateStyle.bg} color={stateStyle.color} border={stateStyle.border}>
                          {stateStyle.label}
                        </Pill>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <Pill
                          bg={inStock ? '#dcfce7' : '#fef2f2'}
                          color={inStock ? '#166534' : '#991b1b'}
                          border={inStock ? '#bbf7d0' : '#fecaca'}
                        >
                          {inStock ? 'In Stock' : 'Out of Stock'}
                        </Pill>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        {price !== null ? (
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: colors.primary }}>
                              {formatCurrency(price)}
                            </div>
                            {salePrice !== null && salePrice < price && (
                              <div style={{ fontSize: '12px', color: colors.error, textDecoration: 'line-through' }}>
                                {formatCurrency(salePrice)}
                              </div>
                            )}
                            {product.unit && (
                              <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                                Per {product.unit}
                              </div>
                            )}
                          </div>
                        ) : '—'}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', maxWidth: '160px' }}>
                        {category ? (
                          <Pill bg={colors.bg} color={colors.textSecondary} border={colors.border}>
                            <span style={{ display: 'inline-block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>{category}</span>
                          </Pill>
                        ) : <span style={{ color: colors.textMuted, fontSize: '13px' }}>—</span>}
                      </td>

                      {/* Product Name */}
                      <td style={{ padding: '12px 16px', maxWidth: '220px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, wordBreak: 'break-word' }}>{name}</div>
                        {subtitle && (
                          <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px', wordBreak: 'break-word' }}>{subtitle}</div>
                        )}
                      </td>

                      {/* Image */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={name}
                            style={{
                              width: '52px',
                              height: '52px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              display: 'block',
                              border: `1px solid ${colors.border}`,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '10px',
                            background: '#eef7f1',
                            border: `1px solid ${colors.borderLight}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}>
                            🥬
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div style={{
            padding: '14px 20px',
            borderTop: `1px solid ${colors.borderLight}`,
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '12px', color: colors.textMuted, fontVariantNumeric: 'tabular-nums' }}>
              {(() => {
                const start = (safePage - 1) * pageSize + 1;
                const end = Math.min(safePage * pageSize, filtered.length);
                return `Showing ${start}–${end} of ${filtered.length}`;
              })()}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="admin-products-page"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: safePage === 1 ? colors.textMuted : colors.textPrimary,
                cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                ...interactiveBtn,
              }}
              onMouseEnter={(e) => { if (safePage !== 1) e.currentTarget.style.background = colors.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
            >
              ←
            </button>
            <span style={{ fontSize: '13px', color: colors.textSecondary, fontVariantNumeric: 'tabular-nums', minWidth: '52px', textAlign: 'center' }}>
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              className="admin-products-page"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1px solid ${colors.border}`,
                background: colors.surface,
                color: safePage >= totalPages ? colors.textMuted : colors.textPrimary,
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                ...interactiveBtn,
              }}
              onMouseEnter={(e) => { if (safePage < totalPages) e.currentTarget.style.background = colors.bg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
            >
              →
            </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
