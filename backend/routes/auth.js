// routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "lumora_secret_key";

/* REGISTER */
router.post("/register", async (req, res) => {
  const { name, email, password, dob, gender } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (name, email, password, dob, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, dob || null, gender || null],
      (err, result) => {
        if (err) return res.status(500).json({ msg: "Register failed" });

        res.json({
          msg: "User created",
          user_id: result.insertId,
        });
      }
    );
  } catch {
    res.status(500).json({ msg: "Server error" });
  }
});

/* LOGIN - NOW RETURNS REAL JWT */
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

      // ✅ Generate real JWT token
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