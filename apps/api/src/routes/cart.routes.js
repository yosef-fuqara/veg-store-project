const express = require("express");
const {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  prepareCheckout
} = require("../controllers/cart.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamSchema
} = require("../validators/cart.validator");

const router = express.Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/items", validate(addCartItemSchema), addCartItem);
router.patch(
  "/items/:productId",
  validate(cartItemParamSchema, "params"),
  validate(updateCartItemSchema),
  updateCartItemQuantity
);
router.delete("/items/:productId", validate(cartItemParamSchema, "params"), removeCartItem);
router.delete("/", clearCart);
router.post("/checkout/prepare", prepareCheckout);

module.exports = router;
