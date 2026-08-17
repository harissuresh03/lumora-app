// backend/routes/studentExport.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// ============================================
// 1. EXPORT JOURNAL ENTRIES AS PDF
// ============================================

router.get("/journal/:user_id/pdf", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  const { month, year } = req.query;
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    let query = "SELECT * FROM journals WHERE user_id = ?";
    let params = [userId];
    
    if (month && year) {
      query += " AND MONTH(created_at) = ? AND YEAR(created_at) = ?";
      params.push(parseInt(month), parseInt(year));
    }
    
    query += " ORDER BY created_at DESC";
    
    const [journals] = await db.promise().query(query, params);
    
    if (journals.length === 0) {
      return res.status(404).json({ msg: "No journal entries found for this period" });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `journal_entries_${month || 'all'}_${year || 'all'}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    doc.fontSize(20).text('Lumora - Journal Entries', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Exported on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    if (month && year) {
      doc.text(`Month: ${new Date(year, month-1).toLocaleString('default', { month: 'long' })} ${year}`, { align: 'center' });
    }
    doc.moveDown();
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    journals.forEach((journal, index) => {
      const date = new Date(journal.created_at).toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      doc.fontSize(14).text(`Entry ${index + 1} - ${date}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(journal.content, { align: 'left', width: 500 });
      doc.moveDown();
      
      if (index < journals.length - 1) {
        doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();
      }
    });

    doc.end();
  } catch (error) {
    console.error("Export journal error:", error);
    res.status(500).json({ msg: "Failed to export journal entries" });
  }
});

// ============================================
// 2. EXPORT MOOD HISTORY AS CSV (LAST 7 DAYS)
// ============================================

router.get("/mood/:user_id/csv", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [moods] = await db.promise().query(
      `SELECT mood, created_at FROM moods 
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY created_at DESC`,
      [userId]
    );
    
    if (moods.length === 0) {
      return res.status(404).json({ msg: "No mood data found for the last 7 days" });
    }

    const moodLabels = {
      1: 'Terrible',
      2: 'Sad',
      3: 'Okay',
      4: 'Good',
      5: 'Great'
    };

    const formattedData = moods.map(m => ({
      Date: new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      Mood: m.mood,
      Mood_Label: moodLabels[m.mood] || 'Unknown'
    }));

    const fields = ['Date', 'Mood', 'Mood_Label'];
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedData);

    const filename = `mood_history_last_7_days.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export mood error:", error);
    res.status(500).json({ msg: "Failed to export mood data" });
  }
});

// ============================================
// 3. EXPORT SLEEP LOGS AS CSV (LAST 7 DAYS)
// ============================================

router.get("/sleep/:user_id/csv", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [sleep] = await db.promise().query(
      `SELECT bedtime, wake_time, duration, quality, created_at FROM sleep 
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY created_at DESC`,
      [userId]
    );
    
    if (sleep.length === 0) {
      return res.status(404).json({ msg: "No sleep data found for the last 7 days" });
    }

    const qualityLabels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Okay',
      4: 'Good',
      5: 'Excellent'
    };

    const formattedData = sleep.map(s => ({
      Date: new Date(s.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      Bedtime: s.bedtime,
      Wake_Time: s.wake_time,
      Duration_hours: parseFloat(s.duration).toFixed(1),
      Quality: s.quality,
      Quality_Label: qualityLabels[s.quality] || 'Unknown'
    }));

    const fields = ['Date', 'Bedtime', 'Wake_Time', 'Duration_hours', 'Quality', 'Quality_Label'];
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedData);

    const filename = `sleep_logs_last_7_days.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export sleep error:", error);
    res.status(500).json({ msg: "Failed to export sleep data" });
  }
});

// ============================================
// 4. EXPORT ASSESSMENT RESULT AS PDF
// ============================================

router.get("/assessment/:assessment_id/pdf", verifyToken, async (req, res) => {
  const assessmentId = parseInt(req.params.assessment_id);
  const userId = req.user.id;

  try {
    const [assessments] = await db.promise().query(
      "SELECT * FROM assessments WHERE id = ? AND user_id = ?",
      [assessmentId, userId]
    );
    
    if (assessments.length === 0) {
      return res.status(404).json({ msg: "Assessment not found" });
    }

    const assessment = assessments[0];
    let answers = [];
    try {
      answers = JSON.parse(assessment.answers);
    } catch (e) {
      answers = [];
    }

    let questions = [];
    if (assessment.type === 'phq9') {
      questions = [
        "Little interest or pleasure in doing things",
        "Feeling down, depressed, or hopeless",
        "Trouble falling/staying asleep or sleeping too much",
        "Feeling tired or having little energy",
        "Poor appetite or overeating",
        "Feeling bad about yourself or that you're a failure",
        "Trouble concentrating on things",
        "Moving or speaking slowly, or being fidgety/restless",
        "Thoughts that you would be better off dead or hurting yourself"
      ];
    } else if (assessment.type === 'gad7') {
      questions = [
        "Feeling nervous, anxious, or on edge",
        "Not being able to stop or control worrying",
        "Worrying too much about different things",
        "Trouble relaxing",
        "Being so restless that it's hard to sit still",
        "Becoming easily annoyed or irritable",
        "Feeling afraid as if something awful might happen"
      ];
    } else if (assessment.type === 'pss') {
      questions = [
        "In the last month, how often have you been upset because of something that happened unexpectedly?",
        "In the last month, how often have you felt that you were unable to control the important things in your life?",
        "In the last month, how often have you felt nervous and 'stressed'?",
        "In the last month, how often have you felt confident about your ability to handle your personal problems?",
        "In the last month, how often have you felt that things were going your way?",
        "In the last month, how often have you found that you could not cope with all the things that you had to do?",
        "In the last month, how often have you been able to control irritations in your life?",
        "In the last month, how often have you felt that you were on top of things?",
        "In the last month, how often have you been angered because of things that happened that were outside of your control?",
        "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?"
      ];
    }

    const scoreOptions = assessment.type === 'pss'
      ? ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often']
      : ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `assessment_${assessment.type}_${assessment.id}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    doc.fontSize(22).text('Lumora - Assessment Results', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Type: ${assessment.type.toUpperCase()}`, { align: 'center' });
    doc.text(`Date: ${new Date(assessment.taken_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text('Score Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(20).text(`Score: ${assessment.score}`, { align: 'center' });
    doc.fontSize(14).text(`Severity: ${assessment.severity}`, { align: 'center' });
    doc.moveDown();
    doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(16).text('Detailed Results', { underline: true });
    doc.moveDown(0.5);

    questions.forEach((q, index) => {
      const answer = answers[index] !== undefined ? answers[index] : 'N/A';
      const answerText = scoreOptions[answer] || 'N/A';
      
      doc.fontSize(11).text(`${index + 1}. ${q}`, { continued: false });
      doc.fontSize(11).text(`   Answer: ${answerText}`, { continued: false });
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (error) {
    console.error("Export assessment error:", error);
    res.status(500).json({ msg: "Failed to export assessment" });
  }
});

// ============================================
// 5. EXPORT APPOINTMENTS AS CSV
// ============================================

router.get("/appointments/:user_id/csv", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [appointments] = await db.promise().query(
      `SELECT s.*, u.name as counsellor_name, u.nickname as counsellor_nickname
       FROM counselling_sessions s
       JOIN users u ON s.counsellor_id = u.id
       WHERE s.student_id = ?
       ORDER BY s.session_date DESC`,
      [userId]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({ msg: "No appointments found" });
    }

    const formattedData = appointments.map(a => ({
      Date: new Date(a.session_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      Time: new Date(a.session_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      Counsellor: a.counsellor_nickname || a.counsellor_name || 'Unknown',
      Duration_minutes: a.duration || 60,
      Status: a.status || 'Pending',
      Notes: a.notes || ''
    }));

    const fields = ['Date', 'Time', 'Counsellor', 'Duration_minutes', 'Status', 'Notes'];
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedData);

    const filename = `appointments_export.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export appointments error:", error);
    res.status(500).json({ msg: "Failed to export appointments" });
  }
});

module.exports = router;