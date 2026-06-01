const LOGIN_CREDENTIAL_CODES = new Set([
  "TOKEN_INVALID",
  "UNAUTHENTICATED",
  "INVALID_CREDENTIALS"
]);

const INVALID_CREDENTIALS_MESSAGE = /invalid email or password/i;

const TECHNICAL_CODE_IN_TEXT = /\[[A-Z][A-Z0-9_]+\]/g;
const TECHNICAL_CODE_TOKEN = /^[A-Z][A-Z0-9_]+$/;

/** True when a 401 on login is wrong email/password (not session expiry elsewhere). */
export function isLoginCredentialsError(error) {
  if (error?.response?.status !== 401) return false;

  const code = String(error.response?.data?.code || "").toUpperCase();
  if (LOGIN_CREDENTIAL_CODES.has(code)) return true;

  const apiMessage = error.response?.data?.message;
  if (typeof apiMessage === "string" && INVALID_CREDENTIALS_MESSAGE.test(apiMessage)) {
    return true;
  }

  const userMessage = error?.userMessage;
  if (typeof userMessage === "string") {
    const cleaned = stripTechnicalErrorCodes(userMessage);
    if (INVALID_CREDENTIALS_MESSAGE.test(cleaned)) return true;
  }

  return false;
}

/** Remove leaked backend codes like [TOKEN_INVALID] from user-visible strings. */
export function stripTechnicalErrorCodes(message) {
  if (typeof message !== "string") return "";
  return message.replace(TECHNICAL_CODE_IN_TEXT, "").replace(/\s+/g, " ").trim();
}

export function logLoginErrorDetails(error) {
  if (!import.meta.env.DEV || !error) return;
  const res = error.response;
  console.warn("[Login failed]", {
    status: res?.status,
    code: res?.data?.code,
    message: res?.data?.message,
    details: res?.data?.details,
    url: error.config?.url
  });
}

export function containsTechnicalCode(value) {
  if (typeof value !== "string") return false;
  return /\[[A-Z][A-Z0-9_]+\]/.test(value) || TECHNICAL_CODE_TOKEN.test(value.trim());
}
