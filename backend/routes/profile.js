// backend/routes/profile.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const verifyToken = require("../middleware/authmiddleware");

/* =========================
   GET PROFILE - Join with universities to get name
========================= */
router.get("/:id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot view another user's profile" });
  }

  db.query(
    `SELECT u.id, u.name, u.nickname, u.email, u.dob, u.gender, 
            u.university_id, u.student_id,
            u.faculty, u.department,
            u.counsellor_consent,
            u.emergency_contact_name, u.emergency_contact_phone, u.emergency_contact_relationship,
            un.name as university_name, un.short_name as university_short_name
     FROM users u
     LEFT JOIN universities un ON u.university_id = un.id
     WHERE u.id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.error("Profile fetch error:", err);
        return res.status(500).json(err);
      }
      if (!result.length) {
        return res.status(404).json({ msg: "User not found" });
      }
      console.log("Profile data fetched:", result[0]);
      res.json(result[0]);
    }
  );
});

/* =========================
   UPDATE PROFILE - Only update university_id
========================= */
router.put("/update/:id", verifyToken, async (req, res) => {
  const userId = parseInt(req.params.id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized: Cannot update another user's profile" });
  }

  const { 
    name, nickname, email, dob, gender, university_id, student_id,
    faculty, department,
    counsellor_consent,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    password 
  } = req.body;

  console.log("Update data received:", { name, nickname, email, university_id, faculty, department, counsellor_consent });

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
      if (password.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters" });
      }
      
      const hashed = await bcrypt.hash(password, 10);

      db.query(
        `UPDATE users SET 
          name = ?, nickname = ?, email = ?, dob = ?, gender = ?, 
          university_id = ?,
          student_id = ?,
          faculty = ?,
          department = ?,
          counsellor_consent = ?,
          emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relationship = ?,
          password = ? 
         WHERE id = ?`,
        [
          name, nickname || null, email, dob || null, gender || null,
          university_id || null,
          student_id || null,
          faculty || null,
          department || null,
          counsellor_consent !== undefined ? (counsellor_consent ? 1 : 0) : 0,
          emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relationship || null,
          hashed, userId
        ],
        (err, result) => {
          if (err) {
            console.error("Update error:", err);
            return res.status(500).json(err);
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User not found" });
          }
          res.json({ msg: "Profile updated successfully" });
        }
      );
    } else {
      db.query(
        `UPDATE users SET 
          name = ?, nickname = ?, email = ?, dob = ?, gender = ?, 
          university_id = ?,
          student_id = ?,
          faculty = ?,
          department = ?,
          counsellor_consent = ?,
          emergency_contact_name = ?, emergency_contact_phone = ?, emergency_contact_relationship = ?
         WHERE id = ?`,
        [
          name, nickname || null, email, dob || null, gender || null,
          university_id || null,
          student_id || null,
          faculty || null,
          department || null,
          counsellor_consent !== undefined ? (counsellor_consent ? 1 : 0) : 0,
          emergency_contact_name || null, emergency_contact_phone || null, emergency_contact_relationship || null,
          userId
        ],
        (err, result) => {
          if (err) {
            console.error("Update error:", err);
            return res.status(500).json(err);
          }
          if (result.affectedRows === 0) {
            return res.status(404).json({ msg: "User not found" });
          }
          res.json({ msg: "Profile updated successfully" });
        }
      );
    }
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;