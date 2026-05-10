import { useCallback, useState } from "react";

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

/**
 * JSON-backed localStorage hook. Does not run storage writes during SSR.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (!canUseStorage()) return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initialValue;
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (canUseStorage()) {
          try {
            if (next == null) window.localStorage.removeItem(key);
            else window.localStorage.setItem(key, JSON.stringify(next));
          } catch {
            /* quota / private mode */
          }
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
