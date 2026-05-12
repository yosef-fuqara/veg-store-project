import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as authService from "../services/authService";
import { PasswordFieldWithToggle } from "../components/common/PasswordFieldWithToggle";

const colors = {
  primary: "#1e6b3c",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textInverse: "#ffffff",
  textMuted: "#a8a29e",
  bg: "#faf8f5",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca",
  success: "#166534",
  successSurface: "#ecfdf3",
  successBorder: "#bbf7d0"
};

const inputBase = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: "10px",
  border: `1.5px solid ${colors.border}`,
  fontSize: "15px",
  color: colors.textPrimary,
  background: colors.surface,
  outline: "none",
  display: "block",
  transition: "border-color 0.15s, box-shadow 0.15s"
};

const inputFocused = {
  ...inputBase,
  borderColor: colors.primary,
  boxShadow: "0 0 0 3px rgba(30,107,60,0.12)"
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "14px",
  fontWeight: 600,
  color: colors.textSecondary
};

const ResetPasswordPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    const raw = searchParams.get("token");
    if (raw) {
      setToken(raw);
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    if (!token) {
      setError(t("resetPasswordMissingToken"));
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.userMessage || t("resetPasswordError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "clamp(32px, 8vh, 72px) 20px 48px",
        background: colors.bg
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <div
          style={{
            background: `linear-gradient(to bottom, #f2fbf5 0%, ${colors.surface} 90px)`,
            border: `1px solid ${colors.border}`,
            borderTop: `1px solid ${colors.primaryBorder}`,
            borderRadius: "20px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            padding: "32px"
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "26px",
                fontWeight: 800,
                color: colors.textPrimary,
                letterSpacing: "-0.3px",
                lineHeight: 1.2
              }}
            >
              {t("resetPasswordTitle")}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: colors.textSecondary, lineHeight: 1.5 }}>
              {t("resetPasswordSubtitle")}
            </p>
          </div>

          {!token && (
            <div
              role="alert"
              style={{
                marginBottom: "16px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: colors.errorSurface,
                border: `1px solid ${colors.errorBorder}`,
                color: colors.error,
                fontSize: "13.5px",
                lineHeight: 1.5
              }}
            >
              {t("resetPasswordMissingToken")}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={labelStyle}>
              {t("newPassword")}
              <PasswordFieldWithToggle
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                inputStyle={focused === "password" ? inputFocused : inputBase}
              />
            </label>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    role="alert"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: colors.errorSurface,
                      border: `1px solid ${colors.errorBorder}`,
                      color: colors.error,
                      fontSize: "13.5px",
                      lineHeight: 1.5
                    }}
                  >
                    {error}
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    role="status"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: colors.successSurface,
                      border: `1px solid ${colors.successBorder}`,
                      color: colors.success,
                      fontSize: "13.5px",
                      lineHeight: 1.5
                    }}
                  >
                    {t("resetPasswordSuccess")}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting || !token}
              whileHover={!submitting && token ? { scale: 1.02 } : {}}
              whileTap={!submitting && token ? { scale: 0.97 } : {}}
              transition={{ duration: 0.12 }}
              style={{
                marginTop: "6px",
                padding: "12px 20px",
                borderRadius: "10px",
                border: "none",
                background: submitting || !token ? colors.border : colors.primary,
                color: submitting || !token ? colors.textMuted : colors.textInverse,
                fontSize: "15px",
                fontWeight: 600,
                cursor: submitting || !token ? "not-allowed" : "pointer",
                boxShadow: submitting || !token ? "none" : "0 4px 14px rgba(30,107,60,0.30)",
                width: "100%",
                letterSpacing: "0.1px"
              }}
            >
              {submitting ? t("resetPasswordSaving") : t("resetPasswordSubmit")}
            </motion.button>
          </form>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "18px",
              borderTop: `1px solid ${colors.border}`,
              textAlign: "center",
              fontSize: "14px",
              color: colors.textSecondary
            }}
          >
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
              style={{ color: colors.primary, fontWeight: 700, textDecoration: "none" }}
            >
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
