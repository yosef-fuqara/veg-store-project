const env = require("../../config/env");
const placeholder = require("./providers/placeholder.provider");

const REGISTRY = {
  placeholder
};

function getPaymentProvider() {
  const name = env.paymentProvider;
  const mod = REGISTRY[name];
  if (!mod) {
    throw new Error(
      `Unsupported PAYMENT_PROVIDER "${name}". Allowed: ${Object.keys(REGISTRY).join(", ")}`
    );
  }
  return mod;
}

module.exports = { getPaymentProvider, REGISTRY };
