// backend/routes/notifications.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

// Get all notifications for a user (including read)
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Fetch notifications error:", err);
        return res.status(500).json({ msg: "Failed to fetch notifications" });
      }
      res.json(results);
    }
  );
});

// Get ONLY unread notifications (is_read = 0)
router.get("/unread/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT * FROM user_notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 50",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Fetch unread notifications error:", err);
        return res.status(500).json({ msg: "Failed to fetch unread notifications" });
      }
      res.json(results);
    }
  );
});

// Get unread count for a user
router.get("/count/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT COUNT(*) as count FROM user_notifications WHERE user_id = ? AND is_read = 0",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Fetch unread count error:", err);
        return res.status(500).json({ msg: "Failed to fetch unread count" });
      }
      res.json({ count: results[0].count });
    }
  );
});

// Mark single notification as read (is_read = 1)
router.put("/:id/read", verifyToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if notification belongs to the user
  db.query(
    "SELECT user_id FROM user_notifications WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Check notification error:", err);
        return res.status(500).json({ msg: "Server error" });
      }
      if (!results.length) {
        return res.status(404).json({ msg: "Notification not found" });
      }
      if (results[0].user_id !== userId) {
        return res.status(403).json({ msg: "Unauthorized" });
      }

      db.query(
        "UPDATE user_notifications SET is_read = 1 WHERE id = ?",
        [id],
        (err, result) => {
          if (err) {
            console.error("Mark read error:", err);
            return res.status(500).json({ msg: "Failed to mark as read" });
          }
          res.json({ msg: "Notification marked as read" });
        }
      );
    }
  );
});

// Mark ALL notifications as read for a user (is_read = 1)
router.put("/mark-all-read/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
    [userId],
    (err, result) => {
      if (err) {
        console.error("Mark all read error:", err);
        return res.status(500).json({ msg: "Failed to mark all as read" });
      }
      res.json({ 
        msg: "All notifications marked as read", 
        updated: result.affectedRows 
      });
    }
  );
});

module.exports = router;