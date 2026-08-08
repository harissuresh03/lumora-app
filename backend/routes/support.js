// backend/routes/support.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");
const sendAdminNotification = require("../utilityAdmin/notificationHelper");

// Helper function to get online resources from database
function getOnlineResourcesFromDB(callback) {
  db.query(
    "SELECT id, name, url, description, display_order FROM support_resources WHERE type = 'online_resource' AND is_active = 1 ORDER BY display_order",
    (err, results) => {
      if (err) {
        console.error("Fetch online resources error:", err);
        callback([]);
        return;
      }
      callback(results);
    }
  );
}

// Helper function to get crisis resources from database
function getCrisisResourcesFromDB(callback) {
  db.query(
    "SELECT id, name, number, description, hours, display_order FROM support_resources WHERE type = 'crisis_resource' AND is_active = 1 ORDER BY display_order",
    (err, results) => {
      if (err) {
        console.error("Fetch crisis resources error:", err);
        callback([]);
        return;
      }
      callback(results);
    }
  );
}

/**
 * GET /api/support/:user_id
 * Get support resources for the user's university (AUTHENTICATED)
 */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  if (req.user.id !== userId) {
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  db.query(
    "SELECT university_id FROM users WHERE id = ?",
    [userId],
    (err, userResults) => {
      if (err) {
        console.error("User fetch error:", err);
        return res.status(500).json({ msg: "Failed to fetch user data" });
      }
      
      if (!userResults.length) {
        return res.status(404).json({ msg: "User not found" });
      }
      
      const userUniversityId = userResults[0].university_id;
      
      if (!userUniversityId) {
        getOnlineResourcesFromDB((onlineResources) => {
          getCrisisResourcesFromDB((crisisResources) => {
            return res.json({
              hasUniversity: false,
              universityName: null,
              counsellors: [],
              resources: {
                general: {
                  onlineResources: onlineResources,
                  crisisResources: crisisResources
                }
              },
              message: "No university selected. Please update your profile to see university-specific resources."
            });
          });
        });
        return;
      }
      
      // ✅ GET ALL COUNSELLORS FOR THIS UNIVERSITY
      db.query(
        "SELECT id, name, nickname FROM users WHERE role = 'counsellor' AND university_id = ?",
        [userUniversityId],
        (err, counsellorResults) => {
          if (err) {
            console.error("Counsellor fetch error:", err);
          }
          
          const counsellors = counsellorResults || [];
          
          db.query(
            `SELECT id, name, short_name, 
                    counselling_contact, counselling_email, counselling_website,
                    hotline, emergency_contact, support_notes
             FROM universities 
             WHERE id = ?`,
            [userUniversityId],
            (err, uniResults) => {
              if (err) {
                console.error("University fetch error:", err);
                return res.status(500).json({ msg: "Failed to fetch support resources" });
              }
              
              getOnlineResourcesFromDB((onlineResources) => {
                getCrisisResourcesFromDB((crisisResources) => {
                  if (!uniResults.length) {
                    return res.json({
                      hasUniversity: true,
                      universityId: userUniversityId,
                      hasCustomResources: false,
                      counsellors: counsellors,
                      resources: {
                        general: {
                          onlineResources: onlineResources,
                          crisisResources: crisisResources
                        }
                      },
                      message: "University found but no specific resources available yet."
                    });
                  }
                  
                  const university = uniResults[0];
                  const hasCustomResources = !!(university.counselling_contact || 
                                                 university.counselling_email || 
                                                 university.counselling_website);
                  
                  res.json({
                    hasUniversity: true,
                    universityId: university.id,
                    universityName: university.name,
                    universityShortName: university.short_name,
                    hasCustomResources: hasCustomResources,
                    counsellors: counsellors,
                    resources: {
                      university: {
                        counselling_contact: university.counselling_contact,
                        counselling_email: university.counselling_email,
                        counselling_website: university.counselling_website,
                        hotline: university.hotline,
                        emergency_contact: university.emergency_contact,
                        support_notes: university.support_notes
                      },
                      general: {
                        onlineResources: onlineResources,
                        crisisResources: crisisResources
                      }
                    }
                  });
                });
              });
            }
          );
        }
      );
    }
  );
});

// ====================
// ISSUE REPORTING
// ====================

// POST /api/support/report-issue
router.post("/report-issue", verifyToken, (req, res) => {
  const { user_id, subject, message, type } = req.body;
  
  if (req.user.id !== user_id) {
    return res.status(403).json({ msg: "Unauthorized" });
  }

  // Create table if not exists
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS issue_reports (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'bug',
      status ENUM('pending', 'resolved') DEFAULT 'pending',
      admin_response TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  
  db.query(createTableQuery, (err) => {
    if (err) {
      console.error("Create table error:", err);
    }
    
    db.query(
      `INSERT INTO issue_reports (user_id, subject, message, type, status, created_at) 
       VALUES (?, ?, ?, ?, 'pending', NOW())`,
      [user_id, subject, message, type],
      async (err, result) => {
        if (err) {
          console.error("Report issue error:", err);
          return res.status(500).json({ msg: "Failed to submit report" });
        }
        
        await sendAdminNotification(
          'report_issue',
          'New Issue Report',
          `User reported an issue: ${subject}`,
          '/admin/issues',
          result.insertId
        );
        
        res.json({ msg: "Report submitted successfully", id: result.insertId });
      }
    );
  });
});

module.exports = router;