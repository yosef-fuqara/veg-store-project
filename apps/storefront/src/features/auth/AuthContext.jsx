import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../../services/authService";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken
} from "../../services/authStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

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
          clearAccessToken();
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

  const register = useCallback(async (payload) => {
    const { user: nextUser, accessToken } = await authService.register(payload);
    setAccessToken(accessToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout]
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
