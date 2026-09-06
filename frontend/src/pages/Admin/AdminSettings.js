// frontend/src/pages/Admin/AdminSettings.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { useTheme } from "../components/ThemeProvider";
import {
  User,
  Lock,
  Globe,
  Save,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Sun,
  Moon,
  Monitor,
  Eye as EyeIcon
} from "lucide-react";
import { AnimatePresence } from "framer-motion";

function AdminSettings() {
  const navigate = useNavigate();
  const { theme, setTheme, fontSize, setFontSize, getFontSizeInPx } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  
  const [profile, setProfile] = useState({
    name: "",
    nickname: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [systemSettings, setSystemSettings] = useState({
    siteName: "Lumora",
    maintenanceMode: false,
    allowRegistrations: true,
    defaultUserRole: "student",
    sessionTimeout: 60
  });

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        const res = await api.get(`/profile/${userId}`);
        setProfile(prev => ({
          ...prev,
          name: res.data.name || "",
          nickname: res.data.nickname || "",
          email: res.data.email || ""
        }));
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    };

    const fetchSystemSettings = async () => {
      try {
        const res = await api.get("/admin/settings");
        if (res.data) {
          setSystemSettings(prev => ({
            ...prev,
            maintenanceMode: res.data.maintenanceMode === true || res.data.maintenanceMode === 'true',
            allowRegistrations: res.data.allowRegistrations === true || res.data.allowRegistrations === 'true',
            defaultUserRole: res.data.defaultUserRole || 'student',
            sessionTimeout: parseInt(res.data.sessionTimeout) || 60
          }));
        }
      } catch (err) {
        console.error("Fetch settings error:", err);
      }
    };

    fetchAdminProfile();
    fetchSystemSettings();
  }, []);

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
      const userId = localStorage.getItem("user_id");
      await api.put(`/profile/update/${userId}`, {
        name: profile.name,
        nickname: profile.nickname,
        email: profile.email,
        password: profile.newPassword || "",
        currentPassword: profile.currentPassword
      });
      showSuccessToast("Profile updated successfully");
      setProfile(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsUpdate = async () => {
    setSavingSystem(true);
    try {
      const payload = {
        maintenanceMode: systemSettings.maintenanceMode,
        allowRegistrations: systemSettings.allowRegistrations,
        defaultUserRole: systemSettings.defaultUserRole,
        sessionTimeout: systemSettings.sessionTimeout
      };
      
      await api.put("/admin/settings", payload);
      showSuccessToast("System settings updated successfully");
      const refreshRes = await api.get("/admin/settings");
      if (refreshRes.data) {
        setSystemSettings(prev => ({
          ...prev,
          maintenanceMode: refreshRes.data.maintenanceMode === true || refreshRes.data.maintenanceMode === 'true',
          allowRegistrations: refreshRes.data.allowRegistrations === true || refreshRes.data.allowRegistrations === 'true',
          defaultUserRole: refreshRes.data.defaultUserRole || 'student',
          sessionTimeout: parseInt(refreshRes.data.sessionTimeout) || 60
        }));
      }
    } catch (err) {
      console.error("Save system settings error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to update system settings");
    } finally {
      setSavingSystem(false);
    }
  };

  const resetAllSettings = () => {
    setTheme('light');
    setFontSize('medium');
    showSuccessToast("All appearance settings reset to default!");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE ADMIN") {
      showErrorToast('Please type "DELETE ADMIN" to confirm');
      return;
    }
    
    try {
      const userId = localStorage.getItem("user_id");
      await api.delete(`/auth/account/${userId}`);
      localStorage.clear();
      showSuccessToast("Admin account deleted");
      navigate("/");
    } catch (err) {
      showErrorToast("Failed to delete account");
    }
  };

  return (
    <div>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Appearance Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
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
            <EyeIcon size={22} /> Appearance
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
                <Monitor size={24} />
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

        {/* System Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
            <Globe size={22} /> System Settings
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span>Maintenance Mode</span>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  background: systemSettings.maintenanceMode ? '#ef4444' : 'var(--border-light)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  position: 'absolute',
                  width: '22px',
                  height: '22px',
                  borderRadius: '11px',
                  background: 'white',
                  top: '2px',
                  left: systemSettings.maintenanceMode ? '26px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span>Allow New Registrations</span>
              <button
                onClick={() => setSystemSettings({ ...systemSettings, allowRegistrations: !systemSettings.allowRegistrations })}
                style={{
                  width: '50px',
                  height: '26px',
                  borderRadius: '13px',
                  background: systemSettings.allowRegistrations ? '#22c55e' : 'var(--border-light)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  position: 'absolute',
                  width: '22px',
                  height: '22px',
                  borderRadius: '11px',
                  background: 'white',
                  top: '2px',
                  left: systemSettings.allowRegistrations ? '26px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </label>
            
            <div className="input-group">
              <label className="input-label">Default User Role</label>
              <select
                value={systemSettings.defaultUserRole}
                onChange={(e) => setSystemSettings({ ...systemSettings, defaultUserRole: e.target.value })}
                className="input-field"
              >
                <option value="student">Student</option>
                <option value="counsellor">Counsellor</option>
              </select>
            </div>
            
            <div className="input-group">
              <label className="input-label">Session Timeout (minutes)</label>
              <input
                type="number"
                value={systemSettings.sessionTimeout}
                onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: parseInt(e.target.value) })}
                className="input-field"
                min="15"
                max="480"
              />
            </div>
            
            <button 
              onClick={handleSystemSettingsUpdate} 
              className="primary-btn" 
              style={{ width: 'auto', padding: '10px 24px', marginTop: '8px' }}
              disabled={savingSystem}
            >
              <Save size={14} style={{ marginRight: '6px' }} />
              {savingSystem ? "Saving..." : "Save System Settings"}
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
            Once you delete your admin account, there is no going back. All your data will be permanently removed.
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
            <Trash2 size={16} /> Delete Admin Account
          </button>
        </motion.div>
      </div>

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
                <h3 style={{ color: '#ef4444' }}>Delete Admin Account</h3>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
              </div>
              <div className="modal-content">
                <p style={{ marginBottom: '16px' }}>
                  This action <strong>cannot be undone</strong>. This will permanently delete your admin account.
                </p>
                <p style={{ marginBottom: '16px', fontWeight: 500 }}>
                  Type <strong style={{ color: '#ef4444' }}>DELETE ADMIN</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type DELETE ADMIN here"
                  className="input-field"
                  style={{ marginBottom: '20px' }}
                />
                <div className="modal-actions">
                  <button onClick={() => setShowDeleteModal(false)} className="peer-btn-secondary">Cancel</button>
                  <button onClick={handleDeleteAccount} className="peer-btn-primary" style={{ background: '#ef4444' }}>Delete Account</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminSettings;