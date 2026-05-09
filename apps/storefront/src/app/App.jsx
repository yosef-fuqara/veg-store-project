import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "../components/common/PageTransition";
import AbuAlAnasLogo from "../components/common/Logo";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Footer from "../components/Footer";
import RequireAuth from "../components/RequireAuth";
import { useDir } from "../i18n/useDir";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../features/cart/CartContext";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import OrderConfirmationPage from "../pages/OrderConfirmationPage";
import RegisterPage from "../pages/RegisterPage";

const colors = {
  primary:        '#1e6b3c',
  primaryHover:   '#165430',
  primarySurface: '#eef7f1',
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

// ─── Cart badge link ──────────────────────────────────────────────────────────
const CartBadge = ({ qty }) =>
  qty > 0 ? (
    <span style={{
      position: 'absolute',
      top: '-6px',
      insetInlineEnd: '-8px',
      minWidth: '16px',
      height: '16px',
      borderRadius: '9999px',
      background: colors.primary,
      color: '#fff',
      fontSize: '10px',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 3px',
      lineHeight: 1,
    }}>
      {qty > 99 ? '99+' : qty}
    </span>
  ) : null;

const CartNavLink = ({ t }) => {
  const { cart } = useCart();
  const qty = cart.items.reduce((s, i) => s + (i.quantity || 0), 0);
  return (
    <NavLink to="/cart" style={getLinkStyle}>
      {({ isActive }) => (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <CartIcon size={17} />
          <CartBadge qty={qty} />
          {t('cart')}
        </span>
      )}
    </NavLink>
  );
};

// Mobile cart icon (top bar — icon only)
const MobileCartIcon = ({ t }) => {
  const { cart } = useCart();
  const qty = cart.items.reduce((s, i) => s + (i.quantity || 0), 0);
  return (
    <NavLink
      to="/cart"
      aria-label={t('cart')}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '40px', height: '40px', borderRadius: '10px', color: colors.textPrimary, textDecoration: 'none',
        transition: 'background 0.15s' }}
    >
      <CartIcon size={20} />
      <CartBadge qty={qty} />
    </NavLink>
  );
};

// ─── AppNav ───────────────────────────────────────────────────────────────────
const AppNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('nav');
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

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
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}
          aria-label="Home"
        >
          <AbuAlAnasLogo size={52} />
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.2px' }}>
                {t('brandName')}
              </span>
              <span style={{ fontSize: '11px', color: colors.primary, fontWeight: 500, letterSpacing: '0.1px' }}>
                {t('brandTagline')}
              </span>
            </div>
          )}
        </Link>

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
              <NavLink to="/" end style={getLinkStyle}>{t('home')}</NavLink>
              <button
                onClick={handleProductsClick}
                style={{ ...navLinkBase, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('products')}
              </button>
              <CartNavLink t={t} />
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
              <NavLink to="/" end style={({ isActive }) => mobileItemStyle(isActive)}>{t('home')}</NavLink>
              <button onClick={handleProductsClick} style={mobileItemStyle()}>{t('products')}</button>
              <NavLink to="/cart" style={({ isActive }) => mobileItemStyle(isActive)}>{t('cart')}</NavLink>

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

const App = () => {
  useDir();

  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={appRootStyle}>
      <PageTransition isLoading={initialLoad} />
      <AppNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/orders/:id" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
