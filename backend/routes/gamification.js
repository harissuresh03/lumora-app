// backend/routes/gamification.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const {
  getUserPoints,
  getAllStreaks,
  getAllBadges,
  getUserBadges,
  getEquippedBadge,
  equipBadge,
  logGamificationActivity,
  checkAndAwardBadges
} = require("../services/gamificationService");

// Get user gamification stats
router.get("/stats/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  try {
    const points = await getUserPoints(userId);
    const streaks = await getAllStreaks(userId);
    const badges = await getUserBadges(userId);
    const equipped = await getEquippedBadge(userId);
    
    res.json({
      points,
      streaks,
      badges: badges || [],
      equipped_badge: equipped,
      total_badges: badges ? badges.length : 0
    });
  } catch (error) {
    console.error("Gamification stats error:", error);
    res.status(500).json({ msg: "Failed to fetch gamification stats" });
  }
});

// Get all badges
router.get("/badges/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  try {
    const allBadges = await getAllBadges();
    const userBadges = await getUserBadges(userId);
    const userBadgeIds = userBadges.map(b => b.badge_id);
    
    const badges = allBadges.map(b => ({
      ...b,
      is_earned: userBadgeIds.includes(b.id),
      is_equipped: userBadges.find(ub => ub.badge_id === b.id)?.is_equipped || false
    }));
    
    res.json(badges);
  } catch (error) {
    console.error("Badges error:", error);
    res.status(500).json({ msg: "Failed to fetch badges" });
  }
});

// Equip a badge
router.post("/badges/equip", verifyToken, async (req, res) => {
  const { badge_id } = req.body;
  const userId = req.user.id;
  
  try {
    const [userBadge] = await db.promise().query(
      "SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?",
      [userId, badge_id]
    );
    
    if (userBadge.length === 0) {
      return res.status(400).json({ msg: "You have not earned this badge" });
    }
    
    await equipBadge(userId, badge_id);
    const equipped = await getEquippedBadge(userId);
    
    res.json({ msg: "Badge equipped successfully", equipped_badge: equipped });
  } catch (error) {
    console.error("Equip badge error:", error);
    res.status(500).json({ msg: "Failed to equip badge" });
  }
});

// Unequip badge
router.post("/badges/unequip", verifyToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    await db.promise().query(
      "UPDATE user_badges SET is_equipped = FALSE WHERE user_id = ?",
      [userId]
    );
    
    res.json({ msg: "Badge unequipped successfully" });
  } catch (error) {
    console.error("Unequip badge error:", error);
    res.status(500).json({ msg: "Failed to unequip badge" });
  }
});

// Log activity (internal - called from other routes)
router.post("/log-activity", verifyToken, async (req, res) => {
  const { activity_type, metadata } = req.body;
  const userId = req.user.id;
  
  try {
    const result = await logGamificationActivity(userId, activity_type, metadata);
    res.json(result);
  } catch (error) {
    console.error("Log activity error:", error);
    res.status(500).json({ msg: "Failed to log activity" });
  }
});

// Check and award new badges
router.post("/check-badges/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  try {
    // Collect user data for badge checking
    const [moods] = await db.promise().query(
      "SELECT COUNT(*) as count FROM moods WHERE user_id = ?",
      [userId]
    );
    
    const [journals] = await db.promise().query(
      "SELECT COUNT(*) as count FROM journals WHERE user_id = ?",
      [userId]
    );
    
    const [assessments] = await db.promise().query(
      "SELECT type, COUNT(*) as count FROM assessments WHERE user_id = ? GROUP BY type",
      [userId]
    );
    
    const [chats] = await db.promise().query(
      "SELECT COUNT(*) as count FROM gamification_activity_log WHERE user_id = ? AND activity_type = 'chat'",
      [userId]
    );
    
    const [comments] = await db.promise().query(
      "SELECT COUNT(*) as count FROM gamification_activity_log WHERE user_id = ? AND activity_type = 'comment'",
      [userId]
    );
    
    const [articles] = await db.promise().query(
      "SELECT COUNT(*) as count FROM gamification_activity_log WHERE user_id = ? AND activity_type = 'article_read'",
      [userId]
    );
    
    const [activities] = await db.promise().query(
      "SELECT COUNT(*) as count FROM gamification_activity_log WHERE user_id = ? AND activity_type = 'activity_completed'",
      [userId]
    );
    
    const [stressForecasts] = await db.promise().query(
      "SELECT COUNT(*) as count FROM gamification_activity_log WHERE user_id = ? AND activity_type = 'stress_forecast_view'",
      [userId]
    );
    
    const [selfCareDays] = await db.promise().query(
      "SELECT COUNT(DISTINCT DATE(created_at)) as count FROM gamification_activity_log WHERE user_id = ? AND activity_type IN ('mood', 'sleep', 'journal')",
      [userId]
    );
    
    const streaks = await getAllStreaks(userId);
    
    const userData = {
      moodCount: moods[0].count || 0,
      journalCount: journals[0].count || 0,
      chatCount: chats[0].count || 0,
      commentCount: comments[0].count || 0,
      articleCount: articles[0].count || 0,
      activityCount: activities[0].count || 0,
      stressForecastCount: stressForecasts[0].count || 0,
      selfCareDays: selfCareDays[0].count || 0,
      phq9Completed: assessments.find(a => a.type === 'phq9')?.count || 0,
      gad7Completed: assessments.find(a => a.type === 'gad7')?.count || 0,
      pssCompleted: assessments.find(a => a.type === 'pss')?.count || 0,
      streaks: streaks
    };
    
    const awarded = await checkAndAwardBadges(userId, userData);
    
    res.json({ awarded_badges: awarded });
  } catch (error) {
    console.error("Check badges error:", error);
    res.status(500).json({ msg: "Failed to check badges" });
  }
});

module.exports = router;