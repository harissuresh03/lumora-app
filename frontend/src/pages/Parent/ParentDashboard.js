// frontend/src/pages/Parent/ParentDashboard.js
import React, { useState, useEffect, useCallback } from "react";
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
  LayoutDashboard, 
  Settings, 
  User, 
  Smile, 
  Moon, 
  Activity,
  Calendar,
  Download,
  TrendingUp,
  Award
} from "lucide-react";

function ParentDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const parentId = localStorage.getItem("user_id");

  const parentMenuItems = [
    { path: "/parent/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { path: "/parent/settings", icon: <Settings size={18} />, label: "Settings" },
  ];

  // ---------- Helper: robust stress score extraction ----------
  const getStressScore = (stressData) => {
    if (!stressData) return null;
    // If it's already an object with current_score
    if (typeof stressData === 'object' && stressData.current_score !== undefined) {
      const score = parseFloat(stressData.current_score);
      return isNaN(score) ? null : score;
    }
    // If it's a number
    if (typeof stressData === 'number') {
      return stressData;
    }
    // If it's a string that looks like a number
    if (typeof stressData === 'string') {
      const parsed = parseFloat(stressData);
      return isNaN(parsed) ? null : parsed;
    }
    // If it's a stringified JSON (e.g., '{"current_score":35}')
    if (typeof stressData === 'string' && stressData.startsWith('{')) {
      try {
        const obj = JSON.parse(stressData);
        return getStressScore(obj);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const getStressRisk = (stressData) => {
    if (!stressData) return null;
    if (typeof stressData === 'object' && stressData.risk_level) {
      return stressData.risk_level;
    }
    return null;
  };

  // ---------- API calls ----------
  const fetchParentProfile = useCallback(async () => {
    try {
      const res = await api.get(`/profile/${parentId}`);
      const name = res.data.nickname || res.data.name || "Parent";
      localStorage.setItem("user_nickname", name);
    } catch (err) {
      console.error("Fetch parent error:", err);
    }
  }, [parentId]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/parent/students");
      const studentsData = res.data || [];
      console.log("Students API response:", studentsData); // debug
      setStudents(studentsData);
      if (studentsData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(studentsData[0].id);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      showErrorToast("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudentSummary = useCallback(async (studentId) => {
    if (!studentId) return;
    setLoadingSummary(true);
    setStudentData(null);
    try {
      const res = await api.get(`/parent/student/${studentId}/summary`);
      console.log("Summary API response:", res.data); // debug
      setStudentData(res.data);

      // ✅ Update the selected student's current_stress with the summary data
      if (res.data.current_stress) {
        setStudents(prev => prev.map(s => {
          if (s.id === studentId) {
            return {
              ...s,
              current_stress: {
                current_score: res.data.current_stress.current_score,
                risk_level: res.data.current_stress.risk_level
              }
            };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error("Fetch student summary error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to fetch student data");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchParentProfile();
    fetchStudents();
  }, [fetchParentProfile, fetchStudents]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentSummary(selectedStudentId);
    }
  }, [selectedStudentId, fetchStudentSummary]);

  const handleStudentSelect = (studentId) => {
    setSelectedStudentId(studentId);
  };

  const downloadReport = async () => {
    if (!selectedStudentId) return;
    setDownloading(true);
    try {
      const response = await api.get(`/parent/report/${selectedStudentId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const student = students.find(s => s.id === selectedStudentId);
      link.download = `parent_report_${student?.name || 'student'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showSuccessToast("Report downloaded successfully!");
    } catch (err) {
      console.error("Download report error:", err);
      showErrorToast("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const getMoodColor = (mood) => {
    if (!mood) return "#9ca3af";
    const rounded = Math.round(mood);
    const colors = { 1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#16a34a" };
    return colors[rounded] || "#9ca3af";
  };

  const getStressColor = (score) => {
    if (score === null || score === undefined) return "#9ca3af";
    if (score >= 60) return "#ef4444";
    if (score >= 30) return "#f59e0b";
    return "#22c55e";
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDateFull = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  if (students.length === 0) {
    return (
      <Layout customMenuItems={parentMenuItems}>
        <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', padding: '40px', background: 'var(--card-bg-glass)', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
          <User size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>No Students Linked</h2>
          <p style={{ color: 'var(--text-secondary)' }}>You currently don't have any students linked to your account.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>Your child needs to give access from their profile settings.</p>
          <button onClick={() => navigate("/parent/settings")} style={{ marginTop: '20px', padding: '10px 24px', background: 'var(--accent-gradient)', border: 'none', borderRadius: '30px', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Go to Settings
          </button>
        </div>
      </Layout>
    );
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const stressScore = selectedStudent ? getStressScore(selectedStudent.current_stress) : null;
  const stressRisk = selectedStudent ? getStressRisk(selectedStudent.current_stress) : null;

  return (
    <Layout customMenuItems={parentMenuItems}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>My Child's Wellness</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Monitor your child's mental health journey</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => handleStudentSelect(parseInt(e.target.value))}
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', background: 'var(--card-bg-glass)', fontSize: '14px', minWidth: '180px' }}
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} {student.nickname ? `(@${student.nickname})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={downloadReport}
              disabled={downloading || !studentData}
              style={{
                padding: '10px 20px',
                background: 'var(--accent-gradient)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: downloading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 500,
                opacity: downloading ? 0.6 : 1
              }}
            >
              {downloading ? 'Generating...' : <><Download size={16} /> Download Report (PDF)</>}
            </button>
          </div>
        </div>

        {/* Student Quick Stats */}
        {selectedStudent && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
              <Smile size={24} style={{ marginBottom: '8px', color: getMoodColor(selectedStudent.avg_mood) }} />
              <div style={{ fontSize: '28px', fontWeight: 700, color: getMoodColor(selectedStudent.avg_mood) }}>
                {selectedStudent.avg_mood ? `${parseFloat(selectedStudent.avg_mood).toFixed(1)}/5` : 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Mood (7 days)</div>
            </div>
            <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
              <Moon size={24} style={{ marginBottom: '8px', color: '#10b981' }} />
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
                {selectedStudent.avg_sleep ? `${parseFloat(selectedStudent.avg_sleep).toFixed(1)}/5` : 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Sleep Quality (7 days)</div>
            </div>
            <div style={{ background: 'var(--card-bg-glass)', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid var(--border-glass)' }}>
              <Activity size={24} style={{ marginBottom: '8px', color: getStressColor(stressScore) }} />
              <div style={{ fontSize: '28px', fontWeight: 700, color: getStressColor(stressScore) }}>
                {stressScore !== null ? stressScore : 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Current Stress {stressRisk ? `(${stressRisk})` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Full Student Data */}
        {loadingSummary ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg-glass)', borderRadius: '20px', border: '1px solid var(--border-glass)' }}>
            <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto' }}></div>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading student data...</p>
          </div>
        ) : studentData ? (
          <div>
            {/* Mood Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid var(--border-glass)',
                marginBottom: '24px'
              }}
            >
              <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TrendingUp size={20} color="var(--accent-primary)" />
                Mood Trend (Last 7 Days)
              </h3>
              {studentData.mood_trend && studentData.mood_trend.length > 0 ? (
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentData.mood_trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)" 
                        fontSize={11}
                        tickFormatter={(value) => formatDate(value)}
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
                        labelFormatter={(label) => formatDateFull(label)}
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
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No mood data available for the last 7 days.</p>
              )}
            </motion.div>

            {/* Sleep Trend Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid var(--border-glass)',
                marginBottom: '24px'
              }}
            >
              <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Moon size={20} color="#10b981" />
                Sleep Quality Trend (Last 7 Days)
              </h3>
              {studentData.sleep_trend && studentData.sleep_trend.length > 0 ? (
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentData.sleep_trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)" 
                        fontSize={11}
                        tickFormatter={(value) => formatDate(value)}
                      />
                      <YAxis 
                        domain={[0, 5]} 
                        stroke="var(--text-muted)" 
                        fontSize={11}
                        ticks={[1, 2, 3, 4, 5]}
                      />
                      <Tooltip 
                        contentStyle={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                        formatter={(value) => [`${value}/5`, 'Sleep Quality']}
                        labelFormatter={(label) => formatDateFull(label)}
                      />
                      <ReferenceLine y={3} stroke="var(--text-muted)" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Neutral', position: 'right', fill: 'var(--text-muted)', fontSize: 9 }} />
                      <Line
                        type="monotone"
                        dataKey="avg_quality"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#10b981' }}
                        activeDot={{ r: 7 }}
                        name="Sleep Quality"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No sleep data available for the last 7 days.</p>
              )}
            </motion.div>

            {/* Stress Forecast Chart */}
            {studentData.stress_forecast && studentData.stress_forecast.forecast && studentData.stress_forecast.forecast.length > 0 && (
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
                <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={20} color="#ef4444" />
                  Stress Forecast (7 Days)
                </h3>
                {studentData.stress_forecast.summary_sentence && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    {studentData.stress_forecast.summary_sentence}
                  </p>
                )}
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={studentData.stress_forecast.forecast} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                      <XAxis 
                        dataKey="date" 
                        stroke="var(--text-muted)" 
                        fontSize={11}
                        tickFormatter={(value) => formatDate(value)}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="var(--text-muted)" 
                        fontSize={11}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ background: 'var(--card-bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}
                        formatter={(value) => [`${value}/100`, 'Stress']}
                        labelFormatter={(label) => formatDateFull(label)}
                      />
                      <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Low', position: 'right', fill: '#22c55e', fontSize: 9 }} />
                      <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'High', position: 'right', fill: '#ef4444', fontSize: 9 }} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const isActual = payload.is_actual;
                          const color = getStressColor(payload.score);
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isActual ? 7 : 5}
                              fill={color}
                              stroke="white"
                              strokeWidth={2}
                            />
                          );
                        }}
                        activeDot={{ r: 8 }}
                        name="Stress Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {studentData.stress_forecast.tip && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <strong style={{ color: '#f59e0b' }}>💡 Tip: </strong>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{studentData.stress_forecast.tip.headline}</span>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{studentData.stress_forecast.tip.body}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Assessments & Deadlines */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '24px' }}>
              {/* Assessments */}
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
                <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={20} color="var(--accent-primary)" />
                  Recent Assessments
                </h3>
                {studentData.recent_assessments && studentData.recent_assessments.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {studentData.recent_assessments.map((a, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 600 }}>{a.type.toUpperCase()}</span>
                          <span style={{ fontWeight: 700 }}>{a.score}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {a.severity} • {formatDateFull(a.taken_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No assessments taken yet.</p>
                )}
              </motion.div>

              {/* Deadlines */}
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
                <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Calendar size={20} color="#f59e0b" />
                  Upcoming Deadlines
                </h3>
                {studentData.upcoming_deadlines && studentData.upcoming_deadlines.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {studentData.upcoming_deadlines.map((d, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: 500 }}>{d.title}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDateFull(d.due_date)}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {d.subject || 'General'} • Difficulty: {d.difficulty || 'Medium'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No upcoming deadlines.</p>
                )}
              </motion.div>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

export default ParentDashboard;