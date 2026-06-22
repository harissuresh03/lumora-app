// frontend/src/pages/Counsellor/CounsellorLayout.js
import React, { useState, useEffect } from "react";
import { useNavigate, NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Calendar,
  AlertTriangle,
  BarChart3,
  LogOut,
  Menu,
  X,
  Activity,
  Settings as SettingsIcon,
  RefreshCw
} from "lucide-react";
import api from "../../utils/api";
import NotificationBell from "../components/NotificationBell";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { requireCounsellor } from "../../utils/roleAuth";

function CounsellorLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [counsellorName, setCounsellorName] = useState("");
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const counsellorId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!requireCounsellor(navigate)) {
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCounsellor = async () => {
      try {
        const res = await api.get(`/profile/${counsellorId}`);
        setCounsellorName(res.data.nickname || res.data.name);
        
        const statsRes = await api.get(`/counsellor/stats/${counsellorId}`);
        setPendingAlerts(statsRes.data.pendingAlerts || 0);
        setUnreadMessages(statsRes.data.unreadMessages || 0);
      } catch (err) {
        console.error("Fetch counsellor error:", err);
      }
    };
    fetchCounsellor();
    
    const interval = setInterval(() => {
      api.get(`/counsellor/stats/${counsellorId}`)
        .then(res => {
          setPendingAlerts(res.data.pendingAlerts || 0);
          setUnreadMessages(res.data.unreadMessages || 0);
        })
        .catch(err => console.error("Refresh stats error:", err));
    }, 30000);
    
    return () => clearInterval(interval);
  }, [counsellorId]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
    showSuccessToast("Logged out successfully");
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Refresh stats
      const statsRes = await api.get(`/counsellor/stats/${counsellorId}`);
      setPendingAlerts(statsRes.data.pendingAlerts || 0);
      setUnreadMessages(statsRes.data.unreadMessages || 0);
      
      // ✅ Force refresh the current page by reloading the outlet
      // This will trigger a re-render of the child component
      window.dispatchEvent(new Event('refresh'));
      
      showSuccessToast("Dashboard refreshed! ✅");
    } catch (err) {
      console.error("Refresh error:", err);
      showErrorToast("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const menuItems = [
    { path: "/counsellor", icon: <LayoutDashboard size={20} />, label: "Dashboard", badge: 0 },
    { path: "/counsellor/students", icon: <Users size={20} />, label: "Students", badge: 0 },
    { path: "/counsellor/messages", icon: <MessageCircle size={20} />, label: "Messages", badge: unreadMessages, badgeColor: "#3b82f6" },
    { path: "/counsellor/appointments", icon: <Calendar size={20} />, label: "Appointments", badge: 0 },
    { path: "/counsellor/alerts", icon: <AlertTriangle size={20} />, label: "Alerts", badge: pendingAlerts, badgeColor: "#ef4444" },
    { path: "/counsellor/stress-levels", icon: <Activity size={20} />, label: "Stress Levels", badge: 0 },
    { path: "/counsellor/settings", icon: <SettingsIcon size={20} />, label: "Settings", badge: 0 },
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
              Counsellor Panel
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
              end={item.path === "/counsellor"}
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
              {item.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: item.badgeColor || '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '20px',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '14px'
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Counsellor Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Support and monitor student well-being</p>
          </div>
          
          {/* Pill container - Student Style */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px 6px 6px',
              background: 'var(--card-bg-glass)',
              backdropFilter: 'var(--glass-blur-lg)',
              borderRadius: '999px',
              border: '1px solid var(--border-glass)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'visible',  // ✅ ADD THIS
              position: 'relative', // ✅ ADD THIS
              zIndex: 100  // ✅ ADD THIS
            }}
          >
            {/* Notification Bell */}
            <NotificationBell userId={parseInt(counsellorId)} />

            {/* Avatar + Name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 6px'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {counsellorName?.charAt(0)?.toUpperCase() || 'C'}
              </div>

              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap'
                }}
              >
                {counsellorName || 'Counsellor'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={refreshing}
              title="Refresh Dashboard"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                opacity: refreshing ? 0.5 : 1,
                transition: 'all 0.2s ease'
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
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'spinning' : ''}
              />
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'rgba(239,68,68,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
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

export default CounsellorLayout;