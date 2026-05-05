const express = require("express");
const validate = require("../middlewares/validate.middleware");
const { placeholderWebhookSchema } = require("../validators/payment.validator");
const { postWebhook } = require("../controllers/payment.controller");

const router = express.Router();

router.post("/webhook", validate(placeholderWebhookSchema), postWebhook);

module.exports = router;
