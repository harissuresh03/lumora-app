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
  FileSpreadsheet
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

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/counsellor/students/${counsellorId}`, {
        params: { search, filter, page, limit: 20 }
      });
      console.log("Students response:", res.data);
      
      if (res.data.message) {
        setError(res.data.message);
        setStudents([]);
      } else {
        setStudents(res.data.students || []);
        setTotalPages(res.data.totalPages || 1);
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

  // FIXED: Handle decimal values by rounding
  const getMoodEmoji = (mood) => {
    if (mood === null || mood === undefined || mood === 0) return "❓";
    const roundedMood = Math.round(mood);
    const emojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😄" };
    return emojis[roundedMood] || "❓";
  };

  // FIXED: Always show sleep emoji regardless of score
  const getSleepEmoji = () => {
    return "😴"; // Always show the sleep emoji
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
          
          {/* Export Button */}
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
              students.map((student) => (
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

                  {/* Avg Sleep Column - FIXED: Always shows sleep emoji */}
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '20px' }}>{getSleepEmoji()}</span>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {student.avg_sleep_quality ? `${parseFloat(student.avg_sleep_quality).toFixed(2)}/5` : 'N/A'}
                    </div>
                  </td>

                  {/* Stress Column - Shows stress level with color coding */}
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {student.current_stress_score !== null && student.current_stress_score !== undefined ? (
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: student.current_stress_score >= 60 ? '#ef4444' : 
                                    student.current_stress_score >= 30 ? '#f59e0b' : '#22c55e',
                        color: 'white',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {student.current_stress_score >= 60 ? '🔴' : 
                         student.current_stress_score >= 30 ? '🟡' : '🟢'} 
                        {student.current_stress_score}/100
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>N/A</span>
                    )}
                  </td>

                  {/* Consent Column - Shows consent status */}
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {getConsentBadge(student.counsellor_consent)}
                  </td>

                  {/* Alerts Column - Shows alerts count or N/A */}
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
                        onClick={() => navigate(`/counsellor/messages?student=${student.id}`)}
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
                        title="Send Message"
                      >
                        <Mail size={16} />
                        <span>Message</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
    </div>
  );
}

export default CounsellorStudents;