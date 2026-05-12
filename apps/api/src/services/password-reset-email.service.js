const env = require("../config/env");
const { sendEmail, isMailConfigured } = require("./mail.service");

/**
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.resetUrl full URL to storefront reset page including ?token=
 */
async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!isMailConfigured()) {
    return;
  }
  const subject = "Reset your password";
  const text = `You requested a password reset. Open this link to choose a new password (valid for a limited time):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>You requested a password reset.</p><p><a href="${resetUrl.replace(/"/g, "&quot;")}">Set a new password</a></p><p>If you did not request this, you can ignore this email.</p>`;
  await sendEmail({ to, subject, text, html });
}

function buildPasswordResetUrl(plainToken) {
  const base = env.storefrontUrl.replace(/\/+$/, "");
  const url = new URL("/reset-password", `${base}/`);
  url.searchParams.set("token", plainToken);
  return url.toString();
}

module.exports = {
  sendPasswordResetEmail,
  buildPasswordResetUrl
};
