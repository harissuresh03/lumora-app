// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "lumora_secret_key";

/* REGISTER - Only store university_id */
router.post("/register", async (req, res) => {
  const { 
    name, nickname, email, password, dob, gender, 
    university_id, student_id, 
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship 
  } = req.body;

  console.log("Registration data:", { name, nickname, email, university_id, student_id });

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (name, nickname, email, password, dob, gender, 
        university_id, student_id,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        nickname || null, 
        email, 
        hashedPassword, 
        dob || null, 
        gender || null,
        university_id || null,
        student_id || null,
        emergency_contact_name || null, 
        emergency_contact_phone || null, 
        emergency_contact_relationship || null
      ],
      (err, result) => {
        if (err) {
          console.error("Register error:", err);
          return res.status(500).json({ msg: "Register failed", error: err.message });
        }

        res.json({
          msg: "User created",
          user_id: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

/* LOGIN */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json({ msg: "Server error" });

      if (!results.length) {
        return res.status(400).json({ msg: "User not found" });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token: token,
        user_id: user.id,
      });
    }
  );
});

module.exports = router;