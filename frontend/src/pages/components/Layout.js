// frontend/src/pages/components/Layout.js
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import CrisisModal from "./CrisisModal";
import NotificationBell from "./NotificationBell";
import { Shield, Heart, RefreshCw } from "lucide-react";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "./ToastNotification";

function Layout({ children, customMenuItems }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisHotlines, setCrisisHotlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = localStorage.getItem("user_id");
  const userNickname = localStorage.getItem("user_nickname") || "User";

  useEffect(() => {
    fetchCrisisResources();
  }, []);

  const fetchCrisisResources = async () => {
    try {
      const res = await api.get("/public/crisis-resources");
      setCrisisHotlines(res.data.slice(0, 3));
    } catch (err) {
      console.error("Fetch crisis resources error:", err);
      try {
        const fallbackRes = await api.get(`/public/crisis-resources`);
        if (fallbackRes.data) {
          setCrisisHotlines(fallbackRes.data.slice(0, 3));
        }
      } catch (fallbackErr) {
        console.error("Fallback failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
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

  const formatPhoneNumber = (number) => {
    return number.replace(/[^0-9+]/g, '');
  };

  const getInitial = (name) => {
    return name?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <div className="app-container">
      {/* BACKGROUND DECORATION */}
      <div className="bg-decoration">
        <div className="blob1"></div>
        <div className="blob2"></div>
        <div className="blob3"></div>
      </div>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} customMenuItems={customMenuItems} />

      <div className="content-wrapper">
        {/* TOP BAR */}
        <motion.div 
          className="top-bar"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: '24px' }}
        >
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
            zIndex: 100,
            marginLeft: 'auto'
          }}>
            {/* Notification Bell */}
            <NotificationBell userId={parseInt(userId)} />

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />

            <button
              onClick={refreshData}
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
                {getInitial(userNickname)}
              </div>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 500, 
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap'
              }}>
                {userNickname || "User"}
              </span>
            </div>

            <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Page Content */}
        {children}
        
        {/* Crisis Support Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            textAlign: "center",
            padding: "20px",
            fontSize: "13px",
            color: "var(--text-muted)",
            borderTop: "1px solid var(--border-light)",
            marginTop: "32px"
          }}
        >
          <Shield size={16} style={{ display: "inline", marginRight: "6px", color: "#ef4444" }} />
          <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>
            {loading ? "Loading crisis resources..." : "If you're in crisis, help is available 24/7:"}
          </span>
          {!loading && crisisHotlines.length > 0 && (
            <span style={{ marginLeft: "8px" }}>
              {crisisHotlines.map((hotline, index) => (
                <span key={hotline.id}>
                  <a
                    href={`tel:${formatPhoneNumber(hotline.number)}`}
                    style={{
                      color: "var(--accent-primary)",
                      fontWeight: 600,
                      textDecoration: "none"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                  >
                    {hotline.name} ({hotline.number})
                  </a>
                  {index < crisisHotlines.length - 1 && (
                    <span style={{ margin: "0 8px", color: "var(--border-light)" }}>|</span>
                  )}
                </span>
              ))}
            </span>
          )}
        </motion.div>
      </div>

      {/* Floating "Need Help?" Button */}
      <motion.button
        onClick={() => setShowCrisisModal(true)}
        className="crisis-floating-btn"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: "90px",
          right: "24px",
          zIndex: 150,
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          border: "none",
          borderRadius: "50%",
          width: "64px",
          height: "64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          cursor: "pointer",
          boxShadow: "0 8px 30px rgba(239, 68, 68, 0.4)",
          transition: "all 0.3s ease",
          padding: "0"
        }}
      >
        <Heart size={22} style={{ marginBottom: "2px" }} />
        <span style={{ fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Help
        </span>
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute",
            top: "-4px",
            right: "-4px",
            width: "16px",
            height: "16px",
            background: "#ef4444",
            borderRadius: "50%",
            border: "2px solid white"
          }}
        />
      </motion.button>

      {/* Crisis Modal */}
      <AnimatePresence>
        {showCrisisModal && <CrisisModal onClose={() => setShowCrisisModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default Layout;