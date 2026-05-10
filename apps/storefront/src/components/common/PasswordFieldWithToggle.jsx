import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

const wrap = {
  position: "relative",
  width: "100%",
  alignSelf: "stretch",
};

const toggleBtn = (iconColor) => ({
  position: "absolute",
  insetInlineEnd: "4px",
  top: "50%",
  transform: "translateY(-50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "40px",
  height: "40px",
  padding: 0,
  border: "none",
  borderRadius: "8px",
  background: "transparent",
  color: iconColor,
  cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
});

/**
 * Password input with show/hide toggle. Uses paddingInlineEnd and insetInlineEnd for RTL/LTR.
 */
export function PasswordFieldWithToggle({
  value,
  onChange,
  onFocus,
  onBlur,
  autoComplete = "current-password",
  minLength,
  maxLength,
  required,
  inputStyle,
  name,
  id,
  iconMutedColor = "#a8a29e",
  focusOutlineColor = "#1e6b3c",
}) {
  const { t } = useTranslation("auth");
  const [show, setShow] = useState(false);

  return (
    <>
      <style>{`
        .veg-storefront-password-toggle:focus-visible {
          outline: 2px solid ${focusOutlineColor};
          outline-offset: 2px;
        }
      `}</style>
      <div style={wrap}>
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          style={{ ...inputStyle, paddingInlineEnd: "44px" }}
        />
        <button
          type="button"
          className="veg-storefront-password-toggle"
          aria-pressed={show}
          aria-label={show ? t("hidePassword") : t("showPassword")}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShow((v) => !v)}
          style={toggleBtn(iconMutedColor)}
        >
          {show ? (
            <EyeOff size={20} strokeWidth={1.75} aria-hidden />
          ) : (
            <Eye size={20} strokeWidth={1.75} aria-hidden />
          )}
        </button>
      </div>
    </>
  );
}

export default PasswordFieldWithToggle;
