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
  ArrowLeft, 
  Shield,
  Award,
  Star,
} from "lucide-react";

function Profile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [user, setUser] = useState(null);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [loadingGamification, setLoadingGamification] = useState(true);

  // Parent/Guardian state
  const [parentData, setParentData] = useState(null);
  const [parentLoading, setParentLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        setUser(res.data);
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

    const fetchParentData = async () => {
      try {
        const res = await api.get(`/parent/my-parent`);
        if (res.data.hasParent) {
          setParentData({
            parent_id: res.data.parent_id,
            email: res.data.email,
            consent_granted: res.data.consent_granted
          });
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

  if (!user) return <div className="loading-container"><div className="spinner"></div><p className="loading-text">Loading profile...</p></div>;

  const getConsentStatus = () => {
    if (user.counsellor_consent === 1) {
      return { text: "Consented ✅", color: "#22c55e" };
    } else {
      return { text: "Not Consented ❌", color: "#ef4444" };
    }
  };

  const getParentStatus = () => {
    if (parentData) {
      if (parentData.consent_granted) {
        return { text: "Access Granted ✅", color: "#22c55e", email: parentData.email };
      } else {
        return { text: "Access Revoked ❌", color: "#ef4444", email: parentData.email };
      }
    } else {
      return { text: "No Parent Linked", color: "#6b7280", email: null };
    }
  };

  const consentStatus = getConsentStatus();
  const parentStatus = getParentStatus();

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
              <span className="profile-label">Matric Number</span>
              <span className="profile-value">{user.matric_number || "-"}</span>
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
            
            {/* Counsellor Consent - Read Only */}
            <div className="profile-info-item">
              <span className="profile-label">Counsellor Data Sharing</span>
              <span className="profile-value" style={{ color: consentStatus.color }}>
                {consentStatus.text}
              </span>
            </div>
            <div style={{ 
              fontSize: "12px", 
              color: "var(--text-muted)", 
              marginTop: "4px", 
              padding: "8px", 
              background: "var(--bg-secondary)", 
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              {user.counsellor_consent === 1 
                ? "You have given consent to share your data with your university counsellor." 
                : "You have not given consent to share your data with your university counsellor."}
            </div>

            {/* Parent Consent - Read Only */}
            <div className="profile-info-item">
              <span className="profile-label">Parent/Guardian Access</span>
              <span className="profile-value" style={{ color: parentStatus.color }}>
                {parentStatus.text}
              </span>
            </div>
            <div style={{ 
              fontSize: "12px", 
              color: "var(--text-muted)", 
              marginTop: "4px", 
              padding: "8px", 
              background: "var(--bg-secondary)", 
              borderRadius: "8px" 
            }}>
              {parentLoading 
                ? "Loading parent status..." 
                : parentData 
                  ? (parentData.consent_granted 
                      ? `Your parent (${parentData.email}) can view your well-being summary.` 
                      : `Your parent (${parentData.email}) cannot view your data.`)
                  : "No parent/guardian is currently linked to your account."}
            </div>
            {parentData && (
              <div style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "8px",
                fontStyle: "italic"
              }}>
              </div>
            )}
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