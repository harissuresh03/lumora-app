// frontend/src/pages/Admin/AdminReports.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { Trash2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/reports", { params: { status: 'pending' } });
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Fetch reports error:", err);
      showErrorToast("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (reportId, postId, authorName) => {
    if (window.confirm(`Are you sure you want to delete this post by ${authorName}? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/reports/${postId}`);
        showSuccessToast("Post deleted successfully");
        fetchReports();
      } catch (err) {
        console.error("Delete post error:", err);
        showErrorToast("Failed to delete post");
      }
    }
  };

  const handleResolveReport = async (reportId) => {
    if (window.confirm("Mark this report as resolved?")) {
      try {
        await api.post(`/admin/reports/${reportId}/resolve`);
        showSuccessToast("Report resolved");
        fetchReports();
      } catch (err) {
        console.error("Resolve report error:", err);
        showErrorToast("Failed to resolve report");
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={22} color="#ef4444" />
          Pending Reports ({reports.length})
        </h2>
        <button
          onClick={fetchReports}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--card-bg-glass)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg-glass)', borderRadius: '20px' }}>
            <CheckCircle size={48} style={{ marginBottom: '16px', color: '#22c55e' }} />
            <p>No pending reports</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All reported posts have been reviewed.</p>
          </div>
        ) : (
          reports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <AlertTriangle size={16} color="#ef4444" />
                    <strong>Reported by {report.reporter?.nickname || 'Unknown'}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Posted by: <strong>{report.author?.nickname || report.author?.name || 'Unknown'}</strong>
                    {report.author?.email && ` (${report.author.email})`}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Reason: <span style={{ color: 'var(--text-secondary)' }}>{report.reason}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleResolveReport(report.id)}
                    style={{ padding: '6px 14px', background: '#22c55e', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Mark as resolved"
                  >
                    <CheckCircle size={14} /> Resolve
                  </button>
                  <button
                    onClick={() => handleDeletePost(report.id, report.postId, report.author?.nickname || 'Unknown')}
                    style={{ padding: '6px 14px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Delete post"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              
              <div 
                style={{ 
                  padding: '12px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '12px', 
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedPost(expandedPost === report.id ? null : report.id)}
              >
                <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  "{expandedPost === report.id ? report.content : report.content?.length > 200 ? report.content.substring(0, 200) + '...' : report.content}"
                </p>
                {report.content?.length > 200 && expandedPost !== report.id && (
                  <span style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '6px', display: 'inline-block' }}>
                    Click to expand
                  </span>
                )}
              </div>
              
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>📅 Reported: {report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'Unknown'}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminReports;