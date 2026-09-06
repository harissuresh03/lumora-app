// frontend/src/pages/components/DeadlineModal.js
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "./ToastNotification";
import { Plus, Trash2, Edit } from "lucide-react";

function DeadlineModal({ userId, onClose, onUpdate }) {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    type: "assignment",
    due_date: "",
    difficulty: "medium"
  });

  const fetchDeadlines = useCallback(async () => {
    try {
      const res = await api.get(`/deadlines/${userId}`);
      setDeadlines(res.data);
    } catch (err) {
      console.error("Fetch deadlines error:", err);
      showErrorToast("Failed to fetch deadlines");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
  fetchDeadlines();
}, [fetchDeadlines]);

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.due_date) {
      showErrorToast("Title and due date are required");
      return;
    }

    try {
      await api.post("/deadlines", {
        user_id: parseInt(userId),
        ...formData
      });
      showSuccessToast("Deadline added!");
      setFormData({ title: "", subject: "", type: "assignment", due_date: "", difficulty: "medium" });
      setShowAddForm(false);
      await fetchDeadlines();
      if (onUpdate) onUpdate();
    } catch (err) {
      showErrorToast("Failed to add deadline");
    }
  };

  const handleUpdateDeadline = async (id) => {
    try {
      const deadline = deadlines.find(d => d.id === id);
      const updatedData = {
        title: formData.title || deadline.title,
        subject: formData.subject || deadline.subject,
        type: formData.type || deadline.type,
        due_date: formData.due_date || deadline.due_date,
        difficulty: formData.difficulty || deadline.difficulty
      };
      await api.put(`/deadlines/${id}`, updatedData);
      showSuccessToast("Deadline updated!");
      setEditingId(null);
      setFormData({ title: "", subject: "", type: "assignment", due_date: "", difficulty: "medium" });
      await fetchDeadlines();
      if (onUpdate) onUpdate();
    } catch (err) {
      showErrorToast("Failed to update deadline");
    }
  };

  const handleDeleteDeadline = async (id) => {
    if (window.confirm("Are you sure you want to delete this deadline?")) {
      try {
        await api.delete(`/deadlines/${id}`);
        showSuccessToast("Deadline deleted");
        await fetchDeadlines();
        if (onUpdate) onUpdate();
      } catch (err) {
        showErrorToast("Failed to delete deadline");
      }
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      await api.put(`/deadlines/${id}`, { is_complete: !currentStatus });
      showSuccessToast(currentStatus ? "Marked as incomplete" : "Marked as complete!");
      await fetchDeadlines();
      if (onUpdate) onUpdate();
    } catch (err) {
      showErrorToast("Failed to update deadline");
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };
    return colors[difficulty] || "#6b7280";
  };

  const getTypeIcon = (type) => {
    return type === "exam" ? "📝" : "📄";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
          <div className="loading-container" style={{ padding: "40px" }}>
            <div className="spinner"></div>
            <p>Loading deadlines...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "550px", maxHeight: "90vh", overflow: "auto" }}
      >
        <div className="modal-header">
          <h3>📚 Manage Deadlines</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* Add Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              width: "100%",
              padding: "10px",
              background: showAddForm ? "var(--bg-secondary)" : "var(--accent-gradient)",
              border: "none",
              borderRadius: "8px",
              color: showAddForm ? "var(--text-secondary)" : "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "16px"
            }}
          >
            <Plus size={16} /> {showAddForm ? "Cancel" : "Add New Deadline"}
          </button>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddDeadline} style={{ marginBottom: "20px", padding: "16px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
              <div className="input-group">
                <label className="input-label">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Research Paper"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Psychology"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="input-group">
                  <label className="input-label">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="exam">Exam</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="input-field"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Due Date *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-field"
                />
              </div>
              <button type="submit" className="primary-btn">Add Deadline</button>
            </form>
          )}

          {/* Deadlines List */}
          {deadlines.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <p>No deadlines yet</p>
              <p style={{ fontSize: "13px" }}>Add your assignments and exams to get stress forecasts.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  style={{
                    padding: "14px",
                    background: deadline.is_complete ? "var(--bg-secondary)" : "var(--card-bg-glass)",
                    borderRadius: "12px",
                    border: deadline.is_complete ? "1px solid var(--border-light)" : "1px solid var(--border-glass)",
                    opacity: deadline.is_complete ? 0.7 : 1,
                    transition: "all 0.2s"
                  }}
                >
                  {editingId === deadline.id ? (
                    // Edit Mode
                    <div>
                      <div className="input-group">
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="input-field"
                          placeholder="Title"
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div className="input-group">
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="input-field"
                            placeholder="Subject"
                          />
                        </div>
                        <div className="input-group">
                          <input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="input-field"
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                        <button
                          onClick={() => handleUpdateDeadline(deadline.id)}
                          className="primary-btn"
                          style={{ padding: "6px 16px", width: "auto" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setFormData({ title: "", subject: "", type: "assignment", due_date: "", difficulty: "medium" }); }}
                          className="secondary-btn"
                          style={{ padding: "6px 16px" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                        <button
                          onClick={() => handleToggleComplete(deadline.id, deadline.is_complete)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "20px",
                            color: deadline.is_complete ? "#22c55e" : "var(--text-muted)"
                          }}
                        >
                          {deadline.is_complete ? "✅" : "⬜"}
                        </button>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: "14px", textDecoration: deadline.is_complete ? "line-through" : "none" }}>
                            {deadline.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {getTypeIcon(deadline.type)} {deadline.subject || "No subject"} • {formatDate(deadline.due_date)}
                            <span style={{
                              marginLeft: "8px",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "10px",
                              background: getDifficultyColor(deadline.difficulty),
                              color: "white"
                            }}>
                              {deadline.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => {
                            setEditingId(deadline.id);
                            setFormData({
                              title: deadline.title,
                              subject: deadline.subject || "",
                              type: deadline.type,
                              due_date: deadline.due_date,
                              difficulty: deadline.difficulty
                            });
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteDeadline(deadline.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "4px" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default DeadlineModal;