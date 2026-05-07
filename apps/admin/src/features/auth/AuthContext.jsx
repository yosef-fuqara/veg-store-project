import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../../services/authService";
import { getAccessToken, setAccessToken } from "../../services/authStorage";
import { AUTH_SESSION_CLEARED_EVENT, clearAuthSession } from "../../services/authSession";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const handleSessionCleared = () => {
      setUser(null);
      setInitializing(false);
    };

    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);

    return () => {
      window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setInitializing(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const current = await authService.me();
        if (!cancelled) setUser(current);
      } catch (err) {
        if (err.response?.status === 401) {
          clearAuthSession();
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { user: nextUser, accessToken } = await authService.login(credentials);
    setAccessToken(accessToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    clearAuthSession({ redirectToLogin: true, preserveRedirect: false });
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      logout,
      isAdmin: user?.role === "admin"
    }),
    [user, initializing, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
