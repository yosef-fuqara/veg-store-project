import { useCallback, useEffect, useMemo, useState } from "react";
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
import PageTransition from "../components/common/PageTransition";
import * as storeSettingsService from "../services/storeSettingsService";
import { formatApiError } from "../utils/formatApiError";
import { useAdminLanguage } from "../i18n/useAdminLanguage";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import { getStorefrontUrl } from "../utils/storefrontUrl";

const MOBILE_MAX_WIDTH = 767;
const MOBILE_MEDIA = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

const SIDEBAR_COLLAPSED_STORAGE_KEY = "admin-sidebar-collapsed";
const SIDEBAR_EXPANDED_WIDTH = 220;
const SIDEBAR_COLLAPSED_WIDTH = 72;

function readSidebarCollapsed() {
  try {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

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

const sidebarWidthMotion = "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)";

/** Chevron: collapse points toward screen edge that sidebar sits on; expand points the other way. Mirrored in RTL via scaleX. */
const SidebarCollapseToggle = ({ expanded, isRtl, onClick, labelCollapse, labelExpand }) => (
  <button
    type="button"
    className="admin-sidebar-collapse-toggle"
    onClick={onClick}
    aria-label={expanded ? labelCollapse : labelExpand}
    title={expanded ? labelCollapse : labelExpand}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      flexShrink: 0,
      borderRadius: "10px",
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.textPrimary,
      cursor: "pointer",
      padding: 0,
      transition: "background 0.15s, border-color 0.15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = colors.activeNavBg;
      e.currentTarget.style.borderColor = colors.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = colors.bg;
      e.currentTarget.style.borderColor = colors.border;
    }}
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ transform: isRtl ? "scaleX(-1)" : undefined }}
    >
      {expanded ? (
        <polyline points="13 6 7 12 13 18" />
      ) : (
        <polyline points="11 6 17 12 11 18" />
      )}
    </svg>
  </button>
);

const externalLinkIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const Sidebar = ({ isMobile, mobileOpen, onMobileClose, isRtl, desktopCollapsed, onToggleDesktopCollapse, storefrontUrl }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation(["nav", "storeStatus"]);
  const [hovered, setHovered] = useState('');
  const [storeOpen, setStoreOpen] = useState(null);
  const [storeToggleBusy, setStoreToggleBusy] = useState(false);
  const [storeToggleError, setStoreToggleError] = useState('');

  const rail = !isMobile && desktopCollapsed;

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
    flexShrink: 0,
    background: colors.surface,
    borderInlineStart: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    overflowX: 'hidden',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
  };

  const asideDesktop = {
    ...asideBase,
    position: 'relative',
    alignSelf: 'stretch',
    minHeight: 0,
    height: '100%',
    maxHeight: '100%',
    zIndex: 1,
    width: rail ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
    transition: sidebarWidthMotion,
  };

  const asideMobile = {
    ...asideBase,
    alignSelf: 'flex-start',
    minHeight: '100vh',
    position: 'fixed',
    insetBlockStart: 0,
    insetBlockEnd: 0,
    insetInlineEnd: 0,
    width: SIDEBAR_EXPANDED_WIDTH,
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

  const storeTitle =
    storeOpen === null
      ? t('storeStatus:buttons.loadingStore')
      : storeOpen
        ? t('storeStatus:buttons.closeStore')
        : t('storeStatus:buttons.openStore');

  const storeBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: rail ? '10px 8px' : '11px 14px',
    borderRadius: '10px',
    fontSize: rail ? '0' : '13px',
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
    width: rail ? '100%' : '100%',
    minHeight: rail ? '44px' : undefined,
    textAlign: 'center',
    lineHeight: 1.35,
    cursor: storeOpen === null || storeToggleBusy ? 'wait' : 'pointer',
    opacity: storeOpen === null || storeToggleBusy ? 0.75 : 1,
    fontFamily: 'inherit',
  };

  return (
    <aside
      id="admin-app-sidebar"
      className="scrollbar-hidden"
      style={isMobile ? asideMobile : asideDesktop}
      aria-hidden={isMobile && !mobileOpen}
    >
      {/* Brand */}
      <div
        style={{
          padding: rail ? '12px 8px 10px' : '24px 20px 20px',
          borderBottom: `1px solid ${colors.border}`,
          transition: 'padding 0.2s ease',
        }}
      >
        {rail ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '8px',
              }}
            >
              <SidebarCollapseToggle
                expanded={!desktopCollapsed}
                isRtl={isRtl}
                onClick={onToggleDesktopCollapse}
                labelCollapse={t('nav:sidebar.collapse')}
                labelExpand={t('nav:sidebar.expand')}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '0',
              }}
            >
              <AbuAlAnasLogo size={36} title={t('nav:brand')} />
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
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
            {!isMobile && (
              <SidebarCollapseToggle
                expanded={!desktopCollapsed}
                isRtl={isRtl}
                onClick={onToggleDesktopCollapse}
                labelCollapse={t('nav:sidebar.collapse')}
                labelExpand={t('nav:sidebar.expand')}
              />
            )}
          </div>
        )}
        {user && !rail && (
          <div style={{ marginTop: '10px', fontSize: '12px', color: colors.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.name || user.email}
          </div>
        )}
        {!isMobile && (
          <div style={{ marginTop: rail ? '10px' : '14px', display: 'flex', justifyContent: rail ? 'center' : 'flex-start' }}>
            <LanguageSwitcher size="sm" rail={rail} />
          </div>
        )}
      </div>

      {/* Quick store toggle */}
      <div style={{ padding: rail ? '0 8px 12px' : '0 12px 14px', borderBottom: `1px solid ${colors.border}`, paddingTop: '14px' }}>
        <button
          type="button"
          title={storeTitle}
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
          style={storeBtnStyle}
        >
          {rail ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          ) : (
            storeTitle
          )}
        </button>
        {!rail && storeToggleError ? (
          <div style={{ marginTop: 8, fontSize: 11, color: colors.error, lineHeight: 1.35 }} role="alert">
            {storeToggleError}
          </div>
        ) : null}
        {rail && storeToggleError ? (
          <div title={storeToggleError} style={{ marginTop: 6, fontSize: 9, color: colors.error, lineHeight: 1.25, textAlign: 'center', cursor: 'help' }} role="alert">
            !
          </div>
        ) : null}
      </div>

      {/* View customer storefront (new tab only — no auth handoff) */}
      <div
        style={{
          padding: rail ? '0 8px 12px' : '0 12px 14px',
          paddingTop: '12px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {storefrontUrl ? (
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t('nav:viewStore')}
            aria-label={t('nav:viewStore')}
            onMouseEnter={() => setHovered('viewstore')}
            onMouseLeave={() => setHovered('')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: rail ? '0' : '8px',
              width: '100%',
              padding: rail ? '10px 8px' : '9px 14px',
              borderRadius: '10px',
              border: `1px solid ${hovered === 'viewstore' ? colors.primary : colors.border}`,
              background: hovered === 'viewstore' ? colors.activeNavBg : 'transparent',
              color: colors.primary,
              fontSize: rail ? '0' : '13px',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
              boxSizing: 'border-box',
              minHeight: rail ? '44px' : undefined,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: colors.primary }}>{externalLinkIcon}</span>
            {!rail && t('nav:viewStore')}
          </a>
        ) : (
          <span
            title={t('nav:viewStoreUnavailable')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: rail ? '0' : '8px',
              width: '100%',
              padding: rail ? '10px 8px' : '9px 14px',
              borderRadius: '10px',
              border: `1px dashed ${colors.border}`,
              color: colors.textMuted,
              fontSize: rail ? '0' : '12px',
              fontWeight: 500,
              cursor: 'not-allowed',
              boxSizing: 'border-box',
              minHeight: rail ? '44px' : undefined,
              lineHeight: 1.35,
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.55 }}>{externalLinkIcon}</span>
            {!rail && t('nav:viewStore')}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: rail ? '10px 8px' : '14px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ to, labelKey, icon }) => (
          <NavLink
            key={to}
            to={to}
            title={t(`nav:${labelKey}`)}
            onClick={navLinkAfterNav}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: rail ? 'center' : 'flex-start',
              gap: rail ? '0' : '10px',
              padding: rail ? '11px 8px' : '9px 14px',
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
                <span style={{ color: isActive ? colors.primary : colors.textMuted, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {icon}
                </span>
                {!rail && t(`nav:${labelKey}`)}
                {!rail && isActive && (
                  <span style={{ marginInlineStart: 'auto', fontSize: '12px', color: colors.primary }}>›</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      {user && (
        <div style={{ padding: rail ? '12px 8px' : '14px 12px', borderTop: `1px solid ${colors.border}` }}>
          <button
            type="button"
            title={t('nav:signOut')}
            onClick={() => logout()}
            onMouseEnter={() => setHovered('logout')}
            onMouseLeave={() => setHovered('')}
            style={{
              width: '100%',
              padding: rail ? '10px 8px' : '8px 14px',
              borderRadius: '10px',
              border: `1px solid ${colors.border}`,
              background: hovered === 'logout' ? colors.bg : 'transparent',
              color: colors.textPrimary,
              fontSize: rail ? '0' : '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'background 0.12s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: rail ? '44px' : undefined,
            }}
          >
            {rail ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
              t('nav:signOut')
            )}
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

const MobileTopBar = ({ onOpenMenu, menuOpen, storefrontUrl }) => {
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
      {storefrontUrl ? (
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('nav:viewStore')}
          title={t('nav:viewStore')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            color: colors.primary,
            flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {externalLinkIcon}
        </a>
      ) : null}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());
  const storefrontUrl = useMemo(() => getStorefrontUrl(), []);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => !v);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore quota / private mode */
    }
  }, [sidebarCollapsed]);

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

  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const mainPadding = isAuthPage
    ? '0'
    : isMobile
      ? '20px 16px 28px'
      : '36px 40px';

  // In LTR the sidebar should sit on the left (default row), in RTL on the right (row-reverse so it
  // appears on the inline-end side visually). This keeps "natural" RTL layout for Hebrew without
  // breaking the LTR English layout.
  const shellDirection = isRtl ? 'row-reverse' : 'row';

  /** Desktop + sidebar: lock shell to viewport so sidebar and main scroll independently */
  const layoutScrollLocked = showSidebar && !isMobile;

  return (
    <>
      <PageTransition isLoading={initialLoad} />
      <style>{`
        @media ${MOBILE_MEDIA} {
          .admin-mobile-topbar { display: flex !important; }
        }
        .admin-sidebar-collapse-toggle:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .scrollbar-hidden {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          flexDirection: shellDirection,
          minHeight: layoutScrollLocked ? '100vh' : '100vh',
          height: layoutScrollLocked ? '100vh' : undefined,
          maxHeight: layoutScrollLocked ? '100vh' : undefined,
          overflow: layoutScrollLocked ? 'hidden' : undefined,
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
            desktopCollapsed={sidebarCollapsed}
            onToggleDesktopCollapse={toggleSidebarCollapsed}
            storefrontUrl={storefrontUrl}
          />
        )}
        <main
          style={{
            flex: 1,
            padding: mainPadding,
            minWidth: 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            ...(layoutScrollLocked
              ? {
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  minHeight: 0,
                  height: '100%',
                  maxHeight: '100%',
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch',
                }
              : {
                  overflow: 'auto',
                }),
          }}
        >
          {showSidebar && isMobile && (
            <MobileTopBar onOpenMenu={openMobileNav} menuOpen={mobileNavOpen} storefrontUrl={storefrontUrl} />
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
