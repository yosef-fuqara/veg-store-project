import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, NavLink, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Phone, User } from "lucide-react";
import { getModalHoursBody } from "../utils/storeHoursDisplay";
import {
  STOREFRONT_BUSINESS_HOURS_ID,
  STOREFRONT_HEADER_POPOVER_Z,
  STOREFRONT_NAV_HEIGHT,
  scrollToBusinessHoursWhenReady,
} from "../utils/storefrontNavScroll";
import MobileHeaderPopover from "../components/MobileHeaderPopover";
import PageTransition from "../components/common/PageTransition";
import AbuAlAnasLogo from "../components/common/Logo";
import { STORE_CONTACT_PHONES } from "../config/storeContactPhones";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { HeaderStoreNavigation } from "../components/StoreNavigation";
import Footer from "../components/Footer";
import PromotionPopup from "../components/PromotionPopup";
import StoreClosedSection from "../components/StoreClosedSection";
import StoreClosedEntryModal from "../components/StoreClosedEntryModal";
import BusinessHoursModal from "../components/BusinessHoursModal";
import RequireAuth from "../components/RequireAuth";
import { useDir } from "../i18n/useDir";
import { useAuth } from "../features/auth/AuthContext";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import { useCartVisualFeedback } from "../features/cart/CartVisualFeedbackContext";
import { useCartDrawer } from "../features/cart/CartDrawerContext";
import { CartDrawerHost } from "../components/CartDrawer";
import ScrollNavigation from "../components/ScrollNavigation";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import RegisterPage from "../pages/RegisterPage";
import AccountLayout from "../layouts/AccountLayout";
import AccountDashboardPage from "../pages/account/AccountDashboardPage";
import AccountAddressesPage from "../pages/account/AccountAddressesPage";
import AccountFavoritesPage from "../pages/account/AccountFavoritesPage";
import AccountWhatsAppPage from "../pages/account/AccountWhatsAppPage";
import AccountProfilePage from "../pages/account/AccountProfilePage";
import AccountSettingsPage from "../pages/account/AccountSettingsPage";
import AccountPrivacyPage from "../pages/account/AccountPrivacyPage";
import LegalDocPage from "../pages/legal/LegalDocPage";
import UnsubscribePage from "../pages/legal/UnsubscribePage";

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
  fontFamily: 'var(--font-sans)',
  color: colors.textPrimary,
};

const NAV_HEIGHT = STOREFRONT_NAV_HEIGHT;

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
      animate={{ scale: [1, 1.2, 0.94, 1] }}
      transition={{ duration: 0.4, times: [0, 0.38, 0.68, 1], ease: [0.34, 1.4, 0.64, 1] }}
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
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (menuOpen) setOpen(false);
  }, [menuOpen]);

  useEffect(() => {
    if (isMobile || !open) return;
    const onPointerDown = (e) => {
      const anchor = anchorRef.current;
      const pop = popoverRef.current;
      const target = /** @type {Node | null} */ (e.target);
      if (
        target &&
        anchor &&
        !anchor.contains(target) &&
        !(pop && pop.contains(target))
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isMobile, open]);

  const label = t('home:footer.phoneLabel');
  const panelBaseStyle = {
    padding: '14px 16px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    boxShadow: shadow.lg,
    boxSizing: 'border-box',
  };
  const desktopPanelStyle = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    insetInlineEnd: 0,
    minWidth: 220,
    maxWidth: 'min(92vw, 280px)',
    zIndex: STOREFRONT_HEADER_POPOVER_Z,
  };
  const phoneLinks = (
    <>
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
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
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
    </>
  );
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
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={anchorRef}
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
      {isMobile ? (
        <MobileHeaderPopover
          anchorRef={anchorRef}
          popoverRef={popoverRef}
          open={open}
          onClose={() => setOpen(false)}
          id={NAV_PHONE_POPOVER_ID}
          ariaLabel={label}
          dir={dir}
          desiredWidth={240}
          panelStyle={panelBaseStyle}
        >
          {phoneLinks}
        </MobileHeaderPopover>
      ) : (
        <AnimatePresence>
          {open && (
            <motion.div
              key="nav-phone-pop"
              ref={popoverRef}
              id={NAV_PHONE_POPOVER_ID}
              role="dialog"
              aria-label={label}
              dir={dir}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ ...desktopPanelStyle, ...panelBaseStyle }}
            >
              {phoneLinks}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

// ─── AppNav ───────────────────────────────────────────────────────────────────
const AppNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { openCartDrawer } = useCartDrawer();
  const { t, i18n } = useTranslation(['nav', 'home']);
  const lang = String(i18n.language || 'he').split('-')[0].toLowerCase();
  const dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHoursOpen, setIsHoursOpen] = useState(false);
  const hoursAnchorRef = useRef(null);
  const { settings: storeSettings } = useStoreSettings();

  const modalHoursBody = useMemo(
    () =>
      getModalHoursBody(storeSettings, t('nav:storeHoursModalFallbackBody')),
    [storeSettings, t, i18n.language]
  );

  useEffect(() => {
    setMenuOpen(false);
    setIsHoursOpen(false);
  }, [location.pathname]);

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

  const handleBusinessHoursClick = () => {
    setMenuOpen(false);
    setIsHoursOpen((open) => !open);
  };

  /** Home nav + logo: on the homepage, same-route clicks do not run ScrollToTop — scroll up explicitly. */
  const handleHomeNavClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const navIconBtnStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: colors.textPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
    padding: 0,
  };

  return (
    <>
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 10px' : '0 24px',
        height: `${NAV_HEIGHT}px`,
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        boxShadow: shadow.sm,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        gap: isMobile ? '4px' : '8px',
        flexWrap: 'nowrap',
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
          <AbuAlAnasLogo size={isMobile ? 44 : 52} />
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
            gap: isMobile ? '2px' : '6px',
            flexShrink: isMobile ? 0 : 1,
            minWidth: 0,
            flexWrap: 'nowrap',
          }}
        >
          <NavPhonePopover t={t} dir={dir} menuOpen={menuOpen} />
          <button
            ref={hoursAnchorRef}
            type="button"
            aria-expanded={isHoursOpen}
            aria-haspopup="dialog"
            aria-label={t('nav:businessHoursAria')}
            title={t('nav:storeHoursLabel')}
            onClick={handleBusinessHoursClick}
            style={{
              ...navIconBtnStyle,
              background: isHoursOpen ? colors.primarySurface : navIconBtnStyle.background,
              color: isHoursOpen ? colors.primary : navIconBtnStyle.color,
            }}
          >
            <Clock size={20} strokeWidth={2} aria-hidden />
          </button>
          <HeaderStoreNavigation menuOpen={menuOpen} />
          {isMobile && <LanguageSwitcher compact menuOpen={menuOpen} />}
        </div>

        <div style={{ flex: 1 }} />

        {isMobile ? (
          /* ── Mobile controls ──────────────────────────────── */
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            {user ? (
              <NavLink
                to="/account"
                aria-label={t('account')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.textPrimary,
                  textDecoration: 'none',
                }}
              >
                <User size={20} strokeWidth={2} aria-hidden />
              </NavLink>
            ) : null}
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
              <CartNavButton t={t} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <LanguageSwitcher />
              {user ? (
                <NavLink
                  to="/account"
                  style={getLinkStyle}
                  aria-label={t('account')}
                  title={t('account')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <User size={17} strokeWidth={2} aria-hidden />
                    {t('account')}
                  </span>
                </NavLink>
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
              {user ? (
                <NavLink to="/account" style={({ isActive }) => mobileItemStyle(isActive)}>
                  <User size={18} strokeWidth={2} aria-hidden />
                  {t('account')}
                </NavLink>
              ) : null}
              <button
                type="button"
                onClick={() => { openCartDrawer(); setMenuOpen(false); }}
                style={mobileItemStyle()}
              >
                {t('cart')}
              </button>

              <div style={{ height: '1px', background: colors.border, margin: '8px 0' }} />

              {user ? null : (
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

      {isMobile && modalHoursBody ? (
        <MobileHeaderPopover
          anchorRef={hoursAnchorRef}
          open={isHoursOpen}
          onClose={() => setIsHoursOpen(false)}
          ariaLabel={t('nav:storeHoursLabel')}
          dir={dir}
          desiredWidth={320}
          panelStyle={{
            padding: '16px 18px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 12,
            boxShadow: shadow.lg,
          }}
        >
          <p
            style={{
              margin: '0 0 10px',
              fontSize: 12,
              fontWeight: 700,
              color: colors.textSecondary,
              letterSpacing: '0.02em',
              lineHeight: 1.35,
            }}
          >
            {t('nav:storeHoursLabel')}
          </p>
          <p
            style={{
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 10,
              background: colors.primarySurface,
              border: `1px solid ${colors.primaryBorder}`,
              color: colors.primary,
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            <Clock size={18} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
            <span>{modalHoursBody}</span>
          </p>
        </MobileHeaderPopover>
      ) : (
        <BusinessHoursModal
          open={isHoursOpen}
          onClose={() => setIsHoursOpen(false)}
          hoursBody={modalHoursBody}
        />
      )}
    </>
  );
};

const STORE_CLOSED_POPUP_SESSION = "vegstore.storeClosedEntryDismissed";

const App = () => {
  useDir();
  const location = useLocation();
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

  useEffect(() => {
    const hashId = location.hash.replace(/^#/, "");
    if (location.pathname !== "/" || hashId !== STOREFRONT_BUSINESS_HOURS_ID) return undefined;
    scrollToBusinessHoursWhenReady();
    return undefined;
  }, [location.pathname, location.hash]);

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
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<Navigate to="/account/orders" replace />} />
        <Route path="/orders/:id" element={<OrderConfirmationPage />} />
        <Route path="/terms" element={<LegalDocPage pageKey="terms" />} />
        <Route path="/privacy" element={<LegalDocPage pageKey="privacy" />} />
        <Route path="/shipping-policy" element={<LegalDocPage pageKey="shipping" />} />
        <Route path="/cancellation-policy" element={<LegalDocPage pageKey="cancellation" />} />
        <Route path="/accessibility" element={<LegalDocPage pageKey="accessibility" />} />
        <Route path="/customer-club" element={<LegalDocPage pageKey="customerClub" />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
        <Route
          path="/account"
          element={(
            <RequireAuth>
              <AccountLayout />
            </RequireAuth>
          )}
        >
          <Route index element={<AccountDashboardPage />} />
          <Route path="orders" element={<OrderHistoryPage embedded />} />
          <Route path="addresses" element={<AccountAddressesPage />} />
          <Route path="favorites" element={<AccountFavoritesPage />} />
          <Route path="whatsapp" element={<AccountWhatsAppPage />} />
          <Route path="privacy" element={<AccountPrivacyPage />} />
          <Route path="profile" element={<AccountProfilePage />} />
          <Route path="settings" element={<AccountSettingsPage />} />
        </Route>
      </Routes>
      <Footer />
      {!isStoreClosed ? <PromotionPopup /> : null}
      <CartDrawerHost />
      <ScrollNavigation />
    </div>
  );
};

export default App;
