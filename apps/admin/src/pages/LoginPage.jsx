import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { USER_ROLES } from "../constants/roles";
import { useToast } from "../features/toast/ToastContext";

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/products";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      if (user.role !== USER_ROLES.ADMIN) {
        showToast("This account is not an admin account.", "error");
        navigate("/unauthorized", { replace: true });
        return;
      }
      showToast("Signed in successfully.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.userMessage || "Login failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            minLength={8}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error ? <p style={{ color: "crimson", marginTop: 12 }}>{error}</p> : null}
    </section>
  );
};

export default LoginPage;
