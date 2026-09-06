// frontend/src/pages/Journal.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import Layout from "./components/Layout";
import ExportButton from "./components/ExportButton";
import { showSuccessToast, showErrorToast, showWarningToast } from "./components/ToastNotification";
import {
  BookOpen,
  PenLine,
  Trash2,
  Sparkles,
  ArrowLeft,
  Clock,
  Brain,
  Calendar,
  FileText
} from "lucide-react";

function Journal() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [setUserNickname] = useState("");

  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedAiAnalysis, setSelectedAiAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Filter state
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);

  // Weekly Reflection Prompt
  const [weeklyPrompt, setWeeklyPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalEntries: 0,
    streak: 0,
    averageLength: 0
  });

  // ---------- Callbacks ----------
  const fetchUserProfile = useCallback(async () => {
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
  }, [user_id, setUserNickname]);

  const fetchEntries = useCallback(() => {
    api.get(`/journal/${user_id}`).then((res) => {
      setEntries(res.data);
      calculateStats(res.data);
      
      // Extract available years from entries
      const years = [...new Set(res.data.map(e => new Date(e.created_at).getFullYear()))];
      setAvailableYears(years.sort((a, b) => b - a));
      if (years.length > 0 && !years.includes(filterYear)) {
        setFilterYear(years[0]);
      }
    }).catch((err) => console.log(err));
  }, [user_id, filterYear]);

  const filterEntries = useCallback(() => {
    if (!entries.length) {
      setFilteredEntries([]);
      return;
    }

    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      const entryMonth = entryDate.getMonth() + 1;
      const entryYear = entryDate.getFullYear();
      return entryMonth === filterMonth && entryYear === filterYear;
    });
    
    setFilteredEntries(filtered);
  }, [entries, filterMonth, filterYear]);

  const fetchJournalStats = useCallback(async () => {
    try {
      const res = await api.get(`/journal/stats/${user_id}`);
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.log("Fetch stats error:", err);
    }
  }, [user_id]);

  // ---------- Effects ----------
  useEffect(() => {
    fetchUserProfile();
    fetchEntries();
    fetchWeeklyPrompt();
    fetchJournalStats();
  }, [fetchUserProfile, fetchEntries, fetchJournalStats]); // fetchWeeklyPrompt is stable

  useEffect(() => {
    filterEntries();
  }, [filterEntries]);

  // ---------- Helper functions ----------
  const getMonthName = (month) => {
    return new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
  };

  const calculateStats = (entriesData) => {
    const total = entriesData.length;
    
    let streak = 0;
    const entryDates = entriesData.map(e => new Date(e.created_at).toISOString().split('T')[0]);
    const uniqueDates = [...new Set(entryDates)].sort().reverse();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      if (uniqueDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }
    
    const avgLength = total > 0 ? Math.round(entriesData.reduce((sum, e) => sum + e.content.length, 0) / total) : 0;
    
    setStats({ totalEntries: total, streak, averageLength: avgLength });
  };

  const fetchWeeklyPrompt = async () => {
    const prompts = [
      { question: "What went well this week?", focus: "positive", emoji: "🌟" },
      { question: "What was the biggest challenge you faced?", focus: "growth", emoji: "💪" },
      { question: "What did you learn about yourself?", focus: "reflection", emoji: "🪞" },
      { question: "What are you grateful for this week?", focus: "gratitude", emoji: "🙏" },
      { question: "What would you do differently next week?", focus: "improvement", emoji: "📈" },
      { question: "Who or what supported you this week?", focus: "connection", emoji: "🤝" },
      { question: "What made you feel proud this week?", focus: "achievement", emoji: "🏆" },
      { question: "What emotion did you feel most this week?", focus: "emotional", emoji: "❤️" },
      { question: "What's one thing you want to let go of?", focus: "release", emoji: "🍃" },
      { question: "What's one intention for next week?", focus: "intention", emoji: "🎯" }
    ];
    
    const weekNumber = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000));
    const promptIndex = weekNumber % prompts.length;
    setWeeklyPrompt(prompts[promptIndex]);
    
    const lastPromptUsed = localStorage.getItem(`prompt_used_${weekNumber}`);
    if (lastPromptUsed) {
      setShowPrompt(false);
    }
  };

  const addEntry = async () => {
    if (!text.trim()) return;
    
    try {
      setLoading(true);
      const response = await api.post("/journal", { 
        user_id: parseInt(user_id), 
        content: text 
      });
      
      setText("");
      fetchEntries();
      showSuccessToast("Journal entry saved! ✨");
      
      if (response.data.crisisDetected) {
        showWarningToast("We're here for you. 💙 Support is available.");
      }
      
      if (weeklyPrompt) {
        const weekNumber = Math.floor(new Date().getTime() / (7 * 24 * 60 * 60 * 1000));
        localStorage.setItem(`prompt_used_${weekNumber}`, 'true');
      }
    } catch (err) {
      console.log(err);
      showErrorToast("Failed to save journal entry");
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
        showSuccessToast("Entry deleted");
      } catch (err) {
        console.log(err);
        showErrorToast("Failed to delete entry");
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
        showErrorToast("No AI analysis available for this entry");
      }
    } catch (err) {
      console.error("Fetch AI analysis error:", err);
      showErrorToast("Could not load AI analysis");
    }
  };

  const getMoodColor = (mood) => {
    const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#16a34a" };
    return colors[mood] || "#6b7280";
  };

  const getEmotionColor = (emotion) => {
    const colors = { 
      anxiety: "#f59e0b", 
      sadness: "#3b82f6", 
      frustration: "#ef4444", 
      hope: "#10b981", 
      joy: "#fbbf24", 
      neutral: "#6b7280", 
      anger: "#dc2626", 
      fear: "#8b5cf6", 
      loneliness: "#8b5cf6" 
    };
    return colors[emotion?.toLowerCase()] || "#6b7280";
  };

  const getMoodLabel = (mood) => {
    const labels = { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" };
    return labels[mood] || "Unknown";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // ---------- JSX ----------
  return (
    <Layout>

      {/* PAGE HEADER */}
      <div className="page-header">
        <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title">Journal</h1>
          <p className="page-subtitle">A space for your thoughts and reflections</p>
        </div>
        
        {/* Filter and Export Section */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          marginLeft: 'auto'
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Filter:</label>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-light)', 
                background: 'var(--card-bg-glass)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{getMonthName(m)}</option>
              ))}
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-light)', 
                background: 'var(--card-bg-glass)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableYears.length > 0 ? (
                availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))
              ) : (
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              )}
            </select>
          </div>
          
          <ExportButton 
            type="journal" 
            userId={parseInt(user_id)} 
            label="Export PDF"
            month={filterMonth}
            year={filterYear}
            icon={<FileText size={16} />}
            variant="primary"
          />
        </div>
      </div>

      {/* Journal Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <BookOpen size={20} style={{ marginBottom: '8px', color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalEntries}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Entries</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <Calendar size={20} style={{ marginBottom: '8px', color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.streak}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Day Streak</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <PenLine size={20} style={{ marginBottom: '8px', color: 'var(--accent-primary)' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.averageLength}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Characters</div>
        </div>
      </motion.div>

      {/* Filter Info */}
      <div style={{ 
        fontSize: '13px', 
        color: 'var(--text-muted)', 
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <span>
          Showing {filteredEntries.length} entries for {getMonthName(filterMonth)} {filterYear}
        </span>
        {entries.length > 0 && filteredEntries.length === 0 && (
          <span style={{ color: '#f59e0b' }}>
            No entries found for this month
          </span>
        )}
      </div>

      {/* Weekly Reflection Prompt */}
      {showPrompt && weeklyPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            background: 'linear-gradient(135deg, var(--accent-soft), rgba(139, 92, 246, 0.05))',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '24px',
            border: '1px solid var(--border-glass)',
            position: 'relative'
          }}
        >
          <button
            onClick={() => setShowPrompt(false)}
            style={{ 
              position: 'absolute', 
              top: '12px', 
              right: '12px', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '24px' }}>{weeklyPrompt.emoji}</span>
            <strong style={{ fontSize: '14px', color: 'var(--accent-primary)' }}>Weekly Reflection</strong>
          </div>
          <p style={{ fontSize: '16px', marginBottom: '14px', lineHeight: 1.5 }}>
            {weeklyPrompt.question}
          </p>
          <button
            onClick={() => {
              setText(weeklyPrompt.question + "\n\n");
              setShowPrompt(false);
            }}
            style={{
              fontSize: '12px',
              padding: '8px 18px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '30px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <PenLine size={14} /> Write about this
          </button>
        </motion.div>
      )}

      {/* PREVIOUS ENTRIES */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="journal-entries-section"
      >
        <h3 className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} /> Entries ({filteredEntries.length})
        </h3>
        
        {filteredEntries.length === 0 ? (
          <div className="journal-empty-state" style={{ 
            textAlign: "center", 
            padding: "60px", 
            background: "var(--card-bg-glass)", 
            borderRadius: "20px",
            border: "1px solid var(--border-glass)"
          }}>
            <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
            <h4>No journal entries for {getMonthName(filterMonth)} {filterYear}</h4>
            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
              {entries.length > 0 ? 'Try selecting a different month' : 'Write your first entry below.'}
            </p>
          </div>
        ) : (
          <div className="journal-entries-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
            {filteredEntries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                className="journal-entry-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
                onClick={() => openEntry(entry)}
                style={{
                  background: "var(--card-bg-glass)",
                  backdropFilter: "var(--glass-blur)",
                  borderRadius: "16px",
                  padding: "20px",
                  cursor: "pointer",
                  border: "1px solid var(--border-glass)",
                  transition: "all 0.2s"
                }}
              >
                <div className="journal-entry-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div className="journal-entry-date" style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {formatDate(entry.created_at)}
                  </div>
                </div>
                <p className="journal-entry-preview" style={{ fontSize: "14px", lineHeight: 1.5, color: "var(--text-secondary)", margin: "12px 0" }}>
                  {entry.content.length > 120 ? entry.content.substring(0, 120) + "..." : entry.content}
                </p>
                <div className="journal-entry-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-light)" }}>
                  <span className="journal-read-more" style={{ fontSize: "12px", color: "var(--accent-primary)" }}>Read more →</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); fetchAiAnalysis(entry.id); }} 
                    className="journal-ai-insights-btn"
                    style={{ 
                      background: "none", 
                      border: "1px solid var(--border-light)", 
                      color: "var(--accent-primary)", 
                      fontSize: "11px", 
                      padding: "5px 12px", 
                      borderRadius: "20px", 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <Sparkles size={12} /> AI Insights
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* WRITING SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="journal-writing-card"
        style={{
          background: "var(--card-bg-glass)",
          backdropFilter: "var(--glass-blur)",
          borderRadius: "24px",
          padding: "28px",
          marginTop: "32px",
          border: "1px solid var(--border-glass)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <PenLine size={24} color="var(--accent-primary)" />
          <h3 className="card-title" style={{ margin: 0 }}>Write your thoughts</h3>
        </div>
        
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="What's on your mind today? Write freely, without judgment..." 
          className="journal-textarea"
          style={{
            width: "100%",
            minHeight: "220px",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid var(--border-light)",
            fontSize: "14px",
            lineHeight: "1.6",
            resize: "vertical",
            background: "var(--bg-secondary)"
          }}
        />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {text.length} characters
          </div>
          <button 
            onClick={addEntry} 
            disabled={loading || !text.trim()} 
            className="journal-save-btn"
            style={{
              padding: "12px 28px",
              background: "var(--accent-gradient)",
              color: "white",
              border: "none",
              borderRadius: "40px",
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading || !text.trim() ? 0.6 : 1,
              transition: "all 0.2s"
            }}
          >
            {loading ? "Saving..." : "Save to journal"}
          </button>
        </div>
      </motion.div>

      {/* ENTRY DETAIL MODAL */}
      <AnimatePresence>
        {isModalOpen && selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "550px" }}
            >
              <div className="modal-header">
                <div>
                  <h3>{new Date(selectedEntry.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                </div>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
              </div>
              <div className="modal-content">
                <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{selectedEntry.content}</p>
              </div>
              <div style={{ padding: "20px", borderTop: "1px solid var(--border-light)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button 
                  onClick={() => fetchAiAnalysis(selectedEntry.id)} 
                  className="primary-btn" 
                  style={{ width: "auto", padding: "8px 16px", background: "var(--accent-gradient)" }}
                >
                  <Sparkles size={14} style={{ marginRight: "6px" }} /> AI Analysis
                </button>
                <button 
                  onClick={() => deleteEntry(selectedEntry.id)} 
                  style={{ padding: "8px 16px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer" }}
                >
                  <Trash2 size={14} style={{ marginRight: "6px" }} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI ANALYSIS MODAL */}
      <AnimatePresence>
        {showAnalysisModal && selectedAiAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowAnalysisModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "500px" }}
            >
              <div className="modal-header">
                <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Brain size={18} /> AI Analysis
                </h3>
                <button className="modal-close" onClick={() => setShowAnalysisModal(false)}>✕</button>
              </div>
              <div className="modal-content">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
                  <span>Detected Mood:</span>
                  <strong style={{ 
                    background: getMoodColor(selectedAiAnalysis.detected_mood), 
                    padding: "4px 12px", 
                    borderRadius: "20px", 
                    color: selectedAiAnalysis.detected_mood <= 2 ? "white" : "#1f2937" 
                  }}>
                    {getMoodLabel(selectedAiAnalysis.detected_mood)}
                  </strong>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
                  <span>Primary Emotion:</span>
                  <strong style={{ textTransform: "capitalize", color: getEmotionColor(selectedAiAnalysis.primary_emotion) }}>
                    {selectedAiAnalysis.primary_emotion}
                  </strong>
                </div>
                
                <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span>Intensity:</span>
                    <span style={{ fontWeight: "600" }}>{selectedAiAnalysis.intensity}/5</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${selectedAiAnalysis.intensity * 20}%`, 
                      height: "100%", 
                      background: "linear-gradient(90deg, #f59e0b, #ef4444)" 
                    }}></div>
                  </div>
                </div>
                
                <div style={{ marginBottom: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
                  <span>Themes: </span>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                    {selectedAiAnalysis.themes?.map((theme, i) => (
                      <span key={i} style={{ background: "var(--accent-soft)", color: "var(--accent-primary)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px" }}>
                        #{theme}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
                  <span>Confidence:</span>
                  <span style={{ fontWeight: "600", color: "#10b981" }}>{Math.round(selectedAiAnalysis.confidence * 100)}%</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

export default Journal;