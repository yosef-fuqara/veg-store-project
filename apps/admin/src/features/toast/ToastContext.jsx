import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = "success", durationMs = 2500) => {
    setToast({ message, type });
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, durationMs);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            padding: "10px 14px",
            borderRadius: 6,
            color: "#fff",
            background: toast.type === "error" ? "#b42318" : "#027a48",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            zIndex: 1000
          }}
        >
          {toast.message}
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
