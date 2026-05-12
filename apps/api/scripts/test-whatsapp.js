/**
 * Manual WhatsApp notification smoke check. From apps/api:
 *   npm run test:whatsapp
 *
 * Safe defaults:
 * - Uses dummy order/user payloads only (no production data).
 * - Never throws uncaught exceptions from WhatsApp helpers (they swallow errors).
 *
 * Loads apps/api/.env like test-email.js; ensure MONGO_URI and JWT_* are present
 * if you use local env loading (same requirement as starting the API).
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const pkg = `[test-whatsapp]`;
const SAMPLE_ORDER_ADMIN = () => ({
  _id: "manual_test_whatsapp_admin",
  customerPhone: "0501234567",
  deliveryArea: "eilabun",
  total: 199,
  paymentMethod: "credit_card",
  items: [{ name: "Smoke product", quantity: 1 }]
});
const SAMPLE_USER_ADMIN = () => ({ name: "Smoke tester" });

function printResult(section, label, result) {
  const line = `[${section}] ${label}`;
  console.log(`${pkg}`, line);
  console.log(JSON.stringify(result, null, 2));
}

async function main() {
  let exitCode = 0;
  try {
    const {
      notifyAdminOfNewOrder,
      sendTransactionalWhatsAppToCustomer,
      buildCustomerOrderStatusMessage
    } = require("../src/services/whatsapp.service");

    const adminRes = await notifyAdminOfNewOrder(SAMPLE_ORDER_ADMIN(), SAMPLE_USER_ADMIN());
    printResult("admin-new-order", "notifyAdminOfNewOrder", adminRes || {});
    if (adminRes?.reason === "disabled") {
      console.log(
        `${pkg} If you expected admin WhatsApp: set ADMIN_WHATSAPP_PHONE or WHATSAPP_ADMIN_PHONE, WHATSAPP_NOTIFICATIONS_ENABLED=true, and WHATSAPP_PROVIDER (e.g. log). Existing env values are preserved (same rules as dotenv).`
      );
    }

    const sampleDeliveredOrder = () => ({
      _id: "manual_test_whatsapp_customer",
      customerPhone: "0507654321"
    });
    const msg = buildCustomerOrderStatusMessage(sampleDeliveredOrder(), "delivered");
    const custRes = await sendTransactionalWhatsAppToCustomer({
      customerPhone: sampleDeliveredOrder().customerPhone,
      message: msg
    });
    printResult("customer-transactional", "sendTransactionalWhatsAppToCustomer", custRes || {});

    const okCombined = Boolean(adminRes?.ok || custRes?.ok);
    if (!okCombined) {
      console.log(
        `${pkg} Note: WhatsApp may be disabled, misconfigured, or phone normalization skipped — this exit is still SUCCESS (flows must not rely on WhatsApp).`
      );
    } else {
      console.log(`${pkg} At least one path reported ok:true (often log provider or Twilio sandbox).`);
    }
  } catch (err) {
    console.error(`${pkg} Script load or unexpected error:`, err?.message || err);
    exitCode = 1;
  }
  process.exit(exitCode);
}

main();
