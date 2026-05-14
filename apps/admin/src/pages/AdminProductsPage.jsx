import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deleteProduct, getAdminProducts, setProductFrozen } from "../services/productService";
import { useToast } from "../features/toast/ToastContext";
import {
  pickLocalizedName,
  pickLocalizedProductName,
  getAdminProductSearchHaystack,
  getLocalizedText,
  getActiveAdminLanguage
} from "../utils/localizedDisplayName";
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
  textInverse:  '#ffffff',
  error:        '#991b1b',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
};

const STATUS_STYLES = {
  active:   { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
  inactive: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  frozen:   { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  deleted:  { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return '—';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(value);
};

const pickNameSubtitle = (name) => {
  if (!name || typeof name !== 'object' || Array.isArray(name)) return '';
  const active = getActiveAdminLanguage();
  const primary = getLocalizedText(name, active);
  const o = /** @type {Record<string, unknown>} */ (name);
  const parts = [];
  for (const k of ['en', 'he', 'ar']) {
    const v = typeof o[k] === 'string' ? o[k].trim() : '';
    if (v && v !== primary) parts.push(v);
  }
  return parts.join(' | ');
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

/** LTR: image → … → actions (right). RTL: actions on inline-start (right). */
const PRODUCT_TABLE_COLS_LTR = ["image", "productName", "category", "price", "stock", "status", "actions"];
const PRODUCT_TABLE_COLS_RTL = ["actions", "status", "stock", "price", "category", "productName", "image"];
const PRODUCT_COL_TKEY = {
  image: "products:list.tableHeaders.image",
  productName: "products:list.tableHeaders.productName",
  category: "products:list.tableHeaders.category",
  price: "products:list.tableHeaders.price",
  stock: "products:list.tableHeaders.stock",
  status: "products:list.tableHeaders.status",
  actions: "products:list.tableHeaders.actions"
};

const interactiveBtn = {
  transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s',
};

const categoryLabel = (product) => {
  const categoryRaw = product.category?.name ?? (typeof product.category === 'string' ? product.category : '');
  return categoryRaw !== '' && categoryRaw != null ? pickLocalizedName(categoryRaw) : '';
};

const AdminProductsPage = () => {
  const { t } = useTranslation(["products", "common"]);
  const { isRtl } = useAdminLanguage();
  const productTableCols = isRtl ? PRODUCT_TABLE_COLS_RTL : PRODUCT_TABLE_COLS_LTR;
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState(/** @type {'gallery' | 'table'} */ ('gallery'));
  const [drawerProductId, setDrawerProductId] = useState('');
  const [menuId, setMenuId] = useState('');
  /** @type {[{ top: number, left: number } | null, (v: { top: number, left: number } | null) => void]} */
  const [menuPos, setMenuPos] = useState(/** @type {{ top: number, left: number } | null} */ (null));
  const [hoverRowId, setHoverRowId] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const filterRef = useRef(null);
  const menuRef = useRef(null);
  const drawerCloseRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const pageSize = 10;

  const closeProductMenu = useCallback(() => {
    setMenuId('');
    setMenuPos(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerProductId('');
  }, []);

  const menuProduct = useMemo(
    () => items.find((p) => String(p._id) === String(menuId)) ?? null,
    [items, menuId]
  );

  const drawerProduct = useMemo(
    () => items.find((p) => String(p._id) === String(drawerProductId)) ?? null,
    [items, drawerProductId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await getAdminProducts());
    } catch (err) {
      setError(err.userMessage || t('products:list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) closeProductMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeProductMenu]);

  useEffect(() => {
    if (!menuId) return undefined;
    const onScroll = () => closeProductMenu();
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [menuId, closeProductMenu]);

  useEffect(() => {
    if (!menuId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeProductMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuId, closeProductMenu]);

  useEffect(() => {
    if (!drawerProductId) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerProductId, closeDrawer]);

  useEffect(() => {
    if (!drawerProductId) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [drawerProductId]);

  useLayoutEffect(() => {
    if (drawerProductId) drawerCloseRef.current?.focus();
  }, [drawerProductId]);

  useEffect(() => {
    setMenuId('');
    setMenuPos(null);
    setDrawerProductId('');
  }, [page]);

  useEffect(() => {
    if (menuId && !menuProduct) closeProductMenu();
  }, [menuId, menuProduct, closeProductMenu]);

  useEffect(() => {
    if (drawerProductId && !drawerProduct) closeDrawer();
  }, [drawerProductId, drawerProduct, closeDrawer]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (statusFilter !== 'all' && getProductState(p) !== statusFilter) return false;
      if (!q) return true;
      return getAdminProductSearchHaystack(p).includes(q);
    });
  }, [items, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((safePage - 1) * pageSize, safePage * pageSize), [filtered, safePage]);

  const handleToggleFreeze = async (product) => {
    setBusyId(product._id);
    closeProductMenu();
    closeDrawer();
    try {
      await setProductFrozen(product._id, !product.isFrozen);
      showToast(product.isFrozen ? t('products:list.toasts.unfrozen') : t('products:list.toasts.frozen'));
      await load();
    } catch (err) {
      showToast(err.userMessage || t('products:list.toasts.actionFailed'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(t('products:list.confirmDelete', { name: pickLocalizedProductName(product) }))) return;
    setBusyId(product._id);
    closeProductMenu();
    closeDrawer();
    try {
      await deleteProduct(product._id);
      showToast(t('products:list.toasts.deleted'));
      await load();
    } catch (err) {
      showToast(err.userMessage || t('products:list.toasts.deleteFailed'), 'error');
    } finally {
      setBusyId('');
    }
  };

  const openProductDrawer = (product) => {
    closeProductMenu();
    setDrawerProductId(String(product._id));
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

  const renderPriceBlock = (product, { compact } = { compact: false }) => {
    const price = typeof product.price === 'number' ? product.price : null;
    const salePrice = typeof product.salePrice === 'number' ? product.salePrice : null;
    if (price === null) return <span style={{ color: colors.textMuted, fontSize: compact ? '13px' : '14px' }}>—</span>;
    return (
      <div>
        <div style={{ fontSize: compact ? '14px' : '16px', fontWeight: 700, color: colors.primary }}>
          {formatCurrency(price)}
        </div>
        {salePrice !== null && salePrice < price && (
          <div style={{
            fontSize: compact ? '11px' : '12px',
            color: colors.error,
            textDecoration: 'line-through',
            marginTop: compact ? '2px' : '4px',
          }}>
            {formatCurrency(salePrice)}
          </div>
        )}
        {product.unit && !compact && (
          <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '6px' }}>
            {t('products:list.perUnit', { unit: product.unit })}
          </div>
        )}
      </div>
    );
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
        .admin-products-add-category:focus-visible,
        .admin-products-add:focus-visible,
        .admin-products-menu:focus-visible,
        .admin-products-page:focus-visible,
        .admin-products-retry:focus-visible,
        .admin-products-view-opt:focus-visible,
        .admin-products-card:focus-visible,
        .admin-products-drawer-close:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .admin-products-dd-item:hover { background: ${colors.bg}; }
        .admin-products-dd-item:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: -2px; }
        .admin-products-dd-item-danger:hover { background: ${colors.errorBg}; }
        .admin-products-gallery {
          display: grid;
          gap: 16px;
          padding: 16px 20px 8px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 640px) {
          .admin-products-gallery { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .admin-products-gallery { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
        @media (min-width: 1280px) {
          .admin-products-gallery { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
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
        {isRtl ? (
          <>
            <div style={{ textAlign: 'start', flex: '1 1 200px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
                {t('products:list.pageTitle')}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.5 }}>
                {t('products:list.pageSubtitle')}
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
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
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryHover; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,84,48,0.32)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.boxShadow = '0 4px 14px rgba(30,107,60,0.30)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {t('products:list.addProduct')}
              </Link>
              <Link
                to="/categories"
                className="admin-products-add-category"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1.5px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  ...interactiveBtn,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h10"/>
                </svg>
                {t('products:list.manageCategories')}
              </Link>
              <Link
                to="/categories/new"
                className="admin-products-add-category"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1.5px solid ${colors.primary}`,
                  background: colors.surface,
                  color: colors.primary,
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  ...interactiveBtn,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h10"/>
                  <line x1="16" y1="15" x2="22" y2="15"/>
                  <line x1="19" y1="12" x2="19" y2="18"/>
                </svg>
                {t('products:list.addCategory')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
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
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.primaryHover; e.currentTarget.style.boxShadow = '0 4px 12px rgba(22,84,48,0.32)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.boxShadow = '0 4px 14px rgba(30,107,60,0.30)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {t('products:list.addProduct')}
              </Link>
              <Link
                to="/categories"
                className="admin-products-add-category"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1.5px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.textPrimary,
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  ...interactiveBtn,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h10"/>
                </svg>
                {t('products:list.manageCategories')}
              </Link>
              <Link
                to="/categories/new"
                className="admin-products-add-category"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: `1.5px solid ${colors.primary}`,
                  background: colors.surface,
                  color: colors.primary,
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  ...interactiveBtn,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.bg; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h10"/>
                  <line x1="16" y1="15" x2="22" y2="15"/>
                  <line x1="19" y1="12" x2="19" y2="18"/>
                </svg>
                {t('products:list.addCategory')}
              </Link>
            </div>
            <div style={{ textAlign: 'end', flex: '1 1 200px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.5px' }}>
                {t('products:list.pageTitle')}
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: colors.textMuted, lineHeight: 1.5 }}>
                {t('products:list.pageSubtitle')}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ minWidth: 0 }}>{error}</span>
          <button type="button" onClick={load} className="admin-products-retry" style={{ flexShrink: 0, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${colors.errorBorder}`, background: 'transparent', color: colors.error, cursor: 'pointer', fontSize: '12px', fontWeight: 600, ...interactiveBtn }}>
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              {t('common:filter')}
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
                    {opt === 'all' ? t('common:allStatuses') : t(`products:list.status.${opt}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div
            role="group"
            aria-label={t('products:list.view.toggleAria')}
            style={{
              display: 'inline-flex',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {(['gallery', 'table']).map((mode) => (
              <button
                key={mode}
                type="button"
                className="admin-products-view-opt"
                aria-pressed={viewMode === mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '8px 14px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: viewMode === mode ? 600 : 500,
                  background: viewMode === mode ? colors.bg : colors.surface,
                  color: viewMode === mode ? colors.primary : colors.textSecondary,
                  ...interactiveBtn,
                }}
              >
                {mode === 'gallery' ? t('products:list.view.gallery') : t('products:list.view.table')}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', insetInlineStart: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('products:list.searchPlaceholder')}
              aria-label={t('products:list.searchAria')}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={searchInputStyle}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          viewMode === 'gallery' ? (
            <div style={{ padding: '0 0 12px' }} aria-busy="true" aria-live="polite">
              <div style={{ padding: '12px 20px 0', fontSize: '12px', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {t('common:loadingDots')}
              </div>
              <div className="admin-products-gallery">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: '14px',
                      border: `1px solid ${colors.borderLight}`,
                      overflow: 'hidden',
                      background: colors.surface,
                    }}
                  >
                    <div className="admin-products-skel" style={{ aspectRatio: '1', background: colors.borderLight }} />
                    <div style={{ padding: '12px 14px' }}>
                      <div className="admin-products-skel" style={{ height: 14, width: '75%', background: colors.borderLight, borderRadius: '6px', marginBottom: 10 }} />
                      <div className="admin-products-skel" style={{ height: 12, width: '45%', background: colors.borderLight, borderRadius: '6px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
          )
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
              {t('products:list.empty.title')}
            </div>
            <div style={{ fontSize: '13px', color: colors.textMuted, lineHeight: 1.5 }}>
              {search || statusFilter !== 'all'
                ? t('products:list.empty.withSearch')
                : t('products:list.empty.withoutSearch')}
            </div>
          </div>
        ) : viewMode === 'gallery' ? (
          <div className="admin-products-gallery">
            {paged.map((product) => {
              const name = pickLocalizedProductName(product);
              const state = getProductState(product);
              const stateStyle = STATUS_STYLES[state] || STATUS_STYLES.inactive;
              const inStock = product.stockStatus === 'in_stock';
              const isBusy = busyId === product._id;
              const showOverlay = product.isDeleted || product.isFrozen || !inStock;

              return (
                <button
                  key={product._id}
                  type="button"
                  className="admin-products-card"
                  onClick={() => openProductDrawer(product)}
                  disabled={isBusy}
                  aria-label={isBusy ? t('products:list.workingAria') : t('products:list.card.openDetailsAria', { name })}
                  style={{
                    display: 'block',
                    width: '100%',
                    minWidth: 0,
                    padding: 0,
                    margin: 0,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '14px',
                    background: colors.surface,
                    cursor: isBusy ? 'wait' : 'pointer',
                    textAlign: 'start',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    opacity: isBusy ? 0.72 : 1,
                    transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
                    ...interactiveBtn,
                  }}
                  onMouseEnter={(e) => {
                    if (isBusy) return;
                    e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.10)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = colors.border;
                  }}
                >
                  <div style={{
                    position: 'relative',
                    aspectRatio: '1',
                    background: '#eef7f1',
                  }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(36px, 12vw, 52px)',
                        userSelect: 'none',
                      }}>
                        🥬
                      </div>
                    )}
                    {showOverlay && (
                      <div
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(28, 25, 23, 0.22)',
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <div style={{
                      position: 'absolute',
                      insetInlineStart: '8px',
                      insetBlockStart: '8px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      maxWidth: 'calc(100% - 16px)',
                    }}>
                      <Pill bg={stateStyle.bg} color={stateStyle.color} border={stateStyle.border}>
                        {t(`products:list.status.${state}`)}
                      </Pill>
                    </div>
                    <div style={{
                      position: 'absolute',
                      insetInlineEnd: '8px',
                      insetBlockEnd: '8px',
                    }}>
                      <Pill
                        bg={inStock ? '#dcfce7' : '#fef2f2'}
                        color={inStock ? '#166534' : '#991b1b'}
                        border={inStock ? '#bbf7d0' : '#fecaca'}
                      >
                        {inStock ? t('products:list.stock.in') : t('products:list.stock.out')}
                      </Pill>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px 14px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: colors.textPrimary,
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      overflow: 'hidden',
                    }}>
                      {name}
                    </div>
                    <div style={{ marginTop: '10px' }}>
                      {renderPriceBlock(product, { compact: true })}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%',
            }}
          >
            <table dir={isRtl ? 'rtl' : 'ltr'} style={{ width: '100%', minWidth: '880px', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {productTableCols.map((col) => (
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
                      {t(PRODUCT_COL_TKEY[col])}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((product) => {
                  const name = pickLocalizedProductName(product);
                  const subtitle = pickNameSubtitle(product.name);
                  const state = getProductState(product);
                  const stateStyle = STATUS_STYLES[state] || STATUS_STYLES.inactive;
                  const inStock = product.stockStatus === 'in_stock';
                  const category = categoryLabel(product);
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
                      {productTableCols.map((col) => {
                        if (col === "actions") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                className="admin-products-menu"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const pid = String(product._id);
                                  if (menuId === pid) {
                                    closeProductMenu();
                                    return;
                                  }
                                  const r = e.currentTarget.getBoundingClientRect();
                                  const menuWidth = 200;
                                  const left = isRtl
                                    ? Math.max(8, r.right - menuWidth)
                                    : Math.max(8, Math.min(r.left, window.innerWidth - menuWidth - 8));
                                  setMenuPos({ top: r.bottom + 4, left });
                                  setMenuId(pid);
                                }}
                                disabled={isBusy}
                                aria-expanded={menuId === String(product._id)}
                                aria-haspopup="true"
                                aria-label={isBusy ? t('products:list.workingAria') : t('products:list.actionsMenuAria', { name })}
                                style={{
                                  background: menuId === String(product._id) ? colors.borderLight : 'none',
                                  border: 'none',
                                  cursor: isBusy ? 'not-allowed' : 'pointer',
                                  fontSize: '20px',
                                  color: menuId === String(product._id) ? colors.textPrimary : colors.textMuted,
                                  padding: '4px 8px',
                                  borderRadius: '8px',
                                  lineHeight: 1,
                                  opacity: isBusy ? 0.5 : 1,
                                  transition: 'background 0.15s, color 0.15s, opacity 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isBusy && menuId !== String(product._id)) {
                                    e.currentTarget.style.background = colors.borderLight;
                                    e.currentTarget.style.color = colors.textPrimary;
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (menuId !== String(product._id)) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = colors.textMuted;
                                  }
                                }}
                              >
                                {isBusy ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ animation: 'adminProductsSpin 0.9s linear infinite', display: 'block' }}>
                                    <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                                  </svg>
                                ) : '⋮'}
                              </button>
                            </td>
                          );
                        }
                        if (col === "status") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <Pill bg={stateStyle.bg} color={stateStyle.color} border={stateStyle.border}>
                                {t(`products:list.status.${state}`)}
                              </Pill>
                            </td>
                          );
                        }
                        if (col === "stock") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                              <Pill
                                bg={inStock ? '#dcfce7' : '#fef2f2'}
                                color={inStock ? '#166534' : '#991b1b'}
                                border={inStock ? '#bbf7d0' : '#fecaca'}
                              >
                                {inStock ? t('products:list.stock.in') : t('products:list.stock.out')}
                              </Pill>
                            </td>
                          );
                        }
                        if (col === "price") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
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
                                      {t('products:list.perUnit', { unit: product.unit })}
                                    </div>
                                  )}
                                </div>
                              ) : '—'}
                            </td>
                          );
                        }
                        if (col === "category") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle', maxWidth: '160px' }}>
                              {category ? (
                                <Pill bg={colors.bg} color={colors.textSecondary} border={colors.border}>
                                  <span style={{ display: 'inline-block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>{category}</span>
                                </Pill>
                              ) : <span style={{ color: colors.textMuted, fontSize: '13px' }}>—</span>}
                            </td>
                          );
                        }
                        if (col === "productName") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', maxWidth: '220px', verticalAlign: 'middle' }}>
                              <div style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary, wordBreak: 'break-word' }}>{name}</div>
                              {subtitle && (
                                <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '4px', wordBreak: 'break-word' }}>{subtitle}</div>
                              )}
                            </td>
                          );
                        }
                        if (col === "image") {
                          return (
                            <td key={col} style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
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
                          );
                        }
                        return null;
                      })}
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
                return t('common:showingRange', { start, end, total: filtered.length });
              })()}
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="admin-products-page"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label={t('common:previous')}
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
                  aria-label={t('common:next')}
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

        {menuId && menuPos && menuProduct
          ? createPortal(
              <div
                ref={menuRef}
                role="menu"
                style={{
                  position: 'fixed',
                  top: menuPos.top,
                  left: menuPos.left,
                  zIndex: 10000,
                  background: colors.surface,
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  minWidth: '160px',
                  maxWidth: 'min(260px, calc(100vw - 48px))',
                }}
              >
                {menuProduct.isDeleted && (
                  <div
                    style={{
                      padding: '10px 14px',
                      fontSize: '12px',
                      lineHeight: 1.45,
                      color: colors.textSecondary,
                      background: colors.bg,
                      borderBottom: `1px solid ${colors.borderLight}`,
                    }}
                  >
                    {t('products:list.menu.deletedNote')}
                  </div>
                )}
                <Link
                  to={`/products/${menuProduct._id}/edit`}
                  onClick={closeProductMenu}
                  role="menuitem"
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {t('products:list.menu.edit')}
                </Link>
                {!menuProduct.isDeleted && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleToggleFreeze(menuProduct)}
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {menuProduct.isFrozen ? t('products:list.menu.unfreeze') : t('products:list.menu.freeze')}
                  </button>
                )}
                {!menuProduct.isDeleted && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleDelete(menuProduct)}
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.errorBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    {t('products:list.menu.removeFromCatalog')}
                  </button>
                )}
              </div>,
              document.body
            )
          : null}

        {drawerProductId && drawerProduct
          ? createPortal(
              <div
                role="presentation"
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 10001,
                }}
              >
                <button
                  type="button"
                  aria-label={t('products:list.drawer.closeAria')}
                  onClick={closeDrawer}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    background: 'rgba(28, 25, 23, 0.45)',
                    cursor: 'pointer',
                  }}
                />
                <aside
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="admin-product-drawer-title"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    insetBlockStart: 0,
                    insetBlockEnd: 0,
                    insetInlineEnd: 0,
                    width: 'min(420px, 100vw)',
                    maxWidth: '100%',
                    background: colors.surface,
                    boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    borderInlineStart: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 16px',
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}>
                    <h2 id="admin-product-drawer-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>
                      {t('products:list.drawer.title')}
                    </h2>
                    <button
                      ref={drawerCloseRef}
                      type="button"
                      className="admin-products-drawer-close"
                      onClick={closeDrawer}
                      style={{
                        flexShrink: 0,
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        border: `1px solid ${colors.border}`,
                        background: colors.bg,
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1,
                        color: colors.textSecondary,
                        ...interactiveBtn,
                      }}
                      aria-label={t('products:list.drawer.closeAria')}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ overflowY: 'auto', flex: 1, padding: '16px 18px 24px' }}>
                    {(() => {
                      const p = drawerProduct;
                      const name = pickLocalizedProductName(p);
                      const state = getProductState(p);
                      const stateStyle = STATUS_STYLES[state] || STATUS_STYLES.inactive;
                      const inStock = p.stockStatus === 'in_stock';
                      const category = categoryLabel(p);
                      const isBusy = busyId === p._id;
                      return (
                        <>
                          <div style={{
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: `1px solid ${colors.border}`,
                            background: '#eef7f1',
                            marginBottom: '18px',
                          }}>
                            <div style={{ position: 'relative', aspectRatio: '4 / 3', maxHeight: '240px' }}>
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '56px',
                                }}>
                                  🥬
                                </div>
                              )}
                              {(p.isDeleted || p.isFrozen || !inStock) && (
                                <div
                                  aria-hidden="true"
                                  style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(28, 25, 23, 0.18)',
                                    pointerEvents: 'none',
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: 800, color: colors.textPrimary, lineHeight: 1.25, marginBottom: '12px' }}>
                            {name}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            <Pill bg={stateStyle.bg} color={stateStyle.color} border={stateStyle.border}>
                              {t(`products:list.status.${state}`)}
                            </Pill>
                            <Pill
                              bg={inStock ? '#dcfce7' : '#fef2f2'}
                              color={inStock ? '#166534' : '#991b1b'}
                              border={inStock ? '#bbf7d0' : '#fecaca'}
                            >
                              {inStock ? t('products:list.stock.in') : t('products:list.stock.out')}
                            </Pill>
                          </div>
                          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '6px' }}>
                            {t('products:list.tableHeaders.category')}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: colors.textPrimary, marginBottom: '18px' }}>
                            {category || '—'}
                          </div>
                          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '6px' }}>
                            {t('products:list.tableHeaders.price')}
                          </div>
                          <div style={{ marginBottom: '20px' }}>
                            {renderPriceBlock(p, { compact: false })}
                          </div>
                          {p.isDeleted && (
                            <div style={{
                              padding: '12px 14px',
                              fontSize: '13px',
                              lineHeight: 1.45,
                              color: colors.textSecondary,
                              background: colors.bg,
                              borderRadius: '10px',
                              border: `1px solid ${colors.borderLight}`,
                              marginBottom: '20px',
                            }}>
                              {t('products:list.menu.deletedNote')}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link
                              to={`/products/${p._id}/edit`}
                              onClick={closeDrawer}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: colors.primary,
                                color: colors.textInverse,
                                fontSize: '14px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                boxShadow: '0 4px 14px rgba(30,107,60,0.22)',
                                ...interactiveBtn,
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              {t('products:list.menu.edit')}
                            </Link>
                            {!p.isDeleted && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleFreeze(p)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '12px 16px',
                                  borderRadius: '10px',
                                  border: `1px solid ${colors.border}`,
                                  background: colors.surface,
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: colors.textPrimary,
                                  cursor: isBusy ? 'not-allowed' : 'pointer',
                                  opacity: isBusy ? 0.6 : 1,
                                  ...interactiveBtn,
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                {p.isFrozen ? t('products:list.menu.unfreeze') : t('products:list.menu.freeze')}
                              </button>
                            )}
                            {!p.isDeleted && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDelete(p)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  padding: '12px 16px',
                                  borderRadius: '10px',
                                  border: `1px solid ${colors.errorBorder}`,
                                  background: colors.errorBg,
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  color: colors.error,
                                  cursor: isBusy ? 'not-allowed' : 'pointer',
                                  opacity: isBusy ? 0.6 : 1,
                                  ...interactiveBtn,
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                {t('products:list.menu.removeFromCatalog')}
                              </button>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </aside>
              </div>,
              document.body
            )
          : null}
      </div>
    </div>
  );
};

export default AdminProductsPage;
