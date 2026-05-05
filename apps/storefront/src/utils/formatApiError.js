/**
 * Builds a single readable string from an axios error (after API error normalization).
 */
export function formatApiError(error) {
  if (!error) return "Unknown error";

  const res = error.response;
  const data = res?.data;

  if (data && typeof data === "object" && (data.message || data.code || data.details)) {
    const parts = [];
    if (data.code) parts.push(`[${data.code}]`);
    if (data.message) parts.push(String(data.message));
    if (Array.isArray(data.details?.fields) && data.details.fields.length) {
      parts.push(
        data.details.fields.map((f) => `${f.path}: ${f.message}`).join("; ")
      );
    }
    const joined = parts.join(" ").trim();
    if (joined) return joined;
  }

  if (res?.status) {
    const text = res.statusText ? ` ${res.statusText}` : "";
    return `Request failed (HTTP ${res.status}${text})`;
  }

  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "Network error — check that the API is running and that CORS allows this origin.";
  }

  if (error.code === "ECONNABORTED") {
    return "Request timed out.";
  }

  return error.message || "Something went wrong.";
}
