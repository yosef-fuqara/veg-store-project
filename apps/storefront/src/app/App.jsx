import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const AppNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("nav");

  return (
    <nav
      style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1rem",
        flexWrap: "wrap",
        alignItems: "center"
      }}
    >
      <Link to="/">{t("home")}</Link>
      <Link to="/cart">{t("cart")}</Link>
      <Link to="/checkout">{t("checkout")}</Link>
      <LanguageSwitcher />
      {user ? (
        <>
          <span style={{ marginInlineStart: "auto" }}>{t("greeting", { name: user.name })}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            {t("logout")}
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginInlineStart: "auto" }}>
            {t("login")}
          </Link>
          <Link to="/register">{t("register")}</Link>
        </>
      )}
    </nav>
  );
};

const App = () => {
  useDir();

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
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
