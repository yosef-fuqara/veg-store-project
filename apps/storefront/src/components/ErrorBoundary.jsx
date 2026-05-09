import React from "react";

const colors = {
  bg: "#faf8f5",
  surface: "#ffffff",
  border: "#e8e3dc",
  textPrimary: "#1c1917",
  error: "#991b1b",
  errorSurface: "#fef2f2",
  errorBorder: "#fecaca",
  primary: "#1e6b3c",
};

const fontStack =
  "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Storefront render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: "clamp(24px, 6vw, 48px) clamp(16px, 4vw, 24px)",
            boxSizing: "border-box",
            background: colors.bg,
            fontFamily: fontStack,
            color: colors.textPrimary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
            }}
          >
            <h1 style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: 700, lineHeight: 1.25 }}>
              Something went wrong in the UI
            </h1>
            <p
              role="alert"
              style={{
                margin: "0 0 16px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: colors.errorSurface,
                border: `1px solid ${colors.errorBorder}`,
                color: colors.error,
                fontSize: "14px",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: colors.primary,
                color: "#fff",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(30,107,60,0.30)",
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
