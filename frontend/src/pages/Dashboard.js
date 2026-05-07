// pages/Dashboard.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function Dashboard() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userName, setUserName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedMood, setSelectedMood] = useState(null);
  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  
  // Track today's existing entries
  const [todayMood, setTodayMood] = useState(null);
  const [todaySleep, setTodaySleep] = useState(null);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [isUpdatingSleep, setIsUpdatingSleep] = useState(false);
  
  // Tooltip state for sleep bars
  const [tooltip, setTooltip] = useState({ show: false, content: "", x: 0, y: 0 });

  const [moodsData, setMoodsData] = useState([]);
  const [sleepData, setSleepData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile for greeting
  const fetchUserProfile = async () => {
    try {
      const res = await api.get(`/profile/${user_id}`);
      setUserName(res.data.name.split(" ")[0]);
    } catch (err) {
      console.log("Profile fetch error:", err);
    }
  };

  // Fetch today's mood and sleep
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
        setTodaySleep(sleepRes.data);
        setBedtime(sleepRes.data.bedtime);
        setWakeTime(sleepRes.data.wake_time);
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

      setMoodsData(moodRes.data);
      setSleepData(sleepRes.data);
      await fetchTodayEntries();
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

  /* ================= MOOD ================= */
  const saveMood = async () => {
    if (!selectedMood) return;

    try {
      setIsUpdatingMood(true);
      await api.post("/mood", {
        user_id: parseInt(user_id),
        mood: selectedMood,
      });
      
      await fetchTodayEntries();
      await fetchData();
    } catch (err) {
      console.log("Save mood error:", err);
      alert("Failed to save mood. Please try again.");
    } finally {
      setIsUpdatingMood(false);
    }
  };

  const moodColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  const moodLabels = ["😭", "😔", "😐", "🙂", "😄"];
  const moodTexts = ["Terrible", "Sad", "Okay", "Good", "Great"];

  /* ================= SLEEP ================= */
  const getSleepQuality = (hours) => {
    if (hours < 5) return 1;
    if (hours < 7) return 2;
    if (hours <= 9) return 5;
    if (hours <= 10) return 3;
    return 1;
  };

  const getQualityText = (quality) => {
    const texts = { 1: "Poor", 2: "Fair", 3: "Good", 4: "Very Good", 5: "Excellent" };
    return texts[quality] || "Fair";
  };

  const saveSleep = async () => {
    if (!bedtime || !wakeTime) return;

    const start = new Date(`1970-01-01T${bedtime}`);
    let end = new Date(`1970-01-01T${wakeTime}`);
    if (end < start) end.setDate(end.getDate() + 1);

    const duration = (end - start) / (1000 * 60 * 60);
    const quality = getSleepQuality(duration);

    try {
      setIsUpdatingSleep(true);
      await api.post("/sleep", {
        user_id: parseInt(user_id),
        bedtime,
        wake_time: wakeTime,
        duration,
        quality,
      });
      
      await fetchTodayEntries();
      await fetchData();
    } catch (err) {
      console.log("Save sleep error:", err);
      alert("Failed to save sleep. Please try again.");
    } finally {
      setIsUpdatingSleep(false);
    }
  };

  const handleBarHover = (e, sleep) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content: `Quality: ${getQualityText(sleep.quality)} (${sleep.quality}/5)`,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleBarLeave = () => {
    setTooltip({ show: false, content: "", x: 0, y: 0 });
  };

  /* ================= ANALYTICS ================= */
  const avgSleep =
    sleepData.length > 0
      ? (sleepData.reduce((a, b) => a + b.duration, 0) / sleepData.length).toFixed(1)
      : 0;

  const avgQuality =
    sleepData.length > 0
      ? (sleepData.reduce((a, b) => a + b.quality, 0) / sleepData.length).toFixed(1)
      : 0;

  // Prepare data for the last 7 days with accurate day mapping
  const getLast7DaysData = () => {
    const today = new Date();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push({
        date: date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toISOString().split('T')[0],
        sleep: null,
        mood: null,
      });
    }
    
    sleepData.forEach(sleep => {
      const sleepDate = new Date(sleep.created_at).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.fullDate === sleepDate);
      if (dayData) {
        dayData.sleep = {
          duration: sleep.duration,
          quality: sleep.quality,
        };
      }
    });
    
    moodsData.forEach(mood => {
      const moodDate = new Date(mood.created_at).toISOString().split('T')[0];
      const dayData = last7Days.find(d => d.fullDate === moodDate);
      if (dayData) {
        dayData.mood = mood.mood;
      }
    });
    
    return last7Days;
  };

  const last7DaysData = getLast7DaysData();
  
  // Get week range display
  const getWeekRange = () => {
    if (last7DaysData.length === 0) return "";
    const startDate = last7DaysData[0].date;
    const endDate = last7DaysData[6].date;
    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get motivational quote
  const getMotivationalQuote = () => {
    const quotes = [
      "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
      "Small steps every day lead to big changes over time.",
      "Rest when you're weary. Recharge and let your soul catch up.",
      "You don't have to control your thoughts. You just have to stop letting them control you.",
      "Be kind to yourself. You're doing the best you can.",
      "Sleep is the best meditation. 🌙",
      "Every day may not be good, but there's something good in every day.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const hasSleepData = last7DaysData.some(d => d.sleep !== null);
  const hasMoodData = last7DaysData.some(d => d.mood !== null);

  /* ================= UI ================= */
  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Creating your peaceful space...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* BACKGROUND DECORATION */}
      <div style={styles.bgDecoration}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
        <div style={styles.blob3}></div>
      </div>

      {/* HAMBURGER MENU BUTTON */}
      <div style={styles.hamburgerBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span style={styles.hamburgerIcon}>☰</span>
      </div>

      {/* SIDEBAR */}
      <div style={{...styles.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'}}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarLogo}>✨ Lumora</span>
          <button style={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <nav style={styles.sidebarNav}>
          <button style={styles.sidebarItem} onClick={() => navigate("/dashboard")}>
            <span>📊</span> Dashboard
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/journal")}>
            <span>📓</span> Journal
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/profile")}>
            <span>👤</span> Profile
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/mental-health")}>  
            <span>🧠</span> Mental Health
          </button>
          <button style={styles.sidebarItem} onClick={() => navigate("/student-support")}>  
            <span>🎓</span> Student Support
          </button>
          <button style={styles.sidebarItem} onClick={() => alert("Settings coming soon!")}>
            <span>⚙️</span> Settings
          </button>
          <button style={styles.sidebarItemLogout} onClick={logout}>
            <span>🚪</span> Logout
          </button>
        </nav>
      </div>

      {/* OVERLAY FOR SIDEBAR */}
      {sidebarOpen && (
        <div style={styles.overlay} onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* TOOLTIP */}
      {tooltip.show && (
        <div style={{...styles.tooltip, left: tooltip.x, top: tooltip.y}}>
          {tooltip.content}
        </div>
      )}

      <div style={styles.contentWrapper}>
        {/* TOP BAR (removed profile icon since it's in sidebar now) */}
        <div style={styles.topBar}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>✨</span>
            <span style={styles.logoText}>Lumora</span>
          </div>
          <div style={styles.topBarRight}>
            <button style={styles.logoutBtn} onClick={logout}>
              <span>🚪</span> Exit
            </button>
          </div>
        </div>

        {/* WELCOME SECTION */}
        <div style={styles.welcomeSection}>
          <div style={styles.welcomeBadge}>
            <span style={styles.waveEmoji}>👋</span>
            <span>{getGreeting()}</span>
          </div>
          <h1 style={styles.welcomeTitle}>
            Welcome to Lumora, <span style={styles.userName}>{userName || "Friend"} </span>
            <span style={styles.sparkle}>✨</span>
          </h1>
          <p style={styles.weekInfo}>
            📅 Week of {getWeekRange()} • {last7DaysData.length} days tracked
          </p>
          <div style={styles.quoteCard}>
            <span style={styles.quoteIcon}>💭</span>
            <p style={styles.quoteText}>"{getMotivationalQuote()}"</p>
          </div>
        </div>

        {/* STATS CARDS */}
        <div style={styles.analyticsRow}>
          <div style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <span style={styles.statIcon}>😴</span>
            </div>
            <div>
              <h4 style={styles.statLabel}>Average sleep</h4>
              <p style={styles.statValue}>{avgSleep} <span style={styles.statUnit}>hours</span></p>
              <div style={styles.progressBar}>
                <div style={{...styles.progressFill, width: `${(avgSleep / 9) * 100}%`}}></div>
              </div>
              <p style={avgSleep < 7 ? styles.statNegative : styles.statPositive}>
                {avgSleep < 7 ? "Aim for 7-9 hours 🌙" : "Great sleep consistency! ⭐"}
              </p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <span style={styles.statIcon}>⭐</span>
            </div>
            <div>
              <h4 style={styles.statLabel}>Sleep quality</h4>
              <p style={styles.statValue}>{avgQuality} <span style={styles.statUnit}>/5</span></p>
              <div style={styles.qualityStars}>
                {[1,2,3,4,5].map(star => (
                  <span key={star} style={{
                    ...styles.starIcon,
                    opacity: star <= avgQuality ? 1 : 0.3,
                    color: star <= avgQuality ? "#fbbf24" : "#cbd5e1"
                  }}>★</span>
                ))}
              </div>
              <p style={avgQuality < 3.5 ? styles.statNegative : styles.statPositive}>
                {avgQuality < 3.5 ? "Focus on better sleep routine" : "Restoring your energy well 💪"}
              </p>
            </div>
          </div>
        </div>

        {/* SLEEP DURATION CHART */}
        <div style={styles.chartSection}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionIcon}>📊</span>
            <h3 style={styles.sectionTitle}>Sleep tracker</h3>
          </div>
          <p style={styles.sectionSubtitle}>Last 7 days of rest</p>
          
          <div style={styles.weekLabels}>
            {last7DaysData.map((day, idx) => (
              <div key={idx} style={styles.weekDayLabel}>
                <span style={styles.dayName}>{day.dayName}</span>
                <span style={styles.dayDate}>{day.date.getDate()}</span>
              </div>
            ))}
          </div>
          <div style={styles.barChartContainer}>
            {last7DaysData.map((day, idx) => {
              let barColor = moodColors[0];
              let barHeight = 4;
              if (day.sleep) {
                if (day.sleep.duration >= 7) { barColor = moodColors[4]; }
                else if (day.sleep.duration >= 5) { barColor = moodColors[2]; }
                else { barColor = moodColors[0]; }
                barHeight = Math.min(day.sleep.duration * 10, 90);
              }
              
              return (
                <div 
                  key={idx} 
                  style={styles.barWrapper}
                  onMouseEnter={(e) => day.sleep && handleBarHover(e, day.sleep)}
                  onMouseLeave={handleBarLeave}
                >
                  <div style={styles.barColumn}>
                    <div style={{...styles.bar, height: `${barHeight}px`, backgroundColor: barColor}}>
                      {day.sleep && <span style={styles.barValue}>{day.sleep.duration.toFixed(1)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={styles.legend}>
            <span><span style={{...styles.legendDot, backgroundColor: moodColors[4]}}></span> Excellent (7h+)</span>
            <span><span style={{...styles.legendDot, backgroundColor: moodColors[2]}}></span> Fair (5-7h)</span>
            <span><span style={{...styles.legendDot, backgroundColor: moodColors[0]}}></span> Needs improvement (&lt;5h)</span>
          </div>
        </div>

        {/* LINE GRAPHS WITH GRADIENT */}
        <div style={styles.chartRow}>
          {/* Sleep Quality Trend */}
          <div style={styles.chartCard}>
            <div style={styles.cardHeaderSmall}>
              <span style={styles.cardIconSmall}>💙</span>
              <h3 style={styles.cardTitleSmall}>Sleep quality trend</h3>
            </div>
            <div style={styles.lineGraphContainer}>
              <div style={styles.yAxis}>
                <span>5</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
              </div>
              <div style={styles.graphArea}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={styles.svgGraph}>
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {hasSleepData && (
                    <>
                      {/* Gradient fill */}
                      <defs>
                        <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area under the line */}
                      <polygon
                        points={last7DaysData.map((day, idx) => {
                          if (!day.sleep) return null;
                          const x = (idx / (last7DaysData.length - 1)) * 500;
                          const y = 150 - (day.sleep.quality / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ") + `, 500,150, 0,150`}
                        fill="url(#sleepGradient)"
                      />
                      
                      {/* Line */}
                      <polyline
                        points={last7DaysData.map((day, idx) => {
                          if (!day.sleep) return null;
                          const x = (idx / (last7DaysData.length - 1)) * 500;
                          const y = 150 - (day.sleep.quality / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ")}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {last7DaysData.map((day, idx) => {
                        if (!day.sleep) return null;
                        const x = (idx / (last7DaysData.length - 1)) * 500;
                        const y = 150 - (day.sleep.quality / 5) * 150;
                        return (
                          <circle key={idx} cx={x} cy={y} r="5" fill="#3b82f6" stroke="white" strokeWidth="2" />
                        );
                      })}
                    </>
                  )}
                </svg>
                <div style={styles.xAxisLabels}>
                  {last7DaysData.map((day, idx) => (
                    <span key={idx} style={styles.xAxisLabel}>{day.dayName}</span>
                  ))}
                </div>
              </div>
            </div>
            {!hasSleepData && <div style={styles.noDataMessage}>No sleep data yet. Start tracking tonight! 🌙</div>}
          </div>

          {/* Mood Trend */}
          <div style={styles.chartCard}>
            <div style={styles.cardHeaderSmall}>
              <span style={styles.cardIconSmall}>💚</span>
              <h3 style={styles.cardTitleSmall}>Mood trend</h3>
            </div>
            <div style={styles.lineGraphContainer}>
              <div style={styles.yAxis}>
                <span>5</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
              </div>
              <div style={styles.graphArea}>
                <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={styles.svgGraph}>
                  {/* Grid lines */}
                  <line x1="0" y1="0" x2="500" y2="0" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="37.5" x2="500" y2="37.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#e2e8f0" strokeWidth="1" />
                  <line x1="0" y1="112.5" x2="500" y2="112.5" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
                  <line x1="0" y1="150" x2="500" y2="150" stroke="#e2e8f0" strokeWidth="1" />
                  
                  {hasMoodData && (
                    <>
                      {/* Gradient fill */}
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area under the line */}
                      <polygon
                        points={last7DaysData.map((day, idx) => {
                          if (!day.mood) return null;
                          const x = (idx / (last7DaysData.length - 1)) * 500;
                          const y = 150 - (day.mood / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ") + `, 500,150, 0,150`}
                        fill="url(#moodGradient)"
                      />
                      
                      {/* Line */}
                      <polyline
                        points={last7DaysData.map((day, idx) => {
                          if (!day.mood) return null;
                          const x = (idx / (last7DaysData.length - 1)) * 500;
                          const y = 150 - (day.mood / 5) * 150;
                          return `${x},${y}`;
                        }).filter(p => p !== null).join(" ")}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {last7DaysData.map((day, idx) => {
                        if (!day.mood) return null;
                        const x = (idx / (last7DaysData.length - 1)) * 500;
                        const y = 150 - (day.mood / 5) * 150;
                        return (
                          <circle key={idx} cx={x} cy={y} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                        );
                      })}
                    </>
                  )}
                </svg>
                <div style={styles.xAxisLabels}>
                  {last7DaysData.map((day, idx) => (
                    <span key={idx} style={styles.xAxisLabel}>{day.dayName}</span>
                  ))}
                </div>
              </div>
            </div>
            {!hasMoodData && <div style={styles.noDataMessage}>No mood data yet. How are you feeling? 😊</div>}
          </div>
        </div>

        {/* MOOD & SLEEP INPUT CARDS */}
        <div style={styles.twoColumnRow}>
          {/* 😊 MOOD CARD */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>😊</span>
              <div>
                <h3 style={styles.cardTitle}>
                  {todayMood ? "Update your mood" : "How are you feeling?"}
                </h3>
                <p style={styles.cardSubtitle}>
                  {todayMood 
                    ? `You already logged mood today. Update it if needed.` 
                    : "Check in with yourself"}
                </p>
              </div>
            </div>
            {todayMood && (
              <div style={styles.existingBadge}>
                <span>✅ Today's mood: {moodTexts[todayMood.mood - 1]}</span>
              </div>
            )}

            <div style={styles.emojiRow}>
              {moodLabels.map((emoji, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedMood(i + 1)}
                  style={{
                    ...styles.emojiBox,
                    background: selectedMood === i + 1 ? `linear-gradient(135deg, ${moodColors[i]}20, ${moodColors[i]}40)` : "#f9fafb",
                    border: selectedMood === i + 1 ? `2px solid ${moodColors[i]}` : "1px solid #e5e7eb",
                    transform: selectedMood === i + 1 ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <div style={styles.emojiLarge}>{emoji}</div>
                  <div style={styles.emojiLabel}>{moodTexts[i]}</div>
                </div>
              ))}
            </div>

            <button style={styles.primaryBtn} onClick={saveMood} disabled={!selectedMood || isUpdatingMood}>
              {isUpdatingMood 
                ? "Saving..." 
                : todayMood 
                  ? "Update my mood 💫" 
                  : "Log my mood 💫"}
            </button>
          </div>

          {/* 🌙 SLEEP CARD */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🌙</span>
              <div>
                <h3 style={styles.cardTitle}>
                  {todaySleep ? "Update sleep" : "Log sleep"}
                </h3>
                <p style={styles.cardSubtitle}>
                  {todaySleep 
                    ? "You already logged sleep today. Update if needed." 
                    : "Track your rest"}
                </p>
              </div>
            </div>
            {todaySleep && (
              <div style={styles.existingBadge}>
                <span>✅ Today's sleep: {todaySleep.duration.toFixed(1)} hours</span>
              </div>
            )}

            <div style={styles.sleepRow}>
              <div style={styles.inputGroupSmall}>
                <label style={styles.inputLabel}>🌅 Bedtime</label>
                <input 
                  type="time" 
                  value={bedtime} 
                  onChange={(e) => setBedtime(e.target.value)} 
                  style={styles.inputSmall} 
                />
              </div>
              <div style={styles.inputGroupSmall}>
                <label style={styles.inputLabel}>☀️ Wake time</label>
                <input 
                  type="time" 
                  value={wakeTime} 
                  onChange={(e) => setWakeTime(e.target.value)} 
                  style={styles.inputSmall} 
                />
              </div>
            </div>

            <button style={styles.primaryBtn} onClick={saveSleep} disabled={!bedtime || !wakeTime || isUpdatingSleep}>
              {isUpdatingSleep 
                ? "Saving..." 
                : todaySleep 
                  ? "Update sleep 💤" 
                  : "Log sleep 💤"}
            </button>
          </div>
        </div>

        {/* JOURNAL CTA */}
        <div style={styles.journalSection}>
          <div style={styles.journalCard}>
            <div style={styles.journalContent}>
              <div style={styles.journalIcon}>📓✨</div>
              <div>
                <h3 style={styles.journalTitle}>Your personal journal</h3>
                <p style={styles.journalDesc}>Write down your thoughts, reflect, and grow</p>
              </div>
            </div>
            <button onClick={() => navigate("/journal")} style={styles.journalBtn}>
              Open journal →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= PROFESSIONAL STYLES ================= */
const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    background: "#f0f9ff",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },

  contentWrapper: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 32px",
    position: "relative",
    zIndex: 2,
    transition: "margin-left 0.3s ease",
  },

  bgDecoration: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },

  blob1: {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.1), rgba(139,92,246,0.05))",
    filter: "blur(60px)",
  },

  blob2: {
    position: "absolute",
    bottom: "-10%",
    left: "-5%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(16,185,129,0.08), rgba(5,150,105,0.03))",
    filter: "blur(50px)",
  },

  blob3: {
    position: "absolute",
    top: "40%",
    left: "30%",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(245,158,11,0.08), rgba(245,158,11,0.03))",
    filter: "blur(50px)",
  },

  hamburgerBtn: {
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 100,
    background: "white",
    width: "45px",
    height: "45px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    transition: "all 0.2s",
    ":hover": {
      transform: "scale(1.05)",
      boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
    },
  },

  hamburgerIcon: {
    fontSize: "24px",
    color: "#667eea",
  },

  sidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "280px",
    height: "100vh",
    background: "white",
    boxShadow: "2px 0 20px rgba(0,0,0,0.1)",
    zIndex: 1000,
    transition: "transform 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },

  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 20px",
    borderBottom: "1px solid #e5e7eb",
  },

  sidebarLogo: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  closeSidebar: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#9ca3af",
    transition: "color 0.2s",
    ":hover": { color: "#1f2937" },
  },

  sidebarNav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "20px",
  },

  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "none",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#4b5563",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
    textAlign: "left",
    ":hover": {
      background: "#f3f4f6",
      color: "#667eea",
      transform: "translateX(4px)",
    },
  },

  sidebarItemLogout: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    background: "none",
    border: "1px solid #fee2e2",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#ef4444",
    cursor: "pointer",
    transition: "all 0.2s",
    width: "100%",
    textAlign: "left",
    marginTop: "auto",
    ":hover": {
      background: "#fef2f2",
      transform: "translateX(4px)",
    },
  },

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 999,
    animation: "fadeIn 0.3s ease",
  },

  tooltip: {
    position: "fixed",
    background: "#1f2937",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    animation: "fadeIn 0.2s ease",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
  },

  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },

  loadingText: {
    fontSize: "14px",
    opacity: 0.9,
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    position: "relative",
    zIndex: 2,
  },

  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "40px",
  },

  logoIcon: {
    fontSize: "28px",
  },

  logoText: {
    fontSize: "20px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  logoutBtn: {
    background: "white",
    color: "#ef4444",
    border: "1px solid #fee2e2",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
    ":hover": { background: "#fef2f2", transform: "scale(1.02)" },
  },

  welcomeSection: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "28px",
    padding: "32px 40px",
    marginBottom: "32px",
    color: "white",
    position: "relative",
    zIndex: 2,
    boxShadow: "0 20px 35px -10px rgba(102, 126, 234, 0.3)",
  },

  welcomeBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
    padding: "8px 16px",
    borderRadius: "40px",
    fontSize: "14px",
    marginBottom: "20px",
  },

  waveEmoji: {
    fontSize: "18px",
  },

  welcomeTitle: {
    fontSize: "36px",
    fontWeight: "700",
    margin: "0 0 12px 0",
    letterSpacing: "-0.5px",
  },

  userName: {
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },

  sparkle: {
    fontSize: "32px",
  },

  weekInfo: {
    fontSize: "14px",
    opacity: 0.95,
    marginBottom: "16px",
  },

  quoteCard: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "12px",
  },

  quoteIcon: {
    fontSize: "24px",
  },

  quoteText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.5",
    fontStyle: "italic",
  },

  analyticsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "24px",
    marginBottom: "32px",
    position: "relative",
    zIndex: 2,
  },

  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    border: "1px solid rgba(203,213,225,0.3)",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
    ":hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" },
  },

  statIconWrapper: {
    width: "48px",
    height: "48px",
    background: "linear-gradient(135deg, #667eea15, #764ba215)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  statIcon: { fontSize: "28px" },

  statLabel: { fontSize: "13px", fontWeight: "500", color: "#64748b", margin: "0 0 8px 0", letterSpacing: "0.3px" },
  statValue: { fontSize: "32px", fontWeight: "700", color: "#0f172a", margin: 0, lineHeight: 1.2 },
  statUnit: { fontSize: "14px", fontWeight: "400", color: "#64748b" },
  
  progressBar: {
    width: "100%",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    marginTop: "12px",
    overflow: "hidden",
  },
  
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  
  qualityStars: {
    display: "flex",
    gap: "4px",
    marginTop: "8px",
  },
  
  starIcon: {
    fontSize: "18px",
    transition: "opacity 0.2s",
  },
  
  statPositive: { fontSize: "12px", color: "#10b981", margin: "8px 0 0 0", fontWeight: "500" },
  statNegative: { fontSize: "12px", color: "#ef4444", margin: "8px 0 0 0", fontWeight: "500" },

  chartSection: {
    background: "white",
    padding: "24px",
    borderRadius: "20px",
    marginBottom: "32px",
    border: "1px solid rgba(203,213,225,0.3)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    position: "relative",
    zIndex: 2,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },

  sectionIcon: { fontSize: "24px" },
  sectionTitle: { fontSize: "20px", fontWeight: "600", color: "#0f172a", margin: 0 },
  sectionSubtitle: { fontSize: "13px", color: "#64748b", marginBottom: "24px" },

  weekLabels: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "16px",
    padding: "0 20px",
  },

  weekDayLabel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    width: "70px",
  },

  dayName: { fontWeight: "600", color: "#334155", fontSize: "13px" },
  dayDate: { fontSize: "11px", color: "#94a3b8" },

  barChartContainer: {
    display: "flex",
    justifyContent: "space-around",
    alignItems: "flex-end",
    padding: "20px 0",
    minHeight: "160px",
  },

  barWrapper: { display: "flex", flexDirection: "column", alignItems: "center", width: "70px", cursor: "pointer" },
  barColumn: { display: "flex", flexDirection: "column", alignItems: "center" },
  bar: { 
    width: "42px", 
    borderRadius: "12px 12px 8px 8px", 
    transition: "height 0.3s, background 0.2s",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    position: "relative",
    minHeight: "4px",
  },
  
  barValue: {
    position: "absolute",
    top: "-20px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#334155",
  },

  legend: { display: "flex", justifyContent: "center", gap: "24px", marginTop: "20px", fontSize: "12px", color: "#64748b" },
  legendDot: { display: "inline-block", width: "12px", height: "12px", borderRadius: "4px", marginRight: "6px", verticalAlign: "middle" },

  chartRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px",
    position: "relative",
    zIndex: 2,
  },

  chartCard: {
    background: "white",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(203,213,225,0.3)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },

  cardHeaderSmall: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },

  cardIconSmall: { fontSize: "20px" },
  cardTitleSmall: { fontSize: "16px", fontWeight: "600", margin: 0, color: "#0f172a" },

  lineGraphContainer: { display: "flex", marginTop: "10px", gap: "10px" },
  yAxis: { display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", width: "30px", fontSize: "11px", color: "#64748b", paddingBottom: "25px" },
  graphArea: { flex: 1, position: "relative" },
  svgGraph: { width: "100%", height: "150px", backgroundColor: "#fafbfc", borderRadius: "8px" },
  xAxisLabels: { display: "flex", justifyContent: "space-around", marginTop: "8px", padding: "0 10px" },
  xAxisLabel: { fontSize: "11px", color: "#64748b", textAlign: "center", width: "40px" },
  noDataMessage: { textAlign: "center", padding: "40px", color: "#94a3b8", fontSize: "13px" },

  twoColumnRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px",
    position: "relative",
    zIndex: 2,
  },

  card: {
    background: "white",
    padding: "28px",
    borderRadius: "20px",
    border: "1px solid rgba(203,213,225,0.3)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },

  cardHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" },
  cardIcon: { fontSize: "32px" },
  cardTitle: { fontSize: "20px", fontWeight: "600", margin: 0, color: "#0f172a" },
  cardSubtitle: { fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" },

  existingBadge: {
    background: "#dbeafe",
    padding: "10px 14px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontSize: "13px",
    color: "#1e40af",
    textAlign: "center",
    fontWeight: "500",
  },

  emojiRow: { display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "28px" },
  emojiBox: { flex: 1, padding: "14px 8px", borderRadius: "16px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" },
  emojiLarge: { fontSize: "32px", marginBottom: "8px" },
  emojiLabel: { fontSize: "11px", fontWeight: "500", color: "#475569" },

  sleepRow: { display: "flex", gap: "16px", marginBottom: "28px", justifyContent: "center" },
  inputGroupSmall: { flex: 1, maxWidth: "160px" },
  inputLabel: { display: "block", fontSize: "12px", fontWeight: "500", color: "#64748b", marginBottom: "8px", textAlign: "center" },
  inputSmall: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    transition: "all 0.2s",
    background: "#f9fafb",
    textAlign: "center",
    ":focus": { outline: "none", borderColor: "#3b82f6", background: "white" }
  },

  primaryBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(102, 126, 234, 0.4)" },
    ":disabled": { opacity: 0.5, cursor: "not-allowed", transform: "none" },
  },

  journalSection: { position: "relative", zIndex: 2 },
  journalCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "28px 32px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "20px",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
  },

  journalContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  journalIcon: { fontSize: "44px" },
  journalTitle: { fontSize: "20px", fontWeight: "600", margin: 0, color: "white" },
  journalDesc: { fontSize: "13px", margin: "6px 0 0 0", color: "rgba(255,255,255,0.85)" },
  journalBtn: {
    padding: "12px 28px",
    background: "white",
    color: "#667eea",
    border: "none",
    borderRadius: "40px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    ":hover": { transform: "scale(1.02)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;