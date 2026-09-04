const express = require("express");

const router = express.Router();

const { analyzeFace } = require("../controllers/faceController");

router.post("/analyze", analyzeFace);

module.exports = router;
