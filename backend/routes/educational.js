// backend/routes/educational.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const { logGamificationActivity } = require("../services/gamificationService");

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

// Get single article by ID with gamification
router.get("/content/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    const [results] = await db.promise().query(
      "SELECT * FROM educational_content WHERE id = ? AND is_active = 1",
      [id]
    );
    
    if (!results.length) {
      return res.status(404).json({ msg: "Article not found" });
    }

    // ✅ GAMIFICATION: Log article read activity
    await logGamificationActivity(userId, 'article_read', { article_id: id, title: results[0].title });

    res.json(results[0]);
  } catch (error) {
    console.error("Fetch article error:", error);
    res.status(500).json({ msg: "Failed to fetch article" });
  }
});

module.exports = router;