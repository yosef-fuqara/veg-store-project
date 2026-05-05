import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const fieldErrorsFromResponse = (err) => {
  const fields = err.response?.data?.details?.fields;
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, item) => {
    const key = Array.isArray(item.path) ? item.path.join(".") : item.path;
    if (key && !acc[key]) acc[key] = item.message;
    return acc;
  }, {});
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/";

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setError(err.userMessage || "Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 420 }}>
      <h2>Create account</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <label>
          Name
          <input
            value={form.name}
            onChange={update("name")}
            minLength={2}
            maxLength={80}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          {fieldErrors.name ? (
            <small style={{ color: "crimson" }}>{fieldErrors.name}</small>
          ) : null}
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={update("phone")}
            minLength={7}
            maxLength={20}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          {fieldErrors.phone ? (
            <small style={{ color: "crimson" }}>{fieldErrors.phone}</small>
          ) : null}
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          {fieldErrors.email ? (
            <small style={{ color: "crimson" }}>{fieldErrors.email}</small>
          ) : null}
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            style={{ width: "100%", boxSizing: "border-box" }}
          />
          {fieldErrors.password ? (
            <small style={{ color: "crimson" }}>{fieldErrors.password}</small>
          ) : null}
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
      {error ? <p style={{ color: "crimson", marginTop: 12 }}>{error}</p> : null}
      <p style={{ marginTop: 16 }}>
        Already have an account?{" "}
        <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Login</Link>
      </p>
    </section>
  );
};

export default RegisterPage;
