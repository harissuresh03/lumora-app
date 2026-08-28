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
    console.log(`🔍 Fetching recommendations for user ${userId}`);
    
    // Get user profile data
    const profile = await getUserProfile(userId);
    console.log(`📊 Profile from getUserProfile:`, {
      moodCount: profile.moodCount,
      sleepCount: profile.sleepCount,
      journalCount: profile.journalCount,
      assessmentCount: profile.assessmentCount
    });
    
    // Check for crisis indicators first
    const crisis = await detectCrisis(userId);
    
    if (crisis.hasCrisis) {
      console.log(`🚨 Crisis detected for user ${userId}`);
      return res.json({
        crisis: true,
        crisisMessage: crisis.message,
        crisisResources: crisis.resources,
        recommendations: []
      });
    }
    
    // Get articles from database
    const articles = await getArticlesFromDatabase();
    console.log(`📚 Found ${articles.length} articles`);
    
    // Generate recommendations
    const result = await generateRecommendations(profile, articles);
    console.log(`📊 Final result: hasEnoughData=${result.hasEnoughData}, recommendations=${result.recommendations.length}`);
    
    // Get assessment recommendation
    const assessmentRecommendation = await getAssessmentRecommendation(userId);
    
    res.json({
      crisis: false,
      ...result,
      assessmentRecommendation
    });
    
  } catch (error) {
    console.error("❌ Recommendation error:", error);
    res.status(500).json({ msg: "Failed to generate recommendations", error: error.message });
  }
});

module.exports = router;