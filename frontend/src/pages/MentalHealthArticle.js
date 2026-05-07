// pages/MentalHealthArticle.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function MentalHealthArticle() {
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
          <h1 style={styles.heroTitle}>Understanding Mental Health 🧠</h1>
          <p style={styles.heroSubtitle}>
            Your mind matters. Learn, grow, and take steps toward emotional well‑being.
          </p>
        </div>

        <div style={styles.articlesGrid}>
          {/* Article 1 */}
          <div style={styles.articleCard}>
            <div style={styles.articleIcon}>😔</div>
            <h3 style={styles.articleTitle}>What is Mental Health?</h3>
            <p style={styles.articleText}>
              Mental health includes our emotional, psychological, and social well‑being. 
              It affects how we think, feel, and act. It also helps determine how we handle 
              stress, relate to others, and make choices.
            </p>
          </div>

          {/* Article 2 */}
          <div style={styles.articleCard}>
            <div style={styles.articleIcon}>😰</div>
            <h3 style={styles.articleTitle}>Understanding Anxiety</h3>
            <p style={styles.articleText}>
              Anxiety is more than just feeling stressed or worried. While stress is a 
              response to a threat or pressure, anxiety is a persistent feeling of fear 
              or dread. It can interfere with daily activities and is treatable.
            </p>
          </div>

          {/* Article 3 */}
          <div style={styles.articleCard}>
            <div style={styles.articleIcon}>😢</div>
            <h3 style={styles.articleTitle}>Depression: More Than Sadness</h3>
            <p style={styles.articleText}>
              Depression is a common but serious mood disorder. It causes severe symptoms 
              that affect how you feel, think, and handle daily activities. It is not a 
              weakness — it is treatable with professional help.
            </p>
          </div>

          {/* Article 4 */}
          <div style={styles.articleCard}>
            <div style={styles.articleIcon}>🧘</div>
            <h3 style={styles.articleTitle}>Self‑Care Strategies</h3>
            <p style={styles.articleText}>
              Self‑care means taking time to do things that help you live well and improve 
              both your physical and mental health. This can include exercise, healthy 
              eating, sleep hygiene, and setting boundaries.
            </p>
          </div>

          {/* Article 5 */}
          <div style={styles.articleCard}>
            <div style={styles.articleIcon}>💬</div>
            <h3 style={styles.articleTitle}>When to Seek Help</h3>
            <p style={styles.articleText}>
              If you feel overwhelmed, persistently sad, anxious, or have thoughts of 
              harming yourself, it’s important to reach out. Talk to a trusted person, 
              a counselor, or call a mental health helpline.
            </p>
          </div>

          {/* Article 6 */}
          <div style={styles.articleCard}>
            <div style={styles.articleIcon}>🌿</div>
            <h3 style={styles.articleTitle}>Breaking the Stigma</h3>
            <p style={styles.articleText}>
              Mental health stigma often prevents people from seeking help. By speaking 
              openly and compassionately, we can create a safe environment where everyone 
              feels supported to prioritise their mental well‑being.
            </p>
          </div>
        </div>

        {/* TIPS SECTION */}
        <div style={styles.tipsSection}>
          <h2 style={styles.tipsTitle}>Daily Mental Health Tips 💡</h2>
          <div style={styles.tipsGrid}>
            <div style={styles.tipCard}>🌞 Start your day with gratitude</div>
            <div style={styles.tipCard}>🚶 Take short breaks to walk outside</div>
            <div style={styles.tipCard}>📵 Limit screen time before bed</div>
            <div style={styles.tipCard}>💧 Stay hydrated and eat regular meals</div>
            <div style={styles.tipCard}>😴 Prioritise 7‑9 hours of sleep</div>
            <div style={styles.tipCard}>🤝 Connect with a friend or loved one</div>
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
    marginBottom: "48px",
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
    maxWidth: "600px",
    margin: "0 auto",
  },

  articlesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "24px",
    marginBottom: "48px",
  },

  articleCard: {
    background: "white",
    padding: "28px",
    borderRadius: "20px",
    border: "1px solid rgba(203,213,225,0.3)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.2s",
  },

  articleIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },

  articleTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "12px",
  },

  articleText: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#6b7280",
  },

  tipsSection: {
    background: "white",
    padding: "32px",
    borderRadius: "20px",
    border: "1px solid rgba(203,213,225,0.3)",
    textAlign: "center",
  },

  tipsTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "24px",
  },

  tipsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "16px",
  },

  tipCard: {
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "12px",
    fontSize: "14px",
    color: "#4b5563",
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

export default MentalHealthArticle;