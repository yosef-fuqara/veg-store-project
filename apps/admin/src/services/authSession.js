import { clearAccessToken } from "./authStorage";

export const AUTH_SESSION_CLEARED_EVENT = "admin:auth-session-cleared";

let redirectingToLogin = false;

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function clearAuthSession(options = {}) {
  const { redirectToLogin = false, preserveRedirect = true, reason = "" } = options;

  clearAccessToken();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CLEARED_EVENT));
  }

  if (!redirectToLogin || typeof window === "undefined" || redirectingToLogin) return;

  redirectingToLogin = true;

  const currentPath = getCurrentPath();
  const params = new URLSearchParams();
  if (preserveRedirect && currentPath && !currentPath.startsWith("/login")) {
    params.set("redirect", currentPath);
  }
  if (reason) {
    params.set("reason", reason);
  }

  const redirectQuery = params.toString() ? `?${params.toString()}` : "";

  window.location.assign(`/login${redirectQuery}`);
}
