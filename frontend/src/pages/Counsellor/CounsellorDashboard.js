// frontend/src/pages/Counsellor/CounsellorDashboard.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from "../../utils/api";
import { showErrorToast } from "../components/ToastNotification";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle, 
  MessageCircle,
  TrendingUp,
  Activity,
  Smile,
  Moon,
  BarChart3,
  CheckCircle
} from "lucide-react";

function CounsellorDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const counsellorId = localStorage.getItem("user_id");

  const fetchStats = async () => {
    try {
      const res = await api.get(`/counsellor/stats/${counsellorId}`);
      console.log("Stats response:", res.data);
      
      if (res.data.message) {
        setError(res.data.message);
      } else {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
      showErrorToast("Failed to load dashboard data");
      setError("Failed to load data");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/counsellor/analytics/${counsellorId}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error("Fetch analytics error:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchAnalytics()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const moodLabels = ['Terrible', 'Sad', 'Okay', 'Good', 'Great'];
  const moodColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  const sleepLabels = ['Poor', 'Fair', 'Okay', 'Good', 'Excellent'];
  const sleepColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px', 
        background: 'var(--card-bg-glass)', 
        borderRadius: '20px',
        border: '1px solid var(--border-glass)'
      }}>
        <Users size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3>No Students Found</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button 
          onClick={() => window.location.href = '/profile/edit'}
          style={{
            marginTop: '16px',
            padding: '10px 24px',
            background: 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '30px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Update Your Profile
        </button>
      </div>
    );
  }

  const statCards = [
    { title: "Total Students", value: stats?.totalStudents || 0, icon: <Users size={24} />, color: "#6366f1" },
    { title: "Consented Students", value: stats?.consentedStudents || 0, icon: <CheckCircle size={24} />, color: "#10b981" },
    { title: "Pending Appointments", value: stats?.pendingAppointments || 0, icon: <Calendar size={24} />, color: "#f59e0b" },
    { title: "Pending Alerts", value: stats?.pendingAlerts || 0, icon: <AlertTriangle size={24} />, color: "#ef4444" },
    { title: "Unread Messages", value: stats?.unreadMessages || 0, icon: <MessageCircle size={24} />, color: "#3b82f6" },
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
              background: 'var(--card-bg-glass)',
              backdropFilter: 'var(--glass-blur)',
              borderRadius: '20px',
              padding: '20px',
              border: '1px solid var(--border-glass)',
              transition: 'all 0.3s'
            }}
            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{card.title}</span>
              <span style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        {/* Mood Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smile size={20} color="#6366f1" /> Mood Distribution (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.moodDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mood" stroke="#94a3b8" fontSize={11} tickFormatter={(value) => moodLabels[value - 1] || value} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip formatter={(value, name, props) => [`${value} students`, moodLabels[props.payload.mood - 1] || `Mood ${props.payload.mood}`]} />
              <Bar dataKey="student_count" fill="#6366f1" name="Students" radius={[8, 8, 0, 0]}>
                {analytics?.moodDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={moodColors[(entry.mood - 1) % moodColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sleep Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Moon size={20} color="#10b981" /> Sleep Distribution (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics?.sleepDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quality" stroke="#94a3b8" fontSize={11} tickFormatter={(value) => sleepLabels[value - 1] || value} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 'auto']} allowDecimals={false} />
              <Tooltip formatter={(value, name, props) => [`${value} students`, sleepLabels[props.payload.quality - 1] || `Quality ${props.payload.quality}`]} />
              <Bar dataKey="student_count" fill="#10b981" name="Students" radius={[8, 8, 0, 0]}>
                {analytics?.sleepDistribution?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={sleepColors[(entry.quality - 1) % sleepColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Weekly Mood Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-glass)',
          marginBottom: '24px'
        }}
      >
        <h3 style={{ fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="#8b5cf6" /> Weekly Mood Trend (Last 7 Days)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={analytics?.weeklyMoodTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
            <YAxis stroke="#94a3b8" fontSize={11} domain={[1, 5]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="avg_mood" 
              stroke="#8b5cf6" 
              strokeWidth={3} 
              name="Average Mood" 
              dot={{ r: 6, fill: '#8b5cf6' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Overall Student Wellness Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-glass)',
          marginBottom: '24px'
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={20} color="var(--accent-primary)" />
          Overall Student Wellness (Last 7 Days)
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Smile size={28} style={{ marginBottom: '8px', color: '#6366f1' }} />
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {stats?.avgMood ? `${stats.avgMood}/5` : 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Mood</div>
          </div>
          <div style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <Moon size={28} style={{ marginBottom: '8px', color: '#10b981' }} />
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {stats?.avgSleep ? `${stats.avgSleep}/5` : 'N/A'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Sleep Quality</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid var(--border-glass)'
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={20} color="var(--accent-primary)" />
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onClick={() => window.location.href = '/counsellor/students'}
          >
            <Users size={32} style={{ marginBottom: '8px', color: '#6366f1' }} />
            <div style={{ fontWeight: 600 }}>View Students</div>
          </div>
          <div style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onClick={() => window.location.href = '/counsellor/messages'}
          >
            <MessageCircle size={32} style={{ marginBottom: '8px', color: '#3b82f6' }} />
            <div style={{ fontWeight: 600 }}>Send Message</div>
          </div>
          <div style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-soft)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
          onClick={() => window.location.href = '/counsellor/appointments'}
          >
            <Calendar size={32} style={{ marginBottom: '8px', color: '#f59e0b' }} />
            <div style={{ fontWeight: 600 }}>Schedule Session</div>
          </div>
          {/* ✅ REMOVED: Stress Level quick action */}
        </div>
      </motion.div>
    </div>
  );
}

export default CounsellorDashboard;