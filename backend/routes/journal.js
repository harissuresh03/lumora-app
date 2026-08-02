// backend/routes/journal.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const { detectCrisisWithAI, createCrisisAlert } = require("../services/ModerationService");

const router = express.Router();

/* GET journals */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT id, user_id, content, created_at FROM journals WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ADD journal with AI-based crisis detection */
router.post("/", verifyToken, async (req, res) => {
  const { user_id, content } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  if (!user_id || !content) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    // ✅ Use AI-based crisis detection
    const crisisCheck = await detectCrisisWithAI(content);
    
    let crisisDetected = false;
    
    if (crisisCheck.hasCrisis) {
      crisisDetected = true;
      console.log(`🚨 AI detected crisis in journal entry for user: ${user_id}`);
      console.log(`   Reason: ${crisisCheck.reason}`);
      console.log(`   Confidence: ${crisisCheck.confidence}%`);
      console.log(`   Severity: ${crisisCheck.severity}`);
      
      // Create crisis alert (this will send email + dashboard notification)
      await createCrisisAlert(
        user_id, 
        content, 
        null, // Auto-finds counsellor
        'journal' // Source: journal
      );
    }

    // ALWAYS SAVE THE JOURNAL ENTRY (crisis does NOT block)
    const [result] = await db.promise().query(
      "INSERT INTO journals (user_id, content) VALUES (?, ?)",
      [user_id, content]
    );
    
    // If crisis detected, return with warning
    if (crisisDetected) {
      return res.json({
        msg: "Journal saved. We noticed you might be going through a difficult time. Help is available. 💙",
        id: result.insertId,
        crisisDetected: true,
        crisisConfidence: crisisCheck.confidence,
        crisisResources: [
          { name: "Talian Kasih", number: "15999", hours: "24/7" },
          { name: "Befrienders KL", number: "03-7627 2929", hours: "24/7" },
          { name: "Talian HEAL", number: "15555", hours: "8.30 am – 11.59 pm" }
        ]
      });
    }
    
    res.json({ msg: "Journal saved 🌿", id: result.insertId });
    
  } catch (err) {
    console.error("Journal save error:", err);
    res.status(500).json({ msg: "Failed to save journal", error: err.message });
  }
});

/* DELETE journal */
router.delete("/:id", verifyToken, (req, res) => {
  const journalId = req.params.id;
  
  db.query(
    "SELECT user_id FROM journals WHERE id = ?",
    [journalId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (!results.length) {
        return res.status(404).json({ msg: "Journal entry not found" });
      }
      
      if (results[0].user_id !== req.user.id) {
        return res.status(403).json({ msg: "Unauthorized" });
      }
      
      db.query("DELETE FROM journals WHERE id = ?", [journalId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: "Journal entry deleted" });
      });
    }
  );
});

module.exports = router;