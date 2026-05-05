const express = require("express");
const { register, login, getMe } = require("../controllers/auth.controller");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", requireAuth, getMe);

module.exports = router;
