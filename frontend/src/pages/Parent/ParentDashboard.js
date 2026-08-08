// frontend/src/pages/Parent/ParentDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import api from "../../utils/api";
import Layout from "../components/Layout";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { 
  LayoutDashboard, Settings, User, Eye, Smile, Moon, Activity, RefreshCw 
} from "lucide-react";

function ParentDashboard() {
  const navigate = useNavigate();
  const [parentName, setParentName] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const parentId = localStorage.getItem("user_id");

  // ✅ Custom menu items for parent (Dashboard and Settings)
  const parentMenuItems = [
    { path: "/parent/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { path: "/parent/settings", icon: <Settings size={18} />, label: "Settings" },
  ];

  useEffect(() => {
    fetchParentProfile();
    fetchStudents();
  }, []);

  const fetchParentProfile = async () => {
    try {
      const res = await api.get(`/profile/${parentId}`);
      setParentName(res.data.nickname || res.data.name || "Parent");
      localStorage.setItem("user_nickname", res.data.nickname || res.data.name || "Parent");
    } catch (err) {
      console.error("Fetch parent error:", err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/parent/students");
      setStudents(res.data || []);
    } catch (err) {
      console.error("Fetch students error:", err);
      showErrorToast("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
    showSuccessToast("Dashboard refreshed!");
  };

  const viewStudent = async (studentId, e) => {
    if (e) e.stopPropagation();
    setViewingStudent(true);
    setStudentData(null);
    setLoadingSummary(true);
    try {
      const res = await api.get(`/parent/student/${studentId}/summary`);
      setStudentData(res.data);
    } catch (err) {
      console.error("Fetch student summary error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to fetch student data");
      setViewingStudent(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  const closeSummary = () => {
    setViewingStudent(false);
    setStudentData(null);
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || "P";

  const getStressColor = (score) => {
    if (!score) return "#9ca3af";
    if (score >= 60) return "#ef4444";
    if (score >= 30) return "#f59e0b";
    return "#22c55e";
  };

  const getStressLabel = (score) => {
    if (!score) return "No Data";
    if (score >= 60) return "High";
    if (score >= 30) return "Moderate";
    return "Low";
  };

  const getMoodEmoji = (mood) => {
    if (!mood) return "❓";
    const rounded = Math.round(mood);
    const emojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😄" };
    return emojis[rounded] || "❓";
  };

  const getMoodColor = (mood) => {
    if (!mood) return "#9ca3af";
    const rounded = Math.round(mood);
    const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#16a34a" };
    return colors[rounded] || "#9ca3af";
  };

  const getSleepEmoji = (quality) => {
    if (!quality) return "❓";
    const rounded = Math.round(quality);
    const emojis = { 1: "😴", 2: "😴", 3: "😌", 4: "😊", 5: "🌟" };
    return emojis[rounded] || "❓";
  };

  if (loading) {
    return (
      <Layout customMenuItems={parentMenuItems}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout customMenuItems={parentMenuItems}>
      {students.length === 0 ? (
        <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px', background: 'var(--card-bg-glass)', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
          <User size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>No Students Linked</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You don't have any students linked to your account yet.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Your child needs to invite you from their profile settings.</p>
          <button onClick={() => navigate("/parent/settings")} style={{ marginTop: '20px', padding: '10px 24px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '30px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Go to Settings
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {students.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                style={{ background: 'var(--card-bg-glass)', backdropFilter: 'var(--glass-blur)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-glass)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => viewStudent(student.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '18px' }}>{student.name}</h4>
                    {student.nickname && <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>@{student.nickname}</p>}
                  </div>
                  <div style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', background: student.consent_granted ? '#22c55e' : '#f59e0b', color: 'white' }}>
                    {student.consent_granted ? '✅ Active' : '⏳ Pending'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'space-around' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px' }}>{getMoodEmoji(student.avg_mood)}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: getMoodColor(student.avg_mood) }}>
                      {student.avg_mood ? `${parseFloat(student.avg_mood).toFixed(1)}/5` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Mood</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px' }}>{getSleepEmoji(student.avg_sleep)}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                      {student.avg_sleep ? `${parseFloat(student.avg_sleep).toFixed(1)}/5` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Avg Sleep</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: getStressColor(student.current_stress) }}>
                      {student.current_stress ? `${student.current_stress}/100` : 'N/A'}
                    </div>
                    <div style={{ fontSize: '11px', color: getStressColor(student.current_stress) }}>
                      {getStressLabel(student.current_stress)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Stress</div>
                  </div>
                </div>

                <button
                  onClick={(e) => viewStudent(student.id, e)}
                  style={{
                    marginTop: '14px',
                    width: '100%',
                    padding: '10px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '10px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <Eye size={16} /> View Full Summary
                </button>
              </motion.div>
            ))}
          </div>

          {viewingStudent && loadingSummary && (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg-glass)', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
              <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto' }}></div>
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading student summary...</p>
            </div>
          )}

          {viewingStudent && !loadingSummary && studentData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: 'var(--card-bg-glass)', backdropFilter: 'var(--glass-blur)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-glass)', marginTop: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', margin: 0 }}>
                    {studentData.student.name}'s Well-being Summary
                    {studentData.student.nickname && <span style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '8px' }}>@{studentData.student.nickname}</span>}
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>📊 Read-only summary • Updated daily</p>
                </div>
                <button
                  onClick={closeSummary}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
                  <Smile size={24} style={{ marginBottom: '8px', color: getMoodColor(studentData.average_mood) }} />
                  <div style={{ fontSize: '24px', fontWeight: 700, color: getMoodColor(studentData.average_mood) }}>
                    {studentData.average_mood || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Mood (7 days)</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
                  <Moon size={24} style={{ marginBottom: '8px', color: '#10b981' }} />
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                    {studentData.average_sleep || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Sleep Quality</div>
                </div>
                <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
                  <Activity size={24} style={{ marginBottom: '8px', color: getStressColor(studentData.current_stress?.current_score) }} />
                  <div style={{ fontSize: '24px', fontWeight: 700, color: getStressColor(studentData.current_stress?.current_score) }}>
                    {studentData.current_stress?.current_score || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Stress</div>
                </div>
              </div>

              {studentData.mood_trend && studentData.mood_trend.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px' }}>📈 Mood Trend (Last 7 Days)</h4>
                  <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studentData.mood_trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis 
                          dataKey="date" 
                          stroke="var(--text-muted)" 
                          fontSize={11}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                        />
                        <YAxis 
                          domain={[0, 5]} 
                          stroke="var(--text-muted)" 
                          fontSize={11}
                          ticks={[1, 2, 3, 4, 5]}
                        />
                        <Tooltip 
                          contentStyle={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                          formatter={(value) => [`${value}/5`, 'Mood']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        />
                        <ReferenceLine y={3} stroke="var(--text-muted)" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Neutral', position: 'right', fill: 'var(--text-muted)', fontSize: 9 }} />
                        <Line
                          type="monotone"
                          dataKey="avg_mood"
                          stroke="var(--accent-primary)"
                          strokeWidth={3}
                          dot={{ r: 5, fill: 'var(--accent-primary)' }}
                          activeDot={{ r: 7 }}
                          name="Mood"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {studentData.recent_assessments && studentData.recent_assessments.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>📋 Recent Assessments</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {studentData.latest_phq9 && (
                      <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>PHQ-9</span>
                        <span><strong>{studentData.latest_phq9.score}/27</strong> - {studentData.latest_phq9.severity}</span>
                      </div>
                    )}
                    {studentData.latest_gad7 && (
                      <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>GAD-7</span>
                        <span><strong>{studentData.latest_gad7.score}/21</strong> - {studentData.latest_gad7.severity}</span>
                      </div>
                    )}
                    {studentData.latest_pss && (
                      <div style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>PSS-10</span>
                        <span><strong>{studentData.latest_pss.score}/40</strong> - {studentData.latest_pss.severity}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                💙 This is a read-only summary. Individual logs and journal entries are not shared for privacy.
              </div>
            </motion.div>
          )}
        </>
      )}
    </Layout>
  );
}

export default ParentDashboard;