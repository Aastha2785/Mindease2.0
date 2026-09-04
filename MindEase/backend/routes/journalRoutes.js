const express = require("express");

const router = express.Router();

const {
    analyzeJournal,
    getJournalHistory
} = require("../controllers/journalController");

router.post("/analyze", analyzeJournal);

router.get("/history", getJournalHistory);

module.exports = router;