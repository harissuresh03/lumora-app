// backend/routes/parent.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authmiddleware");
const crypto = require("crypto");
const { sendParentInvitationEmail } = require("../services/emailService");

const JWT_SECRET = "lumora_secret_key";

// ============================================
// STUDENT: Get My Parent
// ============================================

router.get("/my-parent", verifyToken, async (req, res) => {
  const studentId = req.user.id;

  if (req.user.role !== "student") {
    return res.status(403).json({ msg: "Access denied. Student only." });
  }

  try {
    const [link] = await db.promise().query(
      `SELECT ps.*, u.email, u.name 
       FROM parent_student_links ps
       JOIN users u ON ps.parent_id = u.id
       WHERE ps.student_id = ? AND ps.consent_granted = 1
       LIMIT 1`,
      [studentId]
    );

    if (link.length === 0) {
      return res.json({ hasParent: false });
    }

    res.json({
      hasParent: true,
      parent_id: link[0].parent_id,
      email: link[0].email,
      name: link[0].name,
      consent_granted: link[0].consent_granted === 1
    });
  } catch (error) {
    console.error("Get my parent error:", error);
    res.status(500).json({ msg: "Failed to fetch parent data" });
  }
});

// ============================================
// STUDENT: Invite Parent
// ============================================

router.post("/invite", verifyToken, async (req, res) => {
  const { parent_email } = req.body;
  const studentId = req.user.id;

  if (!parent_email) {
    return res.status(400).json({ msg: "Parent email is required" });
  }

  try {
    const [student] = await db.promise().query(
      "SELECT id, name FROM users WHERE id = ? AND role = 'student'",
      [studentId]
    );

    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // Check if student already has a linked parent
    const [existingLink] = await db.promise().query(
      "SELECT * FROM parent_student_links WHERE student_id = ? AND consent_granted = 1",
      [studentId]
    );

    if (existingLink.length > 0) {
      return res.status(400).json({ 
        msg: "You already have a linked parent. Only one parent/guardian is allowed." 
      });
    }

    // Check if there's a pending invitation already
    const [pendingLink] = await db.promise().query(
      "SELECT * FROM parent_student_links WHERE student_id = ? AND consent_granted = 0",
      [studentId]
    );

    if (pendingLink.length > 0) {
      const [parentUser] = await db.promise().query(
        "SELECT email FROM users WHERE id = ?",
        [pendingLink[0].parent_id]
      );
      return res.status(400).json({ 
        msg: `A pending invitation was already sent to ${parentUser[0]?.email || 'the parent'}. Please wait for them to accept.` 
      });
    }

    // Check if this email already has a parent account
    const [existingParent] = await db.promise().query(
      "SELECT id, email, parent_invitation_token FROM users WHERE email = ? AND role = 'parent'",
      [parent_email]
    );

    let parentId;

    if (existingParent.length > 0) {
      parentId = existingParent[0].id;
      
      // If parent has no invitation token (already confirmed), just create link
      if (!existingParent[0].parent_invitation_token) {
        await db.promise().query(
          `INSERT INTO parent_student_links 
           (parent_id, student_id, consent_granted) 
           VALUES (?, ?, TRUE)`,
          [parentId, studentId]
        );
        return res.json({
          msg: "Parent already has an account. They can log in with their credentials.",
          parent_id: parentId,
          parent_email: parent_email
        });
      }
      
      // Parent exists but hasn't confirmed yet - generate new token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      await db.promise().query(
        `UPDATE users 
         SET parent_invitation_token = ?, parent_invitation_expires = ? 
         WHERE id = ?`,
        [token, tokenExpiry, parentId]
      );
      
      await db.promise().query(
        `INSERT INTO parent_student_links 
         (parent_id, student_id, consent_granted) 
         VALUES (?, ?, TRUE)`,
        [parentId, studentId]
      );
      
      await sendParentInvitationEmail(parent_email, student[0].name);
      return res.json({
        msg: "New invitation sent! Parent can login with the provided credentials.",
        parent_id: parentId,
        parent_email: parent_email
      });
    }

    // Create new parent account
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [result] = await db.promise().query(
      `INSERT INTO users 
       (email, password, role, parent_invitation_token, parent_invitation_expires, is_active, created_at) 
       VALUES (?, ?, 'parent', ?, ?, 1, NOW())`,
      [parent_email, hashedPassword, token, tokenExpiry]
    );

    parentId = result.insertId;

    // Create link with consent granted
    await db.promise().query(
      `INSERT INTO parent_student_links 
       (parent_id, student_id, consent_granted) 
       VALUES (?, ?, TRUE)`,
      [parentId, studentId]
    );

    // Send invitation email
    await sendParentInvitationEmail(parent_email, student[0].name);

    res.json({
      msg: "Parent account created! An email with login credentials has been sent.",
      parent_id: parentId,
      parent_email: parent_email
    });

  } catch (error) {
    console.error("Invite parent error:", error);
    res.status(500).json({ msg: "Failed to send invitation", error: error.message });
  }
});

// ============================================
// PARENT: Login (Clears token on login)
// ============================================

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [parent] = await db.promise().query(
      "SELECT id, email, password, role, is_active, name, parent_invitation_token FROM users WHERE email = ? AND role = 'parent'",
      [email]
    );

    if (!parent.length) {
      return res.status(400).json({ msg: "Parent account not found" });
    }

    const parentData = parent[0];

    if (!parentData.is_active) {
      return res.status(403).json({ msg: "Account is deactivated" });
    }

    const match = await bcrypt.compare(password, parentData.password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Clear invitation token on login
    if (parentData.parent_invitation_token) {
      await db.promise().query(
        `UPDATE users 
         SET parent_invitation_token = NULL, parent_invitation_expires = NULL 
         WHERE id = ?`,
        [parentData.id]
      );
      console.log(`Parent ${parentData.email} confirmed, token cleared.`);
    }

    const token = jwt.sign(
      { id: parentData.id, email: parentData.email, role: parentData.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await db.promise().query(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [parentData.id]
    );

    res.json({
      token: token,
      user_id: parentData.id,
      role: parentData.role,
      name: parentData.name || "Parent"
    });

  } catch (error) {
    console.error("Parent login error:", error);
    res.status(500).json({ msg: "Failed to login" });
  }
});

// ============================================
// STUDENT: Update Parent Consent (simplified - single toggle)
// ============================================

router.put("/settings", verifyToken, async (req, res) => {
  const studentId = req.user.id;
  const { consent_granted } = req.body;

  if (req.user.role !== "student") {
    return res.status(403).json({ msg: "Access denied. Student only." });
  }

  try {
    await db.promise().query(
      `UPDATE parent_student_links SET 
        consent_granted = ?
       WHERE student_id = ?`,
      [consent_granted, studentId]
    );

    res.json({ msg: "Parent consent updated successfully" });
  } catch (error) {
    console.error("Update parent consent error:", error);
    res.status(500).json({ msg: "Failed to update parent consent" });
  }
});

// ============================================
// PARENT: Get Linked Students
// ============================================

router.get("/students", verifyToken, async (req, res) => {
  const parentId = req.user.id;

  if (req.user.role !== "parent") {
    return res.status(403).json({ msg: "Access denied. Parent only." });
  }

  try {
    const [students] = await db.promise().query(
      `SELECT 
        u.id, u.name, u.nickname, u.email,
        ps.consent_granted,
        (SELECT AVG(mood) FROM moods WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_mood,
        (SELECT AVG(quality) FROM sleep WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_sleep,
        (SELECT 
           JSON_EXTRACT(forecast_data, '$[0].score') 
         FROM stress_forecast 
         WHERE user_id = u.id 
         ORDER BY created_at DESC 
         LIMIT 1) as current_stress
       FROM parent_student_links ps
       JOIN users u ON ps.student_id = u.id
       WHERE ps.parent_id = ? AND ps.consent_granted = 1`,
      [parentId]
    );

    res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ msg: "Failed to fetch students" });
  }
});

// ============================================
// PARENT: Get Student Summary (Extended)
// ============================================

router.get("/student/:student_id/summary", verifyToken, async (req, res) => {
  const parentId = req.user.id;
  const studentId = parseInt(req.params.student_id);

  if (req.user.role !== "parent") {
    return res.status(403).json({ msg: "Access denied. Parent only." });
  }

  try {
    const [link] = await db.promise().query(
      "SELECT * FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND consent_granted = 1",
      [parentId, studentId]
    );

    if (!link.length) {
      return res.status(403).json({ msg: "No consent to view this student's data" });
    }

    const [student] = await db.promise().query(
      "SELECT id, name, nickname, email FROM users WHERE id = ? AND role = 'student'",
      [studentId]
    );

    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }

    const result = {
      student: student[0],
      consent: {
        granted: link[0].consent_granted
      }
    };

    // Mood data (last 7 days)
    const [moodData] = await db.promise().query(
      `SELECT 
        DATE(created_at) as date,
        AVG(mood) as avg_mood
       FROM moods 
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [studentId]
    );
    result.mood_trend = moodData;

    const [avgMood] = await db.promise().query(
      "SELECT AVG(mood) as avg_mood FROM moods WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
      [studentId]
    );
    result.average_mood = avgMood[0]?.avg_mood ? parseFloat(avgMood[0].avg_mood).toFixed(1) : null;

    // Sleep data (last 7 days)
    const [sleepData] = await db.promise().query(
      `SELECT 
        DATE(created_at) as date,
        AVG(quality) as avg_quality
       FROM sleep 
       WHERE user_id = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [studentId]
    );
    result.sleep_trend = sleepData;

    const [avgSleep] = await db.promise().query(
      "SELECT AVG(quality) as avg_quality FROM sleep WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
      [studentId]
    );
    result.average_sleep = avgSleep[0]?.avg_quality ? parseFloat(avgSleep[0].avg_quality).toFixed(1) : null;

    // Stress data (latest forecast)
    const [stress] = await db.promise().query(
      `SELECT 
         JSON_EXTRACT(forecast_data, '$[0].score') as current_score,
         JSON_EXTRACT(forecast_data, '$[0].risk_level') as risk_level
       FROM stress_forecast 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [studentId]
    );
    result.current_stress = stress[0] || null;

    // ✅ Full stress forecast
    const [stressForecast] = await db.promise().query(
      `SELECT forecast_data, peak_stress_day, tip, summary_sentence, created_at
       FROM stress_forecast 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [studentId]
    );
    result.stress_forecast = stressForecast.length > 0 ? {
      forecast: JSON.parse(stressForecast[0].forecast_data),
      peak_stress_day: JSON.parse(stressForecast[0].peak_stress_day),
      tip: JSON.parse(stressForecast[0].tip),
      summary_sentence: stressForecast[0].summary_sentence,
      created_at: stressForecast[0].created_at
    } : null;

    // Assessment data
    const [assessments] = await db.promise().query(
      `SELECT type, score, severity, taken_at 
       FROM assessments 
       WHERE user_id = ? 
       ORDER BY taken_at DESC 
       LIMIT 3`,
      [studentId]
    );
    result.recent_assessments = assessments;

    const [phq9] = await db.promise().query(
      `SELECT score, severity, taken_at 
       FROM assessments 
       WHERE user_id = ? AND type = 'phq9' 
       ORDER BY taken_at DESC 
       LIMIT 1`,
      [studentId]
    );
    result.latest_phq9 = phq9[0] || null;

    const [gad7] = await db.promise().query(
      `SELECT score, severity, taken_at 
       FROM assessments 
       WHERE user_id = ? AND type = 'gad7' 
       ORDER BY taken_at DESC 
       LIMIT 1`,
      [studentId]
    );
    result.latest_gad7 = gad7[0] || null;

    const [pss] = await db.promise().query(
      `SELECT score, severity, taken_at 
       FROM assessments 
       WHERE user_id = ? AND type = 'pss' 
       ORDER BY taken_at DESC 
       LIMIT 1`,
      [studentId]
    );
    result.latest_pss = pss[0] || null;

    // Upcoming deadlines
    const [deadlines] = await db.promise().query(
      `SELECT id, title, subject, type, due_date, difficulty
       FROM deadlines 
       WHERE user_id = ? AND is_complete = 0
       ORDER BY due_date ASC
       LIMIT 5`,
      [studentId]
    );
    result.upcoming_deadlines = deadlines;

    res.json(result);
  } catch (error) {
    console.error("Student summary error:", error);
    res.status(500).json({ msg: "Failed to fetch student summary" });
  }
});

// ============================================
// PARENT: Download PDF Report
// ============================================

router.get("/report/:student_id/pdf", verifyToken, async (req, res) => {
  const parentId = req.user.id;
  const studentId = parseInt(req.params.student_id);

  if (req.user.role !== "parent") {
    return res.status(403).json({ msg: "Access denied. Parent only." });
  }

  try {
    // Check consent
    const [link] = await db.promise().query(
      "SELECT * FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND consent_granted = 1",
      [parentId, studentId]
    );
    if (!link.length) {
      return res.status(403).json({ msg: "No consent to view this student's data" });
    }

    const { generateParentReportPDF } = require("../services/wellnessReportService");
    const { doc, filename } = await generateParentReportPDF(studentId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error("Parent report PDF error:", error);
    res.status(500).json({ msg: "Failed to generate report" });
  }
});

// ============================================
// STUDENT: Revoke Parent Access
// ============================================

router.post("/revoke/:parent_id", verifyToken, async (req, res) => {
  const studentId = req.user.id;
  const parentId = parseInt(req.params.parent_id);

  if (req.user.role !== "student") {
    return res.status(403).json({ msg: "Access denied. Student only." });
  }

  try {
    await db.promise().query(
      `UPDATE parent_student_links SET 
        consent_granted = FALSE
       WHERE parent_id = ? AND student_id = ?`,
      [parentId, studentId]
    );

    res.json({ msg: "Parent access revoked successfully" });
  } catch (error) {
    console.error("Revoke access error:", error);
    res.status(500).json({ msg: "Failed to revoke parent access" });
  }
});

module.exports = router;