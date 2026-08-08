// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./pages/components/ThemeProvider";
import { AccessibilityProvider } from "./pages/components/AccessibilityProvider";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Journal from "./pages/Journal";
import MentalHealthArticle from "./pages/MentalHealthArticle"; 
import StudentSupport from "./pages/StudentSupport";          
import PeerSupport from "./pages/PeerSupport";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";

// Parent Routes
import ParentDashboard from "./pages/Parent/ParentDashboard";
import ParentSettings from "./pages/Parent/ParentSettings";

// Admin imports
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminReports from "./pages/Admin/AdminReports";
import AdminResources from "./pages/Admin/AdminResources";
import AdminIssues from "./pages/Admin/AdminIssues";
import AdminSettings from "./pages/Admin/AdminSettings";
import AdminCounsellorRequests from "./pages/Admin/AdminCounsellorRequests";

// Counsellor imports
import CounsellorLayout from "./pages/Counsellor/CounsellorLayout";
import CounsellorDashboard from "./pages/Counsellor/CounsellorDashboard";
import CounsellorStudents from "./pages/Counsellor/CounsellorStudents";
import CounsellorStudentProfile from "./pages/Counsellor/CounsellorStudentProfile";
import CounsellorAppointments from "./pages/Counsellor/CounsellorAppointments";
import CounsellorAlerts from "./pages/Counsellor/CounsellorAlerts";
import CounsellorSettings from "./pages/Counsellor/CounsellorSettings";

// Route protection helper
const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("user_role");
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (userRole === 'counsellor') {
      return <Navigate to="/counsellor" replace />;
    }
    if (userRole === 'parent') {
      return <Navigate to="/parent/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user is parent and trying to access student pages, redirect
  if (userRole === 'parent' && !requiredRole) {
    return <Navigate to="/parent/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <Router>
          <AnimatePresence>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Student Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
              <Route path="/mental-health" element={<ProtectedRoute><MentalHealthArticle /></ProtectedRoute>} />
              <Route path="/student-support" element={<ProtectedRoute><StudentSupport /></ProtectedRoute>} />
              <Route path="/peer-support" element={<ProtectedRoute><PeerSupport /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />

              {/* Parent Routes */}
              <Route path="/parent/dashboard" element={<ProtectedRoute requiredRole="parent"><ParentDashboard /></ProtectedRoute>} />
              <Route path="/parent/settings" element={<ProtectedRoute requiredRole="parent"><ParentSettings /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="reports" element={<AdminReports />} /> 
                <Route path="resources" element={<AdminResources />} />
                <Route path="issues" element={<AdminIssues />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="counsellor-requests" element={<AdminCounsellorRequests />} />
              </Route>

              {/* Counsellor Routes */}
              <Route path="/counsellor" element={<ProtectedRoute requiredRole="counsellor"><CounsellorLayout /></ProtectedRoute>}>
                <Route index element={<CounsellorDashboard />} />
                <Route path="students" element={<CounsellorStudents />} />
                <Route path="student/:id" element={<CounsellorStudentProfile />} />
                <Route path="appointments" element={<CounsellorAppointments />} />
                <Route path="alerts" element={<CounsellorAlerts />} />
                <Route path="settings" element={<CounsellorSettings />} />
              </Route>

              {/* Catch All */}
              <Route path="*" element={
                <ProtectedRoute>
                  {(() => {
                    const role = localStorage.getItem("user_role");
                    if (role === 'admin') return <Navigate to="/admin" replace />;
                    if (role === 'counsellor') return <Navigate to="/counsellor" replace />;
                    if (role === 'parent') return <Navigate to="/parent/dashboard" replace />;
                    return <Navigate to="/dashboard" replace />;
                  })()}
                </ProtectedRoute>
              } />
            </Routes>
          </AnimatePresence>
        </Router>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;