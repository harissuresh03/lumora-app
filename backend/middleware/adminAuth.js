// backend/middleware/adminAuth.js
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = "lumora_secret_key";

// Verify admin role middleware
const verifyAdmin = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    
    db.query(
      "SELECT role, is_active FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) {
          return res.status(500).json({ msg: "Server error" });
        }
        if (!results.length) {
          return res.status(404).json({ msg: "User not found" });
        }
        if (!results[0].is_active) {
          return res.status(403).json({ msg: "Account is deactivated" });
        }
        if (results[0].role !== 'admin') {
          return res.status(403).json({ msg: "Access denied. Admin only." });
        }
        
        req.user = decoded;
        next();
      }
    );
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

// Log admin action
const logAdminAction = (adminId, action, targetType, targetId, details, ipAddress) => {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
      [adminId, action, targetType, targetId, details || null, ipAddress || null],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// Send notification to user
const sendNotification = (userId, title, message, type, relatedId = null) => {
  return new Promise((resolve, reject) => {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'warning', 'success', 'error', 'ban', 'report_reviewed') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        related_id INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    db.query(createTableQuery, (err) => {
      if (err) {
        console.error("Create notifications table error:", err);
        resolve(null);
        return;
      }
      
      db.query(
        "INSERT INTO user_notifications (user_id, title, message, type, related_id) VALUES (?, ?, ?, ?, ?)",
        [userId, title, message, type, relatedId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  });
};

module.exports = { verifyAdmin, logAdminAction, sendNotification };