// routes/journal.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

const router = express.Router();

/* GET journals - with auth & ownership check */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  // Check if user is accessing their own data
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot access another user's journal" });
  }

  db.query(
    "SELECT * FROM journals WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ADD journal - with auth & ownership check */
router.post("/", verifyToken, (req, res) => {
  const { user_id, content } = req.body;
  
  // Check if user is posting for themselves
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized: Cannot add journal for another user" });
  }

  if (!user_id || !content) {
    return res.status(400).json({ msg: "Missing required fields: user_id and content" });
  }

  if (content.length > 5000) {
    return res.status(400).json({ msg: "Journal entry too long (max 5000 characters)" });
  }

  db.query(
    "INSERT INTO journals (user_id, content) VALUES (?, ?)",
    [user_id, content],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ msg: "Journal saved 🌿", id: result.insertId });
    }
  );
});

module.exports = router;