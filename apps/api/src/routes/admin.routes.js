const express = require("express");
const { getAdminPing } = require("../controllers/admin.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { USER_ROLES } = require("../constants/roles");

const router = express.Router();

router.get("/ping", requireAuth, requireRole(USER_ROLES.ADMIN), getAdminPing);

module.exports = router;
