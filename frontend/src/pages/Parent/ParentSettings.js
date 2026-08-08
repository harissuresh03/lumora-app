// frontend/src/pages/Parent/ParentSettings.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";
import Layout from "../components/Layout";
import { useTheme } from "../components/ThemeProvider";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import {
  User,
  Moon,
  Sun,
  Contrast,
  Eye,
  Trash2,
  AlertTriangle,
  Mail,
  Shield,
  Save,
  EyeOff,
  Lock,
  LayoutDashboard,
  Settings as SettingsIcon,
  ArrowLeft
} from "lucide-react";

function ParentSettings() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Report Issue State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubject, setReportSubject] = useState("");
  const [reportMessage, setReportMessage] = useState("");
  const [reportType, setReportType] = useState("bug");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  
  // Theme
  const { theme, fontSize, setTheme, setFontSize, getFontSizeInPx } = useTheme();

  // Profile State
  const [profile, setProfile] = useState({
    name: "",
    nickname: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Parent menu items with correct paths
  const parentMenuItems = [
    { path: "/parent/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { path: "/parent/settings", icon: <SettingsIcon size={18} />, label: "Settings" },
  ];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        setProfile({
          name: res.data.name || "",
          nickname: res.data.nickname || "",
          email: res.data.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        localStorage.setItem("user_nickname", res.data.nickname || res.data.name || "Parent");
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };
    fetchUserProfile();
  }, [user_id]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      showErrorToast("New passwords do not match");
      setLoading(false);
      return;
    }
    
    if (profile.newPassword && profile.newPassword.length < 6) {
      showErrorToast("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    try {
      await api.put(`/profile/update/${user_id}`, {
        name: profile.name,
        nickname: profile.nickname,
        email: profile.email,
        password: profile.newPassword || "",
        currentPassword: profile.currentPassword
      });
      showSuccessToast("Profile updated successfully");
      setProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      if (profile.nickname) localStorage.setItem("user_nickname", profile.nickname);
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      showErrorToast('Please type "DELETE" to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/auth/account/${user_id}`);
      localStorage.clear();
      showSuccessToast("Account deleted successfully. 💙");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Delete account error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleReportIssue = async () => {
    if (!reportSubject.trim()) {
      showErrorToast("Please enter a subject");
      return;
    }
    if (!reportMessage.trim()) {
      showErrorToast("Please describe the issue");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await api.post("/support/report-issue", {
        user_id: parseInt(user_id),
        subject: reportSubject,
        message: reportMessage,
        type: reportType
      });
      showSuccessToast("Thank you for your report! We'll look into it. 🙏");
      setShowReportModal(false);
      setReportSubject("");
      setReportMessage("");
      setReportType("bug");
    } catch (err) {
      console.error("Report issue error:", err);
      showErrorToast("Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const resetAllSettings = () => {
    setTheme('light');
    setFontSize('medium');
    showSuccessToast("All appearance settings reset to default!");
  };

  return (
    <Layout customMenuItems={parentMenuItems}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* ✅ Page Header with Back Button */}
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => navigate("/parent/dashboard")} 
            className="back-arrow-btn"
            style={{
              background: 'var(--card-bg-glass)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--border-glass)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-soft)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card-bg-glass)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--accent-primary)' }} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Settings</h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Customize your parent experience
            </p>
          </div>
        </div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye size={20} /> Appearance
          </h2>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>Theme</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <button
                onClick={() => setTheme('light')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: theme === 'light' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: theme === 'light' ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                <Sun size={24} />
                <span>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: theme === 'dark' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: theme === 'dark' ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                <Moon size={24} />
                <span>Dark</span>
              </button>
              <button
                onClick={() => setTheme('high-contrast')}
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  border: theme === 'high-contrast' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  background: theme === 'high-contrast' ? 'var(--accent-soft)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text-primary)'
                }}
              >
                <Contrast size={24} />
                <span>High Contrast</span>
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>Text Size</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['small', 'medium', 'large', 'x-large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    border: fontSize === size ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                    background: fontSize === size ? 'var(--accent-soft)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : size === 'large' ? '16px' : '18px',
                    textTransform: 'capitalize',
                    color: 'var(--text-primary)'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <p style={{ fontSize: getFontSizeInPx(), color: 'var(--text-primary)' }}>Preview text: This is how text will look at this size.</p>
            </div>
          </div>

          <button
            onClick={resetAllSettings}
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--border-light)',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--accent-primary)',
              width: '100%'
            }}
          >
            Reset All Appearance Settings to Default
          </button>
        </motion.div>

        {/* Profile Information Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={20} /> Profile Information
          </h2>

          <form onSubmit={handleProfileUpdate}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Nickname</label>
                <input
                  type="text"
                  value={profile.nickname}
                  onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                  className="input-field"
                  placeholder="How others see you"
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} /> Change Password
              </h3>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group">
                  <label className="input-label">Current Password</label>
                  <input
                    type="password"
                    value={profile.currentPassword}
                    onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                    className="input-field"
                    placeholder="Required to change password"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={profile.newPassword}
                      onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                      className="input-field"
                      placeholder="Min 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <input
                    type="password"
                    value={profile.confirmPassword}
                    onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="primary-btn" style={{ width: 'auto', padding: '12px 32px' }}>
              <Save size={16} style={{ marginRight: '8px' }} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} /> Support
          </h2>

          <button
            onClick={() => setShowReportModal(true)}
            style={{
              width: '100%',
              padding: '14px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}
          >
            <Mail size={18} /> Report an Issue
          </button>

          <div style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <strong style={{ color: '#ef4444' }}>Danger Zone</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Once you delete your account, there is no going back. All your data will be permanently removed.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </motion.div>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '450px' }}
              >
                <div className="modal-header">
                  <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} /> Delete Account
                  </h3>
                  <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
                </div>
                <div className="modal-content">
                  <p style={{ marginBottom: '16px' }}>
                    This action <strong>cannot be undone</strong>. This will permanently delete:
                  </p>
                  <ul style={{ marginBottom: '20px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                    <li>Your profile information</li>
                    <li>Your linked student data (if any)</li>
                    <li>All your account data</li>
                  </ul>
                  <p style={{ marginBottom: '16px', fontWeight: 500 }}>
                    Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE here"
                    className="input-field"
                    style={{ marginBottom: '20px' }}
                  />
                  <div className="modal-actions">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="peer-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        opacity: isDeleting ? 0.6 : 1
                      }}
                    >
                      {isDeleting ? "Deleting..." : "Permanently Delete"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Issue Modal */}
        <AnimatePresence>
          {showReportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-overlay"
              onClick={() => setShowReportModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px' }}
              >
                <div className="modal-header">
                  <h3>Report an Issue</h3>
                  <button className="modal-close" onClick={() => setShowReportModal(false)}>✕</button>
                </div>
                <div className="modal-content">
                  <div className="input-group">
                    <label className="input-label">Issue Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="input-field"
                    >
                      <option value="bug">🐛 Bug / Technical Issue</option>
                      <option value="feature">💡 Feature Request</option>
                      <option value="content">📝 Content Issue</option>
                      <option value="privacy">🔒 Privacy Concern</option>
                      <option value="other">❓ Other</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Subject</label>
                    <input
                      type="text"
                      value={reportSubject}
                      onChange={(e) => setReportSubject(e.target.value)}
                      className="input-field"
                      placeholder="Brief summary of the issue"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Description</label>
                    <textarea
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      className="peer-textarea"
                      rows="5"
                      placeholder="Please provide detailed information about the issue..."
                    />
                  </div>

                  <div style={{
                    padding: '12px',
                    background: 'var(--accent-soft)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px'
                  }}>
                    <Shield size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Our team will review your report and get back to you within 48 hours.
                  </div>

                  <div className="modal-actions">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="peer-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReportIssue}
                      disabled={isSubmittingReport}
                      className="peer-btn-primary"
                    >
                      {isSubmittingReport ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default ParentSettings;