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

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <Link
          to="/products/new"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '10px',
            background: colors.primary, color: colors.textInverse,
            fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(30,107,60,0.25)',
          }}
        >
          Add Product +
        </Link>
        <div style={{ textAlign: 'end' }}>
          <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
            Products
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.textMuted }}>
            Manage your fruit and vegetable inventory
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{error}</span>
          <button type="button" onClick={load} style={{ marginInlineStart: '12px', padding: '4px 10px', borderRadius: '6px', border: `1px solid ${colors.errorBorder}`, background: 'transparent', color: colors.error, cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
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
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.primary, display: 'inline-block', marginInlineStart: '2px' }} />
              )}
            </button>
            {filterOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, zIndex: 20,
                background: colors.surface, borderRadius: '10px', border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: '148px',
              }}>
                {FILTER_OPTIONS.map((opt) => (
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
                    {opt === 'all' ? 'All statuses' : opt.charAt(0).toUpperCase() + opt.slice(1)}
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
              placeholder="...Search products"
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

        {/* Table content */}
        {loading ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '14px' }}>
            Loading products...
          </div>
        ) : paged.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: colors.textMuted, fontSize: '14px' }}>
            No matching products found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Actions', 'Status', 'Stock', 'Price', 'Category', 'Product Name', 'Image'].map((h) => (
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

                return (
                  <tr key={product._id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', position: 'relative' }}>
                      <div ref={menuId === product._id ? menuRef : null} style={{ display: 'inline-block' }}>
                        <button
                          type="button"
                          onClick={() => setMenuId(menuId === product._id ? '' : product._id)}
                          disabled={isBusy}
                          style={{
                            background: 'none', border: 'none', cursor: isBusy ? 'not-allowed' : 'pointer',
                            fontSize: '20px', color: colors.textMuted, padding: '2px 6px',
                            borderRadius: '6px', lineHeight: 1,
                          }}
                        >
                          ⋮
                        </button>
                        {menuId === product._id && (
                          <div style={{
                            position: 'absolute', top: '100%', insetInlineStart: 0, zIndex: 20,
                            background: colors.surface, borderRadius: '10px',
                            border: `1px solid ${colors.border}`,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: '150px',
                          }}>
                            <Link
                              to={`/products/${product._id}/edit`}
                              onClick={() => setMenuId('')}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', fontSize: '13px', color: colors.textPrimary, textDecoration: 'none' }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              Edit
                            </Link>
                            {!product.isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleToggleFreeze(product)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', border: 'none', background: 'none', fontSize: '13px', color: colors.textPrimary, cursor: 'pointer', textAlign: 'start' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                {product.isFrozen ? 'Unfreeze' : 'Freeze'}
                              </button>
                            )}
                            {!product.isDeleted && (
                              <button
                                type="button"
                                onClick={() => handleDelete(product)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', border: 'none', background: 'none', fontSize: '13px', color: colors.error, cursor: 'pointer', textAlign: 'start' }}
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
                    <td style={{ padding: '12px 16px' }}>
                      <Pill bg={stateStyle.bg} color={stateStyle.color} border={stateStyle.border}>
                        {stateStyle.label}
                      </Pill>
                    </td>

                    {/* Stock */}
                    <td style={{ padding: '12px 16px' }}>
                      <Pill
                        bg={inStock ? '#dcfce7' : '#fef2f2'}
                        color={inStock ? '#166534' : '#991b1b'}
                        border={inStock ? '#bbf7d0' : '#fecaca'}
                      >
                        {inStock ? 'In Stock' : 'Out of Stock'}
                      </Pill>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '12px 16px' }}>
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
                            <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '1px' }}>
                              Per {product.unit}
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '12px 16px' }}>
                      {category ? (
                        <Pill bg={colors.bg} color={colors.textSecondary} border={colors.border}>
                          {category}
                        </Pill>
                      ) : <span style={{ color: colors.textMuted, fontSize: '13px' }}>—</span>}
                    </td>

                    {/* Product Name */}
                    <td style={{ padding: '12px 16px', maxWidth: '200px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>{name}</div>
                      {subtitle && (
                        <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px' }}>{subtitle}</div>
                      )}
                    </td>

                    {/* Image */}
                    <td style={{ padding: '12px 16px' }}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={name}
                          style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: '52px', height: '52px', borderRadius: '8px', background: '#eef7f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                          🥬
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ padding: '14px 20px', borderTop: `1px solid ${colors.borderLight}`, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${colors.border}`, background: colors.surface, color: safePage === 1 ? colors.textMuted : colors.textPrimary, cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              ←
            </button>
            <span style={{ fontSize: '13px', color: colors.textSecondary }}>
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ padding: '6px 12px', borderRadius: '7px', border: `1px solid ${colors.border}`, background: colors.surface, color: safePage >= totalPages ? colors.textMuted : colors.textPrimary, cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', fontSize: '13px' }}
            >
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
