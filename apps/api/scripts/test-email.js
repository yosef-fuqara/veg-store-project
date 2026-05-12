/**
 * Manual SMTP check. From apps/api: npm run test:email
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const env = require("../src/config/env");
const { verifyMailConnection, sendEmail } = require("../src/services/mail.service");

async function main() {
  try {
    await verifyMailConnection();
    console.log("SMTP verify: OK");
  } catch (e) {
    console.error("SMTP verify: FAILED —", e.message);
    process.exit(1);
  }

  const to = env.mailUser;
  if (!to) {
    console.error("MAIL_USER is not set; cannot pick recipient for test send.");
    process.exit(1);
  }

  try {
    await sendEmail({
      to,
      subject: "Veg store API — test email",
      text: "This is a plain-text test from scripts/test-email.js.",
      html: "<p>This is an <strong>HTML</strong> test from <code>scripts/test-email.js</code>.</p>"
    });
    console.log(`Test email sent successfully to ${to}`);
  } catch (e) {
    console.error("Test email send: FAILED —", e.message);
    process.exit(1);
  }
}

main();
