// backend/routes/universities.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all universities (no auth needed for registration)
router.get("/", (req, res) => {
  db.query(
    "SELECT id, name, short_name FROM universities ORDER BY name ASC",
    (err, results) => {
      if (err) {
        console.error("Fetch universities error:", err);
        return res.status(500).json({ msg: "Failed to fetch universities" });
      }
      res.json(results);
    }
  );
});

// GET university by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT id, name, short_name FROM universities WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results[0] || null);
    }
  );
});

module.exports = router;