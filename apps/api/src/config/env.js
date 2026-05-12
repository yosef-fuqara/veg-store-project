const dotenv = require("dotenv");

dotenv.config();

const requiredVars = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  apiBasePath: process.env.API_BASE_PATH || "/api/v1",
  mongoUri: process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || "15m",
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL || "7d",
  corsOriginStore: process.env.CORS_ORIGIN_STORE || "http://localhost:5173",
  corsOriginAdmin: process.env.CORS_ORIGIN_ADMIN || "http://localhost:5174",
  /** Base URL for storefront links in emails (password reset). Falls back to CORS_ORIGIN_STORE. */
  storefrontUrl: String(
    process.env.STOREFRONT_URL ||
      process.env.FRONTEND_URL ||
      process.env.CORS_ORIGIN_STORE ||
      "http://localhost:5173"
  ).replace(/\/+$/, ""),
  passwordResetTtlMs: Number(process.env.PASSWORD_RESET_TTL_MS || 30 * 60 * 1000),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
  paymentProvider: process.env.PAYMENT_PROVIDER || "placeholder",
  paymentApiKey: process.env.PAYMENT_API_KEY || "",
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || "",
  paymentCallbackUrl: process.env.PAYMENT_CALLBACK_URL || "",
  paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL || "",
  paymentCancelUrl: process.env.PAYMENT_CANCEL_URL || "",
  // Admin notifications
  adminBaseUrl: process.env.ADMIN_BASE_URL || "",
  whatsappNotificationsEnabled:
    process.env.WHATSAPP_NOTIFICATIONS_ENABLED || process.env.WHATSAPP_ENABLED || "false",
  whatsappProvider: process.env.WHATSAPP_PROVIDER || "",
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN || process.env.TWILIO_AUTH_TOKEN || "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  whatsappTwilioAccountSid:
    process.env.WHATSAPP_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || "",
  whatsappTwilioFrom: process.env.WHATSAPP_TWILIO_FROM || process.env.TWILIO_WHATSAPP_FROM || "",
  adminWhatsappPhone: process.env.ADMIN_WHATSAPP_PHONE || process.env.WHATSAPP_ADMIN_PHONE || "",
  // SMTP (optional — order flows work without mail)
  mailHost: process.env.MAIL_HOST || "",
  mailPort: Number(process.env.MAIL_PORT || 587),
  mailUser: process.env.MAIL_USER || "",
  mailPass: process.env.MAIL_PASS || "",
  mailFrom: process.env.MAIL_FROM || "",
  adminEmail: (process.env.ADMIN_EMAIL || "").trim()
};

module.exports = env;
