const jwt = require("jsonwebtoken");

const JWT_SECRET = "lumora_secret_key";

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = verifyToken;