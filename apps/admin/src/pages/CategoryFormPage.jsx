import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createCategory } from "../services/categoryService";
import { useToast } from "../features/toast/ToastContext";

const emptyName = () => ({ ar: "", he: "", en: "" });

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  borderLight: "#f0ece6",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  error: "#991b1b",
  errorBg: "#fef2f2",
  errorBorder: "#fecaca",
};

const fontStack =
  "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const inputBase = {
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1.5px solid ${colors.border}`,
  fontSize: "15px",
  lineHeight: 1.45,
  color: colors.textPrimary,
  background: colors.surface,
  outline: "none",
  fontFamily: fontStack,
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "14px",
  fontWeight: 500,
  color: colors.textSecondary,
};

const cardStyle = {
  background: colors.surface,
  border: `1px solid ${colors.border}`,
  borderRadius: "14px",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const Field = ({ label, hint, children }) => (
  <div style={labelStyle}>
    <span>{label}</span>
    {children}
    {hint && (
      <span style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.5 }}>{hint}</span>
    )}
  </div>
);

const CategoryFormPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation(["categories", "common"]);
  const [name, setName] = useState(emptyName);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  const inputStyle = (field) => ({
    ...inputBase,
    ...(focused === field
      ? { borderColor: colors.primary, boxShadow: "0 0 0 3px rgba(30,107,60,0.12)" }
      : {}),
  });

  const focus = (f) => () => setFocused(f);
  const blur = () => setFocused(null);

  const onNameChange = (lang) => (e) => {
    const v = e.target.value;
    setName((prev) => ({ ...prev, [lang]: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await createCategory({
        name: {
          ar: name.ar.trim(),
          he: name.he.trim(),
          en: name.en.trim(),
        },
        description: description.trim(),
        isActive,
        isFrozen,
      });
      showToast(t("categories:form.toasts.created"));
      navigate("/categories", { replace: true });
    } catch (err) {
      const message = err.userMessage || err.message || t("categories:form.toasts.createFailed");
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px", width: "100%", boxSizing: "border-box", minWidth: 0, fontFamily: fontStack }}>
      <style>{`
        @keyframes categoryFormSpin {
          to { transform: rotate(360deg); }
        }
        .category-form-back:focus-visible,
        .category-form-submit:focus-visible,
        .category-form-cancel:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .category-form-spinner {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          animation: categoryFormSpin 0.9s linear infinite;
          display: inline-block;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: "-0.3px",
            }}
          >
            {t("categories:form.title")}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: colors.textMuted, lineHeight: 1.5 }}>
            {t("categories:form.subtitle")}
          </p>
        </div>
        <Link
          to="/categories"
          className="category-form-back"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "10px",
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            color: colors.textPrimary,
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "background 0.15s, border-color 0.15s",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.bg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surface;
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t("common:back")}
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "10px",
            background: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
            fontSize: "14px",
            lineHeight: 1.5,
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={cardStyle}>
          <h3
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 700,
              color: colors.textPrimary,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("categories:form.sectionTitle")}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>
              {t("categories:form.fields.nameAllLangs")}
            </span>
            <Field label={t("categories:form.fields.nameAr")}>
              <input
                value={name.ar}
                onChange={onNameChange("ar")}
                required
                minLength={2}
                maxLength={80}
                onFocus={focus("nameAr")}
                onBlur={blur}
                style={inputStyle("nameAr")}
                dir="rtl"
                autoComplete="off"
              />
            </Field>
            <Field label={t("categories:form.fields.nameHe")}>
              <input
                value={name.he}
                onChange={onNameChange("he")}
                required
                minLength={2}
                maxLength={80}
                onFocus={focus("nameHe")}
                onBlur={blur}
                style={inputStyle("nameHe")}
                dir="rtl"
                autoComplete="off"
              />
            </Field>
            <Field label={t("categories:form.fields.nameEn")} hint={t("categories:form.fields.nameEnHint")}>
              <input
                value={name.en}
                onChange={onNameChange("en")}
                required
                minLength={2}
                maxLength={80}
                onFocus={focus("nameEn")}
                onBlur={blur}
                style={inputStyle("nameEn")}
                dir="ltr"
                autoComplete="off"
              />
            </Field>
          </div>

          <Field label={t("categories:form.fields.description")} hint={t("categories:form.fields.descriptionHint")}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              onFocus={focus("description")}
              onBlur={blur}
              style={{ ...inputStyle("description"), resize: "vertical", minHeight: "96px" }}
            />
          </Field>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingTop: "4px",
            }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>{t("categories:form.fields.status")}</span>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                color: colors.textPrimary,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: colors.primary, cursor: "pointer" }}
              />
              {t("categories:form.fields.active")}
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                color: colors.textPrimary,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isFrozen}
                onChange={(e) => setIsFrozen(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: colors.primary, cursor: "pointer" }}
              />
              {t("categories:form.fields.frozen")}
            </label>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "12px" }}>
          <button
            type="submit"
            className="category-form-submit"
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              flex: "1 1 200px",
              minWidth: 0,
              padding: "12px 20px",
              borderRadius: "10px",
              border: "none",
              background: submitting ? colors.border : colors.primary,
              color: submitting ? colors.textMuted : colors.textInverse,
              fontSize: "15px",
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 4px 14px rgba(30,107,60,0.28)",
              fontFamily: fontStack,
              transition: "background 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = colors.primaryHover;
            }}
            onMouseLeave={(e) => {
              if (!submitting) e.currentTarget.style.background = colors.primary;
            }}
          >
            {submitting && (
              <svg
                className="category-form-spinner"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M21 12a9 9 0 1 1-6.22-8.56" />
              </svg>
            )}
            {submitting ? t("categories:form.buttons.saving") : t("categories:form.buttons.submit")}
          </button>
          <button
            type="button"
            className="category-form-cancel"
            onClick={() => navigate("/products")}
            disabled={submitting}
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              border: `1px solid ${colors.border}`,
              background: colors.surface,
              color: colors.textPrimary,
              fontSize: "15px",
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: fontStack,
              transition: "background 0.15s, border-color 0.15s",
              flex: "0 1 auto",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.background = colors.bg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = colors.surface;
            }}
          >
            {t("categories:form.buttons.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryFormPage;
