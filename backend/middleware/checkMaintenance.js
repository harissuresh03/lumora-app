// backend/middleware/checkMaintenance.js
const db = require("../db");

const checkMaintenance = async (req, res, next) => {
  // ✅ Skip maintenance check for admin routes and login
  // Check full path OR just the route part
  const fullPath = req.path;
  const routePath = req.baseUrl + req.path;
  
  // Skip if it's admin route or login
  if (fullPath.startsWith('/admin') || 
      fullPath.startsWith('/api/admin') ||
      fullPath === '/auth/login' ||
      fullPath === '/api/auth/login' ||
      routePath.includes('/auth/login') ||
      routePath.includes('/admin')) {
    return next();
  }

  try {
    const [settings] = await db.promise().query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'maintenanceMode'"
    );
    
    const maintenanceMode = settings[0]?.setting_value === 'true';
    
    if (maintenanceMode) {
      console.log(`⛔ Maintenance mode active - blocking request to: ${req.path}`);
      return res.status(503).json({ 
        msg: "System is currently under maintenance. Please try again later.",
        maintenance: true
      });
    }
    
    next();
  } catch (error) {
    console.error("Maintenance check error:", error);
    next();
  }
};

module.exports = checkMaintenance;