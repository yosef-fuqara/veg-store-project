import { useTranslation } from "react-i18next";
import { STORAGE_KEY } from "../i18n";

const OPTIONS = [
  { code: "he", label: "עברית" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" }
];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation("nav");

  const handleChange = (event) => {
    const code = event.target.value;
    i18n.changeLanguage(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore quota / private mode
    }
  };

  const current = (i18n.language || "he").split("-")[0];

  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: "0.9rem" }}>{t("language")}</span>
      <select value={current} onChange={handleChange} aria-label={t("language")}>
        {OPTIONS.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
