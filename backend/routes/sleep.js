// backend/routes/sleep.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const { logGamificationActivity } = require("../services/gamificationService");

/* GET sleep records - with auth & ownership check */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot access another user's sleep data" });
  }

  db.query(
    "SELECT * FROM sleep WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
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
router.post("/", verifyToken, async (req, res) => {
  const { user_id, bedtime, wake_time, duration, quality } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  console.log("Sleep save request:", { user_id, bedtime, wake_time, duration, quality });
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized: Cannot add sleep data for another user" });
  }

  if (!user_id || !bedtime || !wake_time) {
    return res.status(400).json({ 
      msg: "Missing required fields: user_id, bedtime, wake_time" 
    });
  }

  if (duration && (duration < 0 || duration > 24)) {
    return res.status(400).json({ msg: "Invalid duration: must be between 0 and 24 hours" });
  }

  if (quality && (quality < 1 || quality > 5)) {
    return res.status(400).json({ msg: "Quality must be between 1 and 5" });
  }

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(bedtime) || !timeRegex.test(wake_time)) {
    return res.status(400).json({ msg: "Invalid time format. Use HH:MM (24-hour format)" });
  }

  try {
    const [existing] = await db.promise().query(
      "SELECT id FROM sleep WHERE user_id = ? AND DATE(created_at) = ?",
      [user_id, today]
    );

    let result;
    let updated = false;

    if (existing.length > 0) {
      await db.promise().query(
        "UPDATE sleep SET bedtime = ?, wake_time = ?, duration = ?, quality = ? WHERE id = ?",
        [bedtime, wake_time, duration || null, quality || null, existing[0].id]
      );
      result = { id: existing[0].id };
      updated = true;
    } else {
      const [insertResult] = await db.promise().query(
        "INSERT INTO sleep (user_id, bedtime, wake_time, duration, quality) VALUES (?, ?, ?, ?, ?)",
        [user_id, bedtime, wake_time, duration || null, quality || null]
      );
      result = { id: insertResult.insertId };
    }

    // ✅ GAMIFICATION: Log sleep activity & award badges
    await logGamificationActivity(user_id, 'sleep');

    res.json({ 
      msg: updated ? "Sleep updated for today 💤" : "Sleep saved for today 💤", 
      id: result.id, 
      updated: updated 
    });
  } catch (error) {
    console.error("Sleep save error:", error);
    res.status(500).json({ msg: "Failed to save sleep" });
  }
});

module.exports = router;