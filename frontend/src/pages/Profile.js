// pages/Profile.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Phone,
  Heart,
  LogOut,
  Menu,
  ArrowLeft,
  Activity,
  TrendingUp,
  Building,
  IdCard
} from "lucide-react";

function Profile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
        if (err.response?.status === 401) {
          navigate("/");
        }
      }
    };
    fetchUserProfile();
  }, [user_id, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="bg-decoration">
        <div className="blob1"></div>
        <div className="blob2"></div>
        <div className="blob3"></div>
      </div>

      {/* Hamburger Menu */}
      <div className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu size={20} />
      </div>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">Lumora</span>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-item ${window.location.pathname === "/dashboard" ? "active" : ""}`} onClick={() => navigate("/dashboard")}>
            <Activity size={18} /><span>Dashboard</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/journal" ? "active" : ""}`} onClick={() => navigate("/journal")}>
            <BookOpen size={18} /><span>Journal</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/mental-health" ? "active" : ""}`} onClick={() => navigate("/mental-health")}>
            <Heart size={18} /><span>Mental Health</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/student-support" ? "active" : ""}`} onClick={() => navigate("/student-support")}>
            <TrendingUp size={18} /><span>Student Support</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/profile" ? "active" : ""}`} onClick={() => navigate("/profile")}>
            <User size={18} /><span>Profile</span>
          </button>
          <button className="sidebar-item-logout" onClick={logout}>
            <LogOut size={18} /><span>Logout</span>
          </button>
        </nav>
      </div>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      <div className="content-wrapper">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="user-profile">
            <div className="user-avatar"><User size={18} /></div>
            <span className="user-name-top">{userNickname || "User"}</span>
            <div className="logout-icon" onClick={logout}><LogOut size={16} /></div>
          </div>
        </div>

        {/* Page Header */}
        <div className="page-header">
          <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Profile</h1>
            <p className="page-subtitle">Your personal information and account details</p>
          </div>
        </div>

        {/* Profile Card */}
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
            </div>
          </div>

          <div className="profile-info-grid">
            {/* Personal Information */}
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
                <span className="profile-value">
                  {user.dob ? new Date(user.dob).toLocaleDateString() : "-"}
                </span>
              </div>

              <div className="profile-info-item">
                <span className="profile-label">Gender</span>
                <span className="profile-value">{user.gender || "-"}</span>
              </div>
            </div>

            {/* Academic Information */}
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
            </div>

            {/* Emergency Contact */}
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

            {/* Account Information */}
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
      </div>
    </div>
  );
}

export default Profile;