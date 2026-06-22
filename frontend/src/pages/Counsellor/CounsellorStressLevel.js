// frontend/src/pages/Counsellor/CounsellorStressLevel.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showErrorToast, showSuccessToast } from "../components/ToastNotification";
import { 
  Users, 
  Eye, 
  Mail, 
  RefreshCw,
  Activity,
  TrendingUp,
  BarChart3
} from "lucide-react";

function CounsellorStressLevel() {  // ← Renamed component
  const navigate = useNavigate();
  const counsellorId = localStorage.getItem("user_id");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Fetch all students with stress scores
      const res = await api.get(`/counsellor/students/${counsellorId}`, {
        params: { limit: 100 }
      });
      
      // Filter students with stress data and sort by stress score
      const studentsWithStress = (res.data.students || [])
        .filter(s => s.current_stress_score !== null)
        .sort((a, b) => (b.current_stress_score || 0) - (a.current_stress_score || 0));
      
      setStudents(studentsWithStress);
    } catch (err) {
      console.error("Fetch students error:", err);
      showErrorToast("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
    showSuccessToast("Data refreshed!");
  };

  const getStressLevel = (score) => {
    if (score >= 60) return { label: 'High', color: '#ef4444', emoji: '🔴' };
    if (score >= 30) return { label: 'Moderate', color: '#f59e0b', emoji: '🟡' };
    return { label: 'Low', color: '#22c55e', emoji: '🟢' };
  };

  const getFilteredStudents = () => {
    if (filter === 'high') {
      return students.filter(s => s.current_stress_score >= 60);
    }
    if (filter === 'moderate') {
      return students.filter(s => s.current_stress_score >= 30 && s.current_stress_score < 60);
    }
    return students;
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading at-risk students...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#ef4444" />
            Stress Levels
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
            Students with moderate to high stress levels ({students.filter(s => s.current_stress_score >= 30).length} students)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '30px',
              border: '1px solid var(--border-light)',
              background: 'var(--card-bg-glass)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Students</option>
            <option value="high">🔴 High Stress Only</option>
            <option value="moderate">🟡 Moderate Stress Only</option>
          </select>
          <button
            onClick={refreshData}
            disabled={refreshing}
            style={{
              padding: '8px 16px',
              borderRadius: '30px',
              border: '1px solid var(--border-light)',
              background: 'var(--card-bg-glass)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
            {students.filter(s => s.current_stress_score >= 60).length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔴 High Stress</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
            {students.filter(s => s.current_stress_score >= 30 && s.current_stress_score < 60).length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🟡 Moderate Stress</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>
            {students.filter(s => s.current_stress_score < 30 && s.current_stress_score !== null).length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🟢 Low Stress</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-primary)' }}>
            {students.filter(s => s.current_stress_score === null).length}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No Data</div>
        </div>
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px',
          background: 'var(--card-bg-glass)',
          borderRadius: '20px',
          border: '1px solid var(--border-glass)'
        }}>
          <Users size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h4>No students match your filter</h4>
          <p style={{ color: 'var(--text-secondary)' }}>
            {filter === 'all' ? 'No students with stress data available' :
             filter === 'high' ? 'No students with high stress' :
             'No students with moderate stress'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredStudents.map((student, index) => {
            const stressLevel = getStressLevel(student.current_stress_score);
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  background: 'var(--card-bg-glass)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  border: `1px solid ${stressLevel.color}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `var(--accent-gradient)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 600
                  }}>
                    {student.nickname?.charAt(0)?.toUpperCase() || student.name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{student.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {student.nickname && `@${student.nickname} • `}
                      {student.email}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px' }}>
                      <span>📊 Avg Mood: {student.avg_mood ? `${student.avg_mood}/5` : 'N/A'}</span>
                      <span>💤 Sleep: {student.avg_sleep_quality ? `${student.avg_sleep_quality}/5` : 'N/A'}</span>
                      <span>⚠️ Alerts: {student.pending_alerts || 0}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* Stress Score */}
                  <div style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    background: `${stressLevel.color}20`,
                    border: `1px solid ${stressLevel.color}`,
                    textAlign: 'center',
                    minWidth: '80px'
                  }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: stressLevel.color }}>
                      {student.current_stress_score || 'N/A'}
                    </div>
                    <div style={{ fontSize: '10px', color: stressLevel.color, fontWeight: 600 }}>
                      {stressLevel.emoji} {stressLevel.label}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => navigate(`/counsellor/student/${student.id}`)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => navigate(`/counsellor/messages?student=${student.id}`)}
                      style={{
                        padding: '6px 12px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    >
                      <Mail size={14} /> Message
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CounsellorStressLevel;