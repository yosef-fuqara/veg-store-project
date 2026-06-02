import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/AuthContext";
import { PasswordFieldWithToggle } from "../../components/common/PasswordFieldWithToggle";
import { accountCardStyle, accountColors, accountGhostButtonStyle, accountInputStyle, accountPrimaryButtonStyle } from "../../features/account/accountTheme";
import * as accountService from "../../services/accountService";

const AccountSettingsPage = () => {
  const { t } = useTranslation("account");
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handlePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError(t("settings.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await accountService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage(t("settings.passwordChanged"));
    } catch (err) {
      setError(err.userMessage || t("settings.passwordError"));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ margin: "0 0 6px", fontSize: "22px", fontWeight: 700, color: accountColors.textPrimary }}>{t("settings.title")}</h2>
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

      <form onSubmit={handlePassword} style={{ ...accountCardStyle, display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: accountColors.textPrimary }}>{t("settings.passwordSection")}</h3>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("settings.currentPassword")}
          <PasswordFieldWithToggle
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            inputStyle={accountInputStyle}
            required
            autoComplete="current-password"
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("settings.newPassword")}
          <PasswordFieldWithToggle
            value={passwords.newPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            inputStyle={accountInputStyle}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: accountColors.textSecondary }}>
          {t("settings.confirmPassword")}
          <PasswordFieldWithToggle
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
            inputStyle={accountInputStyle}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button type="submit" disabled={busy} style={{ ...accountPrimaryButtonStyle, alignSelf: "flex-start", opacity: busy ? 0.7 : 1 }}>
          {t("settings.changePassword")}
        </button>
      </form>

      <div style={accountCardStyle}>
        <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 600, color: accountColors.textPrimary }}>{t("settings.logoutSection")}</h3>
        <p style={{ margin: "0 0 14px", fontSize: "14px", color: accountColors.textSecondary }}>{t("settings.logoutHint")}</p>
        <button type="button" onClick={handleLogout} style={accountGhostButtonStyle}>
          {t("settings.logout")}
        </button>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
