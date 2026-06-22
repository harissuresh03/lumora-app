// frontend/src/pages/components/CounsellorStressForecast.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showErrorToast } from "./ToastNotification";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp, AlertTriangle, Lightbulb, Calendar, RefreshCw } from "lucide-react";

function CounsellorStressForecast({ studentId, counsellorId }) {
  const [forecast, setForecast] = useState(null);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/counsellor/stress-forecast/${studentId}/${counsellorId}`);
      if (res.data.hasData) {
        setForecast(res.data);
        setDeadlines(res.data.deadlines || []);
      } else {
        setForecast(null);
        setDeadlines([]);
      }
    } catch (err) {
      console.error("Fetch forecast error:", err);
      showErrorToast("Failed to fetch stress forecast");
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchForecast();
    }
  }, [studentId]);

  const getRiskColor = (score) => {
    if (score < 30) return "#22c55e";
    if (score < 60) return "#f59e0b";
    return "#ef4444";
  };

  const getRiskLabel = (score) => {
    if (score < 30) return "Low";
    if (score < 60) return "Moderate";
    return "High";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = { easy: "#22c55e", medium: "#f59e0b", hard: "#ef4444" };
    return colors[difficulty] || "#6b7280";
  };

  const getTypeIcon = (type) => {
    return type === "exam" ? "📝" : "📄";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '280px'
        }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>
            Day {data.day} - {formatDate(data.date)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span>Stress Score:</span>
            <span style={{ fontWeight: 700, color: getRiskColor(data.score) }}>
              {data.score}/100
            </span>
            <span style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              background: getRiskColor(data.score),
              color: 'white'
            }}>
              {getRiskLabel(data.score)}
            </span>
          </div>
          {data.contributing_deadlines && data.contributing_deadlines.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 500 }}>Contributing:</div>
              <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                {data.contributing_deadlines.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data.is_actual ? '📊 Actual Data' : '🔮 Predicted'}
          </div>
        </div>
      );
    }
    return null;
  };

  const getTipIcon = (category) => {
    switch(category) {
      case 'burnout_warning':
        return <AlertTriangle size={20} color="#ef4444" />;
      case 'academic_triage':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'high_energy_window':
        return <TrendingUp size={20} color="#22c55e" />;
      case 'clustering_alert':
        return <Calendar size={20} color="#8b5cf6" />;
      default:
        return <Lightbulb size={20} color="#6366f1" />;
    }
  };

  const getTipColor = (category) => {
    switch(category) {
      case 'burnout_warning':
        return '#ef4444';
      case 'academic_triage':
        return '#f59e0b';
      case 'high_energy_window':
        return '#22c55e';
      case 'clustering_alert':
        return '#8b5cf6';
      default:
        return '#6366f1';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading stress forecast...</p>
      </div>
    );
  }

  if (!forecast) {
    return (
      <div style={{
        padding: '30px',
        textAlign: 'center',
        background: 'var(--card-bg-glass)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)'
      }}>
        <Calendar size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
        <h4>No Stress Forecast Available</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
          This student hasn't added any deadlines yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ fontSize: '18px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--accent-primary)" />
            Stress Forecast
            {forecast.created_at && (
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-muted)' }}>
                (Updated {new Date(forecast.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })})
              </span>
            )}
          </h4>
          <p style={{ color: 'var(--text-secondary)', margin: '2px 0 0', fontSize: '13px' }}>
            {forecast.summary_sentence}
          </p>
        </div>
        <button
          onClick={() => { setRefreshing(true); fetchForecast(); setTimeout(() => setRefreshing(false), 1000); }}
          disabled={refreshing}
          style={{
            padding: '6px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: '20px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            opacity: refreshing ? 0.6 : 1
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Chart */}
      <div style={{
        background: 'var(--card-bg-glass)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-glass)',
        marginBottom: '16px'
      }}>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast.forecast} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Low', position: 'right', fill: '#22c55e', fontSize: 10 }} />
              <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'High', position: 'right', fill: '#ef4444', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={3}
                name="Stress Score"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const isActual = payload.is_actual;
                  const color = getRiskColor(payload.score);
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActual ? 7 : 5}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      style={{ opacity: 1 }}
                    />
                  );
                }}
                activeDot={{ r: 8 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>● Actual Data</span>
          <span>○ Predicted</span>
          <span>🟢 Low (&lt;30)</span>
          <span>🟡 Moderate (30-59)</span>
          <span>🔴 High (60+)</span>
        </div>
      </div>

      {/* Peak Stress Day */}
      {forecast.peak_stress_day && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          marginBottom: '16px'
        }}>
          <strong>📊 Peak Stress Day:</strong> {formatDate(forecast.peak_stress_day.date)}
          <span style={{
            marginLeft: '8px',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            background: getRiskColor(forecast.peak_stress_day.score),
            color: 'white'
          }}>
            Score: {forecast.peak_stress_day.score}/100
          </span>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {forecast.peak_stress_day.reason}
          </p>
        </div>
      )}

      {/* Counsellor Tip */}
      {forecast.tip && (
        <div style={{
          padding: '14px 18px',
          background: `rgba(${getTipColor(forecast.tip.category) === '#ef4444' ? '239, 68, 68' : 
            getTipColor(forecast.tip.category) === '#f59e0b' ? '245, 158, 11' :
            getTipColor(forecast.tip.category) === '#22c55e' ? '34, 197, 94' :
            getTipColor(forecast.tip.category) === '#8b5cf6' ? '139, 92, 246' :
            '99, 102, 241'}, 0.08)`,
          borderRadius: '12px',
          border: `1px solid ${getTipColor(forecast.tip.category)}`,
          marginBottom: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <div style={{ marginTop: '2px' }}>
            {getTipIcon(forecast.tip.category)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: getTipColor(forecast.tip.category) }}>
              💡 Counsellor Tip: {forecast.tip.headline}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {forecast.tip.body}
            </p>
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <div style={{
          background: 'var(--card-bg-glass)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border-glass)'
        }}>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
            📚 Upcoming Deadlines ({deadlines.length})
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deadlines.map((deadline) => (
              <div
                key={deadline.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>{deadline.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    {getTypeIcon(deadline.type)} {deadline.subject || 'No subject'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    background: getDifficultyColor(deadline.difficulty),
                    color: 'white'
                  }}>
                    {deadline.difficulty}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Due: {formatDate(deadline.due_date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Warning */}
      {forecast.overdue_warning && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ fontSize: '12px', color: '#ef4444' }}>{forecast.overdue_warning}</span>
        </div>
      )}
    </div>
  );
}

export default CounsellorStressForecast;