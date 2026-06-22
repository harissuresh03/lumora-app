// backend/routes/stressForecast.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const { generateStressForecast } = require("../services/stressPredictionService");

// Generate and save stress forecast
router.post("/generate/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    // 1. Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 2. Get today's mood
    const [moodResult] = await db.promise().query(
      "SELECT mood FROM moods WHERE user_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    const moodScore = moodResult.length > 0 ? moodResult[0].mood : 3; // Default to "Okay" (3)

    // 3. Get incomplete deadlines
    const [deadlines] = await db.promise().query(
      "SELECT * FROM deadlines WHERE user_id = ? AND is_complete = 0 ORDER BY due_date ASC",
      [userId]
    );

    if (deadlines.length === 0) {
      return res.json({
        message: "No deadlines found. Add some deadlines to get a stress forecast.",
        hasData: false
      });
    }

    // 4. Call AI to generate forecast
    const forecast = await generateStressForecast(moodScore, deadlines, todayStr);

    // 5. Save forecast to database
    await db.promise().query(
      `INSERT INTO stress_forecast 
       (user_id, forecast_data, peak_stress_day, overdue_warning, tip, summary_sentence, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        userId,
        JSON.stringify(forecast.forecast),
        JSON.stringify(forecast.peak_stress_day),
        forecast.overdue_warning || null,
        JSON.stringify(forecast.tip),
        forecast.summary_sentence
      ]
    );

    // 6. Return the forecast
    res.json({
      hasData: true,
      forecast: forecast.forecast,
      peak_stress_day: forecast.peak_stress_day,
      overdue_warning: forecast.overdue_warning,
      tip: forecast.tip,
      summary_sentence: forecast.summary_sentence,
      mood_used: moodScore
    });

  } catch (error) {
    console.error("Generate forecast error:", error);
    res.status(500).json({ msg: "Failed to generate stress forecast", error: error.message });
  }
});

// Get latest stress forecast for a user
router.get("/latest/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [result] = await db.promise().query(
      `SELECT 
        id,
        forecast_data,
        peak_stress_day,
        overdue_warning,
        tip,
        summary_sentence,
        created_at
       FROM stress_forecast 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.length === 0) {
      return res.json({ hasData: false, message: "No forecast found. Generate one first." });
    }

    res.json({
      hasData: true,
      id: result[0].id,
      forecast: JSON.parse(result[0].forecast_data),
      peak_stress_day: JSON.parse(result[0].peak_stress_day),
      overdue_warning: result[0].overdue_warning,
      tip: JSON.parse(result[0].tip),
      summary_sentence: result[0].summary_sentence,
      created_at: result[0].created_at  // ✅ Make sure this is included
    });

  } catch (error) {
    console.error("Fetch forecast error:", error);
    res.status(500).json({ msg: "Failed to fetch stress forecast" });
  }
});

// Get stress forecast history (for trends)
router.get("/history/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [results] = await db.promise().query(
      `SELECT 
        id,
        peak_stress_day,
        summary_sentence,
        created_at
       FROM stress_forecast 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [userId]
    );

    res.json(results);
  } catch (error) {
    console.error("Fetch forecast history error:", error);
    res.status(500).json({ msg: "Failed to fetch forecast history" });
  }
});

module.exports = router;