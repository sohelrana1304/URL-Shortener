const express = require('express');
const router = express.Router();
const urlController = require("../controllers/urlController")

// To short a long URL
router.post("/url/shorten", urlController.shortUrl)

// To redirect URL
router.get("/:urlCode", urlController.redirectURL)


module.exports = router