// routes/mood.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

const router = express.Router();

/* GET mood for specific date or latest */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  const { date } = req.query; // Optional date parameter (YYYY-MM-DD)
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot access another user's data" });
  }

  let query = "SELECT * FROM moods WHERE user_id = ? ORDER BY created_at DESC";
  let params = [userId];

  if (date) {
    query = "SELECT * FROM moods WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC";
    params = [userId, date];
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/* GET today's mood */
router.get("/today/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT * FROM moods WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC LIMIT 1",
    [userId, today],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0] || null);
    }
  );
});

/* UPSERT mood (insert or update for today) */
router.post("/", verifyToken, (req, res) => {
  const { user_id, mood } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized: Cannot add mood for another user" });
  }

  if (!user_id || !mood) {
    return res.status(400).json({ msg: "Missing required fields: user_id and mood" });
  }

  if (mood < 1 || mood > 5) {
    return res.status(400).json({ msg: "Mood must be between 1 and 5" });
  }

  // Check if mood already exists for today
  db.query(
    "SELECT id FROM moods WHERE user_id = ? AND DATE(created_at) = ?",
    [user_id, today],
    (err, results) => {
      if (err) return res.status(500).json(err);
      
      if (results.length > 0) {
        // Update existing mood
        db.query(
          "UPDATE moods SET mood = ? WHERE id = ?",
          [mood, results[0].id],
          (err) => {
            if (err) return res.status(500).json(err);
            res.json({ msg: "Mood updated for today 🌿", id: results[0].id, updated: true });
          }
        );
      } else {
        // Insert new mood
        db.query(
          "INSERT INTO moods (user_id, mood) VALUES (?, ?)",
          [user_id, mood],
          (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ msg: "Mood saved for today 🌿", id: result.insertId, updated: false });
          }
        );
      }
    }
  );
});

module.exports = router;