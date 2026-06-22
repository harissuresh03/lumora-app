// backend/routes/recommendations.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const {
  getUserProfile,
  generateRecommendations,
  getAssessmentRecommendation,
  detectCrisis,
  getArticlesFromDatabase
} = require("../services/recommendationService");

// GET personalized recommendations for user
router.get("/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    // Get user profile data (last 7 days)
    const profile = await getUserProfile(userId);
    
    // Check for crisis indicators first
    const crisis = await detectCrisis(userId);
    
    if (crisis.hasCrisis) {
      return res.json({
        crisis: true,
        crisisMessage: crisis.message,
        crisisResources: crisis.resources,
        recommendations: []
      });
    }
    
    // Check if user has enough data
    const hasEnoughData = profile.moodCount > 2 || profile.sleepCount > 2 || profile.journalCount > 0;
    
    if (!hasEnoughData) {
      return res.json({
        crisis: false,
        hasEnoughData: false,
        message: "Start logging your mood, sleep, or journal to get personalized recommendations!",
        recommendations: []
      });
    }
    
    // Get articles from database
    const articles = await getArticlesFromDatabase();
    
    // Generate recommendations using database articles
    const recommendations = await generateRecommendations(profile, articles);
    
    // Get assessment recommendation
    const assessmentRecommendation = await getAssessmentRecommendation(userId);
    
    res.json({
      crisis: false,
      hasEnoughData: true,
      recommendations,
      assessmentRecommendation
    });
    
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ msg: "Failed to generate recommendations" });
  }
});

module.exports = router;