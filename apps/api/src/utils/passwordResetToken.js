const crypto = require("crypto");

const TOKEN_BYTES = 32;

const generatePasswordResetToken = () => crypto.randomBytes(TOKEN_BYTES).toString("hex");

const hashPasswordResetToken = (plainToken) =>
  crypto.createHash("sha256").update(String(plainToken), "utf8").digest("hex");

module.exports = {
  generatePasswordResetToken,
  hashPasswordResetToken,
  TOKEN_BYTES
};
