// pages/Dashboard.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import AICompanion from "./components/AICompanion";
import {
  Calendar,
  Moon,
  Smile,
  Activity,
  BookOpen,
  MessageCircle,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Heart,
  Menu
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAICompanion, setShowAICompanion] = useState(false);

  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  
  const [todayMood, setTodayMood] = useState(null);
  const [todaySleep, setTodaySleep] = useState(null);
  const [isUpdatingSleep, setIsUpdatingSleep] = useState(false);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [showMoodOptions, setShowMoodOptions] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const [moodsData, setMoodsData] = useState([]);
  const [sleepData, setSleepData] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateJournals, setSelectedDateJournals] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);

  const moodOptionsList = [
    { value: 1, label: "Terrible", emoji: "😢", color: "#ef4444" },
    { value: 2, label: "Sad", emoji: "😔", color: "#f97316" },
    { value: 3, label: "Okay", emoji: "😐", color: "#eab308" },
    { value: 4, label: "Good", emoji: "🙂", color: "#22c55e" },
    { value: 5, label: "Great", emoji: "😄", color: "#16a34a" },
  ];

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

  const fetchJournals = async () => {
    try {
      const res = await api.get(`/journal/${user_id}`);
      setJournals(res.data.slice(0, 3));
    } catch (err) {
      console.log("Fetch journals error:", err);
    }
  };

  const fetchJournalsByDate = async (date) => {
    try {
      const res = await api.get(`/journal/${user_id}`);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const selectedDateStr = `${year}-${month}-${day}`;
      
      const filteredJournals = res.data.filter(journal => {
        const journalDate = new Date(journal.created_at);
        const journalYear = journalDate.getFullYear();
        const journalMonth = String(journalDate.getMonth() + 1).padStart(2, '0');
        const journalDay = String(journalDate.getDate()).padStart(2, '0');
        const journalDateStr = `${journalYear}-${journalMonth}-${journalDay}`;
        return journalDateStr === selectedDateStr;
      });
      
      setSelectedDateJournals(filteredJournals);
    } catch (err) {
      console.log("Fetch journals by date error:", err);
    }
  };

  const fetchTodayEntries = async () => {
    try {
      const [moodRes, sleepRes] = await Promise.all([
        api.get(`/mood/today/${user_id}`),
        api.get(`/sleep/today/${user_id}`)
      ]);
      
      if (moodRes.data) {
        setTodayMood(moodRes.data);
        setSelectedMood(moodRes.data.mood);
      } else {
        setTodayMood(null);
        setSelectedMood(null);
      }
      
      if (sleepRes.data) {
        const cleanBedtime = sleepRes.data.bedtime?.split(':').slice(0, 2).join(':') || "";
        const cleanWakeTime = sleepRes.data.wake_time?.split(':').slice(0, 2).join(':') || "";
        
        setTodaySleep(sleepRes.data);
        setBedtime(cleanBedtime);
        setWakeTime(cleanWakeTime);
      } else {
        setTodaySleep(null);
        setBedtime("");
        setWakeTime("");
      }
    } catch (err) {
      console.log("Fetch today's entries error:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [moodRes, sleepRes] = await Promise.all([
        api.get(`/mood/${user_id}`),
        api.get(`/sleep/${user_id}`)
      ]);

      setMoodsData(moodRes.data || []);
      setSleepData(sleepRes.data || []);
      await fetchTodayEntries();
      await fetchJournals();
    } catch (err) {
      console.log("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchData();
  }, []);

  const updateMoodManually = async (moodValue) => {
    setIsUpdatingMood(true);
    try {
      await api.post("/mood", {
        user_id: parseInt(user_id),
        mood: moodValue,
      });
      setSelectedMood(moodValue);
      await fetchTodayEntries();
      await fetchData();
      setShowMoodOptions(false);
    } catch (err) {
      console.error("Manual mood update error:", err);
      alert("Failed to update mood");
    } finally {
      setIsUpdatingMood(false);
    }
  };

  const getSleepQuality = (hours) => {
    if (hours < 5) return 1;
    if (hours < 7) return 2;
    if (hours <= 9) return 5;
    if (hours <= 10) return 3;
    return 1;
  };

  const saveSleep = async () => {
    if (!bedtime || !wakeTime) return;

    const cleanBedtime = bedtime.split(':').slice(0, 2).join(':');
    const cleanWakeTime = wakeTime.split(':').slice(0, 2).join(':');

    const start = new Date(`1970-01-01T${cleanBedtime}`);
    let end = new Date(`1970-01-01T${cleanWakeTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const duration = parseFloat((end - start) / (1000 * 60 * 60)).toFixed(1);
    const quality = getSleepQuality(parseFloat(duration));

    try {
      setIsUpdatingSleep(true);
      await api.post("/sleep", {
        user_id: parseInt(user_id),
        bedtime: cleanBedtime,
        wake_time: cleanWakeTime,
        duration: parseFloat(duration),
        quality: quality,
      });
      
      await fetchTodayEntries();
      await fetchData();
    } catch (err) {
      console.log("Save sleep error:", err.response?.data || err.message);
      alert("Failed to save sleep. Please try again.");
    } finally {
      setIsUpdatingSleep(false);
    }
  };

  const getLast7DaysTrend = () => {
  const last7Days = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const mood = moodsData.find(m => {
      const moodDate = new Date(m.created_at);
      return moodDate.toISOString().split('T')[0] === dateStr;
    });
    
    const sleep = sleepData.find(s => {
      const sleepDate = new Date(s.created_at);
      return sleepDate.toISOString().split('T')[0] === dateStr;
    });
    
    last7Days.push({
      date: date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      mood: mood ? mood.mood : null,
      sleepQuality: sleep ? sleep.quality : null,
    });
  }
  return last7Days;
};

  const trendData = getLast7DaysTrend();
  const hasMoodData = trendData.some(d => d.mood !== null);
  const hasSleepData = trendData.some(d => d.sleepQuality !== null);

  const getMoodForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const mood = moodsData.find(m => {
      const moodDate = new Date(m.created_at);
      const moodYear = moodDate.getFullYear();
      const moodMonth = String(moodDate.getMonth() + 1).padStart(2, '0');
      const moodDay = String(moodDate.getDate()).padStart(2, '0');
      const moodDateStr = `${moodYear}-${moodMonth}-${moodDay}`;
      return moodDateStr === dateStr;
    });
    return mood ? mood.mood : null;
  };

  const getMoodDetails = (mood) => {
    const moods = {
      1: { label: "Terrible", emoji: "😢", color: "#ef4444" },
      2: { label: "Sad", emoji: "😔", color: "#f97316" },
      3: { label: "Okay", emoji: "😐", color: "#eab308" },
      4: { label: "Good", emoji: "🙂", color: "#22c55e" },
      5: { label: "Great", emoji: "😄", color: "#16a34a" },
    };
    return moods[mood] || { label: "Not set", emoji: "❓", color: "#9ca3af" };
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  const handleDateClick = async (date, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    setSelectedDate(date);
    await fetchJournalsByDate(date);
    setShowDateModal(true);
  };

  const changeMonth = (increment) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
  };

  const formatMonthYear = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getMotivationalQuote = () => {
    const quotes = [
      "Your mental health is a priority.",
      "Small steps every day lead to big changes.",
      "Rest when you're weary. Recharge and let your soul catch up.",
      "Be kind to yourself. You're doing the best you can.",
      "Sleep is essential for mental clarity and emotional balance.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const todayMoodDetails = todayMood ? getMoodDetails(todayMood.mood) : null;
  const calendarDays = getCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading your dashboard...</p>
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
            <Activity size={18} />
            <span>Dashboard</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/journal" ? "active" : ""}`} onClick={() => navigate("/journal")}>
            <BookOpen size={18} />
            <span>Journal</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/mental-health" ? "active" : ""}`} onClick={() => navigate("/mental-health")}>
            <Heart size={18} />
            <span>Mental Health</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/student-support" ? "active" : ""}`} onClick={() => navigate("/student-support")}>
            <TrendingUp size={18} />
            <span>Student Support</span>
          </button>
          <button className={`sidebar-item ${window.location.pathname === "/profile" ? "active" : ""}`} onClick={() => navigate("/profile")}>
            <User size={18} />
            <span>Profile</span>
          </button>
          <button className="sidebar-item-logout" onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Chat Bubble */}
      <div className="chat-bubble" onClick={() => setShowAICompanion(true)}>
        <div className="chat-bubble-icon">
          <MessageCircle size={20} />
        </div>
        <span className="chat-bubble-text">How are you feeling now?</span>
      </div>

      <div className="content-wrapper">
        {/* Top Bar with Profile */}
        <div className="top-bar">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={14} />
            </div>
            <span className="user-name">{userNickname || "User"}</span>
            <div className="logout-icon" onClick={logout}>
              <LogOut size={16} />
            </div>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-row">
            <div>
              <div className="welcome-badge">
                <span>{getGreeting()}</span>
              </div>
              <h1 className="welcome-title">
                Welcome back, <span className="user-name">{userNickname || "Friend"}</span>
              </h1>
              <p className="quote-text">{getMotivationalQuote()}</p>
            </div>
            <div className="today-mood-quick">
              <span className="today-mood-icon">{todayMoodDetails?.emoji || "❓"}</span>
              <div>
                <p className="today-mood-label">Today's Mood</p>
                <p className="today-mood-value">{todayMoodDetails?.label || "Not logged"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Large Calendar */}
        <div className="calendar-large">
          <div className="calendar-header">
            <h3 className="calendar-title">
              <Calendar size={18} /> {formatMonthYear()}
            </h3>
            <div className="calendar-nav">
              <button onClick={() => changeMonth(-1)} className="calendar-nav-btn">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => changeMonth(1)} className="calendar-nav-btn">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="weekday-header">
            {weekDays.map(day => (
              <div key={day} className="weekday-cell">{day}</div>
            ))}
          </div>
          
          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              const mood = getMoodForDate(day.date);
              const moodDetails = mood ? getMoodDetails(mood) : null;
              const isToday = day.date.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''}`}
                  style={{
                    backgroundColor: !day.isCurrentMonth ? 'transparent' : 'var(--bg-secondary)',
                    border: isToday ? `2px solid var(--accent-primary)` : '1px solid transparent',
                  }}
                  onClick={() => handleDateClick(day.date, day.isCurrentMonth)}
                >
                  <span className="calendar-day-number">
                    {day.date.getDate()}
                  </span>
                  {day.isCurrentMonth && mood && (
                    <div className="calendar-mood" title={moodDetails.label}>
                      <span>{moodDetails.emoji}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="calendar-legend">
            <span>Legend:</span>
            {moodOptionsList.map(mood => (
              <span key={mood.value}>
                <span>{mood.emoji}</span> {mood.label}
              </span>
            ))}
          </div>
        </div>

        {/* Two Column Row - Mood & Sleep Cards */}
        <div className="two-column-row">
          {/* Mood Card */}
          <div className="mood-card">
            <div className="mood-card-header">
              <Smile size={24} color="var(--accent-primary)" />
              <div>
                <h3 className="card-title">Today's Mood</h3>
                <p className="card-subtitle">How are you feeling today?</p>
              </div>
            </div>
            
            {!showMoodOptions ? (
              <>
                <div className="mood-options">
                  {moodOptionsList.map(mood => (
                    <div
                      key={mood.value}
                      className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <span className="mood-option-emoji">{mood.emoji}</span>
                      <span className="mood-option-label">{mood.label}</span>
                    </div>
                  ))}
                </div>
                <button className="primary-btn" onClick={() => updateMoodManually(selectedMood)} disabled={!selectedMood || isUpdatingMood}>
                  {isUpdatingMood ? "Saving..." : (todayMood ? "Update Mood" : "Log Mood")}
                </button>
              </>
            ) : (
              <div className="mood-quick-options">
                {moodOptionsList.map(mood => (
                  <button
                    key={mood.value}
                    className="mood-quick-option"
                    onClick={() => updateMoodManually(mood.value)}
                    disabled={isUpdatingMood}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                ))}
                <button className="mood-quick-cancel" onClick={() => setShowMoodOptions(false)}>Cancel</button>
              </div>
            )}
          </div>

          {/* Sleep Card */}
          <div className="sleep-card">
            <div className="sleep-card-header">
              <Moon size={24} color="var(--accent-primary)" />
              <div>
                <h3 className="card-title">Sleep Tracking</h3>
                <p className="card-subtitle">Log your sleep hours</p>
              </div>
            </div>

            <div className="sleep-input-row">
              <div className="sleep-input-group">
                <label className="input-label">Bedtime</label>
                <input 
                  type="time" 
                  value={bedtime} 
                  onChange={(e) => setBedtime(e.target.value)} 
                  className="sleep-input" 
                />
              </div>
              <div className="sleep-input-group">
                <label className="input-label">Wake time</label>
                <input 
                  type="time" 
                  value={wakeTime} 
                  onChange={(e) => setWakeTime(e.target.value)} 
                  className="sleep-input" 
                />
              </div>
            </div>

            <button className="primary-btn" onClick={saveSleep} disabled={!bedtime || !wakeTime || isUpdatingSleep}>
              {isUpdatingSleep ? "Saving..." : (todaySleep ? "Update Sleep" : "Log Sleep")}
            </button>
          </div>
        </div>

        {/* Graphs Row */}
        <div className="graphs-row">
          {/* Sleep Quality Graph */}
          <div className="graph-card">
            <div className="graph-header">
              <Moon size={18} color="var(--accent-primary)" />
              <h3 className="graph-title">Sleep Quality Trend</h3>
            </div>
            <p className="trend-subtitle">Last 7 days</p>
            
            <div className="line-graph-container">
              <div className="y-axis">
                <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
              </div>
              <div className="graph-area">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="svg-graph">
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {hasSleepData && (
                    <>
                      <defs>
                        <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6d5acf" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#6d5acf" stopOpacity="0.03" />
                        </linearGradient>
                      </defs>
                      
                      <polygon
                        points={trendData.map((day, idx) => {
                          if (!day.sleepQuality) return null;
                          const x = (idx / (trendData.length - 1)) * 500;
                          const y = 150 - (day.sleepQuality / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ") + `, 500,150, 0,150`}
                        fill="url(#sleepGradient)"
                      />
                      
                      <polyline
                        points={trendData.map((day, idx) => {
                          if (!day.sleepQuality) return null;
                          const x = (idx / (trendData.length - 1)) * 500;
                          const y = 150 - (day.sleepQuality / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ")}
                        fill="none"
                        stroke="#6d5acf"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {trendData.map((day, idx) => {
                        if (!day.sleepQuality) return null;
                        const x = (idx / (trendData.length - 1)) * 500;
                        const y = 150 - (day.sleepQuality / 5) * 150;
                        return (
                          <circle key={idx} cx={x} cy={y} r="4" fill="#6d5acf" stroke="white" strokeWidth="2" />
                        );
                      })}
                    </>
                  )}
                </svg>
                <div className="x-axis-labels">
                  {trendData.map((day, idx) => (
                    <span key={idx} className="x-axis-label">{day.dayName}</span>
                  ))}
                </div>
              </div>
            </div>
            {!hasSleepData && <div className="no-data-message">No sleep data yet. Start tracking! 🌙</div>}
          </div>

          {/* Mood Graph */}
          <div className="graph-card">
            <div className="graph-header">
              <Smile size={18} color="var(--accent-primary)" />
              <h3 className="graph-title">Mood Trend</h3>
            </div>
            <p className="trend-subtitle">Last 7 days</p>
            
            <div className="line-graph-container">
              <div className="y-axis">
                <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
              </div>
              <div className="graph-area">
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="svg-graph">
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {hasMoodData && (
                    <>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
                        </linearGradient>
                      </defs>
                      
                      <polygon
                        points={trendData.map((day, idx) => {
                          if (!day.mood) return null;
                          const x = (idx / (trendData.length - 1)) * 500;
                          const y = 150 - (day.mood / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ") + `, 500,150, 0,150`}
                        fill="url(#moodGradient)"
                      />
                      
                      <polyline
                        points={trendData.map((day, idx) => {
                          if (!day.mood) return null;
                          const x = (idx / (trendData.length - 1)) * 500;
                          const y = 150 - (day.mood / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ")}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {trendData.map((day, idx) => {
                        if (!day.mood) return null;
                        const x = (idx / (trendData.length - 1)) * 500;
                        const y = 150 - (day.mood / 5) * 150;
                        return (
                          <circle key={idx} cx={x} cy={y} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
                        );
                      })}
                    </>
                  )}
                </svg>
                <div className="x-axis-labels">
                  {trendData.map((day, idx) => (
                    <span key={idx} className="x-axis-label">{day.dayName}</span>
                  ))}
                </div>
              </div>
            </div>
            {!hasMoodData && <div className="no-data-message">No mood data yet. Log your mood to see trends! 😊</div>}
          </div>
        </div>

        {/* Journal Card - Full Width */}
        <div className="journal-card-full">
          <div className="journal-header">
            <BookOpen size={24} color="var(--accent-primary)" />
            <div>
              <h3 className="journal-title">Recent Journal Entries</h3>
              <p className="card-subtitle">Reflect, write, and grow</p>
            </div>
          </div>
          
          <div className="recent-entries-list">
            {journals.length === 0 ? (
              <div className="no-entries">
                <p>No journal entries yet</p>
              </div>
            ) : (
              journals.map((entry, idx) => (
                <div key={idx} className="recent-entry-item">
                  <div className="recent-entry-date">
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <p className="recent-entry-text">
                    {entry.content.length > 100 ? entry.content.substring(0, 100) + "..." : entry.content}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <button onClick={() => navigate("/journal")} className="primary-btn">
            Write in Journal
          </button>
        </div>
      </div>

      {/* Date Modal */}
      {showDateModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <button className="modal-close" onClick={() => setShowDateModal(false)}>✕</button>
            </div>
            <div className="modal-content">
              <h4>Journal Entries</h4>
              {selectedDateJournals.length === 0 ? (
                <p className="modal-empty">No journal entries for this day</p>
              ) : (
                selectedDateJournals.map((journal, idx) => (
                  <div key={idx} className="modal-journal-entry">
                    <div className="modal-journal-time">
                      {new Date(journal.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <p className="modal-journal-content">{journal.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Companion */}
      {showAICompanion && (
        <AICompanion
          onClose={() => {
            setShowAICompanion(false);
            fetchTodayEntries();
            fetchData();
          }}
          onJournalSaved={() => {
            fetchTodayEntries();
            fetchData();
            fetchJournals();
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;