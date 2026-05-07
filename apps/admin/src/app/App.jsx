import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import RequireAuth from "../components/RequireAuth";
import RequireAdmin from "../components/RequireAdmin";
import { useAuth } from "../features/auth/AuthContext";
import LoginPage from "../pages/LoginPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import AdminProductsPage from "../pages/AdminProductsPage";
import ProductFormPage from "../pages/ProductFormPage";

const AppNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <Link to="/products">Products</Link>
      {user ? (
        <>
          <span style={{ marginInlineStart: "auto" }}>
            {user.name || user.email} ({user.role})
          </span>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <Link to="/login" style={{ marginInlineStart: "auto" }}>
          Login
        </Link>
      )}
    </nav>
  );
};

const App = () => {
  return (
    <div
      style={{
        padding: "1rem",
        fontFamily: "sans-serif",
        maxWidth: 1200,
        margin: "0 auto"
      }}
    >
      <AppNav />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/products"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminProductsPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/products/new"
          element={
            <RequireAuth>
              <RequireAdmin>
                <ProductFormPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/products/:id/edit"
          element={
            <RequireAuth>
              <RequireAdmin>
                <ProductFormPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/products" replace />} />
      </Routes>
    </div>
  );
};

export default App;
