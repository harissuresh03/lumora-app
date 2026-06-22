// backend/routes/studentMessage.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

// Get messages for a student from their counsellor
router.get("/messages/:student_id", verifyToken, async (req, res) => {
  const studentId = parseInt(req.params.student_id);
  
  if (req.user.id !== studentId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    // Get student's counsellor (if any)
    const [counsellor] = await db.promise().query(
      `SELECT u.id, u.name, u.nickname 
       FROM users u
       WHERE u.role = 'counsellor' 
       AND u.university_id = (SELECT university_id FROM users WHERE id = ?)
       LIMIT 1`,
      [studentId]
    );
    
    if (!counsellor.length) {
      return res.json({ 
        messages: [],
        counsellor: null,
        msg: "No counsellor assigned to your university"
      });
    }
    
    // Get messages from this counsellor
    const [messages] = await db.promise().query(
      `SELECT m.*, 
              u.name as counsellor_name, 
              u.nickname as counsellor_nickname
       FROM counsellor_messages m
       JOIN users u ON m.counsellor_id = u.id
       WHERE m.student_id = ? AND m.is_from_counsellor = 1
       ORDER BY m.created_at DESC`,
      [studentId]
    );
    
    // Mark messages as read when student views them
    if (messages.length > 0) {
      const messageIds = messages.map(m => m.id);
      await db.promise().query(
        `UPDATE counsellor_messages SET is_read = 1 WHERE id IN (?) AND student_id = ?`,
        [messageIds, studentId]
      );
    }
    
    res.json({
      messages,
      counsellor: counsellor[0] || null
    });
  } catch (error) {
    console.error("Fetch student messages error:", error);
    res.status(500).json({ msg: "Failed to fetch messages", error: error.message });
  }
});

// Get unread message count for student
router.get("/messages/unread-count/:student_id", verifyToken, async (req, res) => {
  const studentId = parseInt(req.params.student_id);
  
  if (req.user.id !== studentId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [result] = await db.promise().query(
      `SELECT COUNT(*) as count 
       FROM counsellor_messages 
       WHERE student_id = ? AND is_from_counsellor = 1 AND is_read = 0`,
      [studentId]
    );
    
    res.json({ count: result[0].count });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ msg: "Failed to get unread count" });
  }
});

// Mark a specific message as read
router.put("/messages/:id/read", verifyToken, async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id;

  try {
    const [result] = await db.promise().query(
      "UPDATE counsellor_messages SET is_read = 1 WHERE id = ? AND student_id = ?",
      [id, studentId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ msg: "Message not found" });
    }
    
    res.json({ msg: "Message marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ msg: "Failed to mark message as read" });
  }
});

module.exports = router;