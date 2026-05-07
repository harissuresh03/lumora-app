// pages/Journal.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function Journal() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user profile
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
    fetchEntries();
  }, []);

  const fetchEntries = () => {
    api
      .get(`/journal/${user_id}`)
      .then((res) => setEntries(res.data))
      .catch((err) => console.log(err));
  };

  const addEntry = async () => {
    if (!text.trim()) return;

    try {
      setLoading(true);
      await api.post("/journal", {
        user_id: parseInt(user_id),
        content: text,
      });

      setText("");
      fetchEntries();
    } catch (err) {
      console.log(err);
      alert("Failed to save journal entry");
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await api.delete(`/journal/${id}`);
        fetchEntries();
        setIsModalOpen(false);
      } catch (err) {
        console.log(err);
        alert("Failed to delete entry");
      }
    }
  };

  const openEntry = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get mood emoji based on entry content (simple keyword detection)
  const getMoodEmoji = (content) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes("happy") || lowerContent.includes("grateful") || lowerContent.includes("blessed"))
      return "😊";
    if (lowerContent.includes("sad") || lowerContent.includes("upset") || lowerContent.includes("cry"))
      return "😔";
    if (lowerContent.includes("angry") || lowerContent.includes("frustrated")) return "😠";
    if (lowerContent.includes("excited") || lowerContent.includes("amazing")) return "🤩";
    if (lowerContent.includes("tired") || lowerContent.includes("exhausted")) return "😴";
    if (lowerContent.includes("anxious") || lowerContent.includes("worried")) return "😰";
    if (lowerContent.includes("peaceful") || lowerContent.includes("calm")) return "😌";
    return "📝";
  };

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

        {/* HEADER */}
        <div style={styles.headerContent}>
          <div style={styles.titleSection}>
            <span style={styles.titleIcon}>📓✨</span>
            <div>
              <h1 style={styles.title}>Your Journal</h1>
              <p style={styles.subtitle}>A sacred space for your thoughts and reflections</p>
            </div>
          </div>
          <div style={styles.statsBadge}>
            <span>{entries.length}</span>
            <span>{entries.length === 1 ? "entry" : "entries"}</span>
          </div>
        </div>

        {/* Writing Section */}
        <div style={styles.writingSection}>
          <div style={styles.writingCard}>
            <div style={styles.writingHeader}>
              <span style={styles.writingIcon}>✍️</span>
              <h3 style={styles.writingTitle}>Write your thoughts</h3>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind today? Write freely, without judgment..."
              style={styles.textarea}
            />
            <button
              onClick={addEntry}
              disabled={loading || !text.trim()}
              style={styles.saveBtn}
            >
              {loading ? "Saving..." : "Save to journal →"}
            </button>
          </div>
        </div>

        {/* Entries Section */}
        <div style={styles.entriesSection}>
          <div style={styles.entriesHeader}>
            <h3 style={styles.entriesTitle}>Previous entries</h3>
            <span style={styles.entriesCount}>{entries.length} total</span>
          </div>

          {entries.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📖</div>
              <h4 style={styles.emptyTitle}>Your journal is empty</h4>
              <p style={styles.emptyText}>
                Start writing your first entry above. This is your personal space to reflect, grow, and heal.
              </p>
            </div>
          ) : (
            <div style={styles.entriesGrid}>
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  style={styles.entryCard}
                  onClick={() => openEntry(entry)}
                >
                  <div style={styles.entryHeader}>
                    <div style={styles.entryMood}>{getMoodEmoji(entry.content)}</div>
                    <div style={styles.entryDate}>
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                  <p style={styles.entryPreview}>
                    {entry.content.length > 120 
                      ? entry.content.substring(0, 120) + "..." 
                      : entry.content}
                  </p>
                  <div style={styles.entryFooter}>
                    <span style={styles.readMore}>Read more →</span>
                    <span style={styles.entryTime}>
                      {new Date(entry.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for viewing full entry */}
      {isModalOpen && selectedEntry && (
        <div style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalDate}>
                <span>{new Date(selectedEntry.created_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
                <span style={styles.modalTime}>
                  at {new Date(selectedEntry.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <button style={styles.modalClose} onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <div style={styles.modalContent}>
              <p>{selectedEntry.content}</p>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.deleteBtn} onClick={() => deleteEntry(selectedEntry.id)}>
                Delete entry
              </button>
            </div>
          </div>
        </div>
      )}
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

  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "32px",
  },

  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  titleIcon: {
    fontSize: "48px",
  },

  title: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1f2937",
    margin: 0,
    letterSpacing: "-0.5px",
  },

  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "8px 0 0 0",
  },

  statsBadge: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    padding: "12px 24px",
    borderRadius: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(102,126,234,0.3)",
  },

  writingSection: {
    marginBottom: "48px",
  },

  writingCard: {
    background: "white",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
    border: "1px solid rgba(203,213,225,0.3)",
  },

  writingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },

  writingIcon: {
    fontSize: "28px",
  },

  writingTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },

  textarea: {
    width: "100%",
    minHeight: "180px",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: "15px",
    lineHeight: "1.6",
    resize: "vertical",
    fontFamily: "inherit",
    transition: "all 0.2s",
    backgroundColor: "#fafbfc",
  },

  saveBtn: {
    marginTop: "20px",
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "auto",
    minWidth: "160px",
  },

  entriesSection: {
    marginTop: "20px",
  },

  entriesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "24px",
  },

  entriesTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },

  entriesCount: {
    fontSize: "13px",
    color: "#9ca3af",
  },

  entriesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "24px",
  },

  entryCard: {
    background: "white",
    borderRadius: "20px",
    padding: "20px",
    cursor: "pointer",
    transition: "all 0.3s",
    border: "1px solid #f0f0f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },

  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  entryMood: {
    fontSize: "24px",
  },

  entryDate: {
    fontSize: "12px",
    color: "#9ca3af",
    fontWeight: "500",
  },

  entryPreview: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#4b5563",
    margin: "12px 0",
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },

  entryFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #f0f0f0",
  },

  readMore: {
    fontSize: "12px",
    color: "#667eea",
    fontWeight: "500",
  },

  entryTime: {
    fontSize: "11px",
    color: "#d1d5db",
  },

  emptyState: {
    textAlign: "center",
    padding: "60px 40px",
    background: "white",
    borderRadius: "24px",
    border: "2px dashed #e5e7eb",
  },

  emptyIcon: {
    fontSize: "64px",
    marginBottom: "16px",
  },

  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#4b5563",
    margin: "0 0 8px 0",
  },

  emptyText: {
    fontSize: "14px",
    color: "#9ca3af",
    margin: 0,
    maxWidth: "400px",
    marginInline: "auto",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  modal: {
    background: "white",
    borderRadius: "24px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
    animation: "slideUp 0.3s ease",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px 28px",
    borderBottom: "1px solid #f0f0f0",
  },

  modalDate: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937",
  },

  modalTime: {
    fontSize: "12px",
    color: "#9ca3af",
    fontWeight: "normal",
  },

  modalClose: {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#9ca3af",
  },

  modalContent: {
    padding: "28px",
    fontSize: "16px",
    lineHeight: "1.7",
    color: "#374151",
    whiteSpace: "pre-wrap",
  },

  modalFooter: {
    padding: "20px 28px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    justifyContent: "flex-end",
  },

  deleteBtn: {
    background: "#fee2e2",
    color: "#ef4444",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleSheet);

export default Journal;