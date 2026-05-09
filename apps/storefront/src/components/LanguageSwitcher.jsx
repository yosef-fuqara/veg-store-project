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
    <select
      value={current}
      onChange={handleChange}
      aria-label={t("language")}
      style={{
        padding: '5px 8px',
        borderRadius: '6px',
        border: '1px solid #e8e3dc',
        background: 'transparent',
        color: '#57534e',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.code} value={opt.code}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
