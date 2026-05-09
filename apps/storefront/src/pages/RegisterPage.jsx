import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext";

const colors = {
  primary:      '#1e6b3c',
  surface:      '#ffffff',
  border:       '#e8e3dc',
  textPrimary:  '#1c1917',
  textSecondary:'#57534e',
  textInverse:  '#ffffff',
  textMuted:    '#a8a29e',
  error:        '#991b1b',
  errorSurface: '#fef2f2',
  errorBorder:  '#fecaca',
};

const fieldErrorsFromResponse = (err) => {
  const fields = err.response?.data?.details?.fields;
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, item) => {
    const key = Array.isArray(item.path) ? item.path.join(".") : item.path;
    if (key && !acc[key]) acc[key] = item.message;
    return acc;
  }, {});
};

const outerStyle = {
  minHeight: 'calc(100vh - 64px)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '48px 24px',
};

const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: '20px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  padding: '32px',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: 500,
  color: colors.textSecondary,
};

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '15px',
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  display: 'block',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const inputFocused = {
  ...inputBase,
  borderColor: colors.primary,
  boxShadow: '0 0 0 3px rgba(30,107,60,0.12)',
};

const inputError = {
  ...inputBase,
  borderColor: colors.error,
};

const FieldError = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.span
        key="field-error"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.15 }}
        style={{ overflow: 'hidden', display: 'block' }}
      >
        <span style={{ fontSize: '12px', color: colors.error, display: 'block', marginTop: '2px' }}>
          {message}
        </span>
      </motion.span>
    )}
  </AnimatePresence>
);

const RegisterPage = () => {
  const { register } = useAuth();
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);

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

  const inputStyle = (field) => {
    if (fieldErrors[field]) return inputError;
    if (focused === field) return inputFocused;
    return inputBase;
  };

  const focus = (field) => () => setFocused(field);
  const blur = () => setFocused(null);

  return (
    <div style={outerStyle}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div style={cardStyle}>
          <h2
            style={{
              margin: '0 0 24px',
              fontSize: '24px',
              lineHeight: '32px',
              fontWeight: 700,
              color: colors.textPrimary,
            }}
          >
            {t("registerTitle")}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={labelStyle}>
              {t("name")}
              <input
                value={form.name}
                onChange={update("name")}
                minLength={2}
                maxLength={80}
                required
                onFocus={focus("name")}
                onBlur={blur}
                style={inputStyle("name")}
              />
              <FieldError message={fieldErrors.name} />
            </label>

            <label style={labelStyle}>
              {t("phone")}
              <input
                value={form.phone}
                onChange={update("phone")}
                minLength={7}
                maxLength={20}
                required
                onFocus={focus("phone")}
                onBlur={blur}
                style={inputStyle("phone")}
              />
              <FieldError message={fieldErrors.phone} />
            </label>

            <label style={labelStyle}>
              {t("email")}
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                autoComplete="email"
                required
                onFocus={focus("email")}
                onBlur={blur}
                style={inputStyle("email")}
              />
              <FieldError message={fieldErrors.email} />
            </label>

            <label style={labelStyle}>
              {t("password")}
              <input
                type="password"
                value={form.password}
                onChange={update("password")}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                onFocus={focus("password")}
                onBlur={blur}
                style={inputStyle("password")}
              />
              <FieldError message={fieldErrors.password} />
            </label>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    role="alert"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: colors.errorSurface,
                      border: `1px solid ${colors.errorBorder}`,
                      color: colors.error,
                      fontSize: '14px',
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.96 } : {}}
              transition={{ duration: 0.12 }}
              style={{
                marginTop: '4px',
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: submitting ? colors.border : colors.primary,
                color: submitting ? colors.textMuted : colors.textInverse,
                fontSize: '15px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.30)',
                width: '100%',
              }}
            >
              {submitting ? t("creating") : t("register")}
            </motion.button>
          </form>

          <p style={{ margin: '20px 0 0', fontSize: '14px', color: colors.textSecondary }}>
            {t("alreadyHaveAccount")}{" "}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
              style={{ color: colors.primary, fontWeight: 600, textDecoration: 'none' }}
            >
              {t("login")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
