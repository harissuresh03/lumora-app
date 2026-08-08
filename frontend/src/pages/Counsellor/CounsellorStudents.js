// frontend/src/pages/Counsellor/CounsellorStudents.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import ExportButton from "../components/ExportButton";
import { 
  Search, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Mail, 
  RefreshCw,
  Users,
  Eye,
  FileSpreadsheet,
  Filter
} from "lucide-react";

function CounsellorStudents() {
  const navigate = useNavigate();
  const counsellorId = localStorage.getItem("user_id");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedStudentForNote, setSelectedStudentForNote] = useState(null);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [sendingNote, setSendingNote] = useState(false);

  // Stress summary stats
  const [stressStats, setStressStats] = useState({
    high: 0,
    moderate: 0,
    low: 0,
    noData: 0
  });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/counsellor/students/${counsellorId}`, {
        params: { search, filter, page, limit: 20 }
      });
      console.log("📊 Students response:", res.data);
      
      if (res.data.message) {
        setError(res.data.message);
        setStudents([]);
      } else {
        const studentsData = res.data.students || [];
        setStudents(studentsData);
        setTotalPages(res.data.totalPages || 1);
        
        const stats = {
          high: 0,
          moderate: 0,
          low: 0,
          noData: 0
        };
        studentsData.forEach(s => {
          if (s.current_stress_score === null || s.current_stress_score === undefined) {
            stats.noData++;
          } else if (s.current_stress_score >= 60) {
            stats.high++;
          } else if (s.current_stress_score >= 30) {
            stats.moderate++;
          } else {
            stats.low++;
          }
        });
        setStressStats(stats);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      showErrorToast("Failed to fetch students");
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [counsellorId, search, filter, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
    if (!error) showSuccessToast("Students refreshed!");
  };

  // Send note to student
  const sendNoteToStudent = async () => {
    if (!noteMessage.trim()) {
      showErrorToast("Please enter a message");
      return;
    }

    setSendingNote(true);
    try {
      await api.post("/counsellor/send-note", {
        student_id: selectedStudentForNote.id,
        subject: noteSubject || "Note from Counsellor",
        message: noteMessage
      });
      showSuccessToast(`Note sent to ${selectedStudentForNote.name}! 📬`);
      setShowNoteModal(false);
      setNoteSubject("");
      setNoteMessage("");
      setSelectedStudentForNote(null);
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to send note");
    } finally {
      setSendingNote(false);
    }
  };

  const getMoodEmoji = (mood) => {
    if (mood === null || mood === undefined || mood === 0) return "❓";
    const roundedMood = Math.round(mood);
    const emojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😄" };
    return emojis[roundedMood] || "❓";
  };

  const getSleepEmoji = () => {
    return "😴";
  };

  const getMoodColor = (mood) => {
    if (!mood) return "#9ca3af";
    const roundedMood = Math.round(mood);
    const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#16a34a" };
    return colors[roundedMood] || "#9ca3af";
  };

  const getConsentBadge = (consent) => {
    if (consent) {
      return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: '#22c55e', color: 'white', fontWeight: 500 }}>✅ Consented</span>;
    }
    return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: '#ef4444', color: 'white', fontWeight: 500 }}>❌ No Consent</span>;
  };

  const getStressLevel = (score) => {
    if (score === null || score === undefined) return { label: 'No Data', color: '#9ca3af', emoji: '⚪' };
    if (score >= 60) return { label: 'High', color: '#ef4444', emoji: '🔴' };
    if (score >= 30) return { label: 'Moderate', color: '#f59e0b', emoji: '🟡' };
    return { label: 'Low', color: '#22c55e', emoji: '🟢' };
  };

  if (loading && students.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stress Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          background: 'var(--card-bg-glass)', 
          borderRadius: '12px', 
          padding: '16px', 
          textAlign: 'center', 
          border: '1px solid rgba(239, 68, 68, 0.2)' 
        }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
            {stressStats.high}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔴 High Stress</div>
        </div>
        <div style={{ 
          background: 'var(--card-bg-glass)', 
          borderRadius: '12px', 
          padding: '16px', 
          textAlign: 'center', 
          border: '1px solid rgba(245, 158, 11, 0.2)' 
        }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
            {stressStats.moderate}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🟡 Moderate Stress</div>
        </div>
        <div style={{ 
          background: 'var(--card-bg-glass)', 
          borderRadius: '12px', 
          padding: '16px', 
          textAlign: 'center', 
          border: '1px solid rgba(34, 197, 94, 0.2)' 
        }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>
            {stressStats.low}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🟢 Low Stress</div>
        </div>
        <div style={{ 
          background: 'var(--card-bg-glass)', 
          borderRadius: '12px', 
          padding: '16px', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {stressStats.noData}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Stress Data</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, nickname or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '10px 12px 10px 38px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)', width: '250px' }}
            />
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}
          >
            <option value="all">All Students</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="consent">With Consent</option>
            <option value="no_consent">No Consent</option>
            <option value="at_risk">At Risk</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '40px', 
              border: '1px solid var(--border-light)', 
              background: 'var(--card-bg-glass)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
          
          <ExportButton 
            type="counsellor-students"
            userId={parseInt(counsellorId)}
            label="Export CSV"
            icon={<FileSpreadsheet size={16} />}
            variant="primary"
          />
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          {error ? 'Error loading students' : `Showing ${students.length} students`}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Students Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          border: '1px solid var(--border-glass)',
          overflow: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px', textAlign: 'left' }}>Student</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Avg Mood</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Avg Sleep</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Stress</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Consent</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Alerts</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto' }}></div>
                  <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading...</p>
                </td>
              </tr>
            ) : students.length === 0 && !error ? (
              <tr>
                <td colSpan="8" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                  <p style={{ fontSize: '16px', fontWeight: 500 }}>No students found</p>
                  <p style={{ fontSize: '13px' }}>Try adjusting your search or filter</p>
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const stressLevel = getStressLevel(student.current_stress_score);
                return (
                  <tr key={student.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {/* Student Column */}
                    <td style={{ padding: '16px' }}>
                      <strong>{student.name}</strong>
                      {student.nickname && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{student.nickname}</div>}
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.email}</div>
                    </td>

                    {/* Status Column */}
                    <td style={{ padding: '16px' }}>
                      {student.is_active ? (
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#22c55e', color: 'white', fontWeight: 500 }}>Active</span>
                      ) : (
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: '#ef4444', color: 'white', fontWeight: 500 }}>Inactive</span>
                      )}
                    </td>

                    {/* Avg Mood Column */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px' }}>{getMoodEmoji(student.avg_mood)}</span>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: getMoodColor(student.avg_mood) }}>
                        {student.avg_mood ? `${parseFloat(student.avg_mood).toFixed(2)}/5` : 'N/A'}
                      </div>
                    </td>

                    {/* Avg Sleep Column */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px' }}>{getSleepEmoji()}</span>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {student.avg_sleep_quality ? `${parseFloat(student.avg_sleep_quality).toFixed(2)}/5` : 'N/A'}
                      </div>
                    </td>

                    {/* Stress Column */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {student.current_stress_score !== null && student.current_stress_score !== undefined ? (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: stressLevel.color,
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {stressLevel.emoji} {student.current_stress_score}/100
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>

                    {/* Consent Column */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {getConsentBadge(student.counsellor_consent)}
                    </td>

                    {/* Alerts Column */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      {student.pending_alerts !== null && student.pending_alerts !== undefined && student.pending_alerts > 0 ? (
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          background: '#ef4444', 
                          color: 'white', 
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <AlertTriangle size={12} />
                          {student.pending_alerts}
                        </span>
                      ) : student.pending_alerts === 0 ? (
                        <span style={{ color: '#22c55e', fontSize: '14px', fontWeight: 500 }}>✅ No Alerts</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => navigate(`/counsellor/student/${student.id}`)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: 'var(--accent-primary)',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          title="View Profile"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudentForNote(student);
                            setShowNoteModal(true);
                          }}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: '#3b82f6',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          title="Send Note"
                        >
                          <Mail size={16} />
                          <span>Send Note</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-light)', 
              background: page === 1 ? 'var(--bg-secondary)' : 'var(--card-bg-glass)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-light)', 
              background: page === totalPages ? 'var(--bg-secondary)' : 'var(--card-bg-glass)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Send Note Modal */}
      {showNoteModal && selectedStudentForNote && (
        <div className="modal-overlay" onClick={() => setShowNoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Send Note to {selectedStudentForNote.name}</h3>
              <button className="modal-close" onClick={() => setShowNoteModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="input-group">
                <label className="input-label">Subject (optional)</label>
                <input
                  type="text"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  className="input-field"
                  placeholder="Brief subject"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Message *</label>
                <textarea
                  value={noteMessage}
                  onChange={(e) => setNoteMessage(e.target.value)}
                  className="peer-textarea"
                  rows="4"
                  placeholder="Write your note to the student..."
                />
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                marginBottom: '16px'
              }}>
                📬 This note will be sent as a notification to the student.
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowNoteModal(false)} className="peer-btn-secondary">Cancel</button>
                <button onClick={sendNoteToStudent} disabled={sendingNote} className="peer-btn-primary">
                  {sendingNote ? "Sending..." : "Send Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CounsellorStudents;