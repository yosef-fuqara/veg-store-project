const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter;

const isMailConfigured = () =>
  Boolean(env.mailHost && env.mailPort && env.mailUser && env.mailPass && env.mailFrom);

const buildTransportOptions = () => {
  const port = Number(env.mailPort) || 587;
  return {
    host: env.mailHost,
    port,
    secure: port === 465,
    auth: {
      user: env.mailUser,
      pass: env.mailPass
    }
  };
};

const getTransporter = () => {
  if (!isMailConfigured()) {
    throw new Error("Mail is not configured (set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM)");
  }
  if (!transporter) {
    transporter = nodemailer.createTransport(buildTransportOptions());
  }
  return transporter;
};

const logDevMailError = (context, error) => {
  if (env.nodeEnv !== "development") {
    return;
  }
  const code = error?.code ? ` (${error.code})` : "";
  // eslint-disable-next-line no-console
  console.error(`[mail] ${context}: ${error?.message || error}${code}`);
};

async function verifyMailConnection() {
  try {
    await getTransporter().verify();
  } catch (error) {
    logDevMailError("verify failed", error);
    throw error;
  }
}

/**
 * @param {object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 * @param {string} [options.from] override MAIL_FROM
 */
async function sendEmail({ to, subject, text, html, from, ...rest }) {
  if (!isMailConfigured()) {
    const err = new Error("Mail is not configured");
    logDevMailError("sendEmail skipped", err);
    throw err;
  }
  if (!to || !subject) {
    throw new Error("sendEmail requires `to` and `subject`");
  }
  if (!text && !html) {
    throw new Error("sendEmail requires at least one of `text` or `html`");
  }
  try {
    await getTransporter().sendMail({
      from: from || env.mailFrom,
      to,
      subject,
      text,
      html,
      ...rest
    });
  } catch (error) {
    logDevMailError("sendMail failed", error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  verifyMailConnection,
  isMailConfigured
};
