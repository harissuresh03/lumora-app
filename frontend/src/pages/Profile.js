// frontend/src/pages/Profile.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Layout from "./components/Layout";
import { 
  User, 
  Mail, 
  BookOpen, 
  Heart, 
  LogOut, 
  ArrowLeft, 
  Building, 
  Calendar, 
  GraduationCap, 
  Shield,
  Award,
  Star,
  Sparkles
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";

function Profile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [user, setUser] = useState(null);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [loadingGamification, setLoadingGamification] = useState(true);

  // Parent/Guardian state
  const [parentEmail, setParentEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [parentData, setParentData] = useState(null);
  const [parentLoading, setParentLoading] = useState(true);
  const [shareMood, setShareMood] = useState(true);
  const [shareSleep, setShareSleep] = useState(true);
  const [shareStress, setShareStress] = useState(true);
  const [shareAssessments, setShareAssessments] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        setUser(res.data);
        if (res.data.nickname) {
          setUserNickname(res.data.nickname);
        } else {
          setUserNickname(res.data.name.split(" ")[0]);
        }
      } catch (err) {
        console.log("Profile fetch error:", err);
        if (err.response?.status === 401) navigate("/");
      }
    };
    
    const fetchGamificationStats = async () => {
      try {
        const res = await api.get(`/gamification/stats/${user_id}`);
        setGamificationStats(res.data);
      } catch (err) {
        console.error("Fetch gamification stats error:", err);
      } finally {
        setLoadingGamification(false);
      }
    };

    // ✅ UPDATED: Fetch parent data using the new endpoint
    const fetchParentData = async () => {
      try {
        const res = await api.get(`/parent/my-parent`);
        if (res.data.hasParent) {
          setParentData({
            parent_id: res.data.parent_id,
            email: res.data.email,
            consent_granted: res.data.consent_granted,
            share_mood: res.data.share_mood,
            share_sleep: res.data.share_sleep,
            share_stress: res.data.share_stress,
            share_assessments: res.data.share_assessments
          });
          setShareMood(res.data.share_mood);
          setShareSleep(res.data.share_sleep);
          setShareStress(res.data.share_stress);
          setShareAssessments(res.data.share_assessments);
        }
      } catch (err) {
        console.error("Fetch parent data error:", err);
      } finally {
        setParentLoading(false);
      }
    };

    fetchUserProfile();
    fetchGamificationStats();
    fetchParentData();
  }, [user_id, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Invite parent
  const inviteParent = async () => {
    if (!parentEmail.trim()) {
      showErrorToast("Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      const res = await api.post("/parent/invite", { parent_email: parentEmail });
      showSuccessToast(res.data.msg || "Invitation sent successfully!");
      setParentEmail("");
      // Refresh parent data
      const parentRes = await api.get(`/parent/my-parent`);
      if (parentRes.data.hasParent) {
        setParentData({
          parent_id: parentRes.data.parent_id,
          email: parentRes.data.email,
          consent_granted: parentRes.data.consent_granted,
          share_mood: parentRes.data.share_mood,
          share_sleep: parentRes.data.share_sleep,
          share_stress: parentRes.data.share_stress,
          share_assessments: parentRes.data.share_assessments
        });
        setShareMood(parentRes.data.share_mood);
        setShareSleep(parentRes.data.share_sleep);
        setShareStress(parentRes.data.share_stress);
        setShareAssessments(parentRes.data.share_assessments);
      }
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  // Toggle sharing settings
  const toggleShare = async (type) => {
  let updatedValue;
  let payload = {};

  switch(type) {
    case 'mood':
      updatedValue = !shareMood;
      setShareMood(updatedValue);
      payload.share_mood = updatedValue ? 1 : 0;
      break;
    case 'sleep':
      updatedValue = !shareSleep;
      setShareSleep(updatedValue);
      payload.share_sleep = updatedValue ? 1 : 0;
      break;
    case 'stress':
      updatedValue = !shareStress;
      setShareStress(updatedValue);
      payload.share_stress = updatedValue ? 1 : 0;
      break;
    case 'assessments':
      updatedValue = !shareAssessments;
      setShareAssessments(updatedValue);
      payload.share_assessments = updatedValue ? 1 : 0;
      break;
    default:
      return;
  }

  try {
    await api.put("/parent/settings", payload);
    showSuccessToast("Sharing settings updated!");
  } catch (err) {
    showErrorToast("Failed to update sharing settings");
    // Revert on error
    switch(type) {
      case 'mood': setShareMood(!updatedValue); break;
      case 'sleep': setShareSleep(!updatedValue); break;
      case 'stress': setShareStress(!updatedValue); break;
      case 'assessments': setShareAssessments(!updatedValue); break;
    }
  }
};

  // Revoke parent access
  const revokeParentAccess = async () => {
    if (!parentData || !parentData.parent_id) {
      showErrorToast("No parent linked to revoke");
      return;
    }
    if (!window.confirm("Are you sure you want to revoke your parent's access? They will no longer be able to view your data.")) {
      return;
    }

    try {
      await api.post(`/parent/revoke/${parentData.parent_id}`);
      showSuccessToast("Parent access revoked successfully");
      setParentData(null);
      setShareMood(true);
      setShareSleep(true);
      setShareStress(true);
      setShareAssessments(true);
    } catch (err) {
      showErrorToast("Failed to revoke parent access");
    }
  };

  if (!user) return <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading profile...</p></div>;

  // Get consent status display
  const getConsentStatus = () => {
    if (user.counsellor_consent === 1) {
      return { text: "Consented ✅", color: "#22c55e" };
    } else {
      return { text: "Not Consented ❌", color: "#ef4444" };
    }
  };

  const consentStatus = getConsentStatus();
  const levelTitle = gamificationStats?.points?.level 
    ? getLevelTitle(gamificationStats.points.level) 
    : "Well-being Starter 🌱";

  function getLevelTitle(level) {
    const titles = {
      1: "Well-being Starter 🌱",
      2: "Mindful Beginner",
      3: "Self-Care Explorer",
      4: "Wellness Adventurer",
      5: "Emotional Navigator",
      6: "Resilience Builder",
      7: "Balance Seeker",
      8: "Growth Achiever",
      9: "Mental Health Advocate",
      10: "Lumora Champion 🌟"
    };
    return titles[level] || `Level ${level}`;
  }

  return (
    <Layout>
      <div className="page-header">
        <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your personal information and account details</p>
        </div>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={40} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px" }}>{user.name}</h2>
            <p className="profile-subtext" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
              {user.nickname ? `@${user.nickname}` : ""}
            </p>
            
            {/* Gamification Stats */}
            {!loadingGamification && gamificationStats && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '8px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  padding: '4px 14px',
                  background: 'var(--accent-gradient)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Star size={14} />
                  Level {gamificationStats.points?.level || 1} • {gamificationStats.points?.total_points || 0} pts
                </span>
                <span style={{
                  padding: '4px 12px',
                  background: 'var(--accent-soft)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  {levelTitle}
                </span>
                {gamificationStats.equipped_badge && (
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    🏅 {gamificationStats.equipped_badge.icon} {gamificationStats.equipped_badge.name}
                  </span>
                )}
                <span style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Award size={14} />
                  {gamificationStats.total_badges || 0} badges earned
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-section">
            <h4 className="profile-section-title">
              <User size={16} style={{ display: "inline", marginRight: "8px" }} />
              Personal Information
            </h4>
            <div className="profile-info-item">
              <span className="profile-label">Full Name</span>
              <span className="profile-value">{user.name}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Nickname</span>
              <span className="profile-value">{user.nickname || "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Date of Birth</span>
              <span className="profile-value">{user.dob ? new Date(user.dob).toLocaleDateString() : "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Gender</span>
              <span className="profile-value">{user.gender || "-"}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">
              <BookOpen size={16} style={{ display: "inline", marginRight: "8px" }} />
              Academic Information
            </h4>
            <div className="profile-info-item">
              <span className="profile-label">University</span>
              <span className="profile-value">{user.university_name || "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Student ID</span>
              <span className="profile-value">{user.student_id || "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Faculty</span>
              <span className="profile-value">{user.faculty || "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Department</span>
              <span className="profile-value">{user.department || "-"}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">
              <Shield size={16} style={{ display: "inline", marginRight: "8px" }} />
              Privacy & Consent
            </h4>
            <div className="profile-info-item">
              <span className="profile-label">Data Sharing Consent</span>
              <span className="profile-value" style={{ color: consentStatus.color }}>
                {consentStatus.text}
              </span>
            </div>
            <div style={{ 
              fontSize: "12px", 
              color: "var(--text-muted)", 
              marginTop: "8px", 
              padding: "8px", 
              background: "var(--bg-secondary)", 
              borderRadius: "8px" 
            }}>
              {user.counsellor_consent === 1 
                ? "You have given consent to share your data with your university counsellor." 
                : "You have not given consent to share your data with your university counsellor."}
            </div>

            {/* Parent/Guardian Section - Updated */}
            <div style={{ marginTop: "16px" }}>
              <h5 style={{ fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Heart size={16} color="#6366f1" />
                Parent/Guardian Access
              </h5>

              {parentLoading ? (
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading...</div>
              ) : parentData ? (
                // ✅ Parent already linked - Show details
                <div>
                  <div className="profile-info-item">
                    <span className="profile-label">Linked Parent</span>
                    <span className="profile-value">{parentData.email}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">Status</span>
                    <span className="profile-value" style={{ color: parentData.consent_granted ? '#22c55e' : '#f59e0b' }}>
                      {parentData.consent_granted ? '✅ Active' : '⏳ Pending'}
                    </span>
                  </div>
                  
                  {parentData.consent_granted && (
                    <div style={{ marginTop: "12px" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                        Data Sharing Settings:
                      </p>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={shareMood} onChange={() => toggleShare('mood')} style={{ cursor: 'pointer' }} />
                        Share Mood Data
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={shareSleep} onChange={() => toggleShare('sleep')} style={{ cursor: 'pointer' }} />
                        Share Sleep Data
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={shareStress} onChange={() => toggleShare('stress')} style={{ cursor: 'pointer' }} />
                        Share Stress Data
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={shareAssessments} onChange={() => toggleShare('assessments')} style={{ cursor: 'pointer' }} />
                        Share Assessment Results
                      </label>
                      <button
                        onClick={revokeParentAccess}
                        style={{
                          marginTop: '12px',
                          padding: '6px 14px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Revoke Parent Access
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // ✅ No parent linked - Show invite form (only if no parent)
                <div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                    Invite a parent or guardian to view your mental health summary. They will receive an email with instructions.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="Enter parent's email"
                      className="input-field"
                      style={{ flex: 1, minWidth: '180px' }}
                    />
                    <button
                      onClick={inviteParent}
                      disabled={!parentEmail.trim() || inviting}
                      className="primary-btn"
                      style={{ width: 'auto', padding: '10px 20px' }}
                    >
                      {inviting ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">
              <Heart size={16} style={{ display: "inline", marginRight: "8px" }} />
              Emergency Contact
            </h4>
            <div className="profile-info-item">
              <span className="profile-label">Contact Name</span>
              <span className="profile-value">{user.emergency_contact_name || "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Phone Number</span>
              <span className="profile-value">{user.emergency_contact_phone || "-"}</span>
            </div>
            <div className="profile-info-item">
              <span className="profile-label">Relationship</span>
              <span className="profile-value">{user.emergency_contact_relationship || "-"}</span>
            </div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title">
              <Mail size={16} style={{ display: "inline", marginRight: "8px" }} />
              Account Information
            </h4>
            <div className="profile-info-item">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user.email}</span>
            </div>
          </div>
        </div>

        <button className="primary-btn" onClick={() => navigate("/profile/edit")}>
          Edit Profile
        </button>
      </div>
    </Layout>
  );
}

export default Profile;