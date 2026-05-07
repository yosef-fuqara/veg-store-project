import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("auth");
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
        setError(err.userMessage || t("registerFailed"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 420 }}>
      <h2>{t("registerTitle")}</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <label>
          {t("name")}
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
          {t("phone")}
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
          {t("email")}
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
          {t("password")}
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
          {submitting ? t("creating") : t("register")}
        </button>
      </form>
      {error ? <p style={{ color: "crimson", marginTop: 12 }}>{error}</p> : null}
      <p style={{ marginTop: 16 }}>
        {t("alreadyHaveAccount")}{" "}
        <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`}>{t("login")}</Link>
      </p>
    </section>
  );
};

export default RegisterPage;
