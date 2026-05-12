import axios from "axios";
import { formatApiError } from "../utils/formatApiError";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAccessToken,
  getAccessToken
} from "./authStorage";

function resolveBaseURL() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/+$/, "");
  }
  if (import.meta.env.DEV) {
    console.warn(
      "[storefront] VITE_API_URL is unset; using http://localhost:5000/api/v1. Add apps/storefront/.env (see .env.example)."
    );
    return "http://localhost:5000/api/v1";
  }
  console.error("[storefront] VITE_API_URL must be set for production builds.");
  return "";
}

const apiClient = axios.create({
  baseURL: resolveBaseURL()
});
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const reqUrl = String(error.config?.url || "");
    const isCredentialRoute =
      reqUrl.includes("/auth/login") ||
      reqUrl.includes("/auth/register") ||
      reqUrl.includes("/auth/forgot-password") ||
      reqUrl.includes("/auth/reset-password");
    if (status === 401 && !isCredentialRoute && getAccessToken()) {
      clearAccessToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
      }
    }
    error.userMessage = formatApiError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
