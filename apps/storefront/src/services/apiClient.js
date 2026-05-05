import axios from "axios";
import { formatApiError } from "../utils/formatApiError";
import { getAccessToken } from "./authStorage";

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
    error.userMessage = formatApiError(error);
    return Promise.reject(error);
  }
);

export default apiClient;
