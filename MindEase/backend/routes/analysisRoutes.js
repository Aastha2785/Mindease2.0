const express = require("express");

const router = express.Router();

const {
    analyzeOverallMood
} = require("../controllers/analysisController");

router.post("/overall", analyzeOverallMood);

module.exports = router;