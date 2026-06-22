// backend/routes/educational.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

// Get all educational content - PUBLIC
router.get("/content", (req, res) => {
  db.query(
    "SELECT * FROM educational_content WHERE is_active = 1 ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        console.error("Fetch content error:", err);
        return res.status(500).json({ msg: "Failed to fetch content" });
      }
      res.json(results);
    }
  );
});

// Get single article by ID
router.get("/content/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  
  db.query(
    "SELECT * FROM educational_content WHERE id = ? AND is_active = 1",
    [id],
    (err, results) => {
      if (err) {
        console.error("Fetch article error:", err);
        return res.status(500).json({ msg: "Failed to fetch article" });
      }
      if (!results.length) {
        return res.status(404).json({ msg: "Article not found" });
      }
      res.json(results[0]);
    }
  );
});

module.exports = router;