const DEFAULT_DEV_URL = "http://localhost:5173";

/**
 * Public storefront origin for admin "View Store" links.
 * @returns {string | null} Trimmed origin, or null in production when unset.
 */
export function getStorefrontUrl() {
  const raw = import.meta.env.VITE_STOREFRONT_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().replace(/\/+$/, "");
  }
  if (import.meta.env.DEV) {
    return DEFAULT_DEV_URL;
  }
  return null;
}
