import { useCallback, useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RequireAuth from "../components/RequireAuth";
import RequireAdmin from "../components/RequireAdmin";
import { useAuth } from "../features/auth/AuthContext";
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import ProductFormPage from "../pages/ProductFormPage";
import CategoryFormPage from "../pages/CategoryFormPage";
import AdminCategoriesPage from "../pages/AdminCategoriesPage";
import AdminOrdersPage from "../pages/AdminOrdersPage";
import AdminOrderDetailsPage from "../pages/AdminOrderDetailsPage";
import AdminSalesDashboardPage from "../pages/AdminSalesDashboardPage";
import AdminPromotionsPage from "../pages/AdminPromotionsPage";
import AdminStoreStatusPage from "../pages/AdminStoreStatusPage";
import AbuAlAnasLogo from "../components/common/Logo";
import * as storeSettingsService from "../services/storeSettingsService";
import { formatApiError } from "../utils/formatApiError";
import { useAdminLanguage } from "../i18n/useAdminLanguage";
import LanguageSwitcher from "../i18n/LanguageSwitcher";

const MOBILE_MAX_WIDTH = 767;
const MOBILE_MEDIA = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

const colors = {
  primary:    '#1e6b3c',
  bg:         '#faf8f5',
  surface:    '#ffffff',
  border:     '#e8e3dc',
  activeNavBg:'#f0f7f2',
  textPrimary:'#1c1917',
  textMuted:  '#a8a29e',
  error:      '#991b1b',
};

const NAV_ITEMS = [
  {
    to: '/products',
    labelKey: 'items.products',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    to: '/categories',
    labelKey: 'items.categories',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M4 12h16M4 17h10"/>
        <line x1="16" y1="15" x2="22" y2="15"/>
        <line x1="19" y1="12" x2="19" y2="18"/>
      </svg>
    ),
  },
  {
    to: '/orders',
    labelKey: 'items.orders',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
  {
    to: '/sales',
    labelKey: 'items.sales',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
  {
    to: '/promotions',
    labelKey: 'items.popups',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h10M7 13h6" />
      </svg>
    ),
  },
  {
    to: '/store-status',
    labelKey: 'items.storeStatus',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
];

function useIsMobileNav() {
  const getInitial = () =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA).matches;
  const [isMobile, setIsMobile] = useState(getInitial);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

const Sidebar = ({ isMobile, mobileOpen, onMobileClose, isRtl }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation(["nav", "storeStatus"]);
  const [hovered, setHovered] = useState('');
  const [storeOpen, setStoreOpen] = useState(null);
  const [storeToggleBusy, setStoreToggleBusy] = useState(false);
  const [storeToggleError, setStoreToggleError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStoreToggleError('');
      try {
        const s = await storeSettingsService.getStoreSettings();
        if (!cancelled) setStoreOpen(s?.isStoreOpen !== false);
      } catch (e) {
        if (!cancelled) setStoreToggleError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slideMotion = 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)';
  const offCanvasX = isRtl ? '-100%' : '100%';

  const asideBase = {
    width: '220px',
    flexShrink: 0,
    background: colors.surface,
    borderInlineStart: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    alignSelf: 'flex-start',
  };

  const asideDesktop = {
    ...asideBase,
    position: 'sticky',
    top: 0,
    transform: 'none',
    zIndex: 1,
  };

  const asideMobile = {
    ...asideBase,
    position: 'fixed',
    insetBlockStart: 0,
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    maxWidth: 'min(220px, 92vw)',
    zIndex: 1000,
    boxShadow: mobileOpen ? '-4px 0 24px rgba(28, 25, 23, 0.12)' : 'none',
    transition: slideMotion,
    transform: mobileOpen ? 'translateX(0)' : `translateX(${offCanvasX})`,
    pointerEvents: mobileOpen ? 'auto' : 'none',
  };

  const navLinkAfterNav = () => {
    if (isMobile) onMobileClose();
  };

  return (
    <aside
      id="admin-app-sidebar"
      style={isMobile ? asideMobile : asideDesktop}
      aria-hidden={isMobile && !mobileOpen}
    >
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AbuAlAnasLogo size={42} title={t('nav:brand')} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
              {t('nav:brand')}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', color: colors.textMuted, textTransform: 'uppercase', marginTop: '2px' }}>
              {t('nav:adminPanel')}
            </div>
          </div>
        </div>
        {user && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name || user.email}
          </div>
        )}
        {/* Language switcher: desktop sidebar */}
        {!isMobile && (
          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-start' }}>
            <LanguageSwitcher size="sm" />
          </div>
        )}
      </div>

      {/* Quick store toggle */}
      <div style={{ padding: '0 12px 14px', borderBottom: `1px solid ${colors.border}`, paddingTop: '14px' }}>
        <button
          type="button"
          disabled={storeOpen === null || storeToggleBusy}
          onClick={async () => {
            if (storeOpen === null) return;
            const next = !storeOpen;
            setStoreToggleBusy(true);
            setStoreToggleError('');
            try {
              await storeSettingsService.patchStoreSettings({ isStoreOpen: next, reopenAt: null });
              setStoreOpen(next);
              if (isMobile) onMobileClose();
            } catch (e) {
              setStoreToggleError(formatApiError(e));
            } finally {
              setStoreToggleBusy(false);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            background:
              storeOpen === null ? '#78716c' : storeOpen === false ? colors.primary : '#b45309',
            boxShadow:
              storeOpen === null
                ? 'none'
                : storeOpen === false
                  ? '0 2px 8px rgba(30,107,60,0.22)'
                  : '0 2px 8px rgba(180,83,9,0.25)',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            width: '100%',
            textAlign: 'center',
            lineHeight: 1.35,
            cursor: storeOpen === null || storeToggleBusy ? 'wait' : 'pointer',
            opacity: storeOpen === null || storeToggleBusy ? 0.75 : 1,
            fontFamily: 'inherit',
          }}
        >
          {storeOpen === null
            ? t('storeStatus:buttons.loadingStore')
            : storeOpen
              ? t('storeStatus:buttons.closeStore')
              : t('storeStatus:buttons.openStore')}
        </button>
        {storeToggleError ? (
          <div style={{ marginTop: 8, fontSize: 11, color: colors.error, lineHeight: 1.35 }} role="alert">
            {storeToggleError}
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ to, labelKey, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={navLinkAfterNav}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? colors.primary : colors.textPrimary,
              background: isActive ? colors.activeNavBg : 'transparent',
              transition: 'background 0.12s, color 0.12s',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ color: isActive ? colors.primary : colors.textMuted, display: 'flex', alignItems: 'center' }}>
                  {icon}
                </span>
                {t(`nav:${labelKey}`)}
                {isActive && (
                  <span style={{ marginInlineStart: 'auto', fontSize: '12px', color: colors.primary }}>›</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      {user && (
        <div style={{ padding: '14px 12px', borderTop: `1px solid ${colors.border}` }}>
          <button
            type="button"
            onClick={() => logout()}
            onMouseEnter={() => setHovered('logout')}
            onMouseLeave={() => setHovered('')}
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: hovered === 'logout' ? colors.bg : 'transparent',
              color: colors.textPrimary,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background 0.12s',
            }}
          >
            {t('nav:signOut')}
          </button>
        </div>
      )}
    </aside>
  );
};

const MobileNavBackdrop = ({ open, onClose }) => {
  const { t } = useTranslation("common");
  return (
    <button
      type="button"
      aria-label={t("closeMenu")}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        border: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        background: 'rgba(28, 25, 23, 0.45)',
        opacity: open ? 1 : 0,
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.28s',
      }}
    />
  );
};

const MobileTopBar = ({ onOpenMenu, menuOpen }) => {
  const { t } = useTranslation(["nav", "common"]);
  return (
    <header
      style={{
        display: 'none',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
      className="admin-mobile-topbar"
    >
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("common:openMenu")}
        aria-expanded={menuOpen}
        aria-controls="admin-app-sidebar"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          color: colors.textPrimary,
          cursor: 'pointer',
          padding: 0,
          flexShrink: 0,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        <AbuAlAnasLogo size={32} aria-hidden />
        <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('nav:admin')}
        </span>
      </div>
      <LanguageSwitcher size="sm" />
    </header>
  );
};

const App = () => {
  const { user } = useAuth();
  const location = useLocation();
  // Sync <html lang/dir> with the current admin language (and persist to localStorage via i18n detector).
  const { isRtl } = useAdminLanguage();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/unauthorized';
  const showSidebar = user?.role === 'admin' && !isAuthPage;
  const isMobile = useIsMobileNav();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);

  useEffect(() => {
    if (!isMobile) setMobileNavOpen(false);
  }, [isMobile]);

  useEffect(() => {
    closeMobileNav();
  }, [location.pathname, closeMobileNav]);

  useEffect(() => {
    if (!showSidebar || !isMobile || !mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showSidebar, isMobile, mobileNavOpen]);

  useEffect(() => {
    if (!showSidebar || !isMobile || !mobileNavOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeMobileNav();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSidebar, isMobile, mobileNavOpen, closeMobileNav]);

  const mainPadding = isAuthPage
    ? '0'
    : isMobile
      ? '20px 16px 28px'
      : '36px 40px';

  // In LTR the sidebar should sit on the left (default row), in RTL on the right (row-reverse so it
  // appears on the inline-end side visually). This keeps "natural" RTL layout for Hebrew without
  // breaking the LTR English layout.
  const shellDirection = isRtl ? 'row-reverse' : 'row';

  return (
    <>
      <style>{`
        @media ${MOBILE_MEDIA} {
          .admin-mobile-topbar { display: flex !important; }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          flexDirection: shellDirection,
          minHeight: '100vh',
          background: colors.bg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          position: 'relative',
        }}
      >
        {showSidebar && (
          <Sidebar
            isMobile={isMobile}
            mobileOpen={mobileNavOpen}
            onMobileClose={closeMobileNav}
            isRtl={isRtl}
          />
        )}
        <main
          style={{
            flex: 1,
            padding: mainPadding,
            overflow: 'auto',
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {showSidebar && isMobile && (
            <MobileTopBar onOpenMenu={openMobileNav} menuOpen={mobileNavOpen} />
          )}
          <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/products" element={<RequireAuth><RequireAdmin><AdminProductsPage /></RequireAdmin></RequireAuth>} />
              <Route path="/products/new" element={<RequireAuth><RequireAdmin><ProductFormPage /></RequireAdmin></RequireAuth>} />
              <Route path="/products/:id/edit" element={<RequireAuth><RequireAdmin><ProductFormPage /></RequireAdmin></RequireAuth>} />
              <Route path="/categories" element={<RequireAuth><RequireAdmin><AdminCategoriesPage /></RequireAdmin></RequireAuth>} />
              <Route path="/categories/new" element={<RequireAuth><RequireAdmin><CategoryFormPage /></RequireAdmin></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><RequireAdmin><AdminOrdersPage /></RequireAdmin></RequireAuth>} />
              <Route path="/orders/:id" element={<RequireAuth><RequireAdmin><AdminOrderDetailsPage /></RequireAdmin></RequireAuth>} />
              <Route path="/sales" element={<RequireAuth><RequireAdmin><AdminSalesDashboardPage /></RequireAdmin></RequireAuth>} />
              <Route path="/promotions" element={<RequireAuth><RequireAdmin><AdminPromotionsPage /></RequireAdmin></RequireAuth>} />
              <Route path="/store-status" element={<RequireAuth><RequireAdmin><AdminStoreStatusPage /></RequireAdmin></RequireAuth>} />
              <Route path="/" element={<Navigate to="/products" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {showSidebar && isMobile && (
        <MobileNavBackdrop open={mobileNavOpen} onClose={closeMobileNav} />
      )}
    </>
  );
};

export default App;
