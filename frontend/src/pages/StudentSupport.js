// pages/StudentSupport.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  Phone,
  Mail,
  Globe,
  AlertTriangle,
  Heart,
  BookOpen,
  LogOut,
  Menu,
  ArrowLeft,
  Activity,
  TrendingUp,
  User,
  MessageCircle,
  Shield,
  Building,
  ExternalLink,
  Clock
} from "lucide-react";

function StudentSupport() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportData, setSupportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("university");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        if (res.data.nickname) {
          setUserNickname(res.data.nickname);
        } else {
          setUserNickname(res.data.name.split(" ")[0]);
        }
      } catch (err) {
        console.log("Profile fetch error:", err);
      }
    };
    
    const fetchSupportResources = async () => {
      try {
        const res = await api.get(`/support/${user_id}`);
        setSupportData(res.data);
      } catch (err) {
        console.error("Support resources error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
    fetchSupportResources();
  }, [user_id]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const openExternalLink = (url) => {
    if (url) {
      window.open(url, "_blank", "noopener noreferrer");
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="bg-decoration">
          <div className="blob1"></div>
          <div className="blob2"></div>
          <div className="blob3"></div>
        </div>
        <div className="content-wrapper">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading support resources...</p>
          </div>
        </div>
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

      <div className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu size={20} />
      </div>

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
            <h1 className="page-title">Student Support</h1>
            <p className="page-subtitle">
              {supportData?.hasUniversity && supportData.universityName 
                ? `Resources for ${supportData.universityName} students` 
                : "Mental health and wellness resources for students"}
            </p>
          </div>
        </div>

        {/* University Banner */}
        {supportData?.hasUniversity && supportData.universityName && (
          <div className="support-university-banner">
            <Building size={32} />
            <div>
              <h3 className="support-university-name">{supportData.universityName}</h3>
              <p className="support-university-note">
                {supportData.hasCustomResources 
                  ? "Your university has dedicated mental health support services below." 
                  : "We're working to add more university-specific resources. Here are general support options available to you."}
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="support-tab-container">
          <button 
            className={`support-tab ${activeTab === "university" ? "support-tab-active" : ""}`}
            onClick={() => setActiveTab("university")}
          >
            <Building size={14} style={{ marginRight: "6px" }} />
            University Resources
          </button>
          <button 
            className={`support-tab ${activeTab === "national" ? "support-tab-active" : ""}`}
            onClick={() => setActiveTab("national")}
          >
            <AlertTriangle size={14} style={{ marginRight: "6px" }} />
            National Hotlines
          </button>
          <button 
            className={`support-tab ${activeTab === "online" ? "support-tab-active" : ""}`}
            onClick={() => setActiveTab("online")}
          >
            <Globe size={14} style={{ marginRight: "6px" }} />
            Online Resources
          </button>
          <button 
            className={`support-tab ${activeTab === "tips" ? "support-tab-active" : ""}`}
            onClick={() => setActiveTab("tips")}
          >
            <Heart size={14} style={{ marginRight: "6px" }} />
            Wellness Tips
          </button>
        </div>

        {/* University Resources Tab */}
        {activeTab === "university" && (
          <div className="tab-content">
            {supportData?.resources?.university && (
              <div className="resources-section">
                <h3 className="card-title" style={{ marginBottom: "20px" }}>Counselling Services</h3>
                
                {supportData.resources.university.counselling_contact && (
                  <div className="support-resource-card">
                    <Phone size={24} color="var(--accent-primary)" />
                    <div className="support-resource-info">
                      <h4>Contact Number</h4>
                      <p>{supportData.resources.university.counselling_contact}</p>
                      <button 
                        onClick={() => window.location.href = `tel:${supportData.resources.university.counselling_contact.replace(/\D/g, '')}`}
                        className="support-call-btn"
                      >
                        Call Now
                      </button>
                    </div>
                  </div>
                )}
                
                {supportData.resources.university.counselling_email && (
                  <div className="support-resource-card">
                    <Mail size={24} color="var(--accent-primary)" />
                    <div className="support-resource-info">
                      <h4>Email</h4>
                      <p>{supportData.resources.university.counselling_email}</p>
                      <button 
                        onClick={() => window.location.href = `mailto:${supportData.resources.university.counselling_email.split(' ')[0]}`}
                        className="support-email-btn"
                      >
                        Send Email
                      </button>
                    </div>
                  </div>
                )}
                
                {supportData.resources.university.counselling_website && (
                  <div className="support-resource-card">
                    <Globe size={24} color="var(--accent-primary)" />
                    <div className="support-resource-info">
                      <h4>Website</h4>
                      <p>{supportData.resources.university.counselling_website}</p>
                      <button 
                        onClick={() => openExternalLink(supportData.resources.university.counselling_website)}
                        className="support-link-btn"
                      >
                        Visit Website <ExternalLink size={12} style={{ marginLeft: "4px" }} />
                      </button>
                    </div>
                  </div>
                )}
                
                {supportData.resources.university.support_notes && (
                  <div className="support-resource-card">
                    <MessageCircle size={24} color="var(--accent-primary)" />
                    <div className="support-resource-info">
                      <h4>Additional Information</h4>
                      <p>{supportData.resources.university.support_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {(!supportData?.resources?.university || Object.keys(supportData.resources.university).filter(k => supportData.resources.university[k]).length === 0) && (
              <div className="no-resources-message">
                <Shield size={48} color="var(--text-muted)" />
                <p>No specific university resources found in our database yet.</p>
                <p>Please check your university's official website or student portal for counselling services.</p>
                <button 
                  onClick={() => window.open("https://www.google.com/search?q=university+counselling+services+malaysia", "_blank")}
                  className="search-btn"
                >
                  Search for University Resources →
                </button>
              </div>
            )}
          </div>
        )}

        {/* National Hotlines Tab */}
        {activeTab === "national" && (
          <div className="tab-content">
            <div className="resources-section">
              <h3 className="card-title" style={{ marginBottom: "20px" }}>24/7 Crisis Support Hotlines</h3>
              <p className="card-subtitle" style={{ marginBottom: "24px" }}>Free and confidential support available anytime</p>
              
              {supportData?.resources?.general?.nationalHotlines?.map((hotline, idx) => (
                <div key={idx} className="hotline-card">
                  <AlertTriangle size={28} color="#dc2626" />
                  <div className="hotline-info">
                    <h4>{hotline.name}</h4>
                    <p className="hotline-number">{hotline.number}</p>
                    {hotline.hours && <p className="hotline-hours"><Clock size={12} style={{ display: "inline", marginRight: "4px" }} /> {hotline.hours}</p>}
                    <p className="hotline-desc">{hotline.description}</p>
                    <button 
                      onClick={() => {
                        const phoneNumber = hotline.number.replace(/[^0-9+]/g, '');
                        window.location.href = `tel:${phoneNumber}`;
                      }}
                      className="support-emergency-call-btn"
                    >
                      <Phone size={14} style={{ marginRight: "6px" }} />
                      Call Now
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="emergency-card">
                <h4>Emergency Services</h4>
                <div className="emergency-grid">
                  <div className="emergency-item"><span>🚓 Police</span><strong>999</strong></div>
                  <div className="emergency-item"><span>🚑 Ambulance</span><strong>999</strong></div>
                  <div className="emergency-item"><span>🔥 Fire</span><strong>999</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Online Resources Tab */}
        {activeTab === "online" && (
          <div className="tab-content">
            <div className="resources-section">
              <h3 className="card-title" style={{ marginBottom: "20px" }}>Online Mental Health Resources</h3>
              
              {supportData?.resources?.general?.onlineResources?.map((resource, idx) => (
                <div key={idx} className="support-resource-card">
                  <Globe size={24} color="var(--accent-primary)" />
                  <div className="support-resource-info">
                    <h4>{resource.name}</h4>
                    <p>{resource.description}</p>
                    <button 
                      onClick={() => openExternalLink(resource.url)}
                      className="support-link-btn"
                    >
                      Visit Website <ExternalLink size={12} style={{ marginLeft: "4px" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wellness Tips Tab */}
        {activeTab === "tips" && (
          <div className="tab-content">
            <div className="tips-section">
              <h3 className="card-title" style={{ marginBottom: "20px" }}>Mental Wellness Tips</h3>
              
              {supportData?.resources?.general?.tips?.map((tip, idx) => (
                <div key={idx} className="tip-card-simple">
                  <Heart size={18} color="var(--accent-primary)" />
                  <p>{tip}</p>
                </div>
              ))}
              
              <div className="self-care-card">
                <h4>Daily Self-Care Reminders</h4>
                <ul className="self-care-list">
                  <li>Get 7-9 hours of quality sleep</li>
                  <li>Stay hydrated and eat regular meals</li>
                  <li>Take short breaks between study sessions</li>
                  <li>Connect with friends and family</li>
                  <li>Practice deep breathing when feeling overwhelmed</li>
                  <li>Limit social media and screen time before bed</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentSupport;