import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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

// ─── NavLink style helpers ────────────────────────────────────────────────────
const navLinkBase = {
  fontSize: '15px',
  fontWeight: 500,
  color: colors.textSecondary,
  textDecoration: 'none',
  padding: '6px 12px',
  borderRadius: '8px',
  transition: 'color 0.15s, background 0.15s',
  whiteSpace: 'nowrap',
};
const navLinkActive = { ...navLinkBase, color: colors.primary, background: colors.primarySurface };
const getLinkStyle = ({ isActive }) => (isActive ? navLinkActive : navLinkBase);

// ─── Cart badge ───────────────────────────────────────────────────────────────
const CartLink = ({ t }) => {
  const { cart } = useCart();
  const totalQty = cart.items.reduce((s, i) => s + (i.quantity || 0), 0);

  return (
    <NavLink to="/cart" style={getLinkStyle}>
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        🛒
        {totalQty > 0 && (
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
            {totalQty > 99 ? '99+' : totalQty}
          </span>
        )}
      </span>
      {' '}{t('cart')}
    </NavLink>
  );
};

// ─── AppNav ───────────────────────────────────────────────────────────────────
const AppNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('nav');

  const handleProductsClick = () => {
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
    <nav style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center',
      padding: '0 24px',
      height: '64px',
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '16px',
    }}>

      {/* ── Brand ─────────────────────────────────────────────── */}
      <Link
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}
        aria-label="Home"
      >
        <AbuAlAnasLogo size={40} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.2px' }}>
            אבי אל-אנס
          </span>
          <span style={{ fontSize: '11px', color: colors.primary, fontWeight: 500, letterSpacing: '0.2px' }}>
            {t('brandTagline')}
          </span>
        </div>
      </Link>

      {/* ── Center nav links ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
        <NavLink to="/" end style={getLinkStyle}>{t('home')}</NavLink>

        <button
          onClick={handleProductsClick}
          style={{
            ...navLinkBase,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {t('products')}
        </button>

        <CartLink t={t} />
      </div>

      {/* ── End: language + auth ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <LanguageSwitcher />

        {user ? (
          <>
            <span style={{ fontSize: '14px', color: colors.textSecondary, fontWeight: 500, whiteSpace: 'nowrap' }}>
              {t('greeting', { name: user.name })}
            </span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.12 }}
              onClick={() => { logout(); navigate('/', { replace: true }); }}
              style={{
                padding: '7px 16px',
                borderRadius: '9999px',
                border: `1.5px solid ${colors.primary}`,
                background: 'transparent',
                color: colors.primary,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t('logout')}
            </motion.button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              style={getLinkStyle}
            >
              {t('login')}
            </NavLink>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.12 }}>
              <Link
                to="/register"
                style={{
                  display: 'inline-block',
                  padding: '7px 18px',
                  borderRadius: '9999px',
                  background: colors.primary,
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 10px rgba(30,107,60,0.25)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('register')}
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </nav>
  );
};

const App = () => {
  useDir();

  // Show branded intro on every fresh load/refresh.
  // 2200ms: enough for the full logo animation (last element done at ~2.0s) + a brief pause.
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setInitialLoad(false), 2200);
    return () => clearTimeout(t);
  }, []);

  const isLoading = initialLoad;

  return (
    <div style={appRootStyle}>
      <PageTransition isLoading={isLoading} />
      <AppNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              <CartPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <RequireAuth>
              <OrderConfirmationPage />
            </RequireAuth>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
