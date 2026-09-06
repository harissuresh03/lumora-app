// frontend/src/pages/Counsellor/CounsellorSettings.js
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { useTheme } from "../components/ThemeProvider";
import {
  User,
  ArrowLeft,
  Moon,
  Sun,
  Contrast,
  Eye,
  Trash2,
  AlertTriangle,
  Save,
  EyeOff,
  Lock
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

function CounsellorSettings() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Theme
  const { theme, fontSize, setTheme, setFontSize, getFontSizeInPx } = useTheme();

  // Profile State
  const [profile, setProfile] = useState({
    name: "",
    nickname: "",
    email: "",
    university_name: "",
    university_id: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Universities for dropdown
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get(`/profile/${user_id}`);
      setProfile({
        name: res.data.name || "",
        nickname: res.data.nickname || "",
        email: res.data.email || "",
        university_name: res.data.university_name || "",
        university_id: res.data.university_id || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      if (res.data.nickname) setUserNickname(res.data.nickname);
      else setUserNickname(res.data.name.split(" ")[0]);
    } catch (err) {
      console.log("Profile fetch error:", err);
    }
  }, [user_id]);

  useEffect(() => {
  fetchUserProfile();
  fetchUniversities();
}, [fetchUserProfile]);

  const fetchUniversities = async () => {
    try {
      const res = await api.get("/universities");
      setUniversities(res.data);
    } catch (err) {
      console.error("Fetch universities error:", err);
    } finally {
      setLoadingUniversities(false);
    }
  };

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
        university_id: profile.university_id || null,
        password: profile.newPassword || "",
        currentPassword: profile.currentPassword
      });
      showSuccessToast("Profile updated successfully");
      setProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      if (profile.nickname) localStorage.setItem("user_nickname", profile.nickname);
      fetchUserProfile();
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const resetAllSettings = () => {
    setTheme('light');
    setFontSize('medium');
    showSuccessToast("All appearance settings reset to default!");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE COUNSELLOR") {
      showErrorToast('Please type "DELETE COUNSELLOR" to confirm');
      return;
    }
    
    try {
      await api.delete(`/auth/account/${user_id}`);
      localStorage.clear();
      showSuccessToast("Account deleted successfully");
      navigate("/");
    } catch (err) {
      showErrorToast("Failed to delete account");
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="page-header">
        <button onClick={() => navigate("/counsellor")} className="back-arrow-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your counsellor experience</p>
        </div>
      </div>

      {/* Appearance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          border: '1px solid var(--border-glass)'
        }}
      >
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye size={22} /> Appearance
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
                background: theme === 'light' ? 'var(--accent-soft)' : 'var(--card-bg-solid)',
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
                background: theme === 'dark' ? 'var(--accent-soft)' : 'var(--card-bg-solid)',
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
                background: theme === 'high-contrast' ? 'var(--accent-soft)' : 'var(--card-bg-solid)',
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
                  background: fontSize === size ? 'var(--accent-soft)' : 'var(--card-bg-solid)',
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
            <p style={{ fontSize: getFontSizeInPx(), color: 'var(--text-primary)' }}>
              Preview text: This is how text will look at this size.
            </p>
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

      {/* Profile Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '24px',
          border: '1px solid var(--border-glass)'
        }}
      >
        <h2 style={{ fontSize: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={22} /> Profile Settings
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

          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label className="input-label">University</label>
            {loadingUniversities ? (
              <div className="loading-text">Loading universities...</div>
            ) : (
              <select
                value={profile.university_id}
                onChange={(e) => setProfile({ ...profile, university_id: e.target.value })}
                className="input-field"
              >
                <option value="">Select your university</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            )}
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

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}
      >
        <h2 style={{ fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
          <AlertTriangle size={22} /> Danger Zone
        </h2>
        <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
          Once you delete your counsellor account, there is no going back. All your data will be permanently removed.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          style={{
            padding: '12px 24px',
            background: '#ef4444',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          <Trash2 size={16} /> Delete Account
        </button>
      </motion.div>

      {/* Delete Confirmation Modal */}
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
                <h3 style={{ color: '#ef4444' }}>Delete Counsellor Account</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="modal-content">
                <p style={{ marginBottom: '16px' }}>
                  This action <strong>cannot be undone</strong>. This will permanently delete your counsellor account and all associated data.
                </p>
                <p style={{ marginBottom: '16px', fontWeight: 500 }}>
                  Type <strong style={{ color: '#ef4444' }}>DELETE COUNSELLOR</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE COUNSELLOR here"
                  className="input-field"
                  style={{ marginBottom: '20px' }}
                />
                <div className="modal-actions">
                  <button onClick={() => setShowDeleteModal(false)} className="peer-btn-secondary">Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={isDeleting} className="peer-btn-primary" style={{ background: '#ef4444' }}>
                    {isDeleting ? "Deleting..." : "Delete Account"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CounsellorSettings;