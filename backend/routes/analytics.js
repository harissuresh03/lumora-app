// backend/routes/analytics.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

// Get mood triggers and patterns
router.get("/patterns/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  // Get mood data with timestamps for pattern analysis
  db.query(
    `SELECT 
      DATE(created_at) as date,
      DAYNAME(created_at) as day_name,
      HOUR(created_at) as hour,
      mood
     FROM moods 
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     ORDER BY created_at ASC`,
    [userId],
    (err, moods) => {
      if (err) return res.status(500).json(err);
      
      // Analyze day-of-week patterns
      const dayAverages = {
        Monday: { total: 0, count: 0, mood: 0 },
        Tuesday: { total: 0, count: 0, mood: 0 },
        Wednesday: { total: 0, count: 0, mood: 0 },
        Thursday: { total: 0, count: 0, mood: 0 },
        Friday: { total: 0, count: 0, mood: 0 },
        Saturday: { total: 0, count: 0, mood: 0 },
        Sunday: { total: 0, count: 0, mood: 0 }
      };
      
      moods.forEach(m => {
        if (dayAverages[m.day_name]) {
          dayAverages[m.day_name].total += m.mood;
          dayAverages[m.day_name].count++;
        }
      });
      
      // Calculate averages and find lowest/highest days
      const dayPatterns = [];
      let lowestDay = { day: "", mood: 5 };
      let highestDay = { day: "", mood: 1 };
      
      Object.keys(dayAverages).forEach(day => {
        if (dayAverages[day].count > 0) {
          const avg = dayAverages[day].total / dayAverages[day].count;
          dayPatterns.push({ day, avgMood: parseFloat(avg.toFixed(1)) });
          
          if (avg < lowestDay.mood) {
            lowestDay = { day, mood: avg };
          }
          if (avg > highestDay.mood) {
            highestDay = { day, mood: avg };
          }
        }
      });
      
      // Get sleep-mood correlation
      db.query(
        `SELECT 
          s.quality as sleep_quality,
          m.mood
         FROM sleep s
         JOIN moods m ON DATE(s.created_at) = DATE(m.created_at)
         WHERE s.user_id = ? AND m.user_id = ? 
         AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [userId, userId],
        (err, correlations) => {
          if (err) return res.status(500).json(err);
          
          // Calculate correlation between sleep quality and mood
          let sleepCorrelation = { goodSleep: 0, poorSleep: 0 };
          let goodSleepCount = 0, poorSleepCount = 0;
          
          correlations.forEach(c => {
            if (c.sleep_quality >= 4) {
              sleepCorrelation.goodSleep += c.mood;
              goodSleepCount++;
            } else if (c.sleep_quality <= 2) {
              sleepCorrelation.poorSleep += c.mood;
              poorSleepCount++;
            }
          });
          
          const insights = [];
          
          // Day pattern insight
          if (lowestDay.day) {
            insights.push({
              type: "day_pattern",
              title: "Mood Pattern Detected",
              description: `Your mood tends to be lowest on ${lowestDay.day}s and highest on ${highestDay.day}s.`,
              suggestion: `Try planning relaxing activities on ${lowestDay.day}s and productive tasks on ${highestDay.day}s.`
            });
          }
          
          // Sleep correlation insight
          if (goodSleepCount > 0 && poorSleepCount > 0) {
            const avgMoodGoodSleep = sleepCorrelation.goodSleep / goodSleepCount;
            const avgMoodPoorSleep = sleepCorrelation.poorSleep / poorSleepCount;
            const difference = avgMoodGoodSleep - avgMoodPoorSleep;
            
            if (difference > 0.5) {
              insights.push({
                type: "sleep_correlation",
                title: "Sleep Affects Your Mood",
                description: `On days with good sleep, your mood averages ${avgMoodGoodSleep.toFixed(1)}/5. On poor sleep days, it drops to ${avgMoodPoorSleep.toFixed(1)}/5.`,
                suggestion: "Try to maintain a consistent sleep schedule for better emotional balance."
              });
            }
          }
          
          // Get recent mood trend
          const recentMoods = moods.slice(-7);
          const recentAvg = recentMoods.reduce((sum, m) => sum + m.mood, 0) / recentMoods.length;
          const previousMoods = moods.slice(-14, -7);
          const previousAvg = previousMoods.reduce((sum, m) => sum + m.mood, 0) / previousMoods.length;
          
          if (recentAvg > previousAvg + 0.5) {
            insights.push({
              type: "improving_trend",
              title: "You're on an Upward Trend! 🎉",
              description: `Your mood has improved from ${previousAvg.toFixed(1)} to ${recentAvg.toFixed(1)} over the last week.`,
              suggestion: "Keep up the positive habits that are working for you!"
            });
          } else if (recentAvg < previousAvg - 0.5) {
            insights.push({
              type: "declining_trend",
              title: "Your Mood Has Been Lower Lately",
              description: `Your mood has decreased from ${previousAvg.toFixed(1)} to ${recentAvg.toFixed(1)}.`,
              suggestion: "Consider checking in with a counsellor or trying some self-care activities."
            });
          }
          
          res.json({
            dayPatterns,
            insights,
            sleepCorrelation: {
              withGoodSleep: goodSleepCount > 0 ? (sleepCorrelation.goodSleep / goodSleepCount).toFixed(1) : null,
              withPoorSleep: poorSleepCount > 0 ? (sleepCorrelation.poorSleep / poorSleepCount).toFixed(1) : null
            },
            moodHistory: moods.slice(-14).map(m => ({
              date: m.date,
              mood: m.mood
            }))
          });
        }
      );
    }
  );
});

// Log an activity (for tracking triggers)
router.post("/activity", verifyToken, (req, res) => {
  const { user_id, activity_type, intensity, notes } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    "INSERT INTO activity_log (user_id, activity_type, intensity, notes, logged_at) VALUES (?, ?, ?, ?, CURDATE())",
    [user_id, activity_type, intensity || 1, notes || null],
    (err, result) => {
      if (err) {
        console.error("Log activity error:", err);
        return res.status(500).json({ msg: "Failed to log activity" });
      }
      res.json({ msg: "Activity logged successfully" });
    }
  );
});

// Get activity suggestions based on mood
router.get("/suggestions/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  // Get today's mood
  db.query(
    "SELECT mood FROM moods WHERE user_id = ? AND DATE(created_at) = CURDATE() ORDER BY created_at DESC LIMIT 1",
    [userId],
    (err, moodResult) => {
      if (err) return res.status(500).json(err);
      
      const currentMood = moodResult[0]?.mood || 3;
      let suggestions = [];
      
      if (currentMood <= 2) {
        suggestions = [
          { activity: "Take a 5-minute break", why: "Rest can help reset your mind" },
          { activity: "Message a friend", why: "Social connection can lift your mood" },
          { activity: "Listen to uplifting music", why: "Music can improve emotional state" },
          { activity: "Try deep breathing", why: "Calms the nervous system" }
        ];
      } else if (currentMood === 3) {
        suggestions = [
          { activity: "Go for a short walk", why: "Movement boosts endorphins" },
          { activity: "Write in your journal", why: "Processing thoughts can bring clarity" },
          { activity: "Do something kind for someone", why: "Acts of kindness increase happiness" }
        ];
      } else {
        suggestions = [
          { activity: "Share what made you happy", why: "Gratitude multiplies positive feelings" },
          { activity: "Help someone else", why: "Supporting others feels rewarding" },
          { activity: "Plan something to look forward to", why: "Anticipation boosts mood" }
        ];
      }
      
      res.json({ currentMood, suggestions });
    }
  );
});

module.exports = router;