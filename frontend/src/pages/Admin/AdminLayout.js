// frontend/src/pages/Admin/AdminLayout.js
import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Flag,
  BookOpen,
  AlertCircle,
  LogOut,
  Menu,
  X,
  Settings as SettingsIcon,
  UserPlus,
  RefreshCw
} from "lucide-react";
import api from "../../utils/api";
import AdminNotificationBell from "../components/AdminNotificationBell";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { requireAdmin } from "../../utils/roleAuth";

function AdminLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("user_role") || "admin";

  // Format user ID with role prefix
  const getFormattedUserId = () => {
    if (!userId) return "";
    const prefix = userRole === 'student' ? 'S' : userRole === 'counsellor' ? 'C' : userRole === 'parent' ? 'P' : userRole === 'admin' ? 'A' : 'U';
    return `${prefix}${String(userId).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!requireAdmin(navigate)) {
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const res = await api.get(`/profile/${userId}`);
        setAdminName(res.data.nickname || res.data.name);
      } catch (err) {
        console.error("Fetch admin error:", err);
      }
    };
    fetchAdmin();
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
    showSuccessToast("Logged out successfully");
  };

  const refreshPage = async () => {
    setRefreshing(true);
    try {
      window.location.reload();
    } catch (err) {
      console.error("Refresh error:", err);
      showErrorToast("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'A';
  };

  const menuItems = [
    { path: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { path: "/admin/users", icon: <Users size={20} />, label: "User Management" },
    { path: "/admin/reports", icon: <Flag size={20} />, label: "Reports" },
    { path: "/admin/resources", icon: <BookOpen size={20} />, label: "Resources" },
    { path: "/admin/issues", icon: <AlertCircle size={20} />, label: "Issues" },
    { path: "/admin/counsellor-requests", icon: <UserPlus size={20} />, label: "Counsellor Requests" },
    { path: "/admin/settings", icon: <SettingsIcon size={20} />, label: "Settings" },
  ];

  return (
    <div className="admin-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <motion.aside
        initial={{ width: sidebarOpen ? 280 : 80 }}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur-lg)',
          borderRight: '1px solid var(--border-glass)',
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto',
          zIndex: 100
        }}
      >
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)' }}>
          {sidebarOpen && (
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: '20px', fontWeight: 700, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Panel
            </motion.h2>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'all 0.2s',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                position: 'relative'
              })}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid var(--border-light)', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              width: '100%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              color: '#ef4444',
              cursor: 'pointer',
              justifyContent: sidebarOpen ? 'flex-start' : 'center'
            }}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main style={{ flex: 1, marginLeft: sidebarOpen ? 280 : 80, transition: 'margin-left 0.3s', padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Manage users, reports, and system resources</p>
          </div>
          
          {/* Admin User Pill with Notification Bell */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '4px 8px 4px 4px',
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '40px',
            border: '1px solid var(--border-glass)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'visible',
            position: 'relative',
            zIndex: 100
          }}>
            {/* ✅ Admin Notification Bell */}
            <AdminNotificationBell userId={parseInt(localStorage.getItem("user_id"))} />

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />

            {/* Refresh Button */}
            <button
              onClick={refreshPage}
              disabled={refreshing}
              style={{
                background: 'none',
                border: 'none',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                opacity: refreshing ? 0.5 : 1,
                transition: 'all 0.2s',
                width: '32px',
                height: '32px'
              }}
              onMouseEnter={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--accent-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Refresh Page"
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            </button>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />

            {/* User Info */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '2px 12px 2px 8px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {getInitial(adminName)}
              </div>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap'
              }}>
                {adminName || "Admin"}
                {userId && (
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 400, 
                    color: 'var(--text-muted)',
                    marginLeft: '4px'
                  }}>
                    ({getFormattedUserId()})
                  </span>
                )}
              </span>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />

            {/* Logout Button */}
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#ef4444',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                width: '32px',
                height: '32px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;