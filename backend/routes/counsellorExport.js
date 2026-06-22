// backend/routes/counsellorExport.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyCounsellor } = require("../middleware/counsellorAuth");
const { Parser } = require('json2csv');

// ============================================
// 1. EXPORT STUDENT ROSTER AS CSV
// ============================================
router.get("/students/:counsellor_id/csv", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  
  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    // Get counsellor's university
    const [counsellor] = await db.promise().query(
      "SELECT university_id FROM users WHERE id = ?",
      [counsellorId]
    );
    
    const universityId = counsellor[0]?.university_id;
    
    if (!universityId) {
      return res.status(404).json({ msg: "No university found for counsellor" });
    }

    // ✅ Get ONLY consented students
    const [students] = await db.promise().query(
      `SELECT 
        u.id,
        u.name,
        u.nickname,
        u.email,
        u.is_active as status,
        u.counsellor_consent as consent,
        u.created_at as joined_date,
        u.last_login,
        (SELECT AVG(mood) FROM moods WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_mood,
        (SELECT AVG(quality) FROM sleep WHERE user_id = u.id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_sleep_quality,
        (SELECT COUNT(*) FROM crisis_alerts WHERE student_id = u.id AND is_resolved = 0) as pending_alerts,
        (SELECT COUNT(*) FROM counselling_sessions WHERE student_id = u.id) as total_sessions
       FROM users u
       WHERE u.university_id = ? AND u.role = 'student' AND u.counsellor_consent = 1
       ORDER BY u.name ASC`,
      [universityId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ msg: "No consented students found" });
    }

    const formattedData = students.map(s => ({
      'Student ID': s.id,
      'Name': s.name,
      'Nickname': s.nickname || 'N/A',
      'Email': s.email,
      'Status': s.status ? 'Active' : 'Inactive',
      'Consent': s.consent ? 'Yes' : 'No',
      'Avg Mood (7d)': s.avg_mood ? parseFloat(s.avg_mood).toFixed(1) : 'N/A',
      'Avg Sleep (7d)': s.avg_sleep_quality ? parseFloat(s.avg_sleep_quality).toFixed(1) : 'N/A',
      'Pending Alerts': s.pending_alerts || 0,
      'Total Sessions': s.total_sessions || 0,
      'Joined Date': new Date(s.joined_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      'Last Login': s.last_login ? new Date(s.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'
    }));

    const fields = ['Student ID', 'Name', 'Nickname', 'Email', 'Status', 'Consent', 'Avg Mood (7d)', 'Avg Sleep (7d)', 'Pending Alerts', 'Total Sessions', 'Joined Date', 'Last Login'];
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedData);

    const date = new Date().toISOString().split('T')[0];
    const filename = `student_roster_${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export student roster error:", error);
    res.status(500).json({ msg: "Failed to export student roster" });
  }
});

// ============================================
// 2. EXPORT APPOINTMENTS AS CSV
// ============================================
router.get("/appointments/:counsellor_id/csv", verifyCounsellor, async (req, res) => {
  const counsellorId = parseInt(req.params.counsellor_id);
  
  if (req.user.id !== counsellorId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [appointments] = await db.promise().query(
      `SELECT 
        s.id,
        s.session_date,
        s.duration,
        s.status,
        s.notes,
        s.created_by,
        s.created_at,
        u.name as student_name,
        u.nickname as student_nickname,
        u.email as student_email
       FROM counselling_sessions s
       JOIN users u ON s.student_id = u.id
       WHERE s.counsellor_id = ?
       ORDER BY s.session_date DESC`,
      [counsellorId]
    );
    
    if (appointments.length === 0) {
      return res.status(404).json({ msg: "No appointments found" });
    }

    const formattedData = appointments.map(a => ({
      'Student Name': a.student_name,
      'Student Nickname': a.student_nickname || 'N/A',
      'Student Email': a.student_email,
      'Date': new Date(a.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      'Time': new Date(a.session_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      'Duration (min)': a.duration || 60,
      'Status': a.status || 'Pending',
      'Created By': a.created_by || 'counsellor',
      'Notes': a.notes || '',
      'Created At': new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));

    const fields = ['Student Name', 'Student Nickname', 'Student Email', 'Date', 'Time', 'Duration (min)', 'Status', 'Created By', 'Notes', 'Created At'];
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedData);

    const date = new Date().toISOString().split('T')[0];
    const filename = `appointments_${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export appointments error:", error);
    res.status(500).json({ msg: "Failed to export appointments" });
  }
});

// ============================================
// 3. EXPORT ANALYTICS AS CSV
// ============================================
router.get("/analytics/:counsellor_id/csv", verifyCounsellor, async (req, res) => {
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
      return res.status(404).json({ msg: "No university found for counsellor" });
    }

    // 1. Mood Distribution
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

    // 2. Sleep Distribution
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

    // 3. Assessment Scores
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
      ORDER BY a.taken_at DESC LIMIT 100
    `, [universityId]);

    // 4. Weekly Mood Trend
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

    // Build CSV with multiple sections
    const moodLabels = { 1: 'Terrible', 2: 'Sad', 3: 'Okay', 4: 'Good', 5: 'Great' };
    const sleepLabels = { 1: 'Poor', 2: 'Fair', 3: 'Okay', 4: 'Good', 5: 'Excellent' };

    let csvContent = [];

    // Section 1: Mood Distribution
    csvContent.push('=== Mood Distribution (Last 30 Days) ===');
    csvContent.push('Mood Level,Label,Student Count');
    moodDistribution.forEach(m => {
      csvContent.push(`${m.mood},${moodLabels[m.mood] || m.mood},${m.student_count}`);
    });
    csvContent.push('');

    // Section 2: Sleep Distribution
    csvContent.push('=== Sleep Distribution (Last 30 Days) ===');
    csvContent.push('Sleep Quality,Label,Student Count');
    sleepDistribution.forEach(s => {
      csvContent.push(`${s.quality},${sleepLabels[s.quality] || s.quality},${s.student_count}`);
    });
    csvContent.push('');

    // Section 3: Assessment Scores (Last 100)
    csvContent.push('=== Assessment Scores (Last 100) ===');
    csvContent.push('Type,Score,Severity,Taken At');
    assessmentScores.forEach(a => {
      csvContent.push(`${a.type},${a.score},${a.severity},${new Date(a.taken_at).toLocaleDateString()}`);
    });
    csvContent.push('');

    // Section 4: Weekly Mood Trend
    csvContent.push('=== Weekly Mood Trend (Last 7 Days) ===');
    csvContent.push('Date,Average Mood,Student Count');
    weeklyMoodTrend.forEach(w => {
      csvContent.push(`${w.date},${parseFloat(w.avg_mood).toFixed(1)},${w.student_count}`);
    });

    const csv = csvContent.join('\n');
    const date = new Date().toISOString().split('T')[0];
    const filename = `analytics_${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export analytics error:", error);
    res.status(500).json({ msg: "Failed to export analytics" });
  }
});

// ============================================
// 4. EXPORT STUDENT PROGRESS REPORT AS CSV
// ============================================
router.get("/student-progress/:student_id/:counsellor_id/csv", verifyCounsellor, async (req, res) => {
  const { student_id, counsellor_id } = req.params;
  
  if (req.user.id !== parseInt(counsellor_id)) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    // Check consent
    const [student] = await db.promise().query(
      "SELECT counsellor_consent FROM users WHERE id = ? AND role = 'student'",
      [student_id]
    );
    
    if (!student.length || !student[0].counsellor_consent) {
      return res.status(403).json({ msg: "Student has not given consent" });
    }

    // 1. Student Info
    const [studentInfo] = await db.promise().query(
      `SELECT u.id, u.name, u.nickname, u.email, u.counsellor_consent, 
              u.created_at, u.last_login, un.name as university_name
       FROM users u
       LEFT JOIN universities un ON u.university_id = un.id
       WHERE u.id = ? AND u.role = 'student'`,
      [student_id]
    );

    // 2. Stats
    const [stats] = await db.promise().query(`
      SELECT 
        (SELECT AVG(mood) FROM moods WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_mood,
        (SELECT AVG(quality) FROM sleep WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_sleep_quality,
        (SELECT AVG(duration) FROM sleep WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as avg_sleep_duration,
        (SELECT COUNT(*) FROM journals WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) as journal_count,
        (SELECT COUNT(*) FROM assessments WHERE user_id = ?) as assessment_count,
        (SELECT COUNT(*) FROM crisis_alerts WHERE student_id = ? AND is_resolved = 0) as crisis_alerts
    `, [student_id, student_id, student_id, student_id, student_id, student_id]);

    // 3. Mood Trend (Last 30 days - raw data)
    const [moodTrend] = await db.promise().query(
      `SELECT mood, DATE(created_at) as date, created_at 
       FROM moods 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 30`,
      [student_id]
    );

    // 4. Sleep Trend (Last 30 days - raw data)
    const [sleepTrend] = await db.promise().query(
      `SELECT quality, duration, DATE(created_at) as date 
       FROM sleep 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 30`,
      [student_id]
    );

    // 5. Recent Journals
    const [journals] = await db.promise().query(
      `SELECT content, created_at 
       FROM journals 
       WHERE user_id = ? 
       ORDER BY created_at DESC LIMIT 5`,
      [student_id]
    );

    // 6. Session History
    const [sessions] = await db.promise().query(
      `SELECT * FROM counselling_sessions 
       WHERE student_id = ? 
       ORDER BY session_date DESC`,
      [student_id]
    );

    // Build CSV
    const moodLabels = { 1: 'Terrible', 2: 'Sad', 3: 'Okay', 4: 'Good', 5: 'Great' };
    const sleepLabels = { 1: 'Poor', 2: 'Fair', 3: 'Okay', 4: 'Good', 5: 'Excellent' };

    let csvContent = [];

    // Section 1: Student Information
    csvContent.push('=== Student Information ===');
    csvContent.push(`Name,${studentInfo[0].name}`);
    csvContent.push(`Nickname,${studentInfo[0].nickname || 'N/A'}`);
    csvContent.push(`Email,${studentInfo[0].email}`);
    csvContent.push(`University,${studentInfo[0].university_name || 'N/A'}`);
    csvContent.push(`Joined Date,${new Date(studentInfo[0].created_at).toLocaleDateString()}`);
    csvContent.push(`Last Login,${studentInfo[0].last_login ? new Date(studentInfo[0].last_login).toLocaleDateString() : 'Never'}`);
    csvContent.push(`Consent,${studentInfo[0].counsellor_consent ? 'Yes' : 'No'}`);
    csvContent.push('');

    // Section 2: Stats Summary
    csvContent.push('=== Stats Summary (Last 7 Days) ===');
    csvContent.push(`Average Mood,${stats[0].avg_mood ? parseFloat(stats[0].avg_mood).toFixed(1) : 'N/A'}`);
    csvContent.push(`Average Sleep Quality,${stats[0].avg_sleep_quality ? parseFloat(stats[0].avg_sleep_quality).toFixed(1) : 'N/A'}`);
    csvContent.push(`Average Sleep Duration (hours),${stats[0].avg_sleep_duration ? parseFloat(stats[0].avg_sleep_duration).toFixed(1) : 'N/A'}`);
    csvContent.push(`Journal Entries (7d),${stats[0].journal_count || 0}`);
    csvContent.push(`Total Assessments,${stats[0].assessment_count || 0}`);
    csvContent.push(`Active Crisis Alerts,${stats[0].crisis_alerts || 0}`);
    csvContent.push('');

    // Section 3: Mood Trend (Last 30 days - raw data)
    csvContent.push('=== Mood Trend (Last 30 Days) ===');
    csvContent.push('Date,Mood Level,Mood Label');
    moodTrend.reverse().forEach(m => {
      csvContent.push(`${new Date(m.date).toLocaleDateString()},${m.mood},${moodLabels[m.mood] || m.mood}`);
    });
    csvContent.push('');

    // Section 4: Sleep Trend (Last 30 days - raw data)
    csvContent.push('=== Sleep Trend (Last 30 Days) ===');
    csvContent.push('Date,Sleep Quality,Quality Label,Duration (hours)');
    sleepTrend.reverse().forEach(s => {
      csvContent.push(`${new Date(s.date).toLocaleDateString()},${s.quality},${sleepLabels[s.quality] || s.quality},${parseFloat(s.duration).toFixed(1)}`);
    });
    csvContent.push('');

    // Section 5: Recent Journals
    csvContent.push('=== Recent Journals (Last 5) ===');
    csvContent.push('Date,Content Preview');
    journals.forEach(j => {
      const preview = j.content.length > 100 ? j.content.substring(0, 100) + '...' : j.content;
      csvContent.push(`${new Date(j.created_at).toLocaleDateString()},"${preview.replace(/"/g, '""')}"`);
    });
    csvContent.push('');

    // Section 6: Session History
    csvContent.push('=== Session History ===');
    csvContent.push('Date,Duration (min),Status,Notes');
    sessions.forEach(s => {
      csvContent.push(`${new Date(s.session_date).toLocaleDateString()},${s.duration || 60},${s.status || 'Pending'},"${(s.notes || '').replace(/"/g, '""')}"`);
    });

    const csv = csvContent.join('\n');
    const date = new Date().toISOString().split('T')[0];
    const filename = `student_progress_${student_id}_${date}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Export student progress error:", error);
    res.status(500).json({ msg: "Failed to export student progress" });
  }
});

module.exports = router;