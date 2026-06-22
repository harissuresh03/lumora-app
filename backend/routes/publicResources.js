// backend/routes/publicResources.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// ============================================
// PUBLIC ENDPOINTS (No authentication required)
// ============================================

// GET crisis resources - PUBLIC
router.get("/crisis-resources", (req, res) => {
  db.query(
    "SELECT id, name, number, description, hours, display_order FROM support_resources WHERE type = 'crisis_resource' AND is_active = 1 ORDER BY display_order",
    (err, results) => {
      if (err) {
        console.error("Fetch crisis resources error:", err);
        return res.status(500).json({ msg: "Failed to fetch resources" });
      }
      console.log("Crisis resources found:", results.length);
      res.json(results);
    }
  );
});

// GET online resources - PUBLIC
router.get("/online-resources", (req, res) => {
  db.query(
    "SELECT id, name, url, description, display_order FROM support_resources WHERE type = 'online_resource' AND is_active = 1 ORDER BY display_order",
    (err, results) => {
      if (err) {
        console.error("Fetch online resources error:", err);
        return res.status(500).json({ msg: "Failed to fetch resources" });
      }
      console.log("Online resources found:", results.length);
      res.json(results);
    }
  );
});

module.exports = router;