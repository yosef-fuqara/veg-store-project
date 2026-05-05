/** Minimal valid 1x1 PNG */
const tinyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function attachProductImage(req) {
  return req.attach("image", tinyPngBuffer, "test-product.png");
}

module.exports = { tinyPngBuffer, attachProductImage };
