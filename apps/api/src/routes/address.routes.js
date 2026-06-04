const express = require("express");
const { getCities } = require("../controllers/address.controller");

const router = express.Router();

router.get("/cities", getCities);

module.exports = router;
