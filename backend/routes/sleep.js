// routes/sleep.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

/* GET sleep records - with auth & ownership check */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  const { date } = req.query;
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot access another user's sleep data" });
  }

  let query = "SELECT * FROM sleep WHERE user_id = ? ORDER BY created_at DESC";
  let params = [userId];

  if (date) {
    query = "SELECT * FROM sleep WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC";
    params = [userId, date];
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

/* GET today's sleep */
router.get("/today/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT * FROM sleep WHERE user_id = ? AND DATE(created_at) = ? ORDER BY created_at DESC LIMIT 1",
    [userId, today],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0] || null);
    }
  );
});

/* UPSERT sleep (insert or update for today) */
router.post("/", verifyToken, (req, res) => {
  const { user_id, bedtime, wake_time, duration, quality } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized: Cannot add sleep data for another user" });
  }

  if (!user_id || !bedtime || !wake_time || !duration) {
    return res.status(400).json({ 
      msg: "Missing required fields: user_id, bedtime, wake_time, duration" 
    });
  }

  if (duration < 0 || duration > 24) {
    return res.status(400).json({ msg: "Invalid duration: must be between 0 and 24 hours" });
  }

  if (quality && (quality < 1 || quality > 5)) {
    return res.status(400).json({ msg: "Quality must be between 1 and 5" });
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(bedtime) || !timeRegex.test(wake_time)) {
    return res.status(400).json({ msg: "Invalid time format. Use HH:MM (24-hour format)" });
  }

  // Check if sleep already exists for today
  db.query(
    "SELECT id FROM sleep WHERE user_id = ? AND DATE(created_at) = ?",
    [user_id, today],
    (err, results) => {
      if (err) return res.status(500).json(err);
      
      if (results.length > 0) {
        // Update existing sleep
        db.query(
          `UPDATE sleep SET bedtime = ?, wake_time = ?, duration = ?, quality = ? WHERE id = ?`,
          [bedtime, wake_time, duration, quality || null, results[0].id],
          (err) => {
            if (err) return res.status(500).json(err);
            res.json({ msg: "Sleep updated for today 💤", id: results[0].id, updated: true });
          }
        );
      } else {
        // Insert new sleep
        db.query(
          `INSERT INTO sleep (user_id, bedtime, wake_time, duration, quality) 
           VALUES (?, ?, ?, ?, ?)`,
          [user_id, bedtime, wake_time, duration, quality || null],
          (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ msg: "Sleep saved for today 💤", id: result.insertId, updated: false });
          }
        );
      }
    }
  );
});

module.exports = router;