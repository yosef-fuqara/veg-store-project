import axios from "axios";
import { formatApiError } from "../utils/formatApiError";
import { getAccessToken } from "./authStorage";
import { clearAuthSession } from "./authSession";

/** POST /auth/login returns 401 for wrong credentials — must not trigger session-expired flow. */
function isAuthLoginPost(config) {
  if (!config) return false;
  const method = String(config.method || "get").toLowerCase();
  if (method !== "post") return false;
  const url = String(config.url || "").split("?")[0];
  return url === "/auth/login" || url.endsWith("/auth/login");
}

function resolveBaseURL() {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && String(fromEnv).trim() !== "") {
    return String(fromEnv).replace(/\/+$/, "");
  }

  if (import.meta.env.DEV) {
    console.warn(
      "[admin] VITE_API_URL is unset; using http://localhost:5000/api/v1. Add apps/admin/.env (see .env.example)."
    );
    return "http://localhost:5000/api/v1";
  }

  console.error("[admin] VITE_API_URL must be set for production builds.");
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
    const code = String(error.response?.data?.code || "").toUpperCase();

    if (status === 403 && !isAuthLoginPost(error.config) && getAccessToken()) {
      window.location.assign("/unauthorized");
      error.userMessage = formatApiError(error);
      return Promise.reject(error);
    }

    const isFailedLogin =
      isAuthLoginPost(error.config) &&
      (status === 401 || code === "UNAUTHENTICATED" || code === "TOKEN_INVALID");

    if (!isFailedLogin && (status === 401 || code === "UNAUTHENTICATED" || code === "TOKEN_INVALID")) {
      clearAuthSession({
        redirectToLogin: true,
        preserveRedirect: true,
        reason: "session_expired"
      });
    }

    error.userMessage = formatApiError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
