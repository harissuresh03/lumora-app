// pages/MentalHealthArticle.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  Brain,
  Heart,
  BookOpen,
  LogOut,
  Menu,
  ArrowLeft,
  Activity,
  TrendingUp,
  User,
  Shield,
  Wind,
  Coffee,
  Moon,
  Users,
  Sun,
  Sparkles
} from "lucide-react";

function MentalHealthArticle() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    fetchUserProfile();
  }, [user_id]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const articles = [
    { id: 1, icon: <Brain size={28} />, title: "What is Mental Health?", description: "Mental health includes our emotional, psychological, and social well-being. It affects how we think, feel, and act." },
    { id: 2, icon: <Wind size={28} />, title: "Understanding Anxiety", description: "Anxiety is more than just feeling stressed or worried. It is a persistent feeling of fear or dread that can interfere with daily activities." },
    { id: 3, icon: <Heart size={28} />, title: "Depression: More Than Sadness", description: "Depression is a common but serious mood disorder. It causes severe symptoms that affect how you feel, think, and handle daily activities." },
    { id: 4, icon: <Coffee size={28} />, title: "Self-Care Strategies", description: "Self-care means taking time to do things that help you live well and improve both your physical and mental health." },
    { id: 5, icon: <Shield size={28} />, title: "When to Seek Help", description: "If you feel overwhelmed, persistently sad, anxious, or have thoughts of harming yourself, it's important to reach out." },
    { id: 6, icon: <Users size={28} />, title: "Breaking the Stigma", description: "Mental health stigma often prevents people from seeking help. By speaking openly and compassionately, we can create a safe environment." }
  ];

  const tips = [
    { icon: <Sun size={14} />, text: "Start your day with gratitude" },
    { icon: <Wind size={14} />, text: "Take short breaks to walk outside" },
    { icon: <Moon size={14} />, text: "Limit screen time before bed" },
    { icon: <Coffee size={14} />, text: "Stay hydrated and eat regular meals" },
    { icon: <Moon size={14} />, text: "Prioritise 7-9 hours of sleep" },
    { icon: <Users size={14} />, text: "Connect with a friend or loved one" }
  ];

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
            <h1 className="page-title">Mental Health Resources</h1>
            <p className="page-subtitle">Learn, grow, and take steps toward emotional well-being</p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Understanding Mental Health</h1>
          <p className="hero-subtitle">Your mind matters. Learn, grow, and take steps toward emotional well-being.</p>
        </div>

        {/* Articles Grid */}
        <div className="articles-grid">
          {articles.map((article) => (
            <div key={article.id} className="article-card">
              <div className="article-icon" style={{ color: "var(--accent-primary)" }}>
                {article.icon}
              </div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-text">{article.description}</p>
            </div>
          ))}
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h2 className="tips-title">Daily Mental Health Tips</h2>
          <div className="tips-grid">
            {tips.map((tip, index) => (
              <div key={index} className="tip-card">
                <span style={{ color: "var(--accent-primary)", marginRight: "8px" }}>{tip.icon}</span>
                {tip.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MentalHealthArticle;