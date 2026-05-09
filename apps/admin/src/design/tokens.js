/**
 * Abu Al-Anas design tokens — admin app (aligned with storefront organic palette).
 */
export const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",

  accent: "#c47f17",
  accentSurface: "#fdf6e3",
  accentBorder: "#f0d08a",

  bg: "#faf8f5",
  surface: "#ffffff",
  surfaceRaised: "#f5f2ed",
  border: "#e8e3dc",
  borderStrong: "#c9c2b8",

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
  warningBorder: "#fde68a",

  info: "#1d4ed8",
  infoSurface: "#eff6ff",
  infoBorder: "#bfdbfe",
};

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "14px",
};

export const shadow = {
  sm: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  md: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
  toast: "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
};

export const fontStack =
  "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

export const feedbackVariants = {
  success: {
    bg: colors.successSurface,
    border: colors.successBorder,
    fg: colors.success,
    icon: colors.success,
  },
  error: {
    bg: colors.errorSurface,
    border: colors.errorBorder,
    fg: colors.error,
    icon: colors.error,
  },
  warning: {
    bg: colors.warningSurface,
    border: colors.warningBorder,
    fg: colors.warning,
    icon: colors.warning,
  },
  info: {
    bg: colors.infoSurface,
    border: colors.infoBorder,
    fg: colors.info,
    icon: colors.info,
  },
};
