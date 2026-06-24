// backend/routes/adminNotifications.js
console.log("📁 adminNotifications.js loaded!");

const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyAdmin } = require("../middleware/adminAuth");

// ============================================
// SIMPLE TEST ROUTE - WITH FULL DEBUG
// ============================================
router.get("/simple-test", verifyAdmin, async (req, res) => {
  console.log("🔥🔥🔥 SIMPLE TEST ROUTE HIT!");
  console.log("User ID from token:", req.user.id);
  
  try {
    // 1. Check which database we're connected to
    const [dbName] = await db.promise().query("SELECT DATABASE() as db");
    console.log("📌 Connected to database:", dbName[0].db);
    
    // 2. Check if table exists
    const [tableCheck] = await db.promise().query(
      "SHOW TABLES LIKE 'admin_notifications'"
    );
    console.log("📌 Table exists:", tableCheck.length > 0);
    
    // 3. If table exists, get all data
    let results = [];
    if (tableCheck.length > 0) {
      const [data] = await db.promise().query(
        "SELECT * FROM admin_notifications"
      );
      results = data;
      console.log("📌 All notifications:", results);
      console.log("📌 Count:", results.length);
    } else {
      console.log("❌ Table 'admin_notifications' does NOT exist!");
    }
    
    res.json({ 
      message: "Simple test working!", 
      database: dbName[0].db,
      tableExists: tableCheck.length > 0,
      count: results.length,
      data: results,
      userId: req.user.id
    });
  } catch (error) {
    console.error("❌ Simple test error:", error);
    res.json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// ============================================
// GET UNSEEN NOTIFICATIONS ONLY
// ============================================
// GET UNSEEN NOTIFICATIONS ONLY
router.get("/unread", verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    console.log("🔍 /unread - Admin ID:", adminId);
    
    // Check if the admin exists
    const [adminCheck] = await db.promise().query(
      "SELECT id, role FROM users WHERE id = ?",
      [adminId]
    );
    console.log("👤 Admin check:", adminCheck);

    const [notifications] = await db.promise().query(
      `SELECT id, type, title, message, link, related_id, is_read, created_at 
       FROM admin_notifications 
       WHERE admin_id = ? AND is_read = 'unseen' 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [adminId]
    );
    
    console.log(`📨 Found ${notifications.length} unseen notifications`);
    console.log("📨 Notifications data:", notifications);
    
    res.json(notifications);
  } catch (error) {
    console.error("❌ Error in /unread:", error);
    res.status(500).json({
      msg: "Failed to fetch unread notifications",
      error: error.message
    });
  }
});

// ============================================
// GET UNREAD COUNT
// ============================================
router.get("/unread-count", verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const [result] = await db.promise().query(
      "SELECT COUNT(*) as count FROM admin_notifications WHERE admin_id = ? AND is_read = 'unseen'",
      [adminId]
    );

    res.json({ count: Number(result[0].count) });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ msg: "Failed to get unread count", error: error.message });
  }
});

// ============================================
// MARK SINGLE NOTIFICATION AS READ
// ============================================
router.put("/:id/read", verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const [result] = await db.promise().query(
      "UPDATE admin_notifications SET is_read = 'seen' WHERE id = ? AND admin_id = ?",
      [id, adminId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "Notification not found" });
    }

    res.json({ msg: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ msg: "Failed to mark notification as read", error: error.message });
  }
});

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================
router.put("/mark-all-read", verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const [result] = await db.promise().query(
      "UPDATE admin_notifications SET is_read = 'seen' WHERE admin_id = ? AND is_read = 'unseen'",
      [adminId]
    );

    res.json({ 
      msg: "All notifications marked as read", 
      updated: result.affectedRows 
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ msg: "Failed to mark all as read", error: error.message });
  }
});

// ============================================
// CREATE TEST NOTIFICATION
// ============================================
router.post("/test/create", verifyAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    
    console.log(`🔧 Creating test notification for admin ${adminId}`);
    
    const [result] = await db.promise().query(
      `INSERT INTO admin_notifications 
       (admin_id, type, title, message, link, related_id, is_read, created_at) 
       VALUES (?, 'test', ?, ?, ?, ?, 'unseen', NOW())`,
      [adminId, '🧪 Test Notification', 'This is a test notification! Click "Mark as Read" to dismiss.', '/admin', null]
    );
    
    console.log(`✅ Created test notification with ID: ${result.insertId}`);
    
    res.json({ 
      msg: "Test notification created successfully!", 
      id: result.insertId 
    });
  } catch (error) {
    console.error("Create test notification error:", error);
    res.status(500).json({ 
      msg: "Failed to create test notification", 
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;