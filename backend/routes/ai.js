// backend/routes/ai.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const { 
  processChatMessage, 
  generateJournalSummary, 
  updateMoodFromAI 
} = require("../services/aiService");
const { createCrisisAlert, quickCrisisCheck } = require("../services/ModerationService");

// Helper function to get mood label
function getMoodLabel(mood) {
  const labels = {
    1: "Terrible",
    2: "Sad",
    3: "Okay",
    4: "Good",
    5: "Great"
  };
  return labels[mood] || "Okay";
}

// Crisis resources to return when crisis is detected
const CRISIS_RESOURCES = [
  { name: "Talian Kasih", number: "15999", hours: "24/7" },
  { name: "Befrienders KL", number: "03-7627 2929", hours: "24/7" },
  { name: "Talian HEAL", number: "15555", hours: "8.30 am – 11.59 pm" }
];

/**
 * POST /api/ai/chat
 * Process a chat message and detect mood
 */
router.post("/chat", verifyToken, async (req, res) => {
  const { user_id, message, conversationHistory = [], autoSaveMood = true } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  if (!message) {
    return res.status(400).json({ msg: "Message is required" });
  }
  
  try {
    const aiAnalysis = await processChatMessage(message, conversationHistory);
    
    // Check if AI analysis indicates a failure
    if (aiAnalysis.isError || !aiAnalysis.response) {
      console.log("AI service unavailable - returning error without saving");
      return res.status(503).json({ 
        success: false,
        msg: "AI service is currently unavailable. Please try again later.",
        response: "I'm sorry, the AI service is currently unavailable. Please try again in a few moments. 🌙",
        moodAutoSaved: false,
        aiUnavailable: true
      });
    }
    
    // ✅ CHECK FOR CRISIS CONTENT IN CHAT MESSAGE
    const crisisCheck = quickCrisisCheck(message);
    
    if (crisisCheck.hasCrisis) {
      console.log("🚨 Crisis detected in chat message for user:", user_id);
      console.log("🔑 Crisis keywords found:", crisisCheck.crisisKeywords);
      
      // ✅ Create crisis alert (this will send email + dashboard notification)
      await createCrisisAlert(
        user_id, 
        message, 
        null, // Auto-finds counsellor
        'chat' // Source: chat
      );
    }
    
    let moodSaved = false;
    if (autoSaveMood && aiAnalysis.detectedMood) {
      moodSaved = await updateMoodFromAI(user_id, aiAnalysis.detectedMood);
    }
    
    // ✅ Return response with crisis flag and resources
    res.json({
      success: true,
      response: aiAnalysis.response,
      moodAnalysis: {
        detectedMood: aiAnalysis.detectedMood,
        moodLabel: getMoodLabel(aiAnalysis.detectedMood),
        primaryEmotion: aiAnalysis.primaryEmotion,
        intensity: aiAnalysis.intensity,
        keyThemes: aiAnalysis.keyThemes,
        confidence: aiAnalysis.confidence
      },
      moodAutoSaved: moodSaved,
      crisisDetected: crisisCheck.hasCrisis || false,
      crisisResources: crisisCheck.hasCrisis ? CRISIS_RESOURCES : undefined
    });
    
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(503).json({ 
      success: false,
      msg: "AI service is currently unavailable. Please try again later.",
      response: "I'm sorry, the AI service is currently unavailable. Please try again in a few moments. 🌙",
      moodAutoSaved: false,
      aiUnavailable: true
    });
  }
});

/**
 * POST /api/ai/save-journal
 * Save conversation as a journal entry (only if AI is working)
 */
router.post("/save-journal", verifyToken, async (req, res) => {
  const { user_id, conversationHistory, moodAnalysis } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  if (!conversationHistory || conversationHistory.length === 0) {
    return res.status(400).json({ msg: "No conversation to save" });
  }
  
  try {
    // Generate a journal summary from the conversation
    const journalContent = await generateJournalSummary(
      conversationHistory, 
      moodAnalysis?.detectedMood || 3,
      moodAnalysis?.primaryEmotion || "neutral"
    );
    
    // Check if journal generation failed
    if (!journalContent || journalContent.includes("unavailable") || journalContent.length < 20) {
      return res.status(503).json({ 
        success: false,
        msg: "AI service is currently unavailable. Cannot generate journal entry.",
        aiUnavailable: true
      });
    }
    
    // Insert journal entry with summary as content
    db.query(
      "INSERT INTO journals (user_id, content) VALUES (?, ?)",
      [user_id, journalContent],
      async (err, result) => {
        if (err) {
          console.error("Save journal error:", err);
          return res.status(500).json({ msg: "Failed to save journal entry" });
        }
        
        const journalId = result.insertId;
        
        // Save AI analysis to ai_analysis table (only if mood analysis exists)
        if (moodAnalysis && moodAnalysis.detectedMood) {
          db.query(
            `INSERT INTO ai_analysis 
             (journal_id, user_id, detected_mood, primary_emotion, intensity, themes, confidence, ai_response)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              journalId, user_id,
              moodAnalysis.detectedMood || 3,
              moodAnalysis.primaryEmotion || "neutral",
              moodAnalysis.intensity || 2,
              JSON.stringify(moodAnalysis.keyThemes || []),
              moodAnalysis.confidence || 0.5,
              conversationHistory[conversationHistory.length - 1]?.content || ""
            ],
            (err) => {
              if (err) console.error("Save AI analysis error:", err);
            }
          );
        }
        
        res.json({
          success: true,
          msg: "Journal saved successfully 🌿",
          journalId: journalId,
          content: journalContent
        });
      }
    );
    
  } catch (error) {
    console.error("Save journal error:", error);
    res.status(503).json({ 
      success: false,
      msg: "AI service is currently unavailable. Please try again later.",
      aiUnavailable: true
    });
  }
});

/**
 * GET /api/ai/analysis/:journal_id
 * Get AI analysis for a specific journal entry
 */
router.get("/analysis/:journal_id", verifyToken, (req, res) => {
  const { journal_id } = req.params;
  
  db.query(
    `SELECT detected_mood, primary_emotion, intensity, themes, confidence, created_at
     FROM ai_analysis 
     WHERE journal_id = ?`,
    [journal_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results[0] && results[0].themes) {
        try {
          results[0].themes = JSON.parse(results[0].themes);
        } catch(e) {}
      }
      res.json(results[0] || null);
    }
  );
});

module.exports = router;