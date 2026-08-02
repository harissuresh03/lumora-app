// frontend/src/pages/components/EnhancedCharts.js
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity, Moon, Smile } from 'lucide-react';

// Custom Tooltip for Mood Chart
const MoodTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const moodLabels = { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" };
    const moodEmojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😄" };
    
    let formattedLabel = label;
    if (label instanceof Date) {
      formattedLabel = label.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const moodValue = payload[0]?.value;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="chart-tooltip"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{formattedLabel}</p>
        {moodValue && (
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#475569' }}>
            {moodEmojis[moodValue]} {moodLabels[moodValue]}
          </p>
        )}
      </motion.div>
    );
  }
  return null;
};

// Custom Tooltip for Sleep Chart (Grouped)
const SleepGroupedTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const qualityLabels = { 1: "Poor", 2: "Fair", 3: "Okay", 4: "Good", 5: "Excellent" };
    
    let formattedLabel = label;
    if (label instanceof Date) {
      formattedLabel = label.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const qualityValue = payload.find(p => p.name === 'Sleep Quality')?.value;
    const durationValue = payload.find(p => p.name === 'Sleep Duration')?.value;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="chart-tooltip"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{formattedLabel}</p>
        {qualityValue && (
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#475569' }}>
            💤 Quality: {qualityLabels[qualityValue]} ({qualityValue}/5)
          </p>
        )}
        {durationValue && (
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#475569' }}>
            ⏱️ Duration: {durationValue} hours
          </p>
        )}
      </motion.div>
    );
  }
  return null;
};

// Custom Tooltip for Correlation Chart
const CorrelationTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const moodLabels = { 1: "Terrible", 2: "Sad", 3: "Okay", 4: "Good", 5: "Great" };
    const moodEmojis = { 1: "😢", 2: "😔", 3: "😐", 4: "🙂", 5: "😄" };
    const qualityLabels = { 1: "Poor", 2: "Fair", 3: "Okay", 4: "Good", 5: "Excellent" };
    
    let formattedLabel = label;
    if (label instanceof Date) {
      formattedLabel = label.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    const moodValue = payload.find(p => p.name === 'Mood Level')?.value;
    const sleepValue = payload.find(p => p.name === 'Sleep Quality')?.value;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="chart-tooltip"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>{formattedLabel}</p>
        {moodValue && (
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#475569' }}>
            {moodEmojis[moodValue]} Mood: {moodLabels[moodValue]}
          </p>
        )}
        {sleepValue && (
          <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#475569' }}>
            💤 Sleep Quality: {qualityLabels[sleepValue]} ({sleepValue}/5)
          </p>
        )}
      </motion.div>
    );
  }
  return null;
};

// Mood Trend Chart - Lines connect across missing days
export const MoodChart = ({ data, height = 300 }) => {
  const chartData = data.map(item => ({
    dayName: item.dayName,
    mood: item.mood || null,
  }));

  const hasMoodData = chartData.some(d => d.mood !== null);

  if (!hasMoodData) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        color: 'var(--text-muted)'
      }}>
        <Smile size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No mood data available yet.</p>
        <p style={{ fontSize: '12px' }}>Log your mood daily to see your emotional journey!</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={12} />
        <YAxis domain={[1, 5]} stroke="#94a3b8" fontSize={12} ticks={[1, 2, 3, 4, 5]} />
        <Tooltip content={<MoodTooltip />} />
        <Legend />
        <defs>
          <linearGradient id="moodLineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="mood"
          stroke="url(#moodLineGradient)"
          strokeWidth={3}
          name="Mood Level"
          dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#6366f1' }}
          activeDot={{ r: 8, strokeWidth: 0 }}
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Sleep Analysis Chart - Grouped Bar Chart (Sleep Quality + Sleep Duration)
export const SleepChart = ({ data, height = 300 }) => {
  const chartData = data.map(item => ({
    dayName: item.dayName,
    sleepQuality: item.sleepQuality || null,
    sleepDuration: item.sleepHours || null,
  }));

  const hasSleepQuality = chartData.some(d => d.sleepQuality !== null);
  const hasSleepDuration = chartData.some(d => d.sleepDuration !== null);

  if (!hasSleepQuality && !hasSleepDuration) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '50px',
        color: 'var(--text-muted)'
      }}>
        <Moon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No sleep data available yet.</p>
        <p style={{ fontSize: '12px' }}>Track your sleep to see patterns and improve rest!</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={12} />
        <YAxis yAxisId="left" domain={[1, 5]} stroke="#10b981" fontSize={12} ticks={[1, 2, 3, 4, 5]} label={{ value: 'Quality', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#10b981' } }} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 12]} stroke="#f59e0b" fontSize={12} ticks={[0, 2, 4, 6, 8, 10, 12]} label={{ value: 'Hours', angle: 90, position: 'insideRight', style: { fontSize: '12px', fill: '#f59e0b' } }} />
        <Tooltip content={<SleepGroupedTooltip />} />
        <Legend />
        <defs>
          <linearGradient id="sleepQualityGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="sleepDurationGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <Bar
          yAxisId="left"
          dataKey="sleepQuality"
          fill="url(#sleepQualityGradient)"
          name="Sleep Quality"
          radius={[8, 8, 0, 0]}
          barSize={35}
        />
        <Bar
          yAxisId="right"
          dataKey="sleepDuration"
          fill="url(#sleepDurationGradient)"
          name="Sleep Duration (hours)"
          radius={[8, 8, 0, 0]}
          barSize={35}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Correlation Chart (Mood vs Sleep Quality) - Grouped Bar Chart
export const CorrelationChart = ({ data, height = 300 }) => {
  const safeData = data.map(item => ({
    dayName: item.dayName || '',
    mood: item.mood || 0,
    sleepQuality: item.sleepQuality || 0,
  }));

  const hasData = safeData.some(d => d.mood > 0 && d.sleepQuality > 0);

  if (!hasData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
        <Activity size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>Not enough data for correlation</p>
        <p style={{ fontSize: '12px' }}>Log both mood and sleep for 2+ days to see patterns!</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={safeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="dayName" stroke="#94a3b8" fontSize={12} />
        <YAxis domain={[1, 5]} stroke="#6366f1" fontSize={12} ticks={[1, 2, 3, 4, 5]} />
        <Tooltip content={<CorrelationTooltip />} />
        <Legend />
        <defs>
          <linearGradient id="moodBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="sleepBarGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <Bar
          dataKey="mood"
          fill="url(#moodBarGradient)"
          name="Mood Level"
          radius={[8, 8, 0, 0]}
          barSize={40}
        />
        <Bar
          dataKey="sleepQuality"
          fill="url(#sleepBarGradient)"
          name="Sleep Quality"
          radius={[8, 8, 0, 0]}
          barSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Stats Card Component
export const StatsCard = ({ title, value, change, icon, color, subtitle, valueColor }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="stats-card"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', color: '#64748b' }}>{title}</span>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div style={{ 
        fontSize: '32px', 
        fontWeight: '700', 
        color: valueColor || color || '#6366f1', 
        marginBottom: '8px' 
      }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{subtitle}</div>}
      {change !== undefined && change !== 0 && (
        <div style={{ fontSize: '12px', color: change > 0 ? '#10b981' : '#ef4444', marginTop: '8px' }}>
          {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last week
        </div>
      )}
    </motion.div>
  );
};

export default {
  MoodChart,
  SleepChart,
  CorrelationChart,
  StatsCard
};