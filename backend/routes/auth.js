// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const verifyToken = require("../middleware/authmiddleware");

const JWT_SECRET = "lumora_secret_key";

/* REGISTER - with optional parent email */
router.post("/register", async (req, res) => {
  const { 
    name, nickname, email, password, dob, gender, 
    university_id, student_id, faculty, department,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    counsellor_consent,
    parent_email // ✅ NEW: optional parent email
  } = req.body;

  console.log("Registration data received:", { 
    name, nickname, email, university_id, student_id, faculty, department, counsellor_consent,
    parent_email // ✅ Log parent email
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
    
    const [roleSetting] = await db.promise().query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'defaultUserRole'"
    );
    const defaultRole = roleSetting[0]?.setting_value || 'student';
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // Insert user
      const [result] = await connection.query(
        `INSERT INTO users (name, nickname, email, password, dob, gender, 
          university_id, student_id, faculty, department,
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
          student_id || null,
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

      // ✅ Handle parent email if provided
      let parentInvited = false;
      if (parent_email && parent_email.trim() !== "") {
        try {
          // Check if parent already exists
          const [existingParent] = await connection.query(
            "SELECT id, email, parent_invitation_token FROM users WHERE email = ? AND role = 'parent'",
            [parent_email]
          );

          let parentId;

          if (existingParent.length > 0) {
            parentId = existingParent[0].id;
            
            // Check if already linked to this student
            const [existingLink] = await connection.query(
              "SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?",
              [parentId, userId]
            );

            if (existingLink.length === 0) {
              // Create link with consent granted if parent already confirmed (no token)
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
            // Create new parent account
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

            // Create link (consent not yet granted)
            await connection.query(
              `INSERT INTO parent_student_links 
               (parent_id, student_id, consent_granted, consent_granted_at) 
               VALUES (?, ?, FALSE, NULL)`,
              [parentId, userId]
            );

            // Send invitation email
            const { sendParentInvitationEmail } = require("../services/emailService");
            await sendParentInvitationEmail(parent_email, name, true);
            
            parentInvited = true;
            console.log(`✅ Parent invitation sent to ${parent_email} during registration`);
          }
        } catch (parentError) {
          console.error("Parent invitation error during registration:", parentError);
          // Don't fail registration if parent invitation fails
        }
      }

      await connection.commit();
      connection.release();

      console.log("User registered successfully. ID:", userId);
      res.json({
        msg: "User created",
        user_id: userId,
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

/* LOGIN - Check account status and session timeout */
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

      // ✅ Check if account is active (always allow admins even in maintenance)
      // Admin accounts are always active for login
      if (!user.is_active && user.role !== 'admin') {
        return res.status(403).json({ msg: "Your account has been deactivated. Please contact support." });
      }

      // Check if account is banned (admins can't be banned)
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

      // Get session timeout from settings
      try {
        const [settings] = await db.promise().query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'sessionTimeout'"
        );
        const timeoutMinutes = parseInt(settings[0]?.setting_value) || 60;
        console.log(`Session timeout: ${timeoutMinutes} minutes`);

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

// Check if email exists
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

/* DELETE ACCOUNT - Permanently delete user and all associated data */
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