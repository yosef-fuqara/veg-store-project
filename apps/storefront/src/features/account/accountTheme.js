export const accountColors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  border: "#e8e3dc",
  bg: "#faf8f5",
  surface: "#ffffff",
  surfaceRaised: "#f5f2ed",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  textInverse: "#ffffff",
  success: "#166534",
  successSurface: "#f0fdf4",
  successBorder: "#bbf7d0",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca",
  warning: "#92400e",
  warningSurface: "#fffbeb",
  warningBorder: "#fde68a"
};

export const accountShadow = {
  sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  primary: "0 4px 14px rgba(30,107,60,0.30)"
};

export const accountCardStyle = {
  background: accountColors.surface,
  border: `1px solid ${accountColors.border}`,
  borderRadius: "14px",
  padding: "24px",
  boxShadow: accountShadow.sm
};

export const accountInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 14px",
  borderRadius: "10px",
  border: `1.5px solid ${accountColors.border}`,
  fontSize: "15px",
  color: accountColors.textPrimary,
  background: accountColors.surface,
  outline: "none",
  fontFamily: "inherit"
};

export const accountPrimaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  background: accountColors.primary,
  color: accountColors.textInverse,
  fontSize: "15px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: accountShadow.primary,
  textDecoration: "none"
};

export const accountGhostButtonStyle = {
  ...accountPrimaryButtonStyle,
  background: "transparent",
  color: accountColors.primary,
  border: `1.5px solid ${accountColors.primary}`,
  boxShadow: "none"
};
