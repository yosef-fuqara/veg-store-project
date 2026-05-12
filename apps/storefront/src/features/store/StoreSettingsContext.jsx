import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "../../services/apiClient";

const StoreSettingsContext = createContext(null);

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/store-settings");
      const s = data?.data?.settings;
      setSettings(s && typeof s === "object" ? s : null);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void load();
    }, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  /** When settings failed to load, do not block ordering. */
  const canOrderNow = settings == null ? true : settings.isStoreOpen !== false;
  const isStoreClosed = Boolean(settings && settings.isStoreOpen === false);

  const value = useMemo(
    () => ({
      settings,
      loading,
      refetch: load,
      isStoreClosed,
      canOrderNow
    }),
    [settings, loading, load, isStoreClosed, canOrderNow]
  );

  return <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) {
    throw new Error("useStoreSettings must be used within StoreSettingsProvider");
  }
  return ctx;
}
