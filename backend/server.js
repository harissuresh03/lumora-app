require('dotenv').config();
// server.js
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
const authRoutes = require("./routes/auth");
const moodRoutes = require("./routes/mood");
const journalRoutes = require("./routes/journal");
const profileRoutes = require("./routes/profile");
const sleepRoutes = require("./routes/sleep");
const aiRoutes = require("./routes/ai");
const universityRoutes = require("./routes/universities");
const supportRoutes = require("./routes/support");

app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/support", supportRoutes);

app.get("/", (req, res) => {
  res.send("API running 🌿");
});

app.listen(5000, () => {
  console.log("Server running on port 5000 🌿");
});