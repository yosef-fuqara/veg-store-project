import axios from "axios";
import { formatApiError } from "../utils/formatApiError";
import { getAccessToken } from "./authStorage";
import { clearAuthSession } from "./authSession";

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
    if (status === 401 || code === "UNAUTHENTICATED" || code === "TOKEN_INVALID") {
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
