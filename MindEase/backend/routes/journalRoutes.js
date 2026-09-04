const express = require("express");

const router = express.Router();

const {
    analyzeJournal,
    getJournalHistory,
    deleteJournal
} = require("../controllers/journalController");


router.post(
    "/analyze",
    analyzeJournal
);


router.get(
    "/history",
    getJournalHistory
);


router.delete(
    "/:journal_id",
    deleteJournal
);


module.exports = router;