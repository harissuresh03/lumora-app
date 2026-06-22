// backend/routes/deadlines.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

// Get all deadlines for a user
router.get("/:user_id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  try {
    const [deadlines] = await db.promise().query(
      "SELECT * FROM deadlines WHERE user_id = ? ORDER BY due_date ASC",
      [userId]
    );
    res.json(deadlines);
  } catch (error) {
    console.error("Fetch deadlines error:", error);
    res.status(500).json({ msg: "Failed to fetch deadlines" });
  }
});

// Create a new deadline
router.post("/", verifyToken, async (req, res) => {
  const { user_id, title, subject, type, due_date, difficulty } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  if (!title || !due_date) {
    return res.status(400).json({ msg: "Title and due date are required" });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO deadlines (user_id, title, subject, type, due_date, difficulty) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, title, subject || null, type || 'assignment', due_date, difficulty || 'medium']
    );
    res.json({ msg: "Deadline created", id: result.insertId });
  } catch (error) {
    console.error("Create deadline error:", error);
    res.status(500).json({ msg: "Failed to create deadline" });
  }
});

// Update a deadline
router.put("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, subject, type, due_date, difficulty, is_complete } = req.body;

  try {
    // Check ownership
    const [check] = await db.promise().query(
      "SELECT user_id FROM deadlines WHERE id = ?",
      [id]
    );
    if (!check.length || check[0].user_id !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await db.promise().query(
      `UPDATE deadlines SET 
        title = COALESCE(?, title),
        subject = COALESCE(?, subject),
        type = COALESCE(?, type),
        due_date = COALESCE(?, due_date),
        difficulty = COALESCE(?, difficulty),
        is_complete = COALESCE(?, is_complete)
       WHERE id = ?`,
      [title, subject, type, due_date, difficulty, is_complete, id]
    );
    res.json({ msg: "Deadline updated" });
  } catch (error) {
    console.error("Update deadline error:", error);
    res.status(500).json({ msg: "Failed to update deadline" });
  }
});

// Delete a deadline
router.delete("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [check] = await db.promise().query(
      "SELECT user_id FROM deadlines WHERE id = ?",
      [id]
    );
    if (!check.length || check[0].user_id !== req.user.id) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    await db.promise().query("DELETE FROM deadlines WHERE id = ?", [id]);
    res.json({ msg: "Deadline deleted" });
  } catch (error) {
    console.error("Delete deadline error:", error);
    res.status(500).json({ msg: "Failed to delete deadline" });
  }
});

module.exports = router;