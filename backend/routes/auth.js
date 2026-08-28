// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const verifyToken = require("../middleware/authmiddleware");

const JWT_SECRET = "lumora_secret_key";

/* REGISTER - with email verification */
router.post("/register", async (req, res) => {
  const { 
    name, nickname, email, password, dob, gender, 
    university_id, matric_number, faculty, department,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    counsellor_consent,
    parent_email
  } = req.body;

  console.log("Registration data received:", { 
    name, nickname, email, university_id, matric_number, faculty, department, counsellor_consent,
    parent_email
  });

  if (!name || !email || !password) {
    console.log("Missing required fields");
    return res.status(400).json({ msg: "Missing required fields" });
  }

  // Check if registrations are allowed
  try {
    const [settings] = await db.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'allowRegistrations'"
    );
    
    if (settings[0]?.setting_value === 'false') {
      return res.status(403).json({ msg: "Registrations are currently disabled. Please try again later." });
    }
    
    const [roleSetting] = await db.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'defaultUserRole'"
    );
    const defaultRole = roleSetting[0]?.setting_value || 'student';
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get a connection from the pool for transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user with is_verified = FALSE
      const [result] = await connection.query(
        `INSERT INTO users 
         (name, nickname, email, password, dob, gender, 
          university_id, matric_number, faculty, department,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, 
          counsellor_consent, role, is_verified) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
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
        ]
      );

      const userId = result.insertId;

      // Send verification OTP
      const { createVerification } = require("../services/verificationService");
      await createVerification(userId, 'email_verification', email, name);

      // Handle parent email if provided
      let parentInvited = false;
      if (parent_email && parent_email.trim() !== "") {
        try {
          const [existingParent] = await connection.query(
            "SELECT id, email, parent_invitation_token FROM users WHERE email = ? AND role = 'parent'",
            [parent_email]
          );

          let parentId;

          if (existingParent.length > 0) {
            parentId = existingParent[0].id;
            
            const [existingLink] = await connection.query(
              "SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?",
              [parentId, userId]
            );

            if (existingLink.length === 0) {
              const isConsented = !existingParent[0].parent_invitation_token;
              await connection.query(
                `INSERT INTO parent_student_links 
                 (parent_id, student_id, consent_granted, consent_granted_at) 
                 VALUES (?, ?, ?, ?)`,
                [parentId, userId, isConsented ? 1 : 0, isConsented ? new Date() : null]
              );
            }
            parentInvited = true;
          } else {
            const defaultPassword = "password123";
            const hashedParentPassword = await bcrypt.hash(defaultPassword, 10);
            const token = crypto.randomBytes(32).toString('hex');
            const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            const [parentResult] = await connection.query(
              `INSERT INTO users 
               (email, password, role, parent_invitation_token, parent_invitation_expires, is_active, created_at) 
               VALUES (?, ?, 'parent', ?, ?, 1, NOW())`,
              [parent_email, hashedParentPassword, token, tokenExpiry]
            );

            parentId = parentResult.insertId;

            await connection.query(
              `INSERT INTO parent_student_links 
               (parent_id, student_id, consent_granted, consent_granted_at) 
               VALUES (?, ?, FALSE, NULL)`,
              [parentId, userId]
            );

            const { sendParentInvitationEmail } = require("../services/emailService");
            await sendParentInvitationEmail(parent_email, name);
            
            parentInvited = true;
            console.log(`✅ Parent invitation sent to ${parent_email} during registration`);
          }
        } catch (parentError) {
          console.error("Parent invitation error during registration:", parentError);
        }
      }

      await connection.commit();
      connection.release();

      console.log("User registered successfully. ID:", userId);
      res.json({
        msg: "Registration successful! Please check your email for the verification code.",
        user_id: userId,
        email: email,
        needsVerification: true,
        parent_invited: parentInvited
      });

    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    console.error("Server error:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ msg: "Email already registered" });
    }
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

      if (!user.is_verified) {
        return res.status(403).json({
          msg: "Please verify your email address before logging in.",
          needsVerification: true,
          email: user.email,
          user_id: user.id
        });
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
          await db.query(
            "UPDATE users SET is_blocked = FALSE, ban_reason = NULL, banned_until = NULL WHERE id = ?",
            [user.id]
          );
          console.log(`✅ Ban expired for user ${user.id}, unbanned automatically`);
        } else {
          return res.status(403).json({ msg: banMessage });
        }
      }

      try {
        const [settings] = await db.query(
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

/* CHECK EMAIL - unchanged */
router.post("/check-email", async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    
    const [requests] = await db.query(
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

/* DELETE ACCOUNT - unchanged */
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