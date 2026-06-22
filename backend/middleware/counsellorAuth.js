// backend/middleware/counsellorAuth.js
const jwt = require("jsonwebtoken");
const db = require("../db");

const JWT_SECRET = "lumora_secret_key";

// Verify counsellor role (counsellor or admin)
const verifyCounsellor = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    
    db.query(
      "SELECT role, is_active FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) {
          return res.status(500).json({ msg: "Server error" });
        }
        if (!results.length) {
          return res.status(404).json({ msg: "User not found" });
        }
        if (!results[0].is_active) {
          return res.status(403).json({ msg: "Account is deactivated" });
        }
        if (results[0].role !== 'counsellor' && results[0].role !== 'admin') {
          return res.status(403).json({ msg: "Access denied. Counsellors only." });
        }
        
        req.user = decoded;
        next();
      }
    );
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = { verifyCounsellor };