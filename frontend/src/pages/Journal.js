// pages/Journal.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  BookOpen,
  PenLine,
  Trash2,
  Sparkles,
  ArrowLeft,
  Menu,
  LogOut,
  User,
  Clock,
  Brain,
  Activity,
  TrendingUp,
  Heart
} from "lucide-react";

function Journal() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedAiAnalysis, setSelectedAiAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        if (res.data.nickname) {
          setUserNickname(res.data.nickname);
        } else {
          setUserNickname(res.data.name.split(" ")[0]);
        }
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

  const fetchAiAnalysis = async (journalId) => {
    try {
      const res = await api.get(`/ai/analysis/${journalId}`);
      if (res.data) {
        setSelectedAiAnalysis(res.data);
        setShowAnalysisModal(true);
      } else {
        alert("No AI analysis available for this entry");
      }
    } catch (err) {
      console.error("Fetch AI analysis error:", err);
      alert("Could not load AI analysis");
    }
  };

  const getMoodColor = (mood) => {
    const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#16a34a" };
    return colors[mood] || "#6b7280";
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      anxiety: "#f59e0b", sadness: "#3b82f6", frustration: "#ef4444",
      hope: "#10b981", joy: "#fbbf24", neutral: "#6b7280",
      anger: "#dc2626", fear: "#8b5cf6", loneliness: "#8b5cf6"
    };
    return colors[emotion?.toLowerCase()] || "#6b7280";
  };

  const getMoodLabel = (mood) => {
    const labels = { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" };
    return labels[mood] || "Unknown";
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="app-container">
      <div className="bg-decoration">
        <div className="blob1"></div>
        <div className="blob2"></div>
        <div className="blob3"></div>
      </div>

      <div className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu size={20} />
      </div>

      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">Lumora</span>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-item ${window.location.pathname === "/dashboard" ? "active" : ""}`} onClick={() => navigate("/dashboard")}>
            <Activity size={18} /><span>Dashboard</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/journal" ? "active" : ""}`} onClick={() => navigate("/journal")}>
            <BookOpen size={18} /><span>Journal</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/mental-health" ? "active" : ""}`} onClick={() => navigate("/mental-health")}>
            <Heart size={18} /><span>Mental Health</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/student-support" ? "active" : ""}`} onClick={() => navigate("/student-support")}>
            <TrendingUp size={18} /><span>Student Support</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/profile" ? "active" : ""}`} onClick={() => navigate("/profile")}>
            <User size={18} /><span>Profile</span>
          </button>
          <button className="sidebar-item-logout" onClick={logout}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </div>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className="content-wrapper">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="user-profile">
            <div className="user-avatar"><User size={18} /></div>
            <span className="user-name-top">{userNickname || "User"}</span>
            <div className="logout-icon" onClick={logout}><LogOut size={16} /></div>
          </div>
        </div>

        {/* Page Header - Only ONE title */}
        <div className="page-header">
          <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Journal</h1>
            <p className="page-subtitle">A space for your thoughts and reflections</p>
          </div>
        </div>

        {/* Previous Entries Section */}
        <div className="journal-entries-section">
          <h3 className="card-title" style={{ marginBottom: "16px" }}>Previous entries</h3>
          
          {entries.length === 0 ? (
            <div className="journal-empty-state">
              <BookOpen size={48} color="var(--text-muted)" />
              <h4>No journal entries yet</h4>
              <p>Write your first entry below.</p>
            </div>
          ) : (
            <div className="journal-entries-grid">
              {entries.map((entry) => (
                <div key={entry.id} className="journal-entry-card" onClick={() => openEntry(entry)}>
                  <div className="journal-entry-header">
                    <div className="journal-entry-date">
                      {new Date(entry.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                  <p className="journal-entry-preview">
                    {entry.content.length > 120 ? entry.content.substring(0, 120) + "..." : entry.content}
                  </p>
                  <div className="journal-entry-footer">
                    <span className="journal-read-more">Read more →</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); fetchAiAnalysis(entry.id); }} 
                      className="journal-ai-insights-btn"
                    >
                      <Sparkles size={12} /> AI Insights
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Writing Section */}
        <div className="journal-writing-card">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <PenLine size={24} color="var(--accent-primary)" />
            <h3 className="card-title" style={{ margin: 0 }}>Write your thoughts</h3>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind today? Write freely, without judgment..."
            className="journal-textarea"
          />
          <button onClick={addEntry} disabled={loading || !text.trim()} className="journal-save-btn">
            {loading ? "Saving..." : "Save to journal"}
          </button>
        </div>
      </div>

      {/* Modal for viewing full entry */}
      {isModalOpen && selectedEntry && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{new Date(selectedEntry.created_at).toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                  <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                  {new Date(selectedEntry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <div className="modal-content">
              <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedEntry.content}</p>
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={() => fetchAiAnalysis(selectedEntry.id)} className="primary-btn" style={{ width: "auto", padding: "8px 16px" }}>
                <Sparkles size={14} style={{ marginRight: "6px" }} /> AI Analysis
              </button>
              <button onClick={() => deleteEntry(selectedEntry.id)} style={{ padding: "8px 16px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer" }}>
                <Trash2 size={14} style={{ marginRight: "6px" }} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAnalysisModal && selectedAiAnalysis && (
        <div className="modal-overlay" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Brain size={18} style={{ marginRight: "8px" }} /> AI Analysis</h3>
              <button className="modal-close" onClick={() => setShowAnalysisModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span>Detected Mood:</span>
                <strong style={{ background: getMoodColor(selectedAiAnalysis.detected_mood), padding: "4px 12px", borderRadius: "20px", color: selectedAiAnalysis.detected_mood <= 2 ? "white" : "#1f2937" }}>
                  {getMoodLabel(selectedAiAnalysis.detected_mood)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <span>Primary Emotion:</span>
                <strong style={{ textTransform: "capitalize", color: getEmotionColor(selectedAiAnalysis.primary_emotion) }}>
                  {selectedAiAnalysis.primary_emotion}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", alignItems: "center" }}>
                <span>Intensity:</span>
                <div style={{ width: "120px", height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${selectedAiAnalysis.intensity * 20}%`, height: "100%", background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}></div>
                </div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <span>Themes: </span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                  {selectedAiAnalysis.themes?.map((theme, i) => (
                    <span key={i} style={{ background: "#ede8fc", color: "#6d5acf", padding: "4px 10px", borderRadius: "20px", fontSize: "11px" }}>#{theme}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Confidence:</span>
                <span style={{ fontWeight: "600", color: "#10b981" }}>{Math.round(selectedAiAnalysis.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Journal;