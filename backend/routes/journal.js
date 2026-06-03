// routes/journal.js
const express = require("express");
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

const router = express.Router();

/* GET journals */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  db.query(
    "SELECT id, user_id, content, created_at FROM journals WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

/* ADD journal */
router.post("/", verifyToken, (req, res) => {
  const { user_id, content } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  if (!user_id || !content) {
    return res.status(400).json({ msg: "Missing required fields" });
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

/* DELETE journal */
router.delete("/:id", verifyToken, (req, res) => {
  const journalId = req.params.id;
  
  db.query(
    "SELECT user_id FROM journals WHERE id = ?",
    [journalId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (!results.length) {
        return res.status(404).json({ msg: "Journal entry not found" });
      }
      
      if (results[0].user_id !== req.user.id) {
        return res.status(403).json({ msg: "Unauthorized" });
      }
      
      db.query("DELETE FROM journals WHERE id = ?", [journalId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ msg: "Journal entry deleted" });
      });
    }
  );
});

module.exports = router;