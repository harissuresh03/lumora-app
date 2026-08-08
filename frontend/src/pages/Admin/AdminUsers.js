// frontend/src/pages/Admin/AdminUsers.js
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { Search, Download, Ban, UserCheck, Trash2, AlertTriangle } from "lucide-react";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warningFilter, setWarningFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        params: { page, role: roleFilter, status: statusFilter, warning: warningFilter, search }
      });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Fetch users error:", err);
      showErrorToast("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, warningFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      showSuccessToast(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      showErrorToast("Failed to update role");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-status`, { is_active: !currentStatus });
      showSuccessToast(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      showErrorToast("Failed to update status");
    }
  };

  const handleBanUser = async () => {
    if (!banReason) {
      showErrorToast("Please provide a reason for banning");
      return;
    }
    
    try {
      await api.post(`/admin/users/${selectedUser.id}/ban`, {
        ban_reason: banReason,
        duration_days: banDays || null
      });
      showSuccessToast(`User ${selectedUser.name} banned successfully`);
      setShowBanModal(false);
      setBanReason("");
      setBanDays("");
      fetchUsers();
    } catch (err) {
      showErrorToast("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/unban`);
      showSuccessToast("User unbanned successfully");
      fetchUsers();
    } catch (err) {
      showErrorToast("Failed to unban user");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/users/${userId}`);
        showSuccessToast("User deleted successfully");
        fetchUsers();
      } catch (err) {
        showErrorToast("Failed to delete user");
      }
    }
  };

  const exportUsers = async () => {
    try {
      const response = await api.get("/admin/users/export", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccessToast("Users exported successfully");
    } catch (err) {
      showErrorToast("Failed to export users");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return '#ef4444';
      case 'counsellor': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  const getWarningBadgeColor = (count) => {
    if (count >= 3) return '#ef4444';
    if (count >= 2) return '#f59e0b';
    if (count >= 1) return '#eab308';
    return '#22c55e';
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}>
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="counsellor">Counsellors</option>
            <option value="parent">Parents</option>
            <option value="admin">Admins</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
          <select value={warningFilter} onChange={(e) => setWarningFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '40px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)' }}>
            <option value="all">All Warnings</option>
            <option value="1">1 Warning</option>
            <option value="2">2 Warnings</option>
            <option value="3">3+ Warnings</option>
            <option value="banned">Banned Users</option>
          </select>
        </div>
        <button onClick={exportUsers} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '40px', color: 'white', cursor: 'pointer' }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Users Table */}
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
              <th style={{ padding: '16px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Warnings</th>
              <th style={{ padding: '16px', textAlign: 'left' }}>Joined</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px' }}>{user.id}</td>
                  <td style={{ padding: '16px' }}>
                    <strong>{user.name}</strong>
                    {user.nickname && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{user.nickname}</div>}
                  </td>
                  <td style={{ padding: '16px' }}>{user.email}</td>
                  <td style={{ padding: '16px' }}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border-light)', background: getRoleBadgeColor(user.role), color: 'white', fontWeight: 500 }}
                    >
                      <option value="student">Student</option>
                      <option value="counsellor">Counsellor</option>
                      <option value="parent">Parent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {user.is_blocked ? (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: '#ef4444', color: 'white' }}>Banned</span>
                    ) : user.is_active ? (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: '#22c55e', color: 'white' }}>Active</span>
                    ) : (
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', background: '#f59e0b', color: 'white' }}>Inactive</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      background: getWarningBadgeColor(user.warning_count), 
                      color: user.warning_count >= 3 ? 'white' : '#1f2937',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertTriangle size={12} />
                      {user.warning_count}/3
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: user.is_active ? '#f59e0b' : '#22c55e' }}
                        title={user.is_active ? "Deactivate" : "Activate"}
                      >
                        <UserCheck size={18} />
                      </button>
                      {!user.is_blocked ? (
                        <button
                          onClick={() => { setSelectedUser(user); setShowBanModal(true); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                          title="Ban User"
                        >
                          <Ban size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnbanUser(user.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22c55e' }}
                          title="Unban User"
                        >
                          <UserCheck size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                        title="Delete User"
                      >
                        <Trash2 size={18} />
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

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Ban User: {selectedUser.name}</h3>
              <button className="modal-close" onClick={() => setShowBanModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <div className="input-group">
                <label className="input-label">Reason for ban *</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Explain why this user is being banned..."
                  className="peer-textarea"
                  rows="3"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Ban Duration (days) - Leave empty for permanent</label>
                <input
                  type="number"
                  value={banDays}
                  onChange={(e) => setBanDays(e.target.value)}
                  placeholder="e.g., 7, 30, or leave empty"
                  className="input-field"
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowBanModal(false)} className="peer-btn-secondary">Cancel</button>
                <button onClick={handleBanUser} className="peer-btn-primary" style={{ background: '#ef4444' }}>Ban User</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;