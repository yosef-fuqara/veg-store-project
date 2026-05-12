const express = require("express");
const { getPublicStoreSettings } = require("../controllers/store-settings.controller");

const router = express.Router();

router.get("/", getPublicStoreSettings);

module.exports = router;
