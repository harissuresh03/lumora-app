// frontend/src/pages/Counsellor/CounsellorAppointments.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import ExportButton from "../components/ExportButton";
import { Calendar, Clock, CheckCircle, XCircle, Plus, FileSpreadsheet, Trash2 } from "lucide-react";

function CounsellorAppointments() {
  const counsellorId = localStorage.getItem("user_id");
  const [appointments, setAppointments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [formData, setFormData] = useState({
    student_id: "",
    session_date: "",
    duration: 60,
    notes: ""
  });

  useEffect(() => {
    fetchAppointments();
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/counsellor/appointments/${counsellorId}`, {
        params: { status: statusFilter === 'all' ? undefined : statusFilter }
      });
      setAppointments(res.data || []);
    } catch (err) {
      console.error("Fetch appointments error:", err);
      showErrorToast("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/counsellor/students/${counsellorId}`, {
        params: { limit: 100 }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Fetch students error:", err);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.session_date) {
      showErrorToast("Please select a student and date");
      return;
    }

    try {
      await api.post("/counsellor/appointments", {
        counsellor_id: parseInt(counsellorId),
        student_id: parseInt(formData.student_id),
        session_date: formData.session_date,
        duration: formData.duration || 60,
        notes: formData.notes || null
      });
      showSuccessToast("Appointment created and confirmed");
      setShowModal(false);
      setFormData({ student_id: "", session_date: "", duration: 60, notes: "" });
      fetchAppointments();
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to create appointment");
    }
  };

  const handleStatusUpdate = async (id, status, notes = null) => {
    try {
      const payload = { status };
      if (notes !== null) {
        payload.notes = notes;
      }
      
      await api.put(`/counsellor/appointments/${id}/status`, payload);
      
      const statusMessages = {
        confirmed: 'Appointment confirmed ✅',
        cancelled: 'Appointment cancelled ❌',
        completed: 'Appointment marked as completed ✅'
      };
      showSuccessToast(statusMessages[status] || `Appointment ${status}`);
      fetchAppointments();
    } catch (err) {
      showErrorToast("Failed to update status");
    }
  };

  const handleCompleteClick = (id) => {
    setSelectedAppointmentId(id);
    setCompletionNotes("");
    setShowCompleteModal(true);
  };

  const handleCompleteWithNotes = async () => {
    if (selectedAppointmentId) {
      await handleStatusUpdate(selectedAppointmentId, 'completed', completionNotes);
      setShowCompleteModal(false);
      setSelectedAppointmentId(null);
      setCompletionNotes("");
    }
  };

  // ✅ Delete Appointment Handler
  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/counsellor/appointments/${id}`);
      showSuccessToast("Appointment deleted successfully");
      fetchAppointments();
    } catch (err) {
      console.error("Delete appointment error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to delete appointment");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      completed: '#22c55e',
      cancelled: '#ef4444'
    };
    const labels = {
      pending: '⏳ Pending',
      confirmed: '✅ Confirmed',
      completed: '✔️ Completed',
      cancelled: '❌ Cancelled'
    };
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        background: colors[status] || '#9ca3af', 
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {labels[status] || status}
      </span>
    );
  };

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  if (loading && appointments.length === 0) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading appointments...</p></div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}
          >
            <option value="all">All ({appointments.length})</option>
            <option value="pending">⏳ Pending ({pendingCount})</option>
            <option value="confirmed">✅ Confirmed</option>
            <option value="completed">✔️ Completed</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton 
            type="counsellor-appointments"
            userId={parseInt(counsellorId)}
            label="Export CSV"
            icon={<FileSpreadsheet size={16} />}
            variant="primary"
          />
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '40px', color: 'white', cursor: 'pointer' }}
          >
            <Plus size={16} /> Schedule Session
          </button>
        </div>
      </div>

      {/* Pending Requests Banner */}
      {pendingCount > 0 && (
        <div style={{
          padding: '12px 20px',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Clock size={18} color="#f59e0b" />
          <span style={{ fontSize: '14px', color: '#f59e0b' }}>
            {pendingCount} pending appointment request{pendingCount > 1 ? 's' : ''} from student{pendingCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Appointments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'var(--card-bg-glass)', borderRadius: '20px' }}>
            <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No appointments found</p>
          </div>
        ) : (
          appointments.map((appt, idx) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '16px',
                padding: '20px',
                border: appt.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '16px' }}>{appt.student_name}</strong>
                  {appt.student_nickname && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{appt.student_nickname}</span>}
                  {getStatusBadge(appt.status)}
                  {appt.created_by === 'student' && appt.status === 'pending' && (
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#f59e0b',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '2px 10px',
                      borderRadius: '12px'
                    }}>
                      Student Requested
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {formatDate(appt.session_date)}
                  <Clock size={14} style={{ display: 'inline', marginLeft: '16px', marginRight: '6px' }} />
                  {formatTime(appt.session_date)}
                  <span style={{ marginLeft: '16px' }}>⏱️ {appt.duration || 60} min</span>
                </div>
                {appt.notes && <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>📝 {appt.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {appt.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                      style={{ padding: '8px 18px', background: '#22c55e', border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appt.id, 'cancelled')}
                      style={{ padding: '8px 18px', background: '#ef4444', border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <XCircle size={14} /> Decline
                    </button>
                  </>
                )}
                {appt.status === 'confirmed' && (
                  <button
                    onClick={() => handleCompleteClick(appt.id)}
                    style={{ padding: '8px 18px', background: '#3b82f6', border: 'none', borderRadius: '20px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Mark Complete
                  </button>
                )}
                {/* ✅ Delete Button - Always visible for all statuses */}
                <button
                  onClick={() => handleDeleteAppointment(appt.id)}
                  style={{ 
                    padding: '8px 14px', 
                    background: '#ef4444', 
                    border: 'none', 
                    borderRadius: '20px', 
                    color: 'white', 
                    cursor: 'pointer', 
                    fontSize: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Appointment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Schedule Session (Counsellor Initiated)</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div style={{
                padding: '10px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#3b82f6'
              }}>
                Sessions created here will be automatically <strong>confirmed</strong>.
              </div>
              <form onSubmit={handleCreateAppointment}>
                <div className="input-group">
                  <label className="input-label">Student</label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.nickname || s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="input-field"
                    min="15"
                    max="120"
                    step="15"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="peer-textarea"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="peer-btn-secondary">Cancel</button>
                  <button type="submit" className="peer-btn-primary">Schedule (Confirm)</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Complete Appointment with Notes Modal */}
      {showCompleteModal && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Complete Appointment</h3>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                Add notes for this completed session (optional):
              </p>
              <div className="input-group">
                <label className="input-label">Session Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="peer-textarea"
                  rows="4"
                  placeholder="e.g., Topics discussed, progress made, action items, next steps..."
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowCompleteModal(false)} className="peer-btn-secondary">Cancel</button>
                <button onClick={handleCompleteWithNotes} className="peer-btn-primary">Complete Appointment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CounsellorAppointments;