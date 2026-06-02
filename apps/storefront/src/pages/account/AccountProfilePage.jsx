import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "../../i18n";
import { useAuth } from "../../features/auth/AuthContext";
import { accountCardStyle, accountColors, accountInputStyle, accountPrimaryButtonStyle } from "../../features/account/accountTheme";
import * as accountService from "../../services/accountService";

const LANG_OPTIONS = [
  { code: "he", label: "עברית" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" }
];

const AccountProfilePage = () => {
  const { t, i18n } = useTranslation("account");
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "", preferredLanguage: "he" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      preferredLanguage: user.preferredLanguage || (i18n.language || "he").split("-")[0]
    });
  }, [user, i18n.language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const next = await accountService.updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        preferredLanguage: form.preferredLanguage
      });
      updateUser(next);
      i18n.changeLanguage(form.preferredLanguage);
      try {
        localStorage.setItem(STORAGE_KEY, form.preferredLanguage);
      } catch {
        /* ignore */
      }
      setMessage(t("profile.saved"));
    } catch (err) {
      setError(err.userMessage || t("profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>{t("profile.title")}</h2>
      </div>

      {message ? (
        <div role="status" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.successSurface, border: `1px solid ${accountColors.successBorder}`, color: accountColors.success, fontSize: "14px" }}>
          {message}
        </div>
      ) : null}
      {error ? (
        <div role="alert" style={{ padding: "12px 16px", borderRadius: "10px", background: accountColors.errorSurface, border: `1px solid ${accountColors.errorBorder}`, color: accountColors.error, fontSize: "14px" }}>
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "14px" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("profile.name")}
          <input value={form.name} required onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={accountInputStyle} maxLength={80} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("profile.phone")}
          <input value={form.phone} required onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={accountInputStyle} maxLength={20} dir="ltr" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("profile.email")}
          <input type="email" value={form.email} required onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={accountInputStyle} dir="ltr" />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("profile.language")}
          <select value={form.preferredLanguage} onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value }))} style={accountInputStyle}>
            {LANG_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: "13px", color: accountColors.textMuted }}>{t("profile.languageHint")}</span>
        </label>
        <button type="submit" disabled={busy} style={{ ...accountPrimaryButtonStyle, alignSelf: "flex-start", opacity: busy ? 0.7 : 1 }}>
          {t("profile.save")}
        </button>
      </form>
    </div>
  );
};

export default AccountProfilePage;
