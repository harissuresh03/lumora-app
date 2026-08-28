// backend/routes/mood.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const { logGamificationActivity } = require("../services/gamificationService");

const router = express.Router();

/* ==================== GET MOODS ==================== */

/**
 * GET /api/mood/:user_id
 * Get all moods for a user (with optional date filter)
 */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  const { date } = req.query;
  
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

/**
 * GET /api/mood/today/:user_id
 * Get today's mood for a user
 */
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

/**
 * GET /api/mood/ai-detected/:user_id
 * Get AI-detected mood for today (from AI analysis)
 */
router.get("/ai-detected/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    `SELECT m.mood, a.primary_emotion, a.confidence, a.detected_mood as ai_detected_mood, a.created_at 
     FROM moods m
     LEFT JOIN ai_analysis a ON a.user_id = m.user_id AND DATE(a.created_at) = DATE(m.created_at)
     WHERE m.user_id = ? AND DATE(m.created_at) = ?
     ORDER BY m.created_at DESC LIMIT 1`,
    [userId, today],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0] || null);
    }
  );
});

/**
 * GET /api/mood/week/:user_id
 * Get last 7 days of moods for analytics
 */
router.get("/week/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    `SELECT mood, DATE(created_at) as date, 
            DAYNAME(created_at) as day_name,
            HOUR(created_at) as hour
     FROM moods 
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     ORDER BY created_at ASC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ==================== UPSERT MOOD (INSERT OR UPDATE) ==================== */

/**
 * POST /api/mood
 * Insert or update mood for today (UPSERT)
 * Mood scale: 1=Terrible, 2=Sad, 3=Okay, 4=Good, 5=Great
 */
router.post("/", verifyToken, async (req, res) => {
  const { user_id, mood } = req.body;
  const today = new Date().toISOString().split('T')[0];
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized: Cannot add mood for another user" });
  }

  if (!user_id || !mood) {
    return res.status(400).json({ msg: "Missing required fields: user_id and mood" });
  }

  if (mood < 1 || mood > 5) {
    return res.status(400).json({ 
      msg: "Invalid mood value. Must be between 1 and 5",
      scale: { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" }
    });
  }

  try {
    const [existing] = await db.promise().query(
      "SELECT id FROM moods WHERE user_id = ? AND DATE(created_at) = ?",
      [user_id, today]
    );

    let result;
    let updated = false;

    if (existing.length > 0) {
      await db.promise().query(
        "UPDATE moods SET mood = ? WHERE id = ?",
        [mood, existing[0].id]
      );
      result = { id: existing[0].id };
      updated = true;
    } else {
      const [insertResult] = await db.promise().query(
        "INSERT INTO moods (user_id, mood) VALUES (?, ?)",
        [user_id, mood]
      );
      result = { id: insertResult.insertId };
    }

    // ✅ GAMIFICATION: Log mood activity & award badges
    await logGamificationActivity(user_id, 'mood');

    const moodLabels = { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" };

    res.json({ 
      msg: updated ? "Mood updated for today 🌿" : "Mood saved for today 🌿",
      id: result.id,
      updated: updated,
      mood: mood,
      moodLabel: moodLabels[mood]
    });
  } catch (error) {
    console.error("Mood save error:", error);
    res.status(500).json({ msg: "Failed to save mood" });
  }
});

/* ==================== BULK MOOD OPERATIONS ==================== */

/**
 * POST /api/mood/bulk
 * Add multiple moods at once (for testing or backfill)
 */
router.post("/bulk", verifyToken, (req, res) => {
  const { user_id, moods } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  if (!user_id || !moods || !Array.isArray(moods)) {
    return res.status(400).json({ msg: "Invalid request. Need user_id and moods array" });
  }
  
  const values = moods.map(m => [user_id, m.mood, m.created_at || new Date()]);
  
  db.query(
    "INSERT INTO moods (user_id, mood, created_at) VALUES ?",
    [values],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: `${result.affectedRows} moods added`, count: result.affectedRows });
    }
  );
});

/* ==================== DELETE MOOD ==================== */

/**
 * DELETE /api/mood/:id
 * Delete a specific mood entry (only if user owns it)
 */
router.delete("/:id", verifyToken, (req, res) => {
  const moodId = req.params.id;
  
  db.query(
    "SELECT user_id FROM moods WHERE id = ?",
    [moodId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (!results.length) {
        return res.status(404).json({ msg: "Mood entry not found" });
      }
      
      if (results[0].user_id !== req.user.id) {
        return res.status(403).json({ msg: "Unauthorized" });
      }
      
      db.query("DELETE FROM moods WHERE id = ?", [moodId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: "Mood entry deleted successfully" });
      });
    }
  );
});

/* ==================== MOOD STATISTICS ==================== */

/**
 * GET /api/mood/stats/:user_id
 * Get mood statistics for the user
 */
router.get("/stats/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    `SELECT 
      COUNT(*) as total_entries,
      AVG(mood) as average_mood,
      MIN(mood) as lowest_mood,
      MAX(mood) as highest_mood,
      SUM(CASE WHEN mood = 1 THEN 1 ELSE 0 END) as terrible_count,
      SUM(CASE WHEN mood = 2 THEN 1 ELSE 0 END) as sad_count,
      SUM(CASE WHEN mood = 3 THEN 1 ELSE 0 END) as okay_count,
      SUM(CASE WHEN mood = 4 THEN 1 ELSE 0 END) as good_count,
      SUM(CASE WHEN mood = 5 THEN 1 ELSE 0 END) as great_count,
      DATE(MAX(created_at)) as last_entry_date
     FROM moods 
     WHERE user_id = ?`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      const stats = results[0];
      
      const moodLabels = { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" };
      
      res.json({
        ...stats,
        average_mood: stats.average_mood ? parseFloat(stats.average_mood).toFixed(2) : 0,
        mood_distribution: {
          terrible: stats.terrible_count || 0,
          sad: stats.sad_count || 0,
          okay: stats.okay_count || 0,
          good: stats.good_count || 0,
          great: stats.great_count || 0
        }
      });
    }
  );
});

/**
 * GET /api/mood/trend/:user_id
 * Get mood trend for the last 30 days
 */
router.get("/trend/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    `SELECT 
      DATE(created_at) as date,
      mood,
      DAYNAME(created_at) as day_name
     FROM moods 
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     ORDER BY created_at ASC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

module.exports = router;