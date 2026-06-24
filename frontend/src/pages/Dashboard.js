// pages/Dashboard.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import AICompanion from "./components/AICompanion";
import Layout from "./components/Layout";
import AssessmentModal from "./components/AssessmentModal";
import Recommendations from "./components/Recommendations";
import { showSuccessToast, showErrorToast, showInfoToast } from "./components/ToastNotification";
import AnimatedCard, { AnimatedButton, PageTransition } from "./components/AnimatedWrapper";
import ExportButton from "./components/ExportButton";
import { 
  MoodChart, 
  SleepChart, 
  CorrelationChart,
  StatsCard 
} from "./components/EnhancedCharts";
import StressForecast from "./components/StressForecast";
import AssessmentHistoryGraph from "./components/AssessmentHistoryGraph";
import { requireStudent } from "../utils/roleAuth";
import {
  Calendar,
  Moon,
  Smile,
  BookOpen,
  MessageCircle,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Activity,
  RefreshCw
} from "lucide-react";

function Dashboard() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [showAICompanion, setShowAICompanion] = useState(false);
  const [showAssessment, setShowAssessment] = useState(null);

  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  
  const [todayMood, setTodayMood] = useState(null);
  const [todaySleep, setTodaySleep] = useState(null);
  const [isUpdatingSleep, setIsUpdatingSleep] = useState(false);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);

  const [moodsData, setMoodsData] = useState([]);
  const [sleepData, setSleepData] = useState([]);
  const [journals, setJournals] = useState([]);
  const [journalTotal, setJournalTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateJournals, setSelectedDateJournals] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [chartView, setChartView] = useState("mood");

  // Role check - redirect admin to admin panel
  useEffect(() => {
    if (!requireStudent(navigate)) {
      return;
    }
  }, [navigate]);

  // Event listener for opening assessment from recommendations
  useEffect(() => {
    const handleOpenAssessment = (e) => {
      setShowAssessment(e.detail.type);
    };
    
    window.addEventListener('openAssessment', handleOpenAssessment);
    
    return () => {
      window.removeEventListener('openAssessment', handleOpenAssessment);
    };
  }, []);

  // Event listener for opening article from recommendations
  useEffect(() => {
    const handleOpenArticle = (e) => {
      console.log("Open article:", e.detail.article);
      navigate(`/mental-health?article=${e.detail.article.id}`);
    };
    
    window.addEventListener('openArticle', handleOpenArticle);
    
    return () => {
      window.removeEventListener('openArticle', handleOpenArticle);
    };
  }, [navigate]);

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
        localStorage.setItem("user_nickname", res.data.nickname);
      } else {
        setUserNickname(res.data.name.split(" ")[0]);
        localStorage.setItem("user_nickname", res.data.name.split(" ")[0]);
      }
    } catch (err) {
      console.log("Profile fetch error:", err);
    }
  };

  const fetchJournals = async () => {
    try {
      const res = await api.get(`/journal/${user_id}`);
      setJournalTotal(res.data.length);
      setJournals(res.data.slice(0, 5));
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
      showErrorToast("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    showSuccessToast("Dashboard refreshed!");
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
      showSuccessToast(`Mood updated to ${moodOptionsList.find(m => m.value === moodValue)?.label}! 🌟`);
    } catch (err) {
      console.error("Manual mood update error:", err);
      showErrorToast("Failed to update mood. Please try again.");
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
    if (!bedtime || !wakeTime) {
      showErrorToast("Please enter both bedtime and wake time");
      return;
    }

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
      showSuccessToast(`Sleep logged! ${duration} hours of rest 💤`);
    } catch (err) {
      console.log("Save sleep error:", err.response?.data || err.message);
      showErrorToast("Failed to save sleep. Please try again.");
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
        const moodDateStr = moodDate.toISOString().split('T')[0];
        return moodDateStr === dateStr;
      });
      
      const sleep = sleepData.find(s => {
        const sleepDate = new Date(s.created_at);
        const sleepDateStr = sleepDate.toISOString().split('T')[0];
        return sleepDateStr === dateStr;
      });
      
      last7Days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        mood: mood ? Number(mood.mood) : null,
        sleepQuality: sleep ? Number(sleep.quality) : null,
        sleepHours: sleep ? Number(sleep.duration) : null,
      });
    }
    
    return last7Days;
  };

  const trendData = getLast7DaysTrend();
  
  const moodsList = moodsData.map(m => m.mood);
  const averageMood = moodsList.length > 0 
    ? (moodsList.reduce((a, b) => a + b, 0) / moodsList.length).toFixed(1)
    : 0;
  
  const sleepQualities = sleepData.map(s => s.quality);
  const averageSleepQuality = sleepQualities.length > 0 
    ? (sleepQualities.reduce((a, b) => a + b, 0) / sleepQualities.length).toFixed(1)
    : 0;
  
  const sleepDurations = sleepData.map(s => parseFloat(s.duration));
  const averageSleepDuration = sleepDurations.length > 0
    ? (sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length).toFixed(1)
    : 0;

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
    showInfoToast("You've been logged out. Take care! 💙");
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
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading your dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <PageTransition>
      <Layout>
        {/* WELCOME SECTION */}
        <AnimatedCard delay={0.1}>
          <div className="welcome-section">
            <div className="welcome-row">
              <div>
                <div className="welcome-badge">
                  <span>{getGreeting()}</span>
                </div>
                <h1 className="welcome-title" style={{ fontSize: '32px', fontWeight: 700 }}>
                  Welcome back, <span style={{ fontSize: '32px', fontWeight: 700 }}>{userNickname || "Friend"}</span>
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
        </AnimatedCard>

        {/* STATS CARDS */}
        <motion.div 
          className="stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '28px'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <StatsCard 
            title="Average Mood" 
            value={`${averageMood}/5`} 
            icon="😊" 
            color="#6366f1"
            subtitle={`Based on ${moodsList.length} entries`}
          />
          <StatsCard 
            title="Sleep Quality" 
            value={`${averageSleepQuality}/5`} 
            icon="💤" 
            color="#10b981"
            subtitle={`${averageSleepDuration}h avg`}
          />
          <StatsCard 
            title="Average Sleep" 
            value={`${averageSleepDuration}h`} 
            icon="🌙" 
            color="#f59e0b"
            subtitle={`From ${sleepDurations.length} sleep logs`}
          />
          <StatsCard 
            title="Journal Entries" 
            value={journalTotal} 
            icon="📓" 
            color="#8b5cf6"
            subtitle="Your reflections"
          />
        </motion.div>

        {/* RECOMMENDATIONS SECTION */}
        <Recommendations userId={user_id} />

        {/* Assessment History Graph */}
        <AssessmentHistoryGraph userId={user_id} />

        {/* ✅ STRESS FORECAST SECTION */}
        <StressForecast userId={user_id} />

        {/* LARGE CALENDAR */}
        <AnimatedCard delay={0.3}>
          <div className="calendar-large">
            <div className="calendar-header">
              <h3 className="calendar-title"><Calendar size={18} /> {formatMonthYear()}</h3>
              <div className="calendar-nav">
                <button onClick={() => changeMonth(-1)} className="calendar-nav-btn"><ChevronLeft size={16} /></button>
                <button onClick={() => changeMonth(1)} className="calendar-nav-btn"><ChevronRight size={16} /></button>
              </div>
            </div>
            
            <div className="weekday-header">
              {weekDays.map(day => <div key={day} className="weekday-cell">{day}</div>)}
            </div>
            
            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                const mood = getMoodForDate(day.date);
                const moodDetails = mood ? getMoodDetails(mood) : null;
                const isToday = day.date.toDateString() === new Date().toDateString();
                
                return (
                  <motion.div
                    key={index}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''}`}
                    style={{
                      backgroundColor: !day.isCurrentMonth ? 'transparent' : 'var(--bg-secondary)',
                      border: isToday ? `2px solid var(--accent-primary)` : '1px solid transparent',
                    }}
                    onClick={() => handleDateClick(day.date, day.isCurrentMonth)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="calendar-day-number">{day.date.getDate()}</span>
                    {day.isCurrentMonth && mood && (
                      <div className="calendar-mood" title={moodDetails.label}>
                        <span>{moodDetails.emoji}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
            
            <div className="calendar-legend">
              <span>Legend:</span>
              {moodOptionsList.map(mood => (
                <span key={mood.value}><span>{mood.emoji}</span> {mood.label}</span>
              ))}
            </div>
          </div>
        </AnimatedCard>

        {/* TWO COLUMN ROW - MOOD & SLEEP LOGGING */}
        <div className="two-column-row">
          <AnimatedCard delay={0.4}>
            <div className="mood-card">
              <div className="mood-card-header">
                <Smile size={24} color="var(--accent-primary)" />
                <div>
                  <h3 className="card-title">Today's Mood</h3>
                  <p className="card-subtitle">How are you feeling today?</p>
                </div>
              </div>
              
              <div className="mood-options">
                {moodOptionsList.map(mood => (
                  <motion.div 
                    key={mood.value} 
                    className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`} 
                    onClick={() => setSelectedMood(mood.value)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="mood-option-emoji">{mood.emoji}</span>
                    <span className="mood-option-label">{mood.label}</span>
                  </motion.div>
                ))}
              </div>
              <AnimatedButton 
                className="primary-btn" 
                onClick={() => updateMoodManually(selectedMood)} 
                disabled={!selectedMood || isUpdatingMood}
              >
                {isUpdatingMood ? "Saving..." : (todayMood ? "Update Mood" : "Log Mood")}
              </AnimatedButton>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.5}>
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
                  <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="sleep-input" />
                </div>
                <div className="sleep-input-group">
                  <label className="input-label">Wake time</label>
                  <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="sleep-input" />
                </div>
              </div>

              <AnimatedButton className="primary-btn" onClick={saveSleep} disabled={!bedtime || !wakeTime || isUpdatingSleep}>
                {isUpdatingSleep ? "Saving..." : (todaySleep ? "Update Sleep" : "Log Sleep")}
              </AnimatedButton>
            </div>
          </AnimatedCard>
        </div>

        {/* CHARTS SECTION */}
        <AnimatedCard delay={0.6}>
          <div className="graph-card">
            <div className="graph-header">
              <BarChart3 size={20} color="var(--accent-primary)" />
              <h3 className="graph-title">Mood Analytics</h3>
            </div>
            
            <div className="chart-selector" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button 
                className={`chart-type-btn ${chartView === 'mood' ? 'active' : ''}`}
                onClick={() => setChartView('mood')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '40px',
                  border: chartView === 'mood' ? 'none' : '1px solid var(--border-light)',
                  background: chartView === 'mood' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
                  color: chartView === 'mood' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Smile size={16} /> Mood Trend
              </button>
              <button 
                className={`chart-type-btn ${chartView === 'sleep' ? 'active' : ''}`}
                onClick={() => setChartView('sleep')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '40px',
                  border: chartView === 'sleep' ? 'none' : '1px solid var(--border-light)',
                  background: chartView === 'sleep' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
                  color: chartView === 'sleep' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Moon size={16} /> Sleep Quality
              </button>
              <button 
                className={`chart-type-btn ${chartView === 'correlation' ? 'active' : ''}`}
                onClick={() => setChartView('correlation')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '40px',
                  border: chartView === 'correlation' ? 'none' : '1px solid var(--border-light)',
                  background: chartView === 'correlation' ? 'var(--accent-gradient)' : 'var(--card-bg-glass)',
                  color: chartView === 'correlation' ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <TrendingUp size={16} /> Mood vs Sleep
              </button>
            </div>
            
            {/* ✅ NEW: Export section below chart selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-light)'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                📊 Export your weekly data
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ExportButton 
                  type="mood" 
                  userId={parseInt(user_id)} 
                  label="Mood CSV"
                  icon={<Activity size={14} />}
                  variant="primary"
                />
                <ExportButton 
                  type="sleep" 
                  userId={parseInt(user_id)} 
                  label="Sleep CSV"
                  icon={<Moon size={14} />}
                  variant="primary"
                />
              </div>
            </div>
            
            {chartView === 'mood' && (
              <>
                <p className="trend-subtitle">Your emotional journey over the last 7 days</p>
                <MoodChart data={trendData} height={320} />
              </>
            )}
            
            {chartView === 'sleep' && (
              <>
                <p className="trend-subtitle">Sleep quality rating over the last 7 days</p>
                <SleepChart data={trendData} height={320} />
              </>
            )}
            
            {chartView === 'correlation' && (
              <>
                <p className="trend-subtitle">How sleep quality affects your mood</p>
                <CorrelationChart data={trendData} height={320} />
              </>
            )}
          </div>
        </AnimatedCard>

        {/* JOURNAL CARD */}
        <AnimatedCard delay={0.7}>
          <div className="journal-card-full">
            <div className="journal-header">
              <BookOpen size={24} color="var(--accent-primary)" />
              <div>
                <h3 className="journal-title">Recent Journal Entries</h3>
                <p className="card-subtitle">{journalTotal > 0 ? `Showing ${journals.length} of ${journalTotal} entries` : "Reflect, write, and grow"}</p>
              </div>
            </div>
            <div className="recent-entries-list">
              {journals.length === 0 ? (
                <div className="no-entries">
                  <p>No journal entries yet. Start writing your first entry! ✍️</p>
                </div>
              ) : (
                journals.map((entry, idx) => (
                  <motion.div 
                    key={idx} 
                    className="recent-entry-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="recent-entry-date">
                      {new Date(entry.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                    <p className="recent-entry-text">
                      {entry.content.length > 120 ? entry.content.substring(0, 120) + "..." : entry.content}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
            <AnimatedButton onClick={() => navigate("/journal")} className="primary-btn">
              Write in Journal
            </AnimatedButton>
          </div>
        </AnimatedCard>

        {/* CHAT BUBBLE */}
        <motion.div 
          className="chat-bubble" 
          onClick={() => setShowAICompanion(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            y: [0, -5, 0],
            transition: { duration: 2, repeat: Infinity, repeatType: "reverse" }
          }}
        >
          <div className="chat-bubble-icon"><MessageCircle size={20} /></div>
          <span className="chat-bubble-text">How are you feeling now?</span>
        </motion.div>

        {/* DATE MODAL */}
        <AnimatePresence>
          {showDateModal && selectedDate && (
            <motion.div 
              className="modal-overlay" 
              onClick={() => setShowDateModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="modal" 
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="modal-header">
                  <div>
                    <h3>
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}
                    </h3>
                  </div>
                  <button className="modal-close" onClick={() => setShowDateModal(false)}>✕</button>
                </div>
                <div className="modal-content">
                  {selectedDateJournals.length === 0 ? (
                    <p className="modal-empty">No journal entries for this day</p>
                  ) : (
                    selectedDateJournals.map((journal, idx) => (
                      <div key={idx} className="modal-journal-entry">
                        <div className="modal-journal-time">
                          {new Date(journal.created_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <p className="modal-journal-content">{journal.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI COMPANION */}
        <AnimatePresence>
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
                showSuccessToast("Journal entry saved from AI conversation! ✨");
              }} 
            />
          )}
        </AnimatePresence>

        {/* ASSESSMENT MODAL */}
        <AnimatePresence>
          {showAssessment && (
            <AssessmentModal 
              type={showAssessment} 
              onClose={() => setShowAssessment(null)}
              onComplete={() => {
                showSuccessToast("Assessment completed! Check your insights.");
                refreshData();
              }}
            />
          )}
        </AnimatePresence>
      </Layout>
    </PageTransition>
  );
}

export default Dashboard;