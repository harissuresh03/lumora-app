// frontend/src/pages/components/PatternInsights.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { Lightbulb, TrendingUp, TrendingDown, Moon, Calendar, Brain, Sparkles } from "lucide-react";

function PatternInsights() {
  const [insights, setInsights] = useState([]);
  const [dayPatterns, setDayPatterns] = useState([]);
  const [sleepCorrelation, setSleepCorrelation] = useState({});
  const [loading, setLoading] = useState(true);
  const user_id = localStorage.getItem("user_id");

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = async () => {
    try {
      const res = await api.get(`/analytics/patterns/${user_id}`);
      setInsights(res.data.insights);
      setDayPatterns(res.data.dayPatterns);
      setSleepCorrelation(res.data.sleepCorrelation);
    } catch (err) {
      console.error("Fetch patterns error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type) => {
    switch(type) {
      case 'improving_trend': return <TrendingUp size={18} color="#22c55e" />;
      case 'declining_trend': return <TrendingDown size={18} color="#ef4444" />;
      case 'sleep_correlation': return <Moon size={18} color="#8b5cf6" />;
      case 'day_pattern': return <Calendar size={18} color="#f59e0b" />;
      default: return <Lightbulb size={18} color="#6366f1" />;
    }
  };

  if (loading) {
    return (
      <div className="pattern-insights" style={{ padding: "20px", textAlign: "center" }}>
        <div className="spinner" style={{ width: "30px", height: "30px" }}></div>
        <p style={{ fontSize: "12px", marginTop: "12px" }}>Analyzing your patterns...</p>
      </div>
    );
  }

  if (insights.length === 0 && dayPatterns.length === 0) {
    return (
      <div className="pattern-insights" style={{ 
        padding: "30px", 
        textAlign: "center",
        background: "var(--card-bg-glass)",
        borderRadius: "16px"
      }}>
        <Brain size={32} style={{ marginBottom: "12px", opacity: 0.5 }} />
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
          Log your mood for a few more days to see personalized insights!
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          The more data you provide, the better insights you'll get.
        </p>
      </div>
    );
  }

  return (
    <div className="pattern-insights">
      {/* Insights Cards */}
      {insights.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="#f59e0b" />
            Personalized Insights
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  padding: "14px",
                  background: "var(--accent-soft)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-glass)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  {getInsightIcon(insight.type)}
                  <strong style={{ fontSize: "14px" }}>{insight.title}</strong>
                </div>
                <p style={{ fontSize: "13px", marginBottom: "6px", color: "var(--text-secondary)" }}>
                  {insight.description}
                </p>
                <p style={{ fontSize: "12px", color: "var(--accent-primary)" }}>
                  💡 {insight.suggestion}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Day Pattern Chart */}
      {dayPatterns.length > 0 && (
        <div>
          <h4 style={{ fontSize: "14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} />
            Mood by Day of Week
          </h4>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {dayPatterns.map((day, idx) => (
              <div
                key={idx}
                style={{
                  flex: 1,
                  minWidth: "70px",
                  textAlign: "center",
                  padding: "8px",
                  background: "var(--bg-secondary)",
                  borderRadius: "8px"
                }}
              >
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{day.day.substring(0, 3)}</div>
                <div style={{ 
                  fontSize: "18px", 
                  fontWeight: "bold",
                  color: day.avgMood >= 4 ? "#22c55e" : day.avgMood >= 3 ? "#eab308" : "#ef4444"
                }}>
                  {day.avgMood}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>/5</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep Correlation */}
      {sleepCorrelation.withGoodSleep && sleepCorrelation.withPoorSleep && (
        <div style={{ marginTop: "16px", padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Moon size={14} />
            <span style={{ fontSize: "12px", fontWeight: 500 }}>Sleep & Mood Connection</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span>After good sleep: <strong style={{ color: "#22c55e" }}>{sleepCorrelation.withGoodSleep}/5</strong></span>
            <span>After poor sleep: <strong style={{ color: "#ef4444" }}>{sleepCorrelation.withPoorSleep}/5</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatternInsights;