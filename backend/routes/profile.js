// routes/profile.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/authmiddleware");

/* =========================
   GET PROFILE - with auth & ownership check
========================= */
router.get("/:id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Check if user is accessing their own profile
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot view another user's profile" });
  }

  db.query(
    "SELECT id, name, email, dob, gender FROM users WHERE id = ?",
    [userId],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (!result.length) {
        return res.status(404).json({ msg: "User not found" });
      }
      res.json(result[0]);
    }
  );
});

/* =========================
   UPDATE PROFILE - with auth & ownership check
========================= */
router.put("/update/:id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Check if user is updating their own profile
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot update another user's profile" });
  }

  const { name, email, dob, gender, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ msg: "Name and Email required" });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ msg: "Invalid email format" });
  }

  try {
    if (password && password.trim() !== "") {
      // Password strength check
      if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
      }
      
      const hashed = await bcrypt.hash(password, 10);

      db.query(
        `UPDATE users SET name=?, email=?, dob=?, gender=?, password=? WHERE id=?`,
        [name, email, dob || null, gender || null, hashed, userId],
        (err, result) => {
          if (err) return res.status(500).json(err);
          if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User not found" });
          }
          res.json({ msg: "Updated with password" });
        }
      );
    } else {
      db.query(
        `UPDATE users SET name=?, email=?, dob=?, gender=? WHERE id=?`,
        [name, email, dob || null, gender || null, userId],
        (err, result) => {
          if (err) return res.status(500).json(err);
          if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User not found" });
          }
          res.json({ msg: "Updated successfully" });
        }
      );
    }
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;