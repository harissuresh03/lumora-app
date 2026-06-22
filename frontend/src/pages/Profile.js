// frontend/src/pages/Profile.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Layout from "./components/Layout";
import { User, Mail, BookOpen, Heart, LogOut, ArrowLeft, Building, Calendar, GraduationCap, Shield } from "lucide-react";

function Profile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [user, setUser] = useState(null);

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
    fetchUserProfile();
  }, [user_id, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
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

  return (
    <Layout>
      <div className="page-header">
        <button onClick={() => navigate("/dashboard")} className="back-arrow-btn"><ArrowLeft size={18} /></button>
        <div><h1 className="page-title">Profile</h1><p className="page-subtitle">Your personal information and account details</p></div>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar"><User size={40} /></div>
          <div><h2 style={{ margin: 0, fontSize: "22px" }}>{user.name}</h2><p className="profile-subtext" style={{ color: "var(--text-secondary)", marginTop: "4px" }}>{user.nickname ? `@${user.nickname}` : ""}</p></div>
        </div>

        <div className="profile-info-grid">
          <div className="profile-section">
            <h4 className="profile-section-title"><User size={16} style={{ display: "inline", marginRight: "8px" }} /> Personal Information</h4>
            <div className="profile-info-item"><span className="profile-label">Full Name</span><span className="profile-value">{user.name}</span></div>
            <div className="profile-info-item"><span className="profile-label">Nickname</span><span className="profile-value">{user.nickname || "-"}</span></div>
            <div className="profile-info-item"><span className="profile-label">Date of Birth</span><span className="profile-value">{user.dob ? new Date(user.dob).toLocaleDateString() : "-"}</span></div>
            <div className="profile-info-item"><span className="profile-label">Gender</span><span className="profile-value">{user.gender || "-"}</span></div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title"><BookOpen size={16} style={{ display: "inline", marginRight: "8px" }} /> Academic Information</h4>
            <div className="profile-info-item"><span className="profile-label">University</span><span className="profile-value">{user.university_name || "-"}</span></div>
            <div className="profile-info-item"><span className="profile-label">Student ID</span><span className="profile-value">{user.student_id || "-"}</span></div>
            {/* ✅ NEW: Faculty and Department */}
            <div className="profile-info-item"><span className="profile-label">Faculty</span><span className="profile-value">{user.faculty || "-"}</span></div>
            <div className="profile-info-item"><span className="profile-label">Department</span><span className="profile-value">{user.department || "-"}</span></div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title"><Shield size={16} style={{ display: "inline", marginRight: "8px" }} /> Privacy & Consent</h4>
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
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title"><Heart size={16} style={{ display: "inline", marginRight: "8px" }} /> Emergency Contact</h4>
            <div className="profile-info-item"><span className="profile-label">Contact Name</span><span className="profile-value">{user.emergency_contact_name || "-"}</span></div>
            <div className="profile-info-item"><span className="profile-label">Phone Number</span><span className="profile-value">{user.emergency_contact_phone || "-"}</span></div>
            <div className="profile-info-item"><span className="profile-label">Relationship</span><span className="profile-value">{user.emergency_contact_relationship || "-"}</span></div>
          </div>

          <div className="profile-section">
            <h4 className="profile-section-title"><Mail size={16} style={{ display: "inline", marginRight: "8px" }} /> Account Information</h4>
            <div className="profile-info-item"><span className="profile-label">Email</span><span className="profile-value">{user.email}</span></div>
          </div>
        </div>

        <button className="primary-btn" onClick={() => navigate("/profile/edit")}>Edit Profile</button>
      </div>
    </Layout>
  );
}

export default Profile;