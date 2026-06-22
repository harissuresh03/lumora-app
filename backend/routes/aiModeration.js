// backend/routes/aiModeration.js
const express = require("express");
const router = express.Router();
const { moderatePost, createCrisisAlert } = require("../services/ModerationService");
const verifyToken = require("../middleware/authmiddleware");

console.log("📁 aiModeration.js loaded!");

router.post("/moderate", verifyToken, async (req, res) => {
  console.log("🔍 /moderate endpoint called");
  const { content } = req.body;
  const userId = req.user.id;
  
  if (!content) {
    return res.status(400).json({ msg: "Content is required" });
  }

  try {
    const result = await moderatePost(content);
    console.log("📤 Moderation result:", result);
    
    // ✅ If crisis is detected, create alert
    if (result.action === 'crisis' && result.isCrisis) {
      await createCrisisAlert(userId, content);
    }
    
    res.json(result);
  } catch (error) {
    console.error("❌ Moderation error:", error);
    res.status(500).json({
      action: 'approved',
      reason: 'Moderation service unavailable, approved by default',
      score: 0,
      error: error.message
    });
  }
});

module.exports = router;