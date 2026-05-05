import { Routes, Route, Link, useNavigate } from "react-router-dom";
import RequireAuth from "../components/RequireAuth";
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

  return (
    <nav style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
      <Link to="/">Home</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/checkout">Checkout</Link>
      {user ? (
        <>
          <span style={{ marginLeft: "auto" }}>Hi, {user.name}</span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginLeft: "auto" }}>
            Login
          </Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
};

const App = () => (
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

export default App;
