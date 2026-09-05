// backend/routes/counsellor.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyCounsellor } = require("../middleware/counsellorAuth");
const verifyToken = require("../middleware/authmiddleware");

// ============================================
// DASHBOARD STATS
// ============================================

router.get("/stats/:counsellor_id", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  
  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [counsellor] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [counsellorId]
    );
    
    const universityId = counsellor[0]?.university_id;
    
    if (!universityId) {
      return res.json({
        totalStudents: 0,
        activeStudents: 0,
        consentedStudents: 0,
        pendingAppointments: 0,
        pendingAlerts: 0,
        avgMood: null,
        avgSleep: null,
        message: "Please update your profile with your university."
      });
    }

    const [totalStudents] = await db.promise().query(
      "SELECT COUNT(*) as count FROM users WHERE university_id = ? AND role = 'student' AND is_active = 1",
      [universityId]
    );
    
    const [consentedStudents] = await db.promise().query(
      "SELECT COUNT(*) as count FROM users WHERE university_id = ? AND role = 'student' AND is_active = 1 AND counsellor_consent = 1",
      [universityId]
    );
    
    const [activeStudents] = await db.promise().query(
      "SELECT COUNT(*) as count FROM users WHERE university_id = ? AND role = 'student' AND is_active = 1 AND counsellor_consent = 1 AND last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
      [universityId]
    );
    
    const [avgMoodResult] = await db.promise().query(`
      SELECT AVG(m.mood) as avg_mood 
      FROM users u
      JOIN moods m ON u.id = m.user_id
      WHERE u.university_id = ? AND u.role = 'student' 
      AND u.counsellor_consent = 1
      AND m.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [universityId]);
    
    const [avgSleepResult] = await db.promise().query(`
      SELECT AVG(s.quality) as avg_sleep 
      FROM users u
      JOIN sleep s ON u.id = s.user_id
      WHERE u.university_id = ? AND u.role = 'student' 
      AND u.counsellor_consent = 1
      AND s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `, [universityId]);
    
    const [pendingAppointments] = await db.promise().query(
      "SELECT COUNT(*) as count FROM counselling_sessions WHERE counsellor_id = ? AND status = 'pending'",
      [counsellorId]
    );
    
    const [pendingAlerts] = await db.promise().query(
      "SELECT COUNT(*) as count FROM crisis_alerts WHERE counsellor_id = ? AND is_resolved = 0",
      [counsellorId]
    );
    
    res.json({
      totalStudents: totalStudents[0].count || 0,
      activeStudents: activeStudents[0].count || 0,
      consentedStudents: consentedStudents[0].count || 0,
      pendingAppointments: pendingAppointments[0].count || 0,
      pendingAlerts: pendingAlerts[0].count || 0,
      avgMood: avgMoodResult[0]?.avg_mood ? parseFloat(avgMoodResult[0].avg_mood).toFixed(1) : null,
      avgSleep: avgSleepResult[0]?.avg_sleep ? parseFloat(avgSleepResult[0].avg_sleep).toFixed(1) : null
    });
    
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ msg: "Failed to fetch stats" });
  }
});

// ============================================
// STUDENT MANAGEMENT
// ============================================

router.get("/students/:counsellor_id", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  const { search, filter, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [counsellor] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [counsellorId]
    );
    
    const universityId = counsellor[0]?.university_id;
    
    if (!universityId) {
      return res.json({
        students: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: "Please update your profile with your university."
      });
    }

    let query = `
      SELECT u.id, u.name, u.nickname, u.email, u.last_login, u.is_active, 
             u.counsellor_consent,
             u.matric_number,
             (SELECT AVG(mood) FROM moods WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_mood,
             (SELECT AVG(quality) FROM sleep WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_sleep_quality,
             (SELECT COUNT(*) FROM crisis_alerts WHERE student_id = u.id AND is_resolved = 0) as pending_alerts,
             (SELECT 
                JSON_EXTRACT(forecast_data, '$[0].score') 
              FROM stress_forecast 
              WHERE user_id = u.id 
              ORDER BY created_at DESC 
              LIMIT 1
             ) as current_stress_score
      FROM users u
      WHERE u.university_id = ? AND u.role = 'student'
      AND u.counsellor_consent = 1
    `;
    
    let params = [universityId];
    
    if (search) {
      query += " AND (u.name LIKE ? OR u.nickname LIKE ? OR u.email LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filter === 'active') {
      query += " AND u.is_active = 1 AND u.last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (filter === 'inactive') {
      query += " AND (u.is_active = 0 OR u.last_login < DATE_SUB(NOW(), INTERVAL 7 DAY))";
    } else if (filter === 'consent') {
      query += " AND u.counsellor_consent = 1";
    } else if (filter === 'no_consent') {
      query = query.replace("AND u.counsellor_consent = 1", "AND u.counsellor_consent = 0");
    } else if (filter === 'at_risk') {
      query += ` AND (SELECT 
                JSON_EXTRACT(forecast_data, '$[0].score') 
              FROM stress_forecast 
              WHERE user_id = u.id 
              ORDER BY created_at DESC 
              LIMIT 1) >= 30`;
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as t`;
    const [countResult] = await db.promise().query(countQuery, params);
    const total = countResult[0]?.total || 0;
    
    query += " ORDER BY u.last_login DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);
    
    const [students] = await db.promise().query(query, params);
    
    res.json({
      students: students || [],
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1
    });
    
  } catch (error) {
    console.error("Students error:", error);
    res.status(500).json({ 
      msg: "Failed to fetch students", 
      error: error.message 
    });
  }
});

// ============================================
// STUDENT PROFILE (WITH EMERGENCY CONTACT)
// ============================================

router.get("/student/:student_id/:counsellor_id", verifyCounsellor, async (req, res) => {
  const { student_id, counsellor_id } = req.params;
  
  if (req.user.id !== parseInt(counsellor_id)) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [student] = await db.promise().query(
      `SELECT u.id, u.name, u.nickname, u.email, u.counsellor_consent, 
              u.created_at, u.last_login, 
              u.emergency_contact_name, 
              u.emergency_contact_phone, 
              u.emergency_contact_relationship,
              u.matric_number,
              un.id as university_id, un.name as university_name
       FROM users u
       LEFT JOIN universities un ON u.university_id = un.id
       WHERE u.id = ? AND u.role = 'student'`,
      [student_id]
    );
    
    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }
    
    if (!student[0].counsellor_consent) {
      return res.status(403).json({ 
        msg: "Student has not given consent to share their data" 
      });
    }
    
    const [counsellor] = await db.promise().query(
      "SELECT id, university_id FROM users WHERE id = ?",
      [counsellor_id]
    );
    
    if (!counsellor.length) {
      return res.status(404).json({ msg: "Counsellor not found" });
    }
    
    if (counsellor[0].university_id !== student[0].university_id) {
      return res.status(403).json({ msg: "Student is not from your university" });
    }
    
    const [moods] = await db.promise().query(
      `SELECT mood, DATE(created_at) as date, created_at 
       FROM moods 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 30`,
      [student_id]
    );
    
    const [sleep] = await db.promise().query(
      `SELECT quality, duration, DATE(created_at) as date 
       FROM sleep 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 30`,
      [student_id]
    );
    
    const [journals] = await db.promise().query(
      `SELECT content, created_at 
       FROM journals 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 5`,
      [student_id]
    );
    
    const [assessments] = await db.promise().query(
      `SELECT type, score, severity, taken_at 
       FROM assessments 
       WHERE user_id = ? 
       ORDER BY taken_at DESC LIMIT 5`,
      [student_id]
    );
    
    const [alerts] = await db.promise().query(
      `SELECT * FROM crisis_alerts 
       WHERE student_id = ? 
       ORDER BY created_at DESC`,
      [student_id]
    );
    
    const [sessions] = await db.promise().query(
      `SELECT * FROM counselling_sessions 
       WHERE student_id = ? 
       ORDER BY session_date DESC`,
      [student_id]
    );
    
    const moodValues = moods.map(m => m.mood);
    const avgMood = moodValues.length > 0 
      ? (moodValues.reduce((a, b) => a + b, 0) / moodValues.length).toFixed(1)
      : null;
    
    const sleepQualities = sleep.map(s => s.quality);
    const avgSleepQuality = sleepQualities.length > 0 
      ? (sleepQualities.reduce((a, b) => a + b, 0) / sleepQualities.length).toFixed(1)
      : null;
    
    const sleepDurations = sleep.map(s => parseFloat(s.duration));
    const avgSleepDuration = sleepDurations.length > 0
      ? (sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length).toFixed(1)
      : null;
    
    res.json({
      student: student[0],
      stats: {
        avgMood,
        avgSleepQuality,
        avgSleepDuration,
        journalCount: journals.length,
        assessmentCount: assessments.length,
        crisisAlerts: alerts.filter(a => !a.is_resolved).length
      },
      moods,
      sleep,
      journals,
      assessments,
      alerts,
      sessions
    });
    
  } catch (error) {
    console.error("Student profile error:", error);
    res.status(500).json({ msg: "Failed to fetch student profile" });
  }
});

// ============================================
// STRESS FORECAST FOR COUNSELLOR
// ============================================

router.get("/stress-forecast/:student_id/:counsellor_id", verifyCounsellor, async (req, res) => {
  const { student_id, counsellor_id } = req.params;
  
  if (req.user.id !== parseInt(counsellor_id)) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [student] = await db.promise().query(
      "SELECT counsellor_consent, university_id FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );
    
    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }
    
    if (!student[0].counsellor_consent) {
      return res.status(403).json({ msg: "Student has not given consent" });
    }
    
    const [counsellor] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [counsellor_id]
    );
    
    if (counsellor[0].university_id !== student[0].university_id) {
      return res.status(403).json({ msg: "Student is not from your university" });
    }
    
    const [forecast] = await db.promise().query(
      `SELECT 
        id,
        forecast_data,
        peak_stress_day,
        overdue_warning,
        tip,
        summary_sentence,
        created_at
       FROM stress_forecast 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [student_id]
    );
    
    const [deadlines] = await db.promise().query(
      `SELECT id, title, subject, type, due_date, difficulty, is_complete
       FROM deadlines 
       WHERE user_id = ? AND is_complete = 0
       ORDER BY due_date ASC
       LIMIT 10`,
      [student_id]
    );
    
    if (forecast.length === 0) {
      return res.json({ 
        hasData: false, 
        message: "No stress forecast available for this student. They need to add deadlines first." 
      });
    }

    res.json({
      hasData: true,
      forecast: JSON.parse(forecast[0].forecast_data),
      peak_stress_day: JSON.parse(forecast[0].peak_stress_day),
      overdue_warning: forecast[0].overdue_warning,
      tip: JSON.parse(forecast[0].tip),
      summary_sentence: forecast[0].summary_sentence,
      created_at: forecast[0].created_at,
      deadlines: deadlines
    });

  } catch (error) {
    console.error("Fetch counsellor stress forecast error:", error);
    res.status(500).json({ msg: "Failed to fetch stress forecast" });
  }
});

// ============================================
// SEND NOTE TO STUDENT (Works with user_notifications)
// ============================================

router.post("/send-note", verifyCounsellor, async (req, res) => {
  const { student_id, subject, message } = req.body;
  const counsellorId = req.user.id;

  if (!student_id || !message) {
    return res.status(400).json({ msg: "Student ID and message are required" });
  }

  try {
    const [student] = await db.promise().query(
      "SELECT counsellor_consent, name FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );

    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }

    if (student[0].counsellor_consent === 0) {
      return res.status(403).json({ msg: "Student has not given consent to receive notes" });
    }

    // ✅ Insert directly into user_notifications (no separate table needed)
    await db.promise().query(
      `INSERT INTO user_notifications 
       (user_id, title, message, type, related_id, created_at) 
       VALUES (?, ?, ?, 'counsellor_note', ?, NOW())`,
      [
        student_id,
        subject || 'Note from Counsellor',
        message,
        counsellorId
      ]
    );

    res.json({ msg: "Note sent successfully to student" });
  } catch (error) {
    console.error("Send note error:", error);
    res.status(500).json({ msg: "Failed to send note" });
  }
});

// ============================================
// APPOINTMENTS
// ============================================

// STUDENT: Create appointment request (pending)
router.post("/appointments/student", verifyToken, async (req, res) => {
  const { student_id, counsellor_id, session_date, duration, notes } = req.body;
  
  if (req.user.id !== student_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  if (!counsellor_id || !session_date) {
    return res.status(400).json({ msg: "Counsellor and date are required" });
  }

  try {
    const [student] = await db.promise().query(
      "SELECT counsellor_consent FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );
    
    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }
    
    const [counsellor] = await db.promise().query(
      `SELECT u.id, u.university_id 
       FROM users u
       WHERE u.id = ? AND u.role = 'counsellor'`,
      [counsellor_id]
    );
    
    if (!counsellor.length) {
      return res.status(404).json({ msg: "Counsellor not found" });
    }
    
    const [studentUni] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [student_id]
    );
    
    if (studentUni[0].university_id !== counsellor[0].university_id) {
      return res.status(403).json({ msg: "Counsellor is not from your university" });
    }
    
    const [result] = await db.promise().query(
      `INSERT INTO counselling_sessions 
       (student_id, counsellor_id, session_date, duration, notes, status, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, 'pending', 'student', NOW())`,
      [student_id, counsellor_id, session_date, duration || 60, notes || null]
    );
    
    await db.promise().query(
      `INSERT INTO user_notifications 
       (user_id, title, message, type, related_id, created_at) 
       VALUES (?, ?, ?, 'university', ?, NOW())`,
      [
        counsellor_id,
        'New Appointment Request',
        `A student has requested an appointment on ${new Date(session_date).toLocaleString()}`,
        student_id
      ]
    );
    
    res.json({ 
      msg: "Appointment request sent successfully!", 
      id: result.insertId,
      status: 'pending'
    });
  } catch (error) {
    console.error("Student create appointment error:", error);
    res.status(500).json({ msg: "Failed to create appointment" });
  }
});

// STUDENT: Get their appointments
router.get("/appointments/student/:student_id", verifyToken, async (req, res) => {
  const studentId = parseInt(req.params.student_id);
  
  if (req.user.id !== studentId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [appointments] = await db.promise().query(
      `SELECT s.*, 
              u.name as counsellor_name, 
              u.nickname as counsellor_nickname
       FROM counselling_sessions s
       JOIN users u ON s.counsellor_id = u.id
       WHERE s.student_id = ?
       ORDER BY s.session_date DESC`,
      [studentId]
    );
    
    res.json(appointments);
  } catch (error) {
    console.error("Student appointments error:", error);
    res.status(500).json({ msg: "Failed to fetch appointments" });
  }
});

// COUNSELLOR: Get appointments
router.get("/appointments/:counsellor_id", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  const { status } = req.query;
  
  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    let query = `
      SELECT s.*, 
             u.name as student_name, 
             u.nickname as student_nickname, 
             u.email as student_email
      FROM counselling_sessions s
      JOIN users u ON s.student_id = u.id
      WHERE s.counsellor_id = ?
    `;
    let params = [counsellorId];
    
    if (status && status !== 'all') {
      query += " AND s.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY s.session_date DESC";
    
    const [appointments] = await db.promise().query(query, params);
    res.json(appointments);
    
  } catch (error) {
    console.error("Appointments error:", error);
    res.status(500).json({ msg: "Failed to fetch appointments" });
  }
});

// COUNSELLOR: Update appointment status
router.put("/appointments/:id/status", verifyCounsellor, async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const counsellorId = req.user.id;

  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ msg: "Invalid status" });
  }

  try {
    const [appointment] = await db.promise().query(
      "SELECT student_id, counsellor_id, session_date FROM counselling_sessions WHERE id = ?",
      [id]
    );
    
    if (!appointment.length) {
      return res.status(404).json({ msg: "Appointment not found" });
    }
    
    if (appointment[0].counsellor_id !== counsellorId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }
    
    let updateQuery = "UPDATE counselling_sessions SET status = ?";
    let params = [status];
    
    if (notes !== undefined && notes !== null) {
      updateQuery += ", notes = ?";
      params.push(notes);
    }
    
    updateQuery += " WHERE id = ? AND counsellor_id = ?";
    params.push(id, counsellorId);
    
    await db.promise().query(updateQuery, params);
    
    const statusMessages = {
      confirmed: 'Your appointment has been confirmed! ✅',
      cancelled: 'Your appointment has been cancelled. ❌',
      completed: 'Your appointment has been marked as completed. ✅'
    };
    
    if (status !== 'pending') {
      await db.promise().query(
        `INSERT INTO user_notifications 
         (user_id, title, message, type, related_id, created_at) 
         VALUES (?, ?, ?, 'university', ?, NOW())`,
        [appointment[0].student_id, `Appointment ${status}`, statusMessages[status] || `Your appointment status has been updated to ${status}`, id]
      );
    }
    
    res.json({ msg: `Appointment ${status} successfully` });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ msg: "Failed to update appointment" });
  }
});

// COUNSELLOR: Create appointment (counsellor-initiated, auto-confirmed)
router.post("/appointments", verifyCounsellor, async (req, res) => {
  const { counsellor_id, student_id, session_date, duration, notes } = req.body;
  
  if (req.user.id !== counsellor_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [student] = await db.promise().query(
      "SELECT counsellor_consent FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );
    if (student.length && student[0].counsellor_consent === 0) {
      return res.status(403).json({ msg: "Student has not given consent" });
    }
  } catch (error) {
    console.error("Consent check error:", error);
    return res.status(500).json({ msg: "Failed to check consent" });
  }

  try {
    await db.promise().query(
      `INSERT INTO counselling_sessions 
       (student_id, counsellor_id, session_date, duration, notes, status, created_by) 
       VALUES (?, ?, ?, ?, ?, 'confirmed', 'counsellor')`,
      [student_id, counsellor_id, session_date, duration || 60, notes || null]
    );
    
    await db.promise().query(
      `INSERT INTO user_notifications 
       (user_id, title, message, type, related_id, created_at) 
       VALUES (?, ?, ?, 'university', ?, NOW())`,
      [
        student_id,
        'Appointment Scheduled',
        `Your counsellor has scheduled an appointment for you on ${new Date(session_date).toLocaleString()}`,
        counsellor_id
      ]
    );
    
    res.json({ msg: "Appointment created successfully" });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ msg: "Failed to create appointment" });
  }
});

// COUNSELLOR: Delete appointment
router.delete("/appointments/:id", verifyCounsellor, async (req, res) => {
  const { id } = req.params;
  const counsellorId = req.user.id;

  try {
    const [appointment] = await db.promise().query(
      "SELECT counsellor_id FROM counselling_sessions WHERE id = ?",
      [id]
    );

    if (!appointment.length) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    if (appointment[0].counsellor_id !== counsellorId) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await db.promise().query(
      "DELETE FROM counselling_sessions WHERE id = ?",
      [id]
    );

    res.json({ msg: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete appointment error:", error);
    res.status(500).json({ msg: "Failed to delete appointment" });
  }
});

// ============================================
// CRISIS ALERTS
// ============================================

router.get("/alerts/:counsellor_id", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  const { resolved } = req.query;
  
  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    let query = `
      SELECT a.*, u.name as student_name, u.nickname as student_nickname, u.email as student_email
      FROM crisis_alerts a
      JOIN users u ON a.student_id = u.id
      WHERE a.counsellor_id = ?
    `;
    let params = [counsellorId];
    
    if (resolved === 'true') {
      query += " AND a.is_resolved = 1";
    } else {
      query += " AND a.is_resolved = 0";
    }
    
    query += " ORDER BY a.created_at DESC";
    
    const [alerts] = await db.promise().query(query, params);
    res.json(alerts);
    
  } catch (error) {
    console.error("Alerts error:", error);
    res.status(500).json({ msg: "Failed to fetch alerts" });
  }
});

router.put("/alerts/:id/resolve", verifyCounsellor, async (req, res) => {
  const { id } = req.params;
  const counsellorId = req.user.id;

  try {
    await db.promise().query(
      "UPDATE crisis_alerts SET is_resolved = 1, resolved_at = NOW() WHERE id = ? AND counsellor_id = ?",
      [id, counsellorId]
    );
    res.json({ msg: "Alert resolved" });
  } catch (error) {
    console.error("Resolve alert error:", error);
    res.status(500).json({ msg: "Failed to resolve alert" });
  }
});

// ============================================
// ANALYTICS
// ============================================

router.get("/analytics/:counsellor_id", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  
  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [counsellor] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [counsellorId]
    );
    
    const universityId = counsellor[0]?.university_id;
    
    if (!universityId) {
      return res.json({
        moodDistribution: [],
        sleepDistribution: [],
        assessmentScores: [],
        message: "Please update your profile with your university."
      });
    }

    const [moodDistribution] = await db.promise().query(`
      SELECT 
        m.mood,
        COUNT(DISTINCT u.id) as student_count
      FROM users u
      JOIN moods m ON u.id = m.user_id
      WHERE u.university_id = ? AND u.role = 'student' 
      AND u.counsellor_consent = 1
      AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY m.mood
      ORDER BY m.mood
    `, [universityId]);
    
    const [sleepDistribution] = await db.promise().query(`
      SELECT 
        s.quality,
        COUNT(DISTINCT u.id) as student_count
      FROM users u
      JOIN sleep s ON u.id = s.user_id
      WHERE u.university_id = ? AND u.role = 'student' 
      AND u.counsellor_consent = 1
      AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY s.quality
      ORDER BY s.quality
    `, [universityId]);
    
    const [assessmentScores] = await db.promise().query(`
      SELECT 
        a.type,
        a.score,
        a.severity,
        a.taken_at
      FROM users u
      JOIN assessments a ON u.id = a.user_id
      WHERE u.university_id = ? AND u.role = 'student' 
      AND u.counsellor_consent = 1
      ORDER BY a.taken_at DESC LIMIT 50
    `, [universityId]);
    
    const [weeklyMoodTrend] = await db.promise().query(`
      SELECT 
        DATE_FORMAT(m.created_at, '%Y-%m-%d') as date,
        AVG(m.mood) as avg_mood,
        COUNT(DISTINCT u.id) as student_count
      FROM users u
      JOIN moods m ON u.id = m.user_id
      WHERE u.university_id = ? AND u.role = 'student' 
      AND u.counsellor_consent = 1
      AND m.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(m.created_at)
      ORDER BY date
    `, [universityId]);
    
    res.json({
      moodDistribution,
      sleepDistribution,
      assessmentScores,
      weeklyMoodTrend
    });
    
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ msg: "Failed to fetch analytics" });
  }
});

// ============================================
// WELLNESS REPORT - PDF
// ============================================

router.get("/wellness-report/:student_id/:counsellor_id", verifyCounsellor, async (req, res) => {
  const { student_id, counsellor_id } = req.params;
  
  if (req.user.id !== parseInt(counsellor_id)) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [student] = await db.promise().query(
      "SELECT counsellor_consent, university_id FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );
    
    if (!student.length) {
      return res.status(404).json({ msg: "Student not found" });
    }
    
    if (!student[0].counsellor_consent) {
      return res.status(403).json({ msg: "Student has not given consent" });
    }
    
    const [counsellor] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [counsellor_id]
    );
    
    if (counsellor[0].university_id !== student[0].university_id) {
      return res.status(403).json({ msg: "Student is not from your university" });
    }

    const { generateWellnessReport, buildPDF } = require("../services/wellnessReportService");
    const { doc, filename, reportData } = await generateWellnessReport(student_id, counsellor_id);
    
    buildPDF(doc, reportData);
    doc.end();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

  } catch (error) {
    console.error("Wellness report error:", error);
    res.status(500).json({ msg: "Failed to generate wellness report", error: error.message });
  }
});

module.exports = router;