// backend/routes/test.js
const express = require("express");
const router = express.Router();

router.get("/ping", (req, res) => {
  console.log("🔥 TEST ROUTE - PING CALLED!");
  res.json({ 
    msg: "TEST ROUTE WORKING!",
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

router.get("/unread", (req, res) => {
  console.log("🔥 TEST ROUTE - UNREAD CALLED!");
  res.json([{ 
    id: 999, 
    title: "TEST NOTIFICATION", 
    message: "This is from the test route!",
    is_read: "unseen"
  }]);
});

module.exports = router;