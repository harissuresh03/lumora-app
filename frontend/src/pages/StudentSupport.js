// pages/StudentSupport.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function StudentSupport() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        setUserName(res.data.name.split(" ")[0]);
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };
    fetchUserProfile();
  }, [user_id]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const openExternalLink = () => {
    window.open("https://ucreds.utem.edu.my/support/student/", "_blank");
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND DECORATION */}
      <div style={styles.bgDecoration}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
        <div style={styles.blob3}></div>
      </div>

      {/* HAMBURGER MENU BUTTON */}
      <div style={styles.hamburgerBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span style={styles.hamburgerIcon}>☰</span>
      </div>

      {/* SIDEBAR */}
      <div style={{...styles.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarLogo}>✨ Lumora</span>
          <button style={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav style={styles.sidebarNav}>
          <button style={styles.sidebarItem} onClick={() => navigate("/dashboard")}>
            <span>📊</span> Dashboard
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/journal")}>
            <span>📓</span> Journal
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/mental-health")}>
            <span>🧠</span> Mental Health
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/student-support")}>
            <span>🎓</span> Student Support
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/profile")}>
            <span>👤</span> Profile
          </button>
          <button style={styles.sidebarItem} onClick={() => alert("Settings coming soon!")}>
            <span>⚙️</span> Settings
          </button>
          <button style={styles.sidebarItemLogout} onClick={logout}>
            <span>🚪</span> Logout
          </button>
        </nav>
      </div>

      {/* OVERLAY FOR SIDEBAR */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)}></div>
      )}

      <div style={styles.contentWrapper}>
        {/* TOP BAR */}
        <div style={styles.topBar}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>✨</span>
            <span style={styles.logoText}>Lumora</span>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.logoutBtn} onClick={logout}>
              <span>🚪</span> Exit
            </button>
          </div>
        </div>

        {/* BACK TO DASHBOARD LINK */}
        <button onClick={() => navigate("/dashboard")} style={styles.backToDashboard}>
          ← Back to Dashboard
        </button>

        {/* MAIN CONTENT */}
        <div style={styles.heroSection}>
          <h1 style={styles.heroTitle}>Student Support Resources 🎓</h1>
          <p style={styles.heroSubtitle}>
            Official resources from Universiti Teknikal Malaysia Melaka (UTeM)
          </p>
        </div>

        {/* EXTERNAL LINK BUTTON */}
        <div style={styles.externalLinkCard}>
          <div style={styles.externalLinkContent}>
            <span style={styles.externalIcon}>🔗</span>
            <div>
              <h3 style={styles.externalTitle}>Visit UTeM Student Support Portal</h3>
              <p style={styles.externalText}>
                Access counseling services, orientation materials, online facilities, and more
              </p>
            </div>
          </div>
          <button style={styles.externalButton} onClick={openExternalLink}>
            Open in New Tab → 
          </button>
        </div>

        {/* DISCLAIMER */}
        <div style={styles.disclaimer}>
          <span style={styles.disclaimerIcon}>ℹ️</span>
          <p style={styles.disclaimerText}>
            External resources are provided for your convenience. Please check with UTeM for the most up‑to‑date information and availability of services.
          </p>
        </div>

        {/* RESOURCES OVERVIEW */}
        <div style={styles.resourcesSection}>
          <h2 style={styles.resourcesTitle}>What You'll Find There</h2>
          <div style={styles.resourcesGrid}>
            <div style={styles.resourceCard}>
              <div style={styles.resourceIcon}>💬</div>
              <h4>eCounseling</h4>
              <p>Counseling procedures, career exploration, crisis prevention, tech & social media impact</p>
            </div>
            <div style={styles.resourceCard}>
              <div style={styles.resourceIcon}>📚</div>
              <h4>eOrientation</h4>
              <p>ODL handbook, academic regulations, health centre, eLibrary resources</p>
            </div>
            <div style={styles.resourceCard}>
              <div style={styles.resourceIcon}>💻</div>
              <h4>Online Facilities</h4>
              <p>Welfare Virtual Library, VPN access, and other digital support tools</p>
            </div>
          </div>
        </div>

        {/* CONTACT & EMERGENCY SECTION */}
        <div style={styles.emergencySection}>
          <h2 style={styles.emergencyTitle}>Need Immediate Help?</h2>
          <p style={styles.emergencyText}>
            If you're experiencing a mental health crisis, please reach out to:
          </p>
          <div style={styles.emergencyContacts}>
            <div style={styles.contactCard}>
              <span>📞</span>
              <div>
                <strong>Befrienders KL</strong>
                <p>03-7627 2929 (24 hours)</p>
              </div>
            </div>
            <div style={styles.contactCard}>
              <span>📞</span>
              <div>
                <strong>Talian Kasih</strong>
                <p>15999 (24 hours)</p>
              </div>
            </div>
            <div style={styles.contactCard}>
              <span>📞</span>
              <div>
                <strong>UTeM Counseling Unit</strong>
                <p>06-270 1248</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    background: "#f0f9ff",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },

  contentWrapper: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 32px",
    position: "relative",
    zIndex: 2,
  },

  bgDecoration: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },

  blob1: {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.1), rgba(139,92,246,0.05))",
    filter: "blur(60px)",
  },

  blob2: {
    position: "absolute",
    bottom: "-10%",
    left: "-5%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.08), rgba(5,150,105,0.03))",
    filter: "blur(50px)",
  },

  blob3: {
    position: "absolute",
    top: "40%",
    left: "30%",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.08), rgba(245,158,11,0.03))",
    filter: "blur(50px)",
  },

  hamburgerBtn: {
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 100,
    background: "white",
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
  },

  hamburgerIcon: {
    fontSize: "24px",
    color: "#667eea",
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "280px",
    height: "100vh",
    background: "white",
    boxShadow: "2px 0 20px rgba(0,0,0,0.1)",
    zIndex: 1000,
    transition: "transform 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },

  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 20px",
    borderBottom: "1px solid #e5e7eb",
  },

  sidebarLogo: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  closeSidebar: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#9ca3af",
  },

  sidebarNav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "20px",
  },

  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#4b5563",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
    textAlign: "left",
  },

  sidebarItemLogout: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "none",
    border: "1px solid #fee2e2",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#ef4444",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
    textAlign: "left",
    marginTop: "auto",
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    position: "relative",
    zIndex: 2,
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "40px",
  },

  logoIcon: {
    fontSize: "28px",
  },

  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  logoutBtn: {
    background: "white",
    color: "#ef4444",
    border: "1px solid #fee2e2",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  backToDashboard: {
    background: "white",
    border: "1px solid #e5e7eb",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#4b5563",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "24px",
    fontFamily: "inherit",
  },

  heroSection: {
    textAlign: "center",
    marginBottom: "40px",
  },

  heroTitle: {
    fontSize: "42px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "16px",
  },

  heroSubtitle: {
    fontSize: "18px",
    color: "#6b7280",
  },

  externalLinkCard: {
    background: "white",
    padding: "32px",
    borderRadius: "20px",
    border: "1px solid rgba(203,213,225,0.3)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "24px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },

  externalLinkContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: 1,
  },

  externalIcon: {
    fontSize: "40px",
  },

  externalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },

  externalText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },

  externalButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },

  disclaimer: {
    background: "#fef3c7",
    padding: "16px 20px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
    borderLeft: "4px solid #f59e0b",
  },

  disclaimerIcon: {
    fontSize: "20px",
  },

  disclaimerText: {
    margin: 0,
    fontSize: "13px",
    color: "#92400e",
    lineHeight: "1.5",
  },

  resourcesSection: {
    marginBottom: "48px",
  },

  resourcesTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "24px",
    textAlign: "center",
  },

  resourcesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },

  resourceCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    textAlign: "center",
    transition: "all 0.2s",
  },

  resourceIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },

  emergencySection: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "40px",
    borderRadius: "24px",
    color: "white",
    textAlign: "center",
  },

  emergencyTitle: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "16px",
  },

  emergencyText: {
    fontSize: "14px",
    marginBottom: "24px",
    opacity: 0.95,
  },

  emergencyContacts: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  },

  contactCard: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    textAlign: "left",
    fontSize: "14px",
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default StudentSupport;