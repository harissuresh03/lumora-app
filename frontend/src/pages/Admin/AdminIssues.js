// frontend/src/pages/Admin/AdminIssues.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { CheckCircle, Trash2, MessageSquare, RefreshCw } from "lucide-react";

function AdminIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [page, statusFilter, typeFilter]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/issues", {
        params: { page, status: statusFilter, type: typeFilter }
      });
      setIssues(res.data.issues);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Fetch issues error:", err);
      showErrorToast("Failed to fetch issues");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId, response = null) => {
    try {
      await api.put(`/admin/issues/${issueId}/status`, {
        status: 'resolved',
        admin_response: response
      });
      showSuccessToast("Issue marked as resolved");
      fetchIssues();
    } catch (err) {
      showErrorToast("Failed to resolve issue");
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm("Are you sure you want to delete this issue report?")) {
      try {
        await api.delete(`/admin/issues/${issueId}`);
        showSuccessToast("Issue deleted successfully");
        fetchIssues();
      } catch (err) {
        showErrorToast("Failed to delete issue");
      }
    }
  };

  const openResponseModal = (issue) => {
    setSelectedIssue(issue);
    setAdminResponse(issue.admin_response || "");
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    if (selectedIssue) {
      await handleResolveIssue(selectedIssue.id, adminResponse);
      setShowResponseModal(false);
      setSelectedIssue(null);
      setAdminResponse("");
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'bug': return '🐛';
      case 'feature': return '💡';
      case 'content': return '📝';
      case 'privacy': return '🔒';
      default: return '❓';
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'resolved') {
      return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', background: '#22c55e', color: 'white' }}>Resolved</span>;
    }
    return <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', background: '#f59e0b', color: 'white' }}>Pending</span>;
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading issues...</p></div>;
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="all">All</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}>
          <option value="all">All Types</option>
          <option value="bug">Bug/Technical</option>
          <option value="feature">Feature Request</option>
          <option value="content">Content Issue</option>
          <option value="privacy">Privacy Concern</option>
          <option value="other">Other</option>
        </select>
        <button onClick={fetchIssues} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: 'var(--card-bg-glass)', border: '1px solid var(--border-light)', borderRadius: '40px', cursor: 'pointer' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Issues List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg-glass)', borderRadius: '20px' }}>
            <CheckCircle size={48} style={{ marginBottom: '16px', color: '#22c55e' }} />
            <p>No {statusFilter} issues found</p>
          </div>
        ) : (
          issues.map((issue, index) => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '20px' }}>{getTypeIcon(issue.type)}</span>
                    <strong>{issue.subject}</strong>
                    {getStatusBadge(issue.status)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    From: {issue.nickname || issue.name} • {issue.email}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {issue.status === 'pending' && (
                    <button
                      onClick={() => openResponseModal(issue)}
                      style={{ padding: '6px 12px', background: '#22c55e', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <MessageSquare size={14} /> Resolve & Respond
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteIssue(issue.id)}
                    style={{ padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '12px' }}>
                <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{issue.message}</p>
              </div>
              
              {issue.admin_response && (
                <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', marginTop: '8px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <strong style={{ fontSize: '12px' }}>Admin Response:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{issue.admin_response}</p>
                </div>
              )}
              
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px' }}>
                Submitted: {new Date(issue.created_at).toLocaleString()}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >
            Previous
          </button>
          <span style={{ padding: '8px 16px' }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedIssue && (
        <div className="modal-overlay" onClick={() => setShowResponseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Resolve Issue</h3>
              <button className="modal-close" onClick={() => setShowResponseModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <strong>Issue:</strong> {selectedIssue.subject}
                <p style={{ marginTop: '8px', fontSize: '13px' }}>{selectedIssue.message}</p>
              </div>
              <div className="input-group">
                <label className="input-label">Admin Response (will be sent to user)</label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Write your response to the user..."
                  className="peer-textarea"
                  rows="4"
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowResponseModal(false)} className="peer-btn-secondary">Cancel</button>
                <button onClick={submitResponse} className="peer-btn-primary">Mark as Resolved & Send Response</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminIssues;