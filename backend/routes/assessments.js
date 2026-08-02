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

// PSS-10 Questions (Official Perceived Stress Scale)
const PSS10_QUESTIONS = [
  { id: 1, text: "In the last month, how often have you been upset because of something that happened unexpectedly?", scores: [0, 1, 2, 3, 4] },
  { id: 2, text: "In the last month, how often have you felt that you were unable to control the important things in your life?", scores: [0, 1, 2, 3, 4] },
  { id: 3, text: "In the last month, how often have you felt nervous and 'stressed'?", scores: [0, 1, 2, 3, 4] },
  { id: 4, text: "In the last month, how often have you felt confident about your ability to handle your personal problems?", scores: [0, 1, 2, 3, 4] },
  { id: 5, text: "In the last month, how often have you felt that things were going your way?", scores: [0, 1, 2, 3, 4] },
  { id: 6, text: "In the last month, how often have you found that you could not cope with all the things that you had to do?", scores: [0, 1, 2, 3, 4] },
  { id: 7, text: "In the last month, how often have you been able to control irritations in your life?", scores: [0, 1, 2, 3, 4] },
  { id: 8, text: "In the last month, how often have you felt that you were on top of things?", scores: [0, 1, 2, 3, 4] },
  { id: 9, text: "In the last month, how often have you been angered because of things that happened that were outside of your control?", scores: [0, 1, 2, 3, 4] },
  { id: 10, text: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", scores: [0, 1, 2, 3, 4] }
];

// ============================================
// PHQ-9 ROUTES
// ============================================

// Get PHQ-9 questions
router.get("/phq9/questions", verifyToken, (req, res) => {
  res.json({ questions: PHQ9_QUESTIONS });
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
      
      res.json({
        id: result.insertId,
        score: totalScore,
        severity,
        maxScore: 27,
        hasSelfHarmRisk,
        recommendation: getPHQ9Recommendation(severity, hasSelfHarmRisk)
      });
    }
  );
});

function getPHQ9Recommendation(severity, hasSelfHarmRisk) {
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

// ============================================
// GAD-7 ROUTES
// ============================================

// Get GAD-7 questions
router.get("/gad7/questions", verifyToken, (req, res) => {
  res.json({ questions: GAD7_QUESTIONS });
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
      
      res.json({
        id: result.insertId,
        score: totalScore,
        severity,
        maxScore: 21,
        recommendation: getGAD7Recommendation(severity)
      });
    }
  );
});

function getGAD7Recommendation(severity) {
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

// ============================================
// PSS-10 ROUTES
// ============================================

// Get PSS-10 questions
router.get("/pss/questions", verifyToken, (req, res) => {
  res.json({ questions: PSS10_QUESTIONS });
});

// Submit PSS-10 assessment
router.post("/pss", verifyToken, (req, res) => {
  const { user_id, answers } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  // Reverse scores for questions 4, 5, 7, 8 (indexes 3, 4, 6, 7)
  let totalScore = 0;
  for (let i = 0; i < answers.length; i++) {
    if ([3, 4, 6, 7].includes(i)) {
      // Reverse score: 0->4, 1->3, 2->2, 3->1, 4->0
      totalScore += (4 - answers[i]);
    } else {
      totalScore += answers[i];
    }
  }
  
  // Determine severity
  let severity = "";
  if (totalScore <= 13) severity = "Low stress";
  else if (totalScore <= 26) severity = "Moderate stress";
  else severity = "High stress";
  
  db.query(
    "INSERT INTO assessments (user_id, type, score, severity, answers) VALUES (?, 'pss', ?, ?, ?)",
    [user_id, totalScore, severity, JSON.stringify(answers)],
    (err, result) => {
      if (err) {
        console.error("Save PSS assessment error:", err);
        return res.status(500).json({ msg: "Failed to save assessment" });
      }
      
      res.json({
        id: result.insertId,
        score: totalScore,
        severity,
        maxScore: 40,
        recommendation: getPSSRecommendation(severity)
      });
    }
  );
});

function getPSSRecommendation(severity) {
  switch(severity) {
    case "Low stress":
      return "Your stress levels are within a healthy range. Continue your current self-care practices and monitor your stress regularly.";
    case "Moderate stress":
      return "Your stress levels are moderate. Consider practicing relaxation techniques such as deep breathing, meditation, or exercise. If stress persists, consider speaking with a counsellor.";
    case "High stress":
      return "Your stress levels are high. We strongly encourage you to reach out to a counsellor or mental health professional immediately. Practice deep breathing, prioritize self-care, and remember that help is available.";
    default:
      return "Continue monitoring your stress levels and reach out for support if needed.";
  }
}

// Get the latest PSS score for a user
router.get("/pss/latest/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    "SELECT score, severity, taken_at FROM assessments WHERE user_id = ? AND type = 'pss' ORDER BY taken_at DESC LIMIT 1",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Fetch PSS error:", err);
        return res.status(500).json({ msg: "Failed to fetch PSS data" });
      }
      
      if (results.length === 0) {
        return res.json({ exists: false });
      }
      
      res.json({
        exists: true,
        score: results[0].score,
        severity: results[0].severity,
        taken_at: results[0].taken_at
      });
    }
  );
});

// Check if PSS should be retaken (monthly)
router.get("/pss/should-retake/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    "SELECT taken_at FROM assessments WHERE user_id = ? AND type = 'pss' ORDER BY taken_at DESC LIMIT 1",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Check PSS retake error:", err);
        return res.status(500).json({ msg: "Failed to check PSS status" });
      }
      
      if (results.length === 0) {
        return res.json({ shouldRetake: true, reason: "No PSS assessment taken yet." });
      }
      
      const lastTaken = new Date(results[0].taken_at);
      const now = new Date();
      const daysDiff = (now - lastTaken) / (1000 * 60 * 60 * 24);
      
      if (daysDiff >= 30) {
        return res.json({ 
          shouldRetake: true, 
          reason: `It's been ${Math.floor(daysDiff)} days since your last assessment. Please retake it monthly.` 
        });
      }
      
      res.json({ 
        shouldRetake: false, 
        reason: `Last taken ${Math.floor(daysDiff)} days ago. Retake in ${30 - Math.floor(daysDiff)} days.` 
      });
    }
  );
});

// ============================================
// ASSESSMENT HISTORY ROUTES
// ============================================

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

// Get assessment history for graphing with comparison
router.get("/history/graph/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    `SELECT 
      id,
      type,
      score,
      severity,
      taken_at,
      DATE(taken_at) as date
     FROM assessments 
     WHERE user_id = ? 
     ORDER BY taken_at ASC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Fetch assessment history error:", err);
        return res.status(500).json({ msg: "Failed to fetch assessment history" });
      }
      
      // Separate PHQ-9, GAD-7, and PSS data
      const phq9Data = results.filter(r => r.type === 'phq9').map(r => ({
        date: r.date,
        score: r.score,
        severity: r.severity,
        taken_at: r.taken_at
      }));
      
      const gad7Data = results.filter(r => r.type === 'gad7').map(r => ({
        date: r.date,
        score: r.score,
        severity: r.severity,
        taken_at: r.taken_at
      }));
      
      const pssData = results.filter(r => r.type === 'pss').map(r => ({
        date: r.date,
        score: r.score,
        severity: r.severity,
        taken_at: r.taken_at
      }));
      
      res.json({
        phq9: phq9Data,
        gad7: gad7Data,
        pss: pssData,
        total: results.length
      });
    }
  );
});

module.exports = router;