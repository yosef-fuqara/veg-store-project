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

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.userMessage || t("loginFailed"));
    } finally {
      setSubmitting(false);
    }
  };

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
            {t("loginTitle")}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={labelStyle}>
              {t("email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={focused === 'email' ? inputFocused : inputBase}
              />
            </label>

            <label style={labelStyle}>
              {t("password")}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                style={focused === 'password' ? inputFocused : inputBase}
              />
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
              {submitting ? t("loggingIn") : t("login")}
            </motion.button>
          </form>

          <p style={{ margin: '20px 0 0', fontSize: '14px', color: colors.textSecondary }}>
            {t("noAccount")}{" "}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirectTo)}`}
              style={{ color: colors.primary, fontWeight: 600, textDecoration: 'none' }}
            >
              {t("createOne")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
