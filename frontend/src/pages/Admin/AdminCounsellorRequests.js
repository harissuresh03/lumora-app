// frontend/src/pages/Admin/AdminCounsellorRequests.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { CheckCircle, XCircle, Trash2, Eye, RefreshCw, Clock, UserCheck, UserX } from "lucide-react";

function AdminCounsellorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/counsellor-requests", {
        params: { status: statusFilter, page, limit: 20 }
      });
      setRequests(res.data.requests);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Fetch requests error:", err);
      showErrorToast("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Are you sure you want to approve this counsellor registration?")) {
      try {
        await api.put(`/admin/counsellor-requests/${id}/approve`, { admin_notes: adminNotes });
        showSuccessToast("Counsellor registration approved successfully");
        setAdminNotes("");
        setShowModal(false);
        fetchRequests();
      } catch (err) {
        showErrorToast(err.response?.data?.msg || "Failed to approve");
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this counsellor registration?")) {
      try {
        await api.put(`/admin/counsellor-requests/${id}/reject`, { admin_notes: adminNotes });
        showSuccessToast("Counsellor registration rejected");
        setAdminNotes("");
        setShowModal(false);
        fetchRequests();
      } catch (err) {
        showErrorToast(err.response?.data?.msg || "Failed to reject");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this request?")) {
      try {
        await api.delete(`/admin/counsellor-requests/${id}`);
        showSuccessToast("Request deleted");
        fetchRequests();
      } catch (err) {
        showErrorToast("Failed to delete");
      }
    }
  };

  const openActionModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes("");
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "#f59e0b", icon: <Clock size={14} />, label: "Pending" },
      approved: { color: "#22c55e", icon: <CheckCircle size={14} />, label: "Approved" },
      rejected: { color: "#ef4444", icon: <XCircle size={14} />, label: "Rejected" }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", background: badge.color, color: "white", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading requests...</p></div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👨‍🏫 Counsellor Registration Requests
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>({requests.length})</span>
        </h2>
        <button
          onClick={fetchRequests}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--card-bg-glass)', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setStatusFilter('pending')}
          style={{
            padding: '10px 24px',
            borderRadius: '40px',
            border: 'none',
            background: statusFilter === 'pending' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
            color: statusFilter === 'pending' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Pending
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          style={{
            padding: '10px 24px',
            borderRadius: '40px',
            border: 'none',
            background: statusFilter === 'approved' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
            color: statusFilter === 'approved' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          style={{
            padding: '10px 24px',
            borderRadius: '40px',
            border: 'none',
            background: statusFilter === 'rejected' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
            color: statusFilter === 'rejected' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Rejected
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          style={{
            padding: '10px 24px',
            borderRadius: '40px',
            border: 'none',
            background: statusFilter === 'all' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
            color: statusFilter === 'all' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          All
        </button>
      </div>

      {/* Requests List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg-glass)', borderRadius: '20px' }}>
            <CheckCircle size={48} style={{ marginBottom: '16px', color: '#22c55e' }} />
            <p>No {statusFilter} requests found</p>
          </div>
        ) : (
          requests.map((request, idx) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '16px' }}>{request.name}</strong>
                    {request.nickname && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{request.nickname}</span>}
                    {getStatusBadge(request.status)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    📧 {request.email}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    🏛️ {request.university_name || 'University not specified'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    📅 Requested: {formatDate(request.created_at)}
                  </div>
                  {request.qualification && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      🎓 {request.qualification}
                    </div>
                  )}
                  {request.experience && (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      💼 {request.experience}
                    </div>
                  )}
                  {request.admin_notes && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      📝 Admin: {request.admin_notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {request.status === 'pending' && (
                    <>
                      <button
                        onClick={() => openActionModal(request)}
                        style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '30px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(request.id)}
                    style={{ padding: '8px 16px', background: '#ef4444', border: 'none', borderRadius: '30px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
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

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Review Counsellor Registration</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '14px' }}>{selectedRequest.name}</strong>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📧 {selectedRequest.email}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>🏛️ {selectedRequest.university_name}</div>
                {selectedRequest.qualification && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    <strong>Qualification:</strong> {selectedRequest.qualification}
                  </div>
                )}
                {selectedRequest.experience && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    <strong>Experience:</strong> {selectedRequest.experience}
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="peer-textarea"
                  rows="3"
                  placeholder="Add notes about this decision..."
                />
              </div>

              <div className="modal-actions">
                <button onClick={() => setShowModal(false)} className="peer-btn-secondary">Cancel</button>
                <button 
                  onClick={() => handleReject(selectedRequest.id)}
                  style={{ padding: '10px 20px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <XCircle size={14} /> Reject
                </button>
                <button 
                  onClick={() => handleApprove(selectedRequest.id)}
                  style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCounsellorRequests;