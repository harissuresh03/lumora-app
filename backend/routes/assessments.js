// backend/routes/assessments.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

// PHQ-9 Questions
const PHQ9_QUESTIONS = [
  { id: 1, text: "Little interest or pleasure in doing things", scores: [0, 1, 2, 3] },
  { id: 2, text: "Feeling down, depressed, or hopeless", scores: [0, 1, 2, 3] },
  { id: 3, text: "Trouble falling/staying asleep or sleeping too much", scores: [0, 1, 2, 3] },
  { id: 4, text: "Feeling tired or having little energy", scores: [0, 1, 2, 3] },
  { id: 5, text: "Poor appetite or overeating", scores: [0, 1, 2, 3] },
  { id: 6, text: "Feeling bad about yourself or that you're a failure", scores: [0, 1, 2, 3] },
  { id: 7, text: "Trouble concentrating on things", scores: [0, 1, 2, 3] },
  { id: 8, text: "Moving or speaking slowly, or being fidgety/restless", scores: [0, 1, 2, 3] },
  { id: 9, text: "Thoughts that you would be better off dead or hurting yourself", scores: [0, 1, 2, 3] }
];

// GAD-7 Questions
const GAD7_QUESTIONS = [
  { id: 1, text: "Feeling nervous, anxious, or on edge", scores: [0, 1, 2, 3] },
  { id: 2, text: "Not being able to stop or control worrying", scores: [0, 1, 2, 3] },
  { id: 3, text: "Worrying too much about different things", scores: [0, 1, 2, 3] },
  { id: 4, text: "Trouble relaxing", scores: [0, 1, 2, 3] },
  { id: 5, text: "Being so restless that it's hard to sit still", scores: [0, 1, 2, 3] },
  { id: 6, text: "Becoming easily annoyed or irritable", scores: [0, 1, 2, 3] },
  { id: 7, text: "Feeling afraid as if something awful might happen", scores: [0, 1, 2, 3] }
];

// Get PHQ-9 questions
router.get("/phq9/questions", verifyToken, (req, res) => {
  res.json({ questions: PHQ9_QUESTIONS });
});

// Get GAD-7 questions
router.get("/gad7/questions", verifyToken, (req, res) => {
  res.json({ questions: GAD7_QUESTIONS });
});

// Get assessment history
router.get("/history/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    "SELECT * FROM assessments WHERE user_id = ? ORDER BY taken_at DESC LIMIT 10",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// Submit PHQ-9 assessment
router.post("/phq9", verifyToken, (req, res) => {
  const { user_id, answers } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  // Calculate score
  let totalScore = 0;
  for (let i = 0; i < answers.length; i++) {
    totalScore += answers[i];
  }
  
  // Determine severity
  let severity = "";
  if (totalScore <= 4) severity = "Minimal depression";
  else if (totalScore <= 9) severity = "Mild depression";
  else if (totalScore <= 14) severity = "Moderate depression";
  else if (totalScore <= 19) severity = "Moderately severe depression";
  else severity = "Severe depression";
  
  // Check for self-harm risk (question 9 score > 0)
  const hasSelfHarmRisk = answers[8] > 0;
  
  db.query(
    "INSERT INTO assessments (user_id, type, score, severity, answers) VALUES (?, 'phq9', ?, ?, ?)",
    [user_id, totalScore, severity, JSON.stringify(answers)],
    (err, result) => {
      if (err) {
        console.error("Save assessment error:", err);
        return res.status(500).json({ msg: "Failed to save assessment" });
      }
      
      // ✅ Return the assessment ID for export
      res.json({
        id: result.insertId,  // ✅ ADDED - Assessment ID for export
        score: totalScore,
        severity,
        maxScore: 27,
        hasSelfHarmRisk,
        recommendation: getRecommendation(severity, hasSelfHarmRisk)
      });
    }
  );
});

// Submit GAD-7 assessment
router.post("/gad7", verifyToken, (req, res) => {
  const { user_id, answers } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  let totalScore = 0;
  for (let i = 0; i < answers.length; i++) {
    totalScore += answers[i];
  }
  
  let severity = "";
  if (totalScore <= 4) severity = "Minimal anxiety";
  else if (totalScore <= 9) severity = "Mild anxiety";
  else if (totalScore <= 14) severity = "Moderate anxiety";
  else severity = "Severe anxiety";
  
  db.query(
    "INSERT INTO assessments (user_id, type, score, severity, answers) VALUES (?, 'gad7', ?, ?, ?)",
    [user_id, totalScore, severity, JSON.stringify(answers)],
    (err, result) => {
      if (err) {
        console.error("Save assessment error:", err);
        return res.status(500).json({ msg: "Failed to save assessment" });
      }
      
      // ✅ Return the assessment ID for export
      res.json({
        id: result.insertId,  // ✅ ADDED - Assessment ID for export
        score: totalScore,
        severity,
        maxScore: 21,
        recommendation: getAnxietyRecommendation(severity)
      });
    }
  );
});

function getRecommendation(severity, hasSelfHarmRisk) {
  if (hasSelfHarmRisk) {
    return "You indicated thoughts of self-harm. Please reach out to a mental health professional immediately. Call Talian Kasih (15999) or Befrienders KL (03-7627 2929) for immediate support.";
  }
  
  switch(severity) {
    case "Minimal depression":
      return "Your symptoms are minimal. Continue practicing self-care and monitoring your mood.";
    case "Mild depression":
      return "Consider speaking with a counsellor. Journaling and physical activity may help improve your mood.";
    case "Moderate depression":
      return "We recommend speaking with a mental health professional. Your university counselling services can provide support.";
    case "Moderately severe depression":
      return "Please consider reaching out to a mental health professional. Your symptoms are significant and professional support is recommended.";
    case "Severe depression":
      return "We strongly encourage you to speak with a mental health professional as soon as possible. Your university counselling services and hotlines are available to support you.";
    default:
      return "Continue monitoring your mental health and reach out for support if needed.";
  }
}

function getAnxietyRecommendation(severity) {
  switch(severity) {
    case "Minimal anxiety":
      return "Your anxiety levels are within normal range. Continue healthy coping strategies.";
    case "Mild anxiety":
      return "Consider trying relaxation techniques like deep breathing or meditation. Regular exercise can also help.";
    case "Moderate anxiety":
      return "We recommend speaking with a counsellor. Learning anxiety management techniques can be very helpful.";
    case "Severe anxiety":
      return "Please consider reaching out to a mental health professional. Your symptoms are significant and professional support is recommended.";
    default:
      return "Continue monitoring your anxiety levels and reach out for support if needed.";
  }
}

module.exports = router;