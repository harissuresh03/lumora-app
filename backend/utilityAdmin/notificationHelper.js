// backend/utilityAdmin/notificationHelper.js
const db = require("../db");

/**
 * Send notification to all admin users
 * @param {string} type - Notification type (report_post, report_issue, counsellor_request, report_group)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} link - Link to navigate to (optional)
 * @param {number} relatedId - Related ID (optional)
 * @returns {Promise<Object>} Result with success status and count
 */
const sendAdminNotification = async (type, title, message, link, relatedId) => {
  try {
    // Get all active admin users
    const [adminUsers] = await db.promise().query(
      "SELECT id FROM users WHERE role = 'admin' AND is_active = 1"
    );
    
    console.log("📨 Admin users found:", adminUsers.length); // ✅ ADD LOGGING
    
    if (adminUsers.length === 0) {
      console.log("⚠️ No active admin users found to notify");
      return { success: false, message: "No active admin users found" };
    }
    
    console.log(`📨 Sending admin notification: "${title}" to ${adminUsers.length} admins`);
    
    // Insert notification for each admin with is_read = 'unseen'
    for (const admin of adminUsers) {
      await db.promise().query(
        `INSERT INTO admin_notifications 
         (admin_id, type, title, message, link, related_id, is_read, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 'unseen', NOW())`,
        [admin.id, type, title, message, link, relatedId]
      );
    }
    
    console.log(`✅ Admin notification sent: ${title}`);
    return { success: true, count: adminUsers.length };
  } catch (error) {
    console.error("❌ Send admin notification error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendAdminNotification;