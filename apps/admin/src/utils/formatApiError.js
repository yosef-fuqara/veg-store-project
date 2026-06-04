import i18n from "../i18n";
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
  const t = i18n.t.bind(i18n);

  if (!error) return t("common:apiErrors.unknown");

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
    return data?.message || t("common:apiErrors.rateLimit");
  }

  if (status) {
    const statusText = res.statusText ? ` ${res.statusText}` : "";
    return t("common:apiErrors.requestFailed", { status, statusText });
  }

  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return t("common:apiErrors.network");
  }

  if (error.code === "ECONNABORTED") {
    return t("common:apiErrors.timeout");
  }

  return stripTechnicalErrorCodes(error.message) || t("common:errorGeneric");
}
