import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import LanguageSwitcher from "../components/LanguageSwitcher";
import RequireAuth from "../components/RequireAuth";
import { useDir } from "../i18n/useDir";
import { useAuth } from "../features/auth/AuthContext";
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
};

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
};

const radius = {
  sm: '6px',
  md: '10px',
};

const weight = {
  medium:   500,
  semibold: 600,
};

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '0 24px',
  height: '64px',
  background: colors.surface,
  borderBottom: `1px solid ${colors.border}`,
  boxShadow: shadow.sm,
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const navLinkBase = {
  fontSize: '15px',
  fontWeight: weight.medium,
  color: colors.textSecondary,
  textDecoration: 'none',
  padding: '6px 10px',
  borderRadius: radius.sm,
  transition: 'color 0.15s, background 0.15s',
};

const navLinkActive = {
  ...navLinkBase,
  color: colors.primary,
  background: colors.primarySurface,
};

const getLinkStyle = ({ isActive }) => (isActive ? navLinkActive : navLinkBase);

const logoutBtnStyle = {
  padding: '8px 16px',
  borderRadius: radius.md,
  border: `1.5px solid ${colors.primary}`,
  background: 'transparent',
  color: colors.primary,
  fontSize: '14px',
  fontWeight: weight.semibold,
  cursor: 'pointer',
};

const appRootStyle = {
  minHeight: '100vh',
  background: colors.bg,
  fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  color: colors.textPrimary,
};

const AppNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("nav");

  return (
    <nav style={navStyle}>
      <NavLink to="/" style={getLinkStyle}>{t("home")}</NavLink>
      <NavLink to="/cart" style={getLinkStyle}>{t("cart")}</NavLink>
      <NavLink to="/checkout" style={getLinkStyle}>{t("checkout")}</NavLink>
      <LanguageSwitcher />
      {user ? (
        <>
          <span
            style={{
              marginInlineStart: 'auto',
              fontSize: '14px',
              color: colors.textSecondary,
              fontWeight: weight.medium,
            }}
          >
            {t("greeting", { name: user.name })}
          </span>
          <motion.button
            type="button"
            style={logoutBtnStyle}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.12 }}
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            {t("logout")}
          </motion.button>
        </>
      ) : (
        <>
          <NavLink
            to="/login"
            style={({ isActive }) => ({ ...getLinkStyle({ isActive }), marginInlineStart: 'auto' })}
          >
            {t("login")}
          </NavLink>
          <NavLink to="/register" style={getLinkStyle}>{t("register")}</NavLink>
        </>
      )}
    </nav>
  );
};

const App = () => {
  useDir();

  return (
    <div style={appRootStyle}>
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
    </div>
  );
};

export default App;
