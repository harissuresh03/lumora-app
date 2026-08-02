// frontend/src/pages/components/GamificationMini.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { 
  Star, 
  Award, 
  ChevronRight
} from "lucide-react";

function GamificationMini({ userId }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchGamificationData();
    }
  }, [userId]);

  const fetchGamificationData = async () => {
    try {
      const res = await api.get(`/gamification/stats/${userId}`);
      setStats(res.data);
    } catch (err) {
      console.error("Fetch gamification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelTitle = (level) => {
    const titles = {
      1: "Well-being Starter",
      2: "Mindful Beginner",
      3: "Self-Care Explorer",
      4: "Wellness Adventurer",
      5: "Emotional Navigator",
      6: "Resilience Builder",
      7: "Balance Seeker",
      8: "Growth Achiever",
      9: "Mental Health Advocate",
      10: "Lumora Champion"
    };
    return titles[level] || `Level ${level}`;
  };

  const getLevelEmoji = (level) => {
    const emojis = {
      1: "🌱",
      2: "🌿",
      3: "🌱",
      4: "🌿",
      5: "🌈",
      6: "💪",
      7: "⚖️",
      8: "🚀",
      9: "🛡️",
      10: "🌟"
    };
    return emojis[level] || "⭐";
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
      </div>
    );
  }

  if (!stats) return null;

  const { points, level } = stats.points || { total_points: 0, level: 1 };
  const totalBadges = stats.badges?.length || 0;
  const equippedBadge = stats.equipped_badge;
  const nextLevelPoints = level * 250;
  const progressToNextLevel = Math.min((points / nextLevelPoints) * 100, 100);

  return (
    <div 
      onClick={() => navigate("/achievements")}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '10px 20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: '1px solid rgba(255,255,255,0.15)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Level & Emoji */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '50px'
      }}>
        <span style={{ fontSize: '24px' }}>{getLevelEmoji(level)}</span>
        <span style={{ 
          fontSize: '10px', 
          fontWeight: 700, 
          color: 'rgba(255,255,255,0.9)',
          background: 'rgba(255,255,255,0.2)',
          padding: '1px 8px',
          borderRadius: '10px'
        }}>
          Lv.{level}
        </span>
      </div>

      {/* Level Title & Points */}
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 600, 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {getLevelTitle(level)}
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 400, 
            opacity: 0.8,
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <Star size={12} /> {points} pts
          </span>
        </div>
        
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          <div style={{
            width: `${progressToNextLevel}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            borderRadius: '2px',
            transition: 'width 0.5s'
          }} />
        </div>
      </div>

      {/* Badge Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {equippedBadge && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            background: 'rgba(255,255,255,0.1)',
            padding: '2px 10px',
            borderRadius: '12px'
          }}>
            <span>{equippedBadge.icon}</span>
            <span style={{ fontSize: '11px' }}>{equippedBadge.name}</span>
          </div>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <Award size={14} />
          <span>{totalBadges}</span>
        </div>
        <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
      </div>
    </div>
  );
}

export default GamificationMini;