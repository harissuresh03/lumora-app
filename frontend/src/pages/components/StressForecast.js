// frontend/src/pages/components/StressForecast.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "./ToastNotification";
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
import { TrendingUp, AlertTriangle, Lightbulb, Calendar, RefreshCw, Plus } from "lucide-react";
import DeadlineModal from "./DeadlineModal";

function StressForecast({ userId }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [moodUsed, setMoodUsed] = useState(3);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stress-forecast/latest/${userId}`);
      if (res.data.hasData) {
        setForecast(res.data);
        setMoodUsed(res.data.mood_used || 3);
      } else {
        setForecast(null);
      }
    } catch (err) {
      console.error("Fetch forecast error:", err);
      await generateForecast();
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async () => {
    setRefreshing(true);
    try {
      const res = await api.post(`/stress-forecast/generate/${userId}`);
      if (res.data.hasData) {
        setForecast({
          hasData: true,
          forecast: res.data.forecast,
          peak_stress_day: res.data.peak_stress_day,
          overdue_warning: res.data.overdue_warning,
          tip: res.data.tip,
          summary_sentence: res.data.summary_sentence
        });
        setMoodUsed(res.data.mood_used || 3);
        showSuccessToast("Academic Stress forecast updated!");
      } else {
        showSuccessToast(res.data.message || "Add some deadlines to get a forecast");
        setForecast(null);
      }
    } catch (err) {
      console.error("Generate forecast error:", err);
      showErrorToast("Failed to generate forecast");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [userId]);

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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading academic stress forecast...</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp size={24} color="var(--accent-primary)" />
            Academic Stress Forecast
            {forecast && forecast.created_at && (
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                (Updated {new Date(forecast.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })})
              </span>
            )}
          </h3>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '13px' }}>
            {forecast ? forecast.summary_sentence : 'Add deadlines to see your stress forecast'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Manage Deadlines Button */}
          <button
            onClick={() => setShowDeadlineModal(true)}
            className="primary-btn"
            style={{
              padding: '8px 16px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              width: 'auto'
            }}
          >
            <Calendar size={16} /> Manage Deadlines
          </button>
          {/* Refresh Forecast Button – now uses same primary-btn class */}
          <button
            onClick={generateForecast}
            disabled={refreshing}
            className="primary-btn"
            style={{
              padding: '8px 16px',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              width: 'auto',
              opacity: refreshing ? 0.6 : 1,
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Updating...' : 'Refresh Forecast'}
          </button>
        </div>
      </div>

      {/* No Data State */}
      {!forecast ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'var(--card-bg-glass)',
          borderRadius: '16px',
          border: '1px solid var(--border-glass)'
        }}>
          <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <h4>No academic stress forecast available</h4>
          <p style={{ color: 'var(--text-secondary)' }}>
            Add your academic deadlines to generate a personalized 7-day academic stress forecast.
          </p>
          <button
            onClick={() => setShowDeadlineModal(true)}
            className="primary-btn"
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              borderRadius: '30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              width: 'auto'
            }}
          >
            <Plus size={16} /> Add Deadlines
          </button>
        </div>
      ) : (
        <>
          {/* Overdue Warning */}
          {forecast.overdue_warning && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <AlertTriangle size={18} color="#ef4444" />
              <span style={{ fontSize: '13px', color: '#ef4444' }}>{forecast.overdue_warning}</span>
            </div>
          )}

          {/* Chart */}
          <div style={{
            background: 'var(--card-bg-glass)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-glass)',
            marginBottom: '16px'
          }}>
            <div style={{ height: '280px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
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

          {/* Tip Card */}
          {forecast.tip && (
            <div style={{
              padding: '16px 20px',
              background: `rgba(${getTipColor(forecast.tip.category) === '#ef4444' ? '239, 68, 68' : 
                getTipColor(forecast.tip.category) === '#f59e0b' ? '245, 158, 11' :
                getTipColor(forecast.tip.category) === '#22c55e' ? '34, 197, 94' :
                getTipColor(forecast.tip.category) === '#8b5cf6' ? '139, 92, 246' :
                '99, 102, 241'}, 0.08)`,
              borderRadius: '12px',
              border: `1px solid ${getTipColor(forecast.tip.category)}`,
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start'
            }}>
              <div style={{ marginTop: '2px' }}>
                {getTipIcon(forecast.tip.category)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: getTipColor(forecast.tip.category) }}>
                  {forecast.tip.headline}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {forecast.tip.body}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Deadline Modal */}
      {showDeadlineModal && (
        <DeadlineModal
          userId={userId}
          onClose={() => setShowDeadlineModal(false)}
          onUpdate={() => {
            setTimeout(generateForecast, 500);
          }}
        />
      )}
    </div>
  );
}

export default StressForecast;