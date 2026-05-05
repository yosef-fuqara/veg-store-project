import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.userMessage || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 420 }}>
      <h2>Login</h2>
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
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
      {error ? <p style={{ color: "crimson", marginTop: 12 }}>{error}</p> : null}
      <p style={{ marginTop: 16 }}>
        No account? <Link to={`/register?redirect=${encodeURIComponent(redirectTo)}`}>Create one</Link>
      </p>
    </section>
  );
};

export default LoginPage;
