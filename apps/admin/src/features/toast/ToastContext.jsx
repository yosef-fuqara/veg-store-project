import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { feedbackVariants, fontStack, radius, shadow } from "../../design/tokens";
import "./ToastContext.css";
import { IconAlertCircle, IconAlertTriangle, IconCheckCircle, IconInfo } from "./ToastIcons";

const ToastContext = createContext(null);

function resolveVariant(type) {
  if (type === "error") return "error";
  if (type === "warning") return "warning";
  if (type === "info") return "info";
  return "success";
}

function ToastIcon({ variant }) {
  const v = feedbackVariants[variant];
  const stroke = v.icon;
  switch (variant) {
    case "error":
      return <IconAlertCircle color={stroke} />;
    case "warning":
      return <IconAlertTriangle color={stroke} />;
    case "info":
      return <IconInfo color={stroke} />;
    default:
      return <IconCheckCircle color={stroke} />;
  }
}

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "success", durationMs = 2800) => {
    setToast({ message, type });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const variant = toast ? resolveVariant(toast.type) : "success";
  const palette = feedbackVariants[variant];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          className="admin-toast-root"
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "16px",
            insetInlineEnd: "16px",
            insetInlineStart: "auto",
            zIndex: 1000,
            maxWidth: "min(420px, calc(100vw - 32px))",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: radius.md,
            border: `1px solid ${palette.border}`,
            background: palette.bg,
            color: palette.fg,
            fontFamily: fontStack,
            fontSize: "14px",
            lineHeight: 1.45,
            fontWeight: 500,
            boxShadow: shadow.toast,
          }}
        >
          <span
            style={{
              flexShrink: 0,
              display: "flex",
              marginTop: "1px",
            }}
          >
            <ToastIcon variant={variant} />
          </span>
          <span style={{ minWidth: 0 }}>{toast.message}</span>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
