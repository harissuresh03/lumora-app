// backend/routes/admin.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyAdmin, logAdminAction, sendNotification } = require("../middleware/adminAuth");
const admin = require("firebase-admin");
const { sendCounsellorApprovalEmail, sendCounsellorRejectionEmail } = require("../services/emailService");

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  const path = require("path");
  try {
    const serviceAccount = require("../firebase-service-account.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized for admin routes");
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message);
  }
}
const firestore = admin.firestore();

// ============================================
// DASHBOARD STATS
// ============================================

router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const [totalUsers] = await db.promise().query("SELECT COUNT(*) as count FROM users");
    const [students] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [counsellors] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role = 'counsellor'");
    const [admins] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const [newUsersWeek] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    const [activeUsers] = await db.promise().query("SELECT COUNT(*) as count FROM users WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    
    let totalPosts = 0;
    let pendingReports = 0;
    let totalGroups = 0;
    
    try {
      const postsSnapshot = await firestore.collection("posts").get();
      totalPosts = postsSnapshot.size;
      
      const reportsSnapshot = await firestore.collection("posts").where("status", "==", "reported").get();
      pendingReports = reportsSnapshot.size;
      
      const groupsSnapshot = await firestore.collection("groups").get();
      totalGroups = groupsSnapshot.size;
    } catch (firebaseError) {
      console.error("Firebase stats error:", firebaseError);
    }
    
    const [pendingIssues] = await db.promise().query("SELECT COUNT(*) as count FROM issue_reports WHERE status = 'pending'");
    
    res.json({
      totalUsers: totalUsers[0].count,
      students: students[0].count,
      counsellors: counsellors[0].count,
      admins: admins[0].count,
      newUsersWeek: newUsersWeek[0].count,
      activeUsers: activeUsers[0].count,
      totalPosts,
      totalGroups,
      pendingReports,
      pendingIssues: pendingIssues[0].count || 0
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ msg: "Failed to fetch stats" });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

router.get("/users", verifyAdmin, async (req, res) => {
  const { role, status, warning, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = "SELECT id, name, nickname, email, role, is_active, is_blocked, warning_count, created_at, last_login FROM users WHERE 1=1";
  let params = [];
  
  if (role && role !== 'all') {
    query += " AND role = ?";
    params.push(role);
  }
  
  if (status === 'active') {
    query += " AND is_active = 1 AND is_blocked = 0";
  } else if (status === 'inactive') {
    query += " AND is_active = 0";
  } else if (status === 'banned') {
    query += " AND is_blocked = 1";
  }
  
  if (warning === '1') {
    query += " AND warning_count = 1";
  } else if (warning === '2') {
    query += " AND warning_count = 2";
  } else if (warning === '3') {
    query += " AND warning_count >= 3 AND is_blocked = 0";
  } else if (warning === 'banned') {
    query += " AND is_blocked = 1";
  }
  
  if (search) {
    query += " AND (name LIKE ? OR nickname LIKE ? OR email LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  const [countResult] = await db.promise().query(`SELECT COUNT(*) as total FROM (${query}) as t`, params);
  const total = countResult[0].total;
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);
  
  const [users] = await db.promise().query(query, params);
  
  res.json({
    users,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  });
});

router.put("/users/:userId/role", verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  if (!['student', 'counsellor', 'admin'].includes(role)) {
    return res.status(400).json({ msg: "Invalid role" });
  }
  
  try {
    const [result] = await db.promise().query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    await logAdminAction(adminId, `Changed user role to ${role}`, 'user', userId, JSON.stringify({ newRole: role }), ipAddress);
    await sendNotification(userId, "Role Updated", `Your account role has been changed to ${role}.`, "info");
    
    res.json({ msg: "User role updated successfully" });
  } catch (error) {
    console.error("Role update error:", error);
    res.status(500).json({ msg: "Failed to update role" });
  }
});

router.put("/users/:userId/toggle-status", verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { is_active } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    const [result] = await db.promise().query(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [is_active, userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    const statusText = is_active ? "activated" : "deactivated";
    await logAdminAction(adminId, `User ${statusText}`, 'user', userId, null, ipAddress);
    await sendNotification(userId, "Account Status Updated", `Your account has been ${statusText}.`, "warning");
    
    res.json({ msg: `User ${statusText} successfully` });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ msg: "Failed to update status" });
  }
});

router.delete("/users/:userId", verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    const [user] = await db.promise().query("SELECT email, name FROM users WHERE id = ?", [userId]);
    
    await db.promise().query("DELETE FROM users WHERE id = ?", [userId]);
    
    await logAdminAction(adminId, `Deleted user`, 'user', userId, JSON.stringify({ email: user[0]?.email, name: user[0]?.name }), ipAddress);
    
    res.json({ msg: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ msg: "Failed to delete user" });
  }
});

router.get("/users/export", verifyAdmin, async (req, res) => {
  try {
    const [users] = await db.promise().query(
      "SELECT id, name, nickname, email, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC"
    );
    
    const csvHeader = "ID,Name,Nickname,Email,Role,Active,Created At,Last Login\n";
    const csvRows = users.map(user => 
      `${user.id},${user.name},${user.nickname || ''},${user.email},${user.role},${user.is_active},${user.created_at},${user.last_login || ''}`
    );
    const csv = csvHeader + csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
    res.send(csv);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ msg: "Failed to export users" });
  }
});

// ============================================
// BAN/UNBAN USER
// ============================================

router.post("/users/:userId/ban", verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const { ban_reason, duration_days } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  let bannedUntil = null;
  if (duration_days && duration_days > 0) {
    bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + parseInt(duration_days));
  }
  
  try {
    await db.promise().query(
      "UPDATE users SET is_blocked = TRUE, ban_reason = ?, banned_until = ? WHERE id = ?",
      [ban_reason, bannedUntil, userId]
    );
    
    await logAdminAction(adminId, `Banned user`, 'user', userId, JSON.stringify({ reason: ban_reason, duration: duration_days }), ipAddress);
    
    let durationText = duration_days ? `for ${duration_days} days` : "permanently";
    await sendNotification(userId, "Account Banned", `Your account has been banned ${durationText}. Reason: ${ban_reason}`, "ban");
    
    res.json({ msg: "User banned successfully" });
  } catch (error) {
    console.error("Ban user error:", error);
    res.status(500).json({ msg: "Failed to ban user" });
  }
});

router.post("/users/:userId/unban", verifyAdmin, async (req, res) => {
  const { userId } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    await db.promise().query(
      "UPDATE users SET is_blocked = FALSE, ban_reason = NULL, banned_until = NULL WHERE id = ?",
      [userId]
    );
    
    await logAdminAction(adminId, `Unbanned user`, 'user', userId, null, ipAddress);
    await sendNotification(userId, "Account Unbanned", "Your account has been unbanned. Please follow community guidelines.", "success");
    
    res.json({ msg: "User unbanned successfully" });
  } catch (error) {
    console.error("Unban user error:", error);
    res.status(500).json({ msg: "Failed to unban user" });
  }
});

// ============================================
// REPORT MANAGEMENT - Firebase Only
// ============================================

// Get all reported posts from Firebase
router.get("/reports", verifyAdmin, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  try {
    let reportsQuery = firestore.collection("reports");
    
    if (status && status !== 'all') {
      reportsQuery = reportsQuery.where("status", "==", status);
    }
    
    const reportsSnapshot = await reportsQuery
      .orderBy("createdAt", "desc")
      .limit(parseInt(limit) * parseInt(page))
      .get();
    
    const reports = [];
    for (const doc of reportsSnapshot.docs) {
      const report = { id: doc.id, ...doc.data() };
      
      const [reporter] = await db.promise().query(
        "SELECT nickname, email FROM users WHERE id = ?",
        [report.reportedBy]
      );
      
      const [author] = await db.promise().query(
        "SELECT name, nickname, email, warning_count, is_blocked FROM users WHERE id = ?",
        [report.postAuthorId]
      );
      
      let postContent = report.reportedContent;
      try {
        const postDoc = await firestore.collection("posts").doc(report.postId).get();
        if (postDoc.exists) {
          postContent = postDoc.data().content;
        }
      } catch (e) {
        console.log("Could not fetch post:", e.message);
      }
      
      reports.push({
        id: report.id,
        postId: report.postId,
        content: postContent || report.reportedContent,
        author: author[0] || { nickname: 'Unknown' },
        reporter: reporter[0] || { nickname: 'Unknown' },
        reason: report.reason,
        reportedAt: report.createdAt?.toDate(),
        status: report.status || 'pending'
      });
    }
    
    res.json({ 
      reports, 
      total: reportsSnapshot.size 
    });
  } catch (error) {
    console.error("Fetch reports error:", error);
    res.status(500).json({ msg: "Failed to fetch reports", error: error.message });
  }
});

// Delete reported post (removes from Firebase)
router.delete("/reports/:postId", verifyAdmin, async (req, res) => {
  const { postId } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    const postRef = firestore.collection("posts").doc(postId);
    const post = await postRef.get();
    
    if (!post.exists) {
      return res.status(404).json({ msg: "Post not found" });
    }
    
    const postData = post.data();
    const authorId = postData.user_id;
    
    await postRef.delete();
    
    const reportsSnapshot = await firestore.collection("reports")
      .where("postId", "==", postId)
      .get();
    
    for (const doc of reportsSnapshot.docs) {
      await doc.ref.update({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: adminId
      });
    }
    
    await logAdminAction(
      adminId, 
      `Deleted reported post`, 
      'post', 
      postId, 
      JSON.stringify({ authorId, content: postData.content?.substring(0, 100) }), 
      ipAddress
    );
    
    await sendNotification(
      authorId, 
      "Post Removed", 
      "Your post was removed by admin for violating community guidelines.", 
      "warning"
    );
    
    res.json({ msg: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ msg: "Failed to delete post", error: error.message });
  }
});

// Resolve a report
router.post("/reports/:reportId/resolve", verifyAdmin, async (req, res) => {
  const { reportId } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    const reportRef = firestore.collection("reports").doc(reportId);
    const report = await reportRef.get();
    
    if (!report.exists) {
      return res.status(404).json({ msg: "Report not found" });
    }
    
    const reportData = report.data();
    
    await reportRef.update({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: adminId
    });
    
    if (reportData.postId) {
      await firestore.collection("posts").doc(reportData.postId).update({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: adminId
      });
    }
    
    await logAdminAction(
      adminId, 
      `Resolved report`, 
      'report', 
      reportId, 
      JSON.stringify({ postId: reportData.postId }), 
      ipAddress
    );
    
    res.json({ msg: "Report resolved successfully" });
  } catch (error) {
    console.error("Resolve report error:", error);
    res.status(500).json({ msg: "Failed to resolve report", error: error.message });
  }
});

// Get report count for sidebar badge
router.get("/reports/count", verifyAdmin, async (req, res) => {
  try {
    const reportsSnapshot = await firestore.collection("reports")
      .where("status", "==", "pending")
      .get();
    
    res.json({ count: reportsSnapshot.size });
  } catch (error) {
    console.error("Report count error:", error);
    res.status(500).json({ msg: "Failed to get report count" });
  }
});

// ============================================
// SYSTEM HEALTH
// ============================================

router.get("/health", verifyAdmin, async (req, res) => {
  const health = {
    database: 'unknown',
    firebase: 'unknown',
    timestamp: new Date()
  };
  
  try {
    await db.promise().query("SELECT 1");
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.database_error = error.message;
  }
  
  try {
    await firestore.collection("posts").limit(1).get();
    health.firebase = 'connected';
  } catch (error) {
    health.firebase = 'disconnected';
    health.firebase_error = error.message;
  }
  
  res.json(health);
});

// ============================================
// ANALYTICS
// ============================================

router.get("/analytics/registrations", verifyAdmin, async (req, res) => {
  try {
    const [registrations] = await db.promise().query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM users 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );
    res.json(registrations);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ msg: "Failed to fetch analytics" });
  }
});

router.get("/analytics/report-resolution", verifyAdmin, async (req, res) => {
  try {
    const [resolutions] = await db.promise().query(
      `SELECT status, COUNT(*) as count FROM issue_reports GROUP BY status`
    );
    res.json(resolutions);
  } catch (error) {
    console.error("Resolution analytics error:", error);
    res.status(500).json({ msg: "Failed to fetch resolution stats" });
  }
});

// ============================================
// ISSUE REPORTS
// ============================================

router.get("/issues", verifyAdmin, async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = "SELECT i.*, u.name, u.nickname, u.email FROM issue_reports i LEFT JOIN users u ON i.user_id = u.id WHERE 1=1";
  let params = [];
  
  if (status && status !== 'all') {
    query += " AND i.status = ?";
    params.push(status);
  }
  
  if (type && type !== 'all') {
    query += " AND i.type = ?";
    params.push(type);
  }
  
  const [countResult] = await db.promise().query(`SELECT COUNT(*) as total FROM (${query}) as t`, params);
  const total = countResult[0].total;
  
  query += " ORDER BY i.created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), offset);
  
  const [issues] = await db.promise().query(query, params);
  
  res.json({
    issues,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit)
  });
});

router.put("/issues/:id/status", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, admin_response } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    await db.promise().query(
      "UPDATE issue_reports SET status = ?, admin_response = ? WHERE id = ?",
      [status, admin_response || null, id]
    );
    
    const [issue] = await db.promise().query("SELECT user_id FROM issue_reports WHERE id = ?", [id]);
    if (issue[0]) {
      await sendNotification(issue[0].user_id, "Issue Report Update", `Your issue report has been marked as ${status}.`, "info");
    }
    
    await logAdminAction(adminId, `Updated issue report status`, 'issue', id, JSON.stringify({ status }), ipAddress);
    
    res.json({ msg: "Issue status updated successfully" });
  } catch (error) {
    console.error("Update issue error:", error);
    res.status(500).json({ msg: "Failed to update issue" });
  }
});

router.delete("/issues/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    await db.promise().query("DELETE FROM issue_reports WHERE id = ?", [id]);
    await logAdminAction(adminId, `Deleted issue report`, 'issue', id, null, ipAddress);
    res.json({ msg: "Issue deleted successfully" });
  } catch (error) {
    console.error("Delete issue error:", error);
    res.status(500).json({ msg: "Failed to delete issue" });
  }
});

// ============================================
// SUPPORT RESOURCES
// ============================================

router.get("/resources", verifyAdmin, async (req, res) => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS support_resources (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('online_resource', 'crisis_resource') NOT NULL,
        name VARCHAR(255),
        number VARCHAR(50),
        url VARCHAR(500),
        description TEXT,
        hours VARCHAR(255),
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await db.promise().query(createTableQuery);
    
    const [resources] = await db.promise().query(
      "SELECT * FROM support_resources WHERE is_active = 1 ORDER BY type, display_order"
    );
    
    const grouped = {
      onlineResources: resources.filter(r => r.type === 'online_resource'),
      crisisResources: resources.filter(r => r.type === 'crisis_resource')
    };
    
    res.json(grouped);
  } catch (error) {
    console.error("Fetch resources error:", error);
    res.status(500).json({ msg: "Failed to fetch resources" });
  }
});

router.post("/resources", verifyAdmin, async (req, res) => {
  const { type, name, number, url, description, hours, display_order } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    const [result] = await db.promise().query(
      "INSERT INTO support_resources (type, name, number, url, description, hours, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [type, name || null, number || null, url || null, description || null, hours || null, display_order || 0]
    );
    
    await logAdminAction(adminId, `Added support resource`, 'resource', result.insertId, JSON.stringify({ type, name }), ipAddress);
    
    res.json({ msg: "Resource added successfully", id: result.insertId });
  } catch (error) {
    console.error("Add resource error:", error);
    res.status(500).json({ msg: "Failed to add resource" });
  }
});

router.put("/resources/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, number, url, description, hours, display_order, is_active } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    await db.promise().query(
      "UPDATE support_resources SET name = ?, number = ?, url = ?, description = ?, hours = ?, display_order = ?, is_active = ? WHERE id = ?",
      [name || null, number || null, url || null, description || null, hours || null, display_order || 0, is_active !== undefined ? is_active : true, id]
    );
    
    await logAdminAction(adminId, `Updated support resource`, 'resource', id, null, ipAddress);
    
    res.json({ msg: "Resource updated successfully" });
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({ msg: "Failed to update resource" });
  }
});

router.delete("/resources/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;
  
  try {
    await db.promise().query("DELETE FROM support_resources WHERE id = ?", [id]);
    await logAdminAction(adminId, `Deleted support resource`, 'resource', id, null, ipAddress);
    res.json({ msg: "Resource deleted successfully" });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ msg: "Failed to delete resource" });
  }
});

// ============================================
// NOTIFICATIONS FOR STUDENTS
// ============================================

router.get("/notifications/:user_id", verifyAdmin, async (req, res) => {
  const { user_id } = req.params;
  
  try {
    const [notifications] = await db.promise().query(
      "SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [user_id]
    );
    res.json(notifications);
  } catch (error) {
    console.error("Fetch notifications error:", error);
    res.status(500).json({ msg: "Failed to fetch notifications" });
  }
});

router.put("/notifications/:id/read", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.promise().query("UPDATE user_notifications SET is_read = TRUE WHERE id = ?", [id]);
    res.json({ msg: "Notification marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ msg: "Failed to mark notification as read" });
  }
});

// ============================================
// ADMIN SETTINGS - System Settings
// ============================================

router.get("/settings", verifyAdmin, async (req, res) => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await db.promise().query(createTableQuery);
    
    const defaultSettings = {
      siteName: "Lumora",
      maintenanceMode: "false",
      allowRegistrations: "true",
      defaultUserRole: "student",
      sessionTimeout: "60"
    };
    
    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.promise().query(
        "INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES (?, ?)",
        [key, value]
      );
    }
    
    const [settings] = await db.promise().query(
      "SELECT setting_key, setting_value FROM system_settings"
    );
    
    const settingsObj = {};
    settings.forEach(s => {
      // Convert string values to proper types
      if (s.setting_value === 'true') settingsObj[s.setting_key] = true;
      else if (s.setting_value === 'false') settingsObj[s.setting_key] = false;
      else if (!isNaN(s.setting_value)) settingsObj[s.setting_key] = parseInt(s.setting_value);
      else settingsObj[s.setting_key] = s.setting_value;
    });
    
    console.log("Settings fetched:", settingsObj);
    
    res.json(settingsObj);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ msg: "Failed to fetch settings", error: error.message });
  }
});

router.put("/settings", verifyAdmin, async (req, res) => {
  const { maintenanceMode, allowRegistrations, defaultUserRole, sessionTimeout } = req.body;
  
  console.log("Updating system settings:", req.body);
  
  try {
    const updates = {
      maintenanceMode: maintenanceMode ? "true" : "false",
      allowRegistrations: allowRegistrations ? "true" : "false",
      defaultUserRole: defaultUserRole || "student",
      sessionTimeout: String(sessionTimeout || 60)
    };
    
    for (const [key, value] of Object.entries(updates)) {
      const [result] = await db.promise().query(
        "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?",
        [value, key]
      );
      console.log(`Updated ${key} to ${value}, affected rows: ${result.affectedRows}`);
    }
    
    await logAdminAction(
      req.user.id, 
      "Updated system settings", 
      "settings", 
      null, 
      JSON.stringify(updates), 
      req.ip
    );
    
    res.json({ msg: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ msg: "Failed to update settings", error: error.message });
  }
});

// ============================================
// NOTIFICATION SETTINGS (Admin)
// ============================================

router.get("/notification-settings", verifyAdmin, async (req, res) => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admin_notification_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_id INT NOT NULL,
        email_notifications BOOLEAN DEFAULT TRUE,
        report_notifications BOOLEAN DEFAULT TRUE,
        user_activity_alerts BOOLEAN DEFAULT TRUE,
        system_update_alerts BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    await db.promise().query(createTableQuery);
    
    let [settings] = await db.promise().query(
      "SELECT * FROM admin_notification_settings WHERE admin_id = ?",
      [req.user.id]
    );
    
    if (settings.length === 0) {
      await db.promise().query(
        "INSERT INTO admin_notification_settings (admin_id) VALUES (?)",
        [req.user.id]
      );
      [settings] = await db.promise().query(
        "SELECT * FROM admin_notification_settings WHERE admin_id = ?",
        [req.user.id]
      );
    }
    
    res.json({
      emailNotifications: settings[0]?.email_notifications === 1,
      reportNotifications: settings[0]?.report_notifications === 1,
      userActivityAlerts: settings[0]?.user_activity_alerts === 1,
      systemUpdateAlerts: settings[0]?.system_update_alerts === 1
    });
  } catch (error) {
    console.error("Get notification settings error:", error);
    res.json({
      emailNotifications: true,
      reportNotifications: true,
      userActivityAlerts: true,
      systemUpdateAlerts: true
    });
  }
});

router.put("/notification-settings", verifyAdmin, async (req, res) => {
  const { emailNotifications, reportNotifications, userActivityAlerts, systemUpdateAlerts } = req.body;
  
  try {
    await db.promise().query(
      `UPDATE admin_notification_settings SET 
        email_notifications = ?, 
        report_notifications = ?, 
        user_activity_alerts = ?, 
        system_update_alerts = ? 
       WHERE admin_id = ?`,
      [emailNotifications ? 1 : 0, reportNotifications ? 1 : 0, userActivityAlerts ? 1 : 0, systemUpdateAlerts ? 1 : 0, req.user.id]
    );
    
    res.json({ msg: "Notification settings updated" });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({ msg: "Failed to update settings" });
  }
});

// ============================================
// COUNSELLOR REQUEST MANAGEMENT
// ============================================

router.get("/counsellor-requests", verifyAdmin, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  console.log("Fetching counsellor requests. Status filter:", status);

  try {
    let query = `
      SELECT r.*, un.name as university_name
      FROM counsellor_requests r
      LEFT JOIN universities un ON r.university_id = un.id
      WHERE 1=1
    `;
    let params = [];

    if (status && status !== 'all') {
      query += " AND r.status = ?";
      params.push(status);
    }

    const countQuery = `SELECT COUNT(*) as total FROM counsellor_requests r ${status && status !== 'all' ? 'WHERE r.status = ?' : ''}`;
    const countParams = status && status !== 'all' ? [status] : [];
    const [countResult] = await db.promise().query(countQuery, countParams);
    const total = countResult[0].total;

    query += " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), offset);

    const [requests] = await db.promise().query(query, params);

    console.log("Found requests:", requests.length);

    res.json({
      requests,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Fetch counsellor requests error:", error);
    res.status(500).json({ msg: "Failed to fetch requests", error: error.message });
  }
});

// Approve counsellor registration request
router.put("/counsellor-requests/:id/approve", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;

  console.log("Approving request:", id);

  try {
    const [request] = await db.promise().query(
      "SELECT * FROM counsellor_requests WHERE id = ?",
      [id]
    );

    if (!request.length) {
      return res.status(404).json({ msg: "Request not found" });
    }

    if (request[0].status !== 'pending') {
      return res.status(400).json({ msg: `Request is already ${request[0].status}` });
    }

    const reqData = request[0];

    // ✅ Generate default password
    const defaultPassword = "password123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // ✅ Create the user with the hashed password
    const insertResult = await db.promise().query(
      `INSERT INTO users 
       (name, nickname, email, password, dob, gender,
        university_id, student_id,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'counsellor', 1)`,
      [
        reqData.name,
        reqData.nickname,
        reqData.email,
        hashedPassword, // ✅ Hashed password stored in database
        reqData.dob,
        reqData.gender,
        reqData.university_id,
        reqData.student_id,
        reqData.emergency_contact_name,
        reqData.emergency_contact_phone,
        reqData.emergency_contact_relationship
      ]
    );

    const newUserId = insertResult[0].insertId;

    await db.promise().query(
      `UPDATE counsellor_requests 
       SET status = 'approved', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), user_id = ?
       WHERE id = ?`,
      [admin_notes || null, adminId, newUserId, id]
    );

    console.log("Counsellor approved and user created. User ID:", newUserId);

    // ✅ Send email with the default password
    await sendCounsellorApprovalEmail(
      reqData.email,
      reqData.name,
      defaultPassword // ✅ Send the plain text password in email
    );
    console.log(`✅ Approval email sent to ${reqData.email} with password: ${defaultPassword}`);

    await logAdminAction(
      adminId,
      `Approved counsellor registration for ${reqData.email}`,
      'counsellor',
      newUserId,
      JSON.stringify({ request_id: id, admin_notes }),
      ipAddress
    );

    await sendNotification(
      newUserId,
      "Counsellor Application Approved",
      "Your counsellor registration has been approved! You can now access the counsellor dashboard.",
      "success"
    );

    res.json({ 
      msg: "Counsellor registration approved successfully",
      emailSent: true
    });
  } catch (error) {
    console.error("Approve counsellor error:", error);
    res.status(500).json({ msg: "Failed to approve request", error: error.message });
  }
});

// Reject counsellor registration request
router.put("/counsellor-requests/:id/reject", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;
  const adminId = req.user.id;
  const ipAddress = req.ip;

  console.log("Rejecting request:", id);

  try {
    const [request] = await db.promise().query(
      "SELECT * FROM counsellor_requests WHERE id = ?",
      [id]
    );

    if (!request.length) {
      return res.status(404).json({ msg: "Request not found" });
    }

    if (request[0].status !== 'pending') {
      return res.status(400).json({ msg: `Request is already ${request[0].status}` });
    }

    // ✅ Send rejection email
    await sendCounsellorRejectionEmail(
      request[0].email,
      request[0].name,
      admin_notes || null
    );
    console.log(`✅ Rejection email sent to ${request[0].email}`);

    await db.promise().query(
      `UPDATE counsellor_requests 
       SET status = 'rejected', admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() 
       WHERE id = ?`,
      [admin_notes || null, adminId, id]
    );

    console.log("Counsellor rejected:", request[0].email);

    await logAdminAction(
      adminId,
      `Rejected counsellor registration for ${request[0].email}`,
      'counsellor',
      null,
      JSON.stringify({ request_id: id, admin_notes }),
      ipAddress
    );

    res.json({ 
      msg: "Counsellor registration rejected",
      emailSent: true
    });
  } catch (error) {
    console.error("Reject counsellor error:", error);
    res.status(500).json({ msg: "Failed to reject request" });
  }
});

// Delete counsellor registration request
router.delete("/counsellor-requests/:id", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const ipAddress = req.ip;

  try {
    const [request] = await db.promise().query(
      "SELECT * FROM counsellor_requests WHERE id = ?",
      [id]
    );

    if (!request.length) {
      return res.status(404).json({ msg: "Request not found" });
    }

    await db.promise().query("DELETE FROM counsellor_requests WHERE id = ?", [id]);

    await logAdminAction(
      adminId,
      `Deleted counsellor registration request ${id}`,
      'counsellor',
      null,
      JSON.stringify({ email: request[0].email }),
      ipAddress
    );

    res.json({ msg: "Request deleted" });
  } catch (error) {
    console.error("Delete request error:", error);
    res.status(500).json({ msg: "Failed to delete request" });
  }
});

module.exports = router;