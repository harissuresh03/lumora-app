// frontend/src/pages/Admin/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from "../../utils/api";
import { 
  Users, 
  UserCheck, 
  UserCog, 
  UserPlus, 
  Flag, 
  AlertCircle, 
  Activity,
  Database,
  Wifi,
  TrendingUp,
  CheckCircle,
  XCircle,
  Settings,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [registrationData, setRegistrationData] = useState([]);
  const [resolutionData, setResolutionData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Fetch stats error:", err);
      }
    };

    const fetchHealth = async () => {
      try {
        const res = await api.get("/admin/health");
        setHealth(res.data);
      } catch (err) {
        console.error("Fetch health error:", err);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const [regRes, resRes] = await Promise.all([
          api.get("/admin/analytics/registrations"),
          api.get("/admin/analytics/report-resolution")
        ]);
        setRegistrationData(regRes.data);
        setResolutionData(resRes.data);
      } catch (err) {
        console.error("Fetch analytics error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchHealth();
    fetchAnalytics();
  }, []);

  const resolutionColors = {
    pending: '#f59e0b',
    reviewed: '#3b82f6',
    resolved: '#22c55e',
    closed: '#6b7280'
  };

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: <Users size={24} />, color: "#6366f1", change: "+12%" },
    { title: "Students", value: stats?.students || 0, icon: <UserCheck size={24} />, color: "#22c55e", change: "+8%" },
    { title: "Counsellors", value: stats?.counsellors || 0, icon: <UserCog size={24} />, color: "#f59e0b", change: "+2%" },
    { title: "Parents", value: stats?.parents || 0, icon: <User size={24} />, color: "#8b5cf6", change: "+5%" }, // ✅ Added Parents
    { title: "Admins", value: stats?.admins || 0, icon: <UserCog size={24} />, color: "#ef4444", change: "0%" },
    { title: "New Users (Week)", value: stats?.newUsersWeek || 0, icon: <UserPlus size={24} />, color: "#10b981", change: "+15%" },
    { title: "Active Users", value: stats?.activeUsers || 0, icon: <Activity size={24} />, color: "#8b5cf6", change: "+5%" },
    // Removed Total Posts and Total Groups
    { title: "Pending Reports", value: stats?.pendingReports || 0, icon: <Flag size={24} />, color: "#ef4444", change: stats?.pendingReports > 0 ? "urgent" : "0" },
    { title: "Pending Issues", value: stats?.pendingIssues || 0, icon: <AlertCircle size={24} />, color: "#f59e0b", change: "needs attention" },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
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
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', color: card.change.includes('urgent') ? '#ef4444' : card.change.includes('attention') ? '#f59e0b' : '#10b981' }}>
              {card.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts Section - unchanged */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* User Registration Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--border-glass)'
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} /> User Registration Trend (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={registrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <defs>
                <linearGradient id="registrationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#registrationGradient)"
                name="New Users"
                dot={{ r: 4, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#6366f1' }}>
                {registrationData.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total New Users</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                {registrationData.length > 0 ? Math.ceil(registrationData.reduce((sum, d) => sum + d.count, 0) / registrationData.length) : 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Daily Average</div>
            </div>
          </div>
        </motion.div>

        {/* Report Resolution Status */}
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
            <Flag size={20} /> Issue Report Resolution Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="status" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#6366f1" name="Number of Reports" radius={[8, 8, 0, 0]}>
                {resolutionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={resolutionColors[entry.status] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
                {resolutionData.find(d => d.status === 'resolved')?.count || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resolved</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                {resolutionData.find(d => d.status === 'pending')?.count || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                {resolutionData.find(d => d.status === 'reviewed')?.count || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reviewed</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Health - unchanged */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
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
          <Database size={20} /> System Health
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <Database size={20} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Database</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {health?.database === 'connected' ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                <span>{health?.database || 'checking...'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <Wifi size={20} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Firebase</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {health?.firebase === 'connected' ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
                <span>{health?.firebase || 'checking...'}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <TrendingUp size={20} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Updated</div>
              <div>{health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <Settings size={20} />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Admin Settings</div>
              <button 
                onClick={() => navigate("/admin/settings")}
                style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '12px' }}
              >
                Configure →
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AdminDashboard;