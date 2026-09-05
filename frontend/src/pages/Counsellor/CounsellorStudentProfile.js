// frontend/src/pages/Counsellor/CounsellorStudentProfile.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import CounsellorStressForecast from "../components/CounsellorStressForecast";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Activity,
  Moon,
  Smile,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Heart,
  FileText
} from "lucide-react";

function CounsellorStudentProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const counsellorId = localStorage.getItem("user_id");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStudentProfile();
    }
  }, [id]);

  const fetchStudentProfile = async () => {
    try {
      const res = await api.get(`/counsellor/student/${id}/${counsellorId}`);
      setProfile(res.data);
    } catch (err) {
      console.error("Fetch profile error:", err);
      
      if (err.response?.status === 403 && err.response?.data?.msg === "Student has not given consent to share their data") {
        showErrorToast("This student has not given consent to share their data.");
      } else {
        showErrorToast("Failed to fetch student profile");
      }
      navigate("/counsellor/students");
    } finally {
      setLoading(false);
    }
  };

  const generateWellnessReport = async () => {
    setGenerating(true);
    try {
      const response = await api.get(`/counsellor/wellness-report/${id}/${counsellorId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wellness_report_${profile?.student?.name?.replace(/\s/g, '_') || 'student'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccessToast("Wellness report downloaded!");
    } catch (err) {
      console.error("Generate report error:", err);
      showErrorToast("Failed to generate wellness report");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    };
    return (
      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: colors[severity] || '#9ca3af', color: 'white' }}>
        {severity || 'Unknown'}
      </span>
    );
  };

  const getMoodColor = (mood) => {
    if (!mood) return "#9ca3af";
    const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#16a34a" };
    return colors[mood] || "#9ca3af";
  };

  const handleEmergencyCall = (phoneNumber) => {
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
      window.location.href = `tel:${cleanNumber}`;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading student profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p>Student not found</p>
        <button onClick={() => navigate("/counsellor/students")} className="primary-btn" style={{ width: 'auto', padding: '10px 30px', marginTop: '20px' }}>
          Back to Students
        </button>
      </div>
    );
  }

  const { student, stats, moods, sleep, assessments, alerts, sessions } = profile;

  return (
    <div>
      {/* Header with Back Button and Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate("/counsellor/students")}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} /> Back to Students
        </button>
        
        {/* ✅ Generate PDF Report Button - Now uses primary-btn class */}
        <button
          onClick={generateWellnessReport}
          disabled={generating}
          className="primary-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '30px',
            fontSize: '13px',
            fontWeight: 500,
            width: 'auto',
            opacity: generating ? 0.6 : 1,
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          <FileText size={16} />
          {generating ? 'Generating...' : 'Generate Report (PDF)'}
        </button>
      </div>

      {/* Student Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-glass)',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{student.name}</h2>
            {student.nickname && <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '4px 0 0' }}>@{student.nickname}</p>}
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
              <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
              {student.email}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Joined: {formatDate(student.created_at)}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              🏛️ {student.university_name || 'University not set'}
            </p>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div style={{ 
          marginTop: '16px', 
          padding: '16px', 
          background: 'rgba(239, 68, 68, 0.05)', 
          borderRadius: '12px', 
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Heart size={18} color="#ef4444" />
            <strong style={{ fontSize: '15px', color: '#ef4444' }}>Emergency Contact</strong>
          </div>
          
          {student.emergency_contact_name || student.emergency_contact_phone ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              {student.emergency_contact_name && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name</span>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{student.emergency_contact_name}</div>
                </div>
              )}
              {student.emergency_contact_phone && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone</span>
                  <div style={{ fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {student.emergency_contact_phone}
                    <button
                      onClick={() => handleEmergencyCall(student.emergency_contact_phone)}
                      style={{
                        padding: '4px 12px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '20px',
                        color: 'white',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Phone size={12} /> Call
                    </button>
                  </div>
                </div>
              )}
              {student.emergency_contact_relationship && (
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Relationship</span>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{student.emergency_contact_relationship}</div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              No emergency contact information provided
            </p>
          )}
        </div>

        {/* Consent Status */}
        <div style={{ 
          marginTop: '12px', 
          padding: '12px', 
          background: student.counsellor_consent ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
          borderRadius: '12px', 
          border: student.counsellor_consent ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)' 
        }}>
          {student.counsellor_consent ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e' }}>
              <CheckCircle size={18} /> Student has given consent to share data
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
              <XCircle size={18} /> Student has NOT given consent to share data
            </span>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <Smile size={20} style={{ marginBottom: '8px', color: '#6366f1' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.avgMood || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Mood /5</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <Moon size={20} style={{ marginBottom: '8px', color: '#10b981' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.avgSleepQuality || 'N/A'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Sleep Quality /5</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <BookOpen size={20} style={{ marginBottom: '8px', color: '#f59e0b' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.journalCount || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Journal Entries (7d)</div>
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
          <AlertTriangle size={20} style={{ marginBottom: '8px', color: '#ef4444' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.crisisAlerts || 0}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Alerts</div>
        </div>
      </div>

      {/* Stress Forecast Section */}
      <div style={{ marginBottom: '24px' }}>
        <CounsellorStressForecast 
          studentId={id}
          counsellorId={counsellorId}
        />
      </div>

      {/* Mood and Sleep Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ marginBottom: '16px' }}>Mood Trend (30 days)</h4>
          {moods.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No mood data available</p>
          ) : (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
              {moods.slice(0, 30).reverse().map((m, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '100%',
                    height: `${(m.mood / 5) * 100}px`,
                    background: getMoodColor(m.mood),
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                    transition: 'all 0.3s'
                  }} />
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(m.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ marginBottom: '16px' }}>Sleep Trend (30 days)</h4>
          {sleep.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No sleep data available</p>
          ) : (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '120px' }}>
              {sleep.slice(0, 30).reverse().map((s, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '100%',
                    height: `${(s.quality / 5) * 100}px`,
                    background: getMoodColor(s.quality),
                    borderRadius: '4px 4px 0 0',
                    minHeight: '4px',
                    transition: 'all 0.3s'
                  }} />
                  <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {new Date(s.date).getDate()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Crisis Alerts */}
      <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          Crisis Alerts
        </h4>
        {alerts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No crisis alerts</p>
        ) : (
          alerts.map((alert, idx) => (
            <div key={idx} style={{ padding: '12px 16px', background: alert.is_resolved ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', marginBottom: '8px', border: alert.is_resolved ? '1px solid var(--border-light)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{alert.alert_type || 'Crisis Alert'}</strong>
                  {getSeverityBadge(alert.severity)}
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{alert.message}</p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {formatDateTime(alert.created_at)}
                    {alert.is_resolved && alert.resolved_at && (
                      <span style={{ marginLeft: '16px', color: '#22c55e' }}>✓ Resolved {formatDateTime(alert.resolved_at)}</span>
                    )}
                  </div>
                </div>
                {!alert.is_resolved && (
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/counsellor/alerts/${alert.id}/resolve`);
                        showSuccessToast("Alert resolved");
                        fetchStudentProfile();
                      } catch (err) {
                        showErrorToast("Failed to resolve alert");
                      }
                    }}
                    style={{ padding: '6px 14px', background: '#22c55e', border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sessions */}
      <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>Session History</h4>
        {sessions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No sessions recorded</p>
        ) : (
          sessions.map((session, idx) => (
            <div key={idx} style={{ padding: '12px 0', borderBottom: idx < sessions.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px' }}>
                  {formatDateTime(session.session_date)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Duration: {session.duration || 60} min • Status: {session.status}
                </div>
                {session.notes && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{session.notes}</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assessments */}
      <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-glass)', marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>Assessment History</h4>
        {assessments.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No assessments taken</p>
        ) : (
          assessments.map((assessment, idx) => (
            <div key={idx} style={{ padding: '12px 0', borderBottom: idx < assessments.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    {assessment.type.toUpperCase()} - {assessment.severity}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Score: {assessment.score} • Taken: {formatDate(assessment.taken_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CounsellorStudentProfile;