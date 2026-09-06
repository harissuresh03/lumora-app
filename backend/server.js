
// backend/server.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const checkMaintenance = require("./middleware/checkMaintenance");

const app = express();

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());

// Apply maintenance check to all routes
// (except routes handled by the middleware itself)
app.use(checkMaintenance);

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/auth");
const moodRoutes = require("./routes/mood");
const journalRoutes = require("./routes/journal");
const profileRoutes = require("./routes/profile");
const sleepRoutes = require("./routes/sleep");
const aiRoutes = require("./routes/ai");
const universityRoutes = require("./routes/universities");
const supportRoutes = require("./routes/support");
const peerSupportRoutes = require("./routes/peerSupport");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const assessmentRoutes = require("./routes/assessments");
const analyticsRoutes = require("./routes/analytics");
const educationalRoutes = require("./routes/educational");
const counsellorRoutes = require("./routes/counsellor");
const counsellorRequestsRoutes = require("./routes/counsellorRequests");
const adminNotificationRoutes = require("./routes/adminNotifications");
const aiModerationRoutes = require("./routes/aiModeration");
const studentExportRoutes = require("./routes/studentExport");
const counsellorExportRoutes = require("./routes/counsellorExport");
const publicResourcesRoutes = require("./routes/publicResources");
const deadlinesRoutes = require("./routes/deadlines");
const stressForecastRoutes = require("./routes/stressForecast");
const recommendationsRoutes = require("./routes/recommendations");
const gamificationRoutes = require("./routes/gamification");
const parentRoutes = require("./routes/parent");
const verificationRoutes = require("./routes/verification");

// ==========================================
// API ROUTES
// ==========================================

app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/universities", universityRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/peer-support", peerSupportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/educational", educationalRoutes);
app.use("/api/counsellor", counsellorRoutes);
app.use("/api/counsellor-requests", counsellorRequestsRoutes);
app.use("/api/admin-notifications", adminNotificationRoutes);
app.use("/api/ai", aiModerationRoutes);
app.use("/api/student-export", studentExportRoutes);
app.use("/api/counsellor-export", counsellorExportRoutes);
app.use("/api/public", publicResourcesRoutes);
app.use("/api/deadlines", deadlinesRoutes);
app.use("/api/stress-forecast", stressForecastRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/parent", parentRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Lumora backend is running 🌿"
  });
});

// ==========================================
// ROOT ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.send("Lumora API running 🌿");
});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Lumora server running on port ${PORT} 🌿`);
});

