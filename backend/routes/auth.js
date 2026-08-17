// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authmiddleware");

const JWT_SECRET = "lumora_secret_key";

/* REGISTER - Check if registrations are allowed */
router.post("/register", async (req, res) => {
  const { 
    name, nickname, email, password, dob, gender, 
    university_id, matric_number, faculty, department,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    counsellor_consent
  } = req.body;

  console.log("Registration data received:", { 
    name, nickname, email, university_id, matric_number, faculty, department, counsellor_consent
  });

  if (!name || !email || !password) {
    console.log("Missing required fields");
    return res.status(400).json({ msg: "Missing required fields" });
  }

  // Check if registrations are allowed
  try {
    const [settings] = await db.promise().query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'allowRegistrations'"
    );
    
    if (settings[0]?.setting_value === 'false') {
      return res.status(403).json({ msg: "Registrations are currently disabled. Please try again later." });
    }
    
    // Get default user role
    const [roleSetting] = await db.promise().query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'defaultUserRole'"
    );
    const defaultRole = roleSetting[0]?.setting_value || 'student';
    
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO users (name, nickname, email, password, dob, gender, 
        university_id, matric_number, faculty, department,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, 
        counsellor_consent, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        nickname || null, 
        email, 
        hashedPassword, 
        dob || null, 
        gender || null,
        university_id || null,
        matric_number || null,
        faculty || null,
        department || null,
        emergency_contact_name || null, 
        emergency_contact_phone || null, 
        emergency_contact_relationship || null,
        counsellor_consent ? 1 : 0,
        defaultRole
      ],
      (err, result) => {
        if (err) {
          console.error("Register error:", err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ msg: "Email already registered" });
          }
          return res.status(500).json({ 
            msg: "Register failed", 
            error: err.message,
            code: err.code 
          });
        }

        console.log("User registered successfully. ID:", result.insertId);

        res.json({
          msg: "User created",
          user_id: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
});

/* LOGIN - unchanged */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt for:", email);

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("Login query error:", err);
        return res.status(500).json({ msg: "Server error" });
      }

      if (!results.length) {
        console.log("User not found:", email);
        return res.status(400).json({ msg: "User not found" });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        console.log("Invalid password for:", email);
        return res.status(400).json({ msg: "Invalid credentials" });
      }

      if (!user.is_active && user.role !== 'admin') {
        return res.status(403).json({ msg: "Your account has been deactivated. Please contact support." });
      }

      if (user.is_blocked && user.role !== 'admin') {
        let banMessage = "Your account has been banned.";
        if (user.ban_reason) {
          banMessage += ` Reason: ${user.ban_reason}`;
        }
        if (user.banned_until && new Date(user.banned_until) > new Date()) {
          banMessage += ` Banned until: ${new Date(user.banned_until).toLocaleDateString()}`;
        } else if (user.banned_until) {
          await db.promise().query(
            "UPDATE users SET is_blocked = FALSE, ban_reason = NULL, banned_until = NULL WHERE id = ?",
            [user.id]
          );
          console.log(`✅ Ban expired for user ${user.id}, unbanned automatically`);
        } else {
          return res.status(403).json({ msg: banMessage });
        }
      }

      try {
        const [settings] = await db.promise().query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'sessionTimeout'"
        );
        const timeoutMinutes = parseInt(settings[0]?.setting_value) || 60;

        db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: `${timeoutMinutes}m` }
        );

        console.log("✅ Login successful for:", email, "Role:", user.role);

        res.json({
          token: token,
          user_id: user.id,
          role: user.role,
        });
      } catch (settingsError) {
        console.error("Settings error:", settingsError);
        db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: "60m" }
        );

        res.json({
          token: token,
          user_id: user.id,
          role: user.role,
        });
      }
    }
  );
});

// Check if email exists - unchanged
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.promise().query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    const [requests] = await db.promise().query(
      "SELECT id FROM counsellor_requests WHERE email = ? AND status = 'pending'",
      [email]
    );

    res.json({ 
      exists: users.length > 0,
      hasPendingRequest: requests.length > 0 
    });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ msg: "Failed to check email" });
  }
});

/* DELETE ACCOUNT - unchanged (no student_id reference) */
router.delete("/account/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  // Delete in correct order (child tables first)
  db.query("DELETE FROM ai_analysis WHERE user_id = ?", [userId], (err) => {
    if (err) console.error("Delete ai_analysis error:", err);
    
    db.query("DELETE FROM journals WHERE user_id = ?", [userId], (err) => {
      if (err) console.error("Delete journals error:", err);
      
      db.query("DELETE FROM moods WHERE user_id = ?", [userId], (err) => {
        if (err) console.error("Delete moods error:", err);
        
        db.query("DELETE FROM sleep WHERE user_id = ?", [userId], (err) => {
          if (err) console.error("Delete sleep error:", err);
          
          db.query("DELETE FROM assessments WHERE user_id = ?", [userId], (err) => {
            if (err) console.error("Delete assessments error:", err);
            
            db.query("DELETE FROM user_notifications WHERE user_id = ?", [userId], (err) => {
              if (err) console.error("Delete notifications error:", err);
              
              db.query("DELETE FROM issue_reports WHERE user_id = ?", [userId], (err) => {
                if (err) console.error("Delete issue_reports error:", err);
                
                db.query("DELETE FROM counsellor_requests WHERE user_id = ?", [userId], (err) => {
                  if (err) console.error("Delete counsellor_requests error:", err);
                  
                  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
                    if (err) {
                      console.error("Delete user error:", err);
                      return res.status(500).json({ msg: "Failed to delete account" });
                    }
                    res.json({ msg: "Account deleted successfully" });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;