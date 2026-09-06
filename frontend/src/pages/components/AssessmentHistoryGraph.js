// frontend/src/pages/components/AssessmentHistoryGraph.js
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';
import api from "../../utils/api";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

function AssessmentHistoryGraph({ userId }) {
  const [data, setData] = useState({ phq9: [], gad7: [], pss: [] });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('phq9');
  const [error, setError] = useState(null);

  const fetchAssessmentHistory = useCallback(async () => {
    try {
      const res = await api.get(`/assessments/history/graph/${userId}`);
      
      // ✅ Ensure phq9, gad7, and pss are always arrays
      setData({
        phq9: Array.isArray(res.data.phq9) ? res.data.phq9 : [],
        gad7: Array.isArray(res.data.gad7) ? res.data.gad7 : [],
        pss: Array.isArray(res.data.pss) ? res.data.pss : []
      });
      setError(null);
    } catch (err) {
      console.error("Fetch assessment history error:", err);
      setError("Failed to load assessment history");
      // ✅ Set empty arrays on error so component doesn't crash
      setData({ phq9: [], gad7: [], pss: [] });
    } finally {
      setLoading(false);
    }
  }, [userId]);

useEffect(() => {
  if (userId) {
    fetchAssessmentHistory();
  }
}, [userId, fetchAssessmentHistory]);

  const getSeverityColor = (score, type) => {
    if (type === 'phq9') {
      if (score <= 4) return '#22c55e';
      if (score <= 9) return '#eab308';
      if (score <= 14) return '#f97316';
      if (score <= 19) return '#ef4444';
      return '#dc2626';
    } else if (type === 'gad7') {
      if (score <= 4) return '#22c55e';
      if (score <= 9) return '#eab308';
      if (score <= 14) return '#f97316';
      return '#ef4444';
    } else { // pss
      if (score <= 13) return '#22c55e';
      if (score <= 26) return '#f97316';
      return '#ef4444';
    }
  };

  const getSeverityLabel = (score, type) => {
    if (type === 'phq9') {
      if (score <= 4) return 'Minimal';
      if (score <= 9) return 'Mild';
      if (score <= 14) return 'Moderate';
      if (score <= 19) return 'Moderately Severe';
      return 'Severe';
    } else if (type === 'gad7') {
      if (score <= 4) return 'Minimal';
      if (score <= 9) return 'Mild';
      if (score <= 14) return 'Moderate';
      return 'Severe';
    } else { // pss
      if (score <= 13) return 'Low';
      if (score <= 26) return 'Moderate';
      return 'High';
    }
  };

  // ✅ Get the current data array (always returns an array)
  const getCurrentData = () => {
    if (selectedType === 'phq9') return data.phq9;
    if (selectedType === 'gad7') return data.gad7;
    return data.pss;
  };

  // ✅ Get comparison - safely handles undefined
  const getComparison = () => {
    const currentData = getCurrentData();
    if (!currentData || currentData.length < 2) return null;
    
    const latest = currentData[currentData.length - 1];
    const previous = currentData[currentData.length - 2];
    const diff = latest.score - previous.score;
    
    return {
      diff,
      latest,
      previous,
      improved: diff < 0,
      worsened: diff > 0,
      stable: diff === 0
    };
  };

  const comparison = getComparison();

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const typeLabels = { phq9: 'PHQ-9', gad7: 'GAD-7', pss: 'PSS-10' };
      const maxScores = { phq9: 27, gad7: 21, pss: 40 };
      const typeLabel = typeLabels[selectedType] || 'PHQ-9';
      const maxScore = maxScores[selectedType] || 27;
      
      return (
        <div style={{
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>
            {new Date(dataPoint.taken_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '4px' }}>
            <span>Score: <strong>{dataPoint.score}</strong>/{maxScore}</span>
            <span style={{ color: getSeverityColor(dataPoint.score, selectedType) }}>
              {getSeverityLabel(dataPoint.score, selectedType)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading assessment history...</p>
      </div>
    );
  }

  const currentData = getCurrentData();
  const maxScores = { phq9: 27, gad7: 21, pss: 40 };
  const maxScore = maxScores[selectedType] || 27;
  const typeLabels = { phq9: 'PHQ-9', gad7: 'GAD-7', pss: 'PSS-10' };
  const typeLabel = typeLabels[selectedType] || 'PHQ-9';
  const typeIcons = { phq9: '📋', gad7: '😰', pss: '📊' };
  const typeIcon = typeIcons[selectedType] || '📋';

  // Severity threshold lines
  const getThresholds = () => {
    if (selectedType === 'phq9') {
      return [
        { value: 4, label: 'Minimal', color: '#22c55e' },
        { value: 9, label: 'Mild', color: '#eab308' },
        { value: 14, label: 'Moderate', color: '#f97316' },
        { value: 19, label: 'Severe', color: '#ef4444' }
      ];
    } else if (selectedType === 'gad7') {
      return [
        { value: 4, label: 'Minimal', color: '#22c55e' },
        { value: 9, label: 'Mild', color: '#eab308' },
        { value: 14, label: 'Moderate', color: '#f97316' }
      ];
    } else { // pss
      return [
        { value: 13, label: 'Low', color: '#22c55e' },
        { value: 26, label: 'Moderate', color: '#f97316' }
      ];
    }
  };

  const thresholds = getThresholds();

  // Y-axis ticks based on type
  const getYAxisTicks = () => {
    if (selectedType === 'phq9') return [0, 5, 10, 15, 20, 25, 27];
    if (selectedType === 'gad7') return [0, 5, 10, 15, 20, 21];
    return [0, 5, 10, 15, 20, 25, 30, 35, 40];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid var(--border-glass)',
        marginTop: '24px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Brain size={20} color="var(--accent-primary)" />
          Assessment History
        </h3>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedType('phq9')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: selectedType === 'phq9' ? '2px solid #6366f1' : '1px solid var(--border-light)',
              background: selectedType === 'phq9' ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedType === 'phq9' ? 600 : 400,
              color: selectedType === 'phq9' ? '#6366f1' : 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', marginRight: '6px' }} />
            PHQ-9
          </button>
          <button
            onClick={() => setSelectedType('gad7')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: selectedType === 'gad7' ? '2px solid #ef4444' : '1px solid var(--border-light)',
              background: selectedType === 'gad7' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedType === 'gad7' ? 600 : 400,
              color: selectedType === 'gad7' ? '#ef4444' : 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', marginRight: '6px' }} />
            GAD-7
          </button>
          <button
            onClick={() => setSelectedType('pss')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: selectedType === 'pss' ? '2px solid #f59e0b' : '1px solid var(--border-light)',
              background: selectedType === 'pss' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: selectedType === 'pss' ? 600 : 400,
              color: selectedType === 'pss' ? '#f59e0b' : 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', marginRight: '6px' }} />
            PSS-10
          </button>
        </div>
      </div>

      {/* Comparison Summary */}
      {comparison && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Previous: <strong>{comparison.previous.score}</strong> → Latest: <strong>{comparison.latest.score}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {comparison.improved && (
              <>
                <TrendingDown size={16} color="#22c55e" />
                <span style={{ color: '#22c55e', fontWeight: 600 }}>
                  Improved by {Math.abs(comparison.diff)} points
                </span>
              </>
            )}
            {comparison.worsened && (
              <>
                <TrendingUp size={16} color="#ef4444" />
                <span style={{ color: '#ef4444', fontWeight: 600 }}>
                  Worsened by {comparison.diff} points
                </span>
              </>
            )}
            {comparison.stable && (
              <>
                <Minus size={16} color="#f59e0b" />
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                  Stable (no change)
                </span>
              </>
            )}
          </span>
          <span style={{ 
            fontSize: '12px',
            padding: '2px 10px',
            borderRadius: '12px',
            background: getSeverityColor(comparison.latest.score, selectedType),
            color: 'white'
          }}>
            {getSeverityLabel(comparison.latest.score, selectedType)}
          </span>
        </div>
      )}

      {/* Chart */}
      {!currentData || currentData.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-muted)'
        }}>
          <AlertTriangle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p>No {typeLabel} assessments taken yet.</p>
          <p style={{ fontSize: '13px' }}>Complete an assessment to track your progress over time.</p>
        </div>
      ) : (
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--text-muted)" 
                fontSize={11}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                domain={[0, maxScore]} 
                stroke="var(--text-muted)" 
                fontSize={11}
                ticks={getYAxisTicks()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Severity threshold areas */}
              {thresholds.map((t, i) => (
                <ReferenceLine 
                  key={i}
                  y={t.value} 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  strokeWidth={1}
                  label={{ value: t.label, position: 'right', fill: '#94a3b8', fontSize: 9 }}
                />
              ))}
              
              {/* Area under the line */}
              <defs>
                <linearGradient id={`gradient-${selectedType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--accent-primary)"
                fill={`url(#gradient-${selectedType})`}
                strokeWidth={2}
              />
              
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent-primary)"
                strokeWidth={3}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  const color = getSeverityColor(payload.score, selectedType);
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6}
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 8 }}
                name={`${typeLabel} Score`}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '16px', 
        marginTop: '16px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        flexWrap: 'wrap'
      }}>
        {thresholds.map((t, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              background: t.color
            }} />
            {t.label} ({t.value})
          </span>
        ))}
      </div>

      {/* Total assessments */}
      <div style={{
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: '12px'
      }}>
        Total {typeLabel} assessments: {currentData ? currentData.length : 0}
      </div>
    </motion.div>
  );
}

export default AssessmentHistoryGraph;