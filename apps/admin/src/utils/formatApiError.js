import { stripTechnicalErrorCodes } from "./loginError";

function logApiErrorDetails(error, data, status) {
  if (!import.meta.env.DEV || !error) return;
  console.warn("[API error]", {
    status,
    code: data?.code,
    message: data?.message,
    details: data?.details,
    url: error.config?.url
  });
}

export function formatApiError(error) {
  if (!error) return "Unknown error";

  const res = error.response;
  const data = res?.data;
  const status = res?.status;

  if (data && typeof data === "object" && (data.message || data.code || data.details)) {
    logApiErrorDetails(error, data, status);

    const parts = [];
    if (data.message) parts.push(String(data.message));
    if (Array.isArray(data.details?.fields) && data.details.fields.length) {
      parts.push(data.details.fields.map((f) => `${f.path}: ${f.message}`).join("; "));
    }
    const joined = stripTechnicalErrorCodes(parts.join(" ").trim());
    if (joined) return joined;
  }

  if (status === 429) {
    return (
      data?.message ||
      "Too many requests. Wait a few minutes and try again, or restart the API server in local development."
    );
  }

  if (status) {
    const text = res.statusText ? ` ${res.statusText}` : "";
    return `Request failed (HTTP ${status}${text})`;
  }

  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "Network error - check that API is running and CORS allows this origin.";
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out.";
  }

  return stripTechnicalErrorCodes(error.message) || "Something went wrong.";
}
