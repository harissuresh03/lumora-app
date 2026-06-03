// backend/routes/support.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authmiddleware");

/**
 * GET /api/support/:user_id
 * Get support resources for the user's university
 */
router.get("/:user_id", verifyToken, (req, res) => {
  const userId = parseInt(req.params.user_id);
  
  console.log("=== SUPPORT API CALLED ===");
  console.log("User ID:", userId);
  
  // Verify user ownership
  if (req.user.id !== userId) {
    console.log("Unauthorized: user mismatch");
    return res.status(403).json({ msg: "Unauthorized" });
  }
  
  // Get user's university_id from their profile (removed 'university' column)
  db.query(
    "SELECT university_id FROM users WHERE id = ?",  // ← Removed 'university' column
    [userId],
    (err, userResults) => {
      if (err) {
        console.error("User fetch error:", err);
        return res.status(500).json({ msg: "Failed to fetch user data" });
      }
      
      if (!userResults.length) {
        console.log("User not found");
        return res.status(404).json({ msg: "User not found" });
      }
      
      const userUniversityId = userResults[0].university_id;
      console.log("User university_id:", userUniversityId);
      
      if (!userUniversityId) {
        console.log("No university selected for user");
        return res.json({
          hasUniversity: false,
          universityName: null,
          resources: getGeneralResources(),
          message: "No university selected. Please update your profile to see university-specific resources."
        });
      }
      
      // Get university details with support resources
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
          
          console.log("University query results:", uniResults);
          
          if (!uniResults.length) {
            console.log("University not found in database");
            return res.json({
              hasUniversity: true,
              universityId: userUniversityId,
              hasCustomResources: false,
              resources: getGeneralResources(),
              message: "University found but no specific resources available yet."
            });
          }
          
          const university = uniResults[0];
          console.log("University data:", university);
          
          // Check if university has custom resources
          const hasCustomResources = !!(university.counselling_contact || 
                                         university.counselling_email || 
                                         university.counselling_website);
          
          console.log("Has custom resources:", hasCustomResources);
          
          res.json({
            hasUniversity: true,
            universityId: university.id,
            universityName: university.name,
            universityShortName: university.short_name,
            hasCustomResources: hasCustomResources,
            resources: {
              university: {
                counselling_contact: university.counselling_contact,
                counselling_email: university.counselling_email,
                counselling_website: university.counselling_website,
                hotline: university.hotline,
                emergency_contact: university.emergency_contact,
                support_notes: university.support_notes
              },
              general: getGeneralResources()
            }
          });
        }
      );
    }
  );
});

/**
 * General mental health resources for all students
 */
function getGeneralResources() {
  return {
    nationalHotlines: [
      { name: "Talian Kasih (24/7)", number: "15999", description: "General crisis support helpline" },
      { name: "Talian HEAL", number: "15555", hours: "8.30 am – 11.59 pm", description: "Mental health crisis helpline" },
      { name: "Befrienders KL (24/7)", number: "+603-7627 2929", description: "Emotional support and crisis intervention" },
      { name: "Mental Health Psychosocial Support", number: "03-2935 9935", description: "MHPSS helpline" }
    ],
    emergency: {
      police: "999",
      ambulance: "999",
      fire: "999"
    },
    onlineResources: [
      { name: "Mental Health Malaysia", url: "https://mentalhealthmalaysia.my/", description: "Mental health resources and information" },
      { name: "Relate Malaysia", url: "https://relate.com.my/", description: "Online counselling services" },
      { name: "The Mind", url: "https://themind.org.my/", description: "Mental health advocacy and support" }
    ],
    tips: [
      "Reach out to someone you trust",
      "Practice self-care and rest",
      "Seek professional help when needed - it's a sign of strength",
      "You are not alone in this journey"
    ]
  };
}

module.exports = router;