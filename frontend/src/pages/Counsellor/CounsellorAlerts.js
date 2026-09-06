// frontend/src/pages/Counsellor/CounsellorAlerts.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { Eye, CheckCircle, Clock, User } from "lucide-react";

function CounsellorAlerts() {
  const navigate = useNavigate();
  const counsellorId = localStorage.getItem("user_id");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get(`/counsellor/alerts/${counsellorId}`, {
        params: { resolved: filter === 'resolved' ? 'true' : undefined }
      });
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Fetch alerts error:", err);
      showErrorToast("Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/counsellor/alerts/${id}/resolve`);
      showSuccessToast("Alert resolved");
      fetchAlerts();
    } catch (err) {
      showErrorToast("Failed to resolve alert");
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[severity] || '#9ca3af';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return icons[severity] || '⚪';
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading alerts...</p></div>;
  }

  return (
    <div>
      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setFilter('active')}
          style={{
            padding: '10px 24px',
            borderRadius: '40px',
            border: 'none',
            background: filter === 'active' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
            color: filter === 'active' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Active Alerts
        </button>
        <button
          onClick={() => setFilter('resolved')}
          style={{
            padding: '10px 24px',
            borderRadius: '40px',
            border: 'none',
            background: filter === 'resolved' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
            color: filter === 'resolved' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Resolved
        </button>
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg-glass)', borderRadius: '20px' }}>
            {filter === 'active' ? (
              <>
                <CheckCircle size={48} style={{ marginBottom: '16px', color: '#22c55e' }} />
                <p>No active alerts</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All students are doing well</p>
              </>
            ) : (
              <>
                <Clock size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No resolved alerts</p>
              </>
            )}
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                padding: '20px',
                border: alert.is_resolved ? '1px solid var(--border-glass)' : '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{getSeverityIcon(alert.severity)}</span>
                    <strong style={{ fontSize: '16px' }}>{alert.alert_type || 'Crisis Alert'}</strong>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      background: getSeverityColor(alert.severity),
                      color: 'white'
                    }}>
                      {alert.severity || 'Unknown'}
                    </span>
                    {alert.is_resolved && (
                      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', background: '#22c55e', color: 'white' }}>
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <strong>{alert.student_name}</strong>
                      {alert.student_nickname && ` (@${alert.student_nickname})`}
                    </span>
                    <button
                      onClick={() => navigate(`/counsellor/student/${alert.student_id}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', fontSize: '12px' }}
                    >
                      <Eye size={14} style={{ display: 'inline' }} /> View Profile
                    </button>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {alert.message}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {formatDate(alert.created_at)}
                    {alert.is_resolved && alert.resolved_at && (
                      <span style={{ marginLeft: '16px' }}>✓ Resolved {formatDate(alert.resolved_at)}</span>
                    )}
                  </div>
                </div>
                {!alert.is_resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#22c55e',
                      border: 'none',
                      borderRadius: '30px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      flexShrink: 0
                    }}
                  >
                    <CheckCircle size={16} /> Resolve
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default CounsellorAlerts;