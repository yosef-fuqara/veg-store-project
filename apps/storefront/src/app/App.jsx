import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Phone } from "lucide-react";
import PageTransition from "../components/common/PageTransition";
import AbuAlAnasLogo from "../components/common/Logo";
import { STORE_CONTACT_PHONES } from "../config/storeContactPhones";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { HeaderStoreNavigation } from "../components/StoreNavigation";
import Footer from "../components/Footer";
import PromotionPopup from "../components/PromotionPopup";
import StoreClosedSection from "../components/StoreClosedSection";
import StoreClosedEntryModal from "../components/StoreClosedEntryModal";
import RequireAuth from "../components/RequireAuth";
import { useDir } from "../i18n/useDir";
import { useAuth } from "../features/auth/AuthContext";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import { useCartVisualFeedback } from "../features/cart/CartVisualFeedbackContext";
import { useCartDrawer } from "../features/cart/CartDrawerContext";
import { CartDrawerHost } from "../components/CartDrawer";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import RegisterPage from "../pages/RegisterPage";

const colors = {
  primary:        '#1e6b3c',
  primaryHover:   '#165430',
  primarySurface: '#eef7f1',
  primaryBorder:  '#a3cfb4',
  border:         '#e8e3dc',
  bg:             '#faf8f5',
  surface:        '#ffffff',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
};

const appRootStyle = {
  minHeight: '100vh',
  background: colors.bg,
  fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  color: colors.textPrimary,
};

const NAV_HEIGHT = 64;

// ─── Breakpoint hook ─────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// ─── Icons ───────────────────────────────────────────────────────────────────
const CartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const MenuIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    {open ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </>
    ) : (
      <>
        <line x1="3" y1="8" x2="21" y2="8"/>
        <line x1="3" y1="16" x2="21" y2="16"/>
      </>
    )}
  </svg>
);

// ─── NavLink style helpers ────────────────────────────────────────────────────
const navLinkBase = {
  fontSize: '14px',
  fontWeight: 500,
  color: colors.textSecondary,
  textDecoration: 'none',
  padding: '6px 11px',
  borderRadius: '6px',
  transition: 'color 0.15s, background 0.15s',
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
};
const navLinkActive = {
  ...navLinkBase,
  color: colors.primary,
  background: colors.primarySurface,
  fontWeight: 600,
};
const getLinkStyle = ({ isActive }) => (isActive ? navLinkActive : navLinkBase);

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  lg: '0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.05)',
  primary: '0 4px 14px rgba(30,107,60,0.30)',
};

// Mobile menu item style
const mobileItemStyle = (isActive = false) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: isActive ? 600 : 500,
  color: isActive ? colors.primary : colors.textPrimary,
  background: isActive ? colors.primarySurface : 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'start',
  width: '100%',
  transition: 'background 0.12s, color 0.12s',
});

/** Cart icon target for fly animation + pulse; no pulse on first paint (bumpKey === 0). */
const CartAnchorPulse = ({ bumpKey, anchorRef, inlineFlexStyle, children }) => {
  if (bumpKey === 0) {
    return (
      <span ref={anchorRef} style={inlineFlexStyle}>
        {children}
      </span>
    );
  }
  return (
    <motion.span
      key={`cart-pulse-${bumpKey}`}
      ref={anchorRef}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.14, 1] }}
      transition={{ duration: 0.42, ease: [0.25, 0.1, 0.25, 1] }}
      style={inlineFlexStyle}
    >
      {children}
    </motion.span>
  );
};

const CartNavButton = ({ t }) => {
  const { openCartDrawer } = useCartDrawer();
  const { desktopCartAnchorRef, cartBumpKey } = useCartVisualFeedback();
  return (
    <button
      type="button"
      onClick={() => openCartDrawer()}
      style={{ ...navLinkBase, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <CartAnchorPulse
          bumpKey={cartBumpKey}
          anchorRef={desktopCartAnchorRef}
          inlineFlexStyle={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        >
          <CartIcon size={17} />
        </CartAnchorPulse>
        {t('cart')}
      </span>
    </button>
  );
};

// Mobile cart icon (top bar — icon only)
const MobileCartIcon = ({ t }) => {
  const { openCartDrawer } = useCartDrawer();
  const { mobileCartAnchorRef, cartBumpKey } = useCartVisualFeedback();
  return (
    <button
      type="button"
      aria-label={t('cart')}
      onClick={() => openCartDrawer()}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '40px', height: '40px', borderRadius: '10px', color: colors.textPrimary,
        border: 'none', background: 'transparent',
        transition: 'background 0.15s', cursor: 'pointer'
      }}
    >
      <CartAnchorPulse
        bumpKey={cartBumpKey}
        anchorRef={mobileCartAnchorRef}
        inlineFlexStyle={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CartIcon size={20} />
      </CartAnchorPulse>
    </button>
  );
};

const NAV_PHONE_POPOVER_ID = 'nav-phone-contact-popover';

/** Phone icon + popover with STORE_CONTACT_PHONES tel: links; closes on outside click, Escape, route change, or mobile menu open. */
const NavPhonePopover = ({ t, dir, menuOpen }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (menuOpen) setOpen(false);
  }, [menuOpen]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const el = wrapRef.current;
      const target = /** @type {Node | null} */ (e.target);
      if (el && target && !el.contains(target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const label = t('home:footer.phoneLabel');
  const iconBtnStyle = (expanded) => ({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: expanded ? colors.primarySurface : 'transparent',
    color: expanded ? colors.primary : colors.textPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  });

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={NAV_PHONE_POPOVER_ID}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        style={iconBtnStyle(open)}
      >
        <Phone size={20} strokeWidth={2} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="nav-phone-pop"
            id={NAV_PHONE_POPOVER_ID}
            role="dialog"
            aria-label={label}
            dir={dir}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              insetInlineEnd: 0,
              minWidth: 220,
              maxWidth: 'min(92vw, 280px)',
              padding: '14px 16px',
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              boxShadow: shadow.lg,
              zIndex: 150,
              boxSizing: 'border-box',
            }}
          >
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 12,
                fontWeight: 600,
                color: colors.textSecondary,
                letterSpacing: '0.02em',
                lineHeight: 1.35,
              }}
            >
              {label}
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {STORE_CONTACT_PHONES.map(({ display, tel }) => (
                <li key={tel}>
                  <a
                    href={`tel:${tel}`}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'block',
                      fontSize: 15,
                      fontWeight: 600,
                      color: colors.primary,
                      textDecoration: 'none',
                      padding: '8px 10px',
                      marginInline: '-10px',
                      borderRadius: 8,
                      unicodeBidi: 'plaintext',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.primarySurface;
                      e.currentTarget.style.color = colors.primaryHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = colors.primary;
                    }}
                  >
                    {display}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── AppNav ───────────────────────────────────────────────────────────────────
const AppNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openCartDrawer } = useCartDrawer();
  const { t, i18n } = useTranslation(['nav', 'home']);
  const lang = String(i18n.language || 'he').split('-')[0].toLowerCase();
  const dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const { settings: storeSettings, loading: storeSettingsLoading } = useStoreSettings();

  const navStoreHoursCompact = useMemo(() => {
    if (storeSettingsLoading || !storeSettings) return null;
    const DEFAULT_OPEN = "09:00";
    const DEFAULT_CLOSE = "21:00";
    const open = String(storeSettings.operatingOpenLocal || "").trim();
    const close = String(storeSettings.operatingCloseLocal || "").trim();
    if (!open || !close || open === close) return null;
    const isDefaultPair = open === DEFAULT_OPEN && close === DEFAULT_CLOSE;
    const shouldShow = storeSettings.operatingHoursEnabled === true || !isDefaultPair;
    if (!shouldShow) return null;
    return `${open}\u2013${close}`;
  }, [storeSettings, storeSettingsLoading]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleProductsClick = () => {
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 320);
    } else {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /** Home nav + logo: on the homepage, same-route clicks do not run ScrollToTop — scroll up explicitly. */
  const handleHomeNavClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: `${NAV_HEIGHT}px`,
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadow.sm,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: '8px',
      }}>

        {/* Brand */}
        <Link
          to="/"
          onClick={handleHomeNavClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0,
            minWidth: 0,
          }}
          aria-label="Home"
        >
          <AbuAlAnasLogo size={52} />
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, minWidth: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.2px' }}>
                {t('brandName')}
              </span>
              <span style={{ fontSize: '11px', color: colors.primary, fontWeight: 500, letterSpacing: '0.1px' }}>
                {t('brandTagline')}
              </span>
            </div>
          )}
        </Link>

        <div
          dir={dir}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          <NavPhonePopover t={t} dir={dir} menuOpen={menuOpen} />
          {navStoreHoursCompact ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                minWidth: 0,
                flexShrink: 1,
                maxWidth: isMobile ? 200 : 320,
              }}
            >
              <span
                title={`${t('nav:storeHoursLabel')} ${navStoreHoursCompact}`}
                style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 600,
                  color: colors.textSecondary,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                  flex: '1 1 auto',
                }}
                aria-label={`${t('nav:storeHoursLabel')} ${navStoreHoursCompact}`}
              >
                {t('nav:storeHoursLabel')} {navStoreHoursCompact}
              </span>
              <HeaderStoreNavigation menuOpen={menuOpen} />
            </span>
          ) : null}
        </div>

        <div style={{ flex: 1 }} />

        {isMobile ? (
          /* ── Mobile controls ──────────────────────────────── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <MobileCartIcon t={t} />
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                width: '40px', height: '40px',
                borderRadius: '10px', border: 'none',
                background: menuOpen ? colors.primarySurface : 'transparent',
                color: menuOpen ? colors.primary : colors.textPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <MenuIcon open={menuOpen} />
            </button>
          </div>
        ) : (
          /* ── Desktop nav ────────────────────────────────── */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <NavLink to="/" end style={getLinkStyle} onClick={handleHomeNavClick}>{t('home')}</NavLink>
              <button
                onClick={handleProductsClick}
                style={{ ...navLinkBase, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('products')}
              </button>
              {user && <NavLink to="/orders" style={getLinkStyle}>{t('orders')}</NavLink>}
              <CartNavButton t={t} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <LanguageSwitcher />
              {user ? (
                <>
                  <span style={{
                    fontSize: '13px', color: colors.textSecondary, fontWeight: 500,
                    whiteSpace: 'nowrap', maxWidth: '140px',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {t('greeting', { name: user.name })}
                  </span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => { logout(); navigate('/', { replace: true }); }}
                    style={{
                      padding: '6px 16px', borderRadius: '9999px',
                      border: `1.5px solid ${colors.primary}`,
                      background: 'transparent', color: colors.primary,
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {t('logout')}
                  </motion.button>
                </>
              ) : (
                <>
                  <NavLink to="/login" style={getLinkStyle}>{t('login')}</NavLink>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.12 }}>
                    <Link
                      to="/register"
                      style={{
                        display: 'inline-block',
                        padding: '7px 18px', borderRadius: '9999px',
                        background: colors.primary, color: '#fff',
                        fontSize: '13px', fontWeight: 600,
                        textDecoration: 'none',
                        boxShadow: shadow.primary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('register')}
                    </Link>
                  </motion.div>
                </>
              )}
            </div>
          </>
        )}
      </nav>

      {/* ── Mobile menu ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0, top: `${NAV_HEIGHT}px`,
                background: 'rgba(0,0,0,0.25)',
                backdropFilter: 'blur(2px)',
                zIndex: 98,
              }}
            />
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              style={{
                position: 'fixed',
                top: `${NAV_HEIGHT}px`,
                insetInlineStart: 0,
                insetInlineEnd: 0,
                background: colors.surface,
                borderBottom: `1px solid ${colors.border}`,
                boxShadow: shadow.lg,
                padding: '12px',
                zIndex: 99,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <NavLink to="/" end style={({ isActive }) => mobileItemStyle(isActive)} onClick={handleHomeNavClick}>{t('home')}</NavLink>
              <button onClick={handleProductsClick} style={mobileItemStyle()}>{t('products')}</button>
              {user && <NavLink to="/orders" style={({ isActive }) => mobileItemStyle(isActive)}>{t('orders')}</NavLink>}
              <button
                type="button"
                onClick={() => { openCartDrawer(); setMenuOpen(false); }}
                style={mobileItemStyle()}
              >
                {t('cart')}
              </button>

              <div style={{ height: '1px', background: colors.border, margin: '8px 0' }} />

              <div style={{ padding: '4px 14px 8px' }}>
                <LanguageSwitcher />
              </div>

              {user ? (
                <>
                  <div style={{ padding: '4px 14px', fontSize: '13px', color: colors.textMuted }}>
                    {t('greeting', { name: user.name })}
                  </div>
                  <button
                    type="button"
                    onClick={() => { logout(); navigate('/', { replace: true }); setMenuOpen(false); }}
                    style={{ ...mobileItemStyle(), color: colors.textSecondary }}
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" style={({ isActive }) => mobileItemStyle(isActive)}>{t('login')}</NavLink>
                  <Link
                    to="/register"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '4px 0 2px', padding: '13px 14px', borderRadius: '10px',
                      background: colors.primary, color: '#fff',
                      fontSize: '15px', fontWeight: 600, textDecoration: 'none',
                      boxShadow: shadow.primary,
                    }}
                  >
                    {t('register')}
                  </Link>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const STORE_CLOSED_POPUP_SESSION = "vegstore.storeClosedEntryDismissed";

const App = () => {
  useDir();
  const { isStoreClosed, settings, loading: storeSettingsLoading } = useStoreSettings();

  const [storeClosedPopupDismissed, setStoreClosedPopupDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORE_CLOSED_POPUP_SESSION) === "1";
  });

  useEffect(() => {
    if (settings?.isStoreOpen !== false && typeof window !== "undefined") {
      sessionStorage.removeItem(STORE_CLOSED_POPUP_SESSION);
      setStoreClosedPopupDismissed(false);
    }
  }, [settings?.isStoreOpen]);

  const dismissStoreClosedPopup = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORE_CLOSED_POPUP_SESSION, "1");
    }
    setStoreClosedPopupDismissed(true);
  }, []);

  const storeClosedReady = !storeSettingsLoading && isStoreClosed && settings;
  const showStoreClosedBanner = Boolean(storeClosedReady && storeClosedPopupDismissed);

  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={appRootStyle}>
      <PageTransition isLoading={initialLoad} />
      <AppNav />
      {storeClosedReady ? (
        <StoreClosedEntryModal
          open={!storeClosedPopupDismissed}
          settings={settings}
          onDismiss={dismissStoreClosedPopup}
        />
      ) : null}
      {showStoreClosedBanner ? (
        <StoreClosedSection settings={settings} variant="banner" />
      ) : null}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
      </Routes>
      <Footer />
      {!isStoreClosed ? <PromotionPopup /> : null}
      <CartDrawerHost />
    </div>
  );
};

export default App;
