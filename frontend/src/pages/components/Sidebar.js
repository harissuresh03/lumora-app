// frontend/src/pages/components/Sidebar.js
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  Heart,
  TrendingUp,
  User,
  LogOut,
  Users,
  Menu,
  Settings as SettingsIcon,
  Shield
} from "lucide-react";
import { isAdmin } from "../../utils/roleAuth";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const adminUser = isAdmin();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const menuItems = [
    { path: "/dashboard", icon: <Activity size={18} />, label: "Dashboard" },
    { path: "/journal", icon: <BookOpen size={18} />, label: "Journal" },
    { path: "/mental-health", icon: <Heart size={18} />, label: "Wellness Library" },
    { path: "/peer-support", icon: <Users size={18} />, label: "Community Connect" },
    { path: "/student-support", icon: <TrendingUp size={18} />, label: "University Resources" },
    { path: "/profile", icon: <User size={18} />, label: "Profile" },
    { path: "/settings", icon: <SettingsIcon size={18} />, label: "Settings" },
  ];

  // Add admin menu item only for admin users
  if (adminUser) {
    menuItems.push({ path: "/admin", icon: <Shield size={18} />, label: "Admin Panel" });
  }

  return (
    <>
      <div className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu size={20} />
      </div>

      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">Lumora</span>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-item ${window.location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <button className="sidebar-item-logout" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {sidebarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
    </>
  );
}

export default Sidebar;