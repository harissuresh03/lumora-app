// frontend/src/pages/components/GamificationDisplay.js
import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { 
  Star, 
  Flame, 
  Award, 
  MessageCircle,
  BookOpen,
  Moon,
  Smile
} from "lucide-react";
import { showSuccessToast } from "./ToastNotification";

function GamificationDisplay({ userId }) {
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equippedBadge, setEquippedBadge] = useState(null);
  const [activeTab, setActiveTab] = useState('badges');

  useEffect(() => {
    if (userId) {
      fetchGamificationData();
    }
  }, [userId]);

  const fetchGamificationData = async () => {
    try {
      const [statsRes, badgesRes] = await Promise.all([
        api.get(`/gamification/stats/${userId}`),
        api.get(`/gamification/badges/${userId}`)
      ]);
      
      setStats(statsRes.data);
      setBadges(badgesRes.data || []);
      setEquippedBadge(statsRes.data.equipped_badge);
    } catch (err) {
      console.error("Fetch gamification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipBadge = async (badgeId) => {
    try {
      await api.post("/gamification/badges/equip", { badge_id: badgeId });
      showSuccessToast("Badge equipped! 🎉");
      fetchGamificationData();
    } catch (err) {
      console.error("Equip badge error:", err);
    }
  };

  const handleUnequipBadge = async () => {
    try {
      await api.post("/gamification/badges/unequip");
      showSuccessToast("Badge unequipped");
      fetchGamificationData();
    } catch (err) {
      console.error("Unequip badge error:", err);
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

  const getStreakEmoji = (streak) => {
    if (streak >= 30) return "🔥";
    if (streak >= 14) return "💪";
    if (streak >= 7) return "🌟";
    return "🌱";
  };

  const getStreakLabel = (type) => {
    const labels = { mood: 'Mood', sleep: 'Sleep', journal: 'Journal', chat: 'Chat' };
    return labels[type] || type;
  };

  const getStreakIcon = (type) => {
    const icons = { mood: <Smile size={14} />, sleep: <Moon size={14} />, journal: <BookOpen size={14} />, chat: <MessageCircle size={14} /> };
    return icons[type] || <Star size={14} />;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading achievements...</p>
      </div>
    );
  }

  if (!stats) return null;

  const { points, level } = stats.points || { total_points: 0, level: 1 };
  const totalBadges = stats.badges?.length || 0;
  const nextLevelPoints = level * 250;
  const progressToNextLevel = Math.min((points / nextLevelPoints) * 100, 100);
  const streakData = stats.streaks || {};
  const earnedBadges = badges.filter(b => b.is_earned);
  const lockedBadges = badges.filter(b => !b.is_earned);

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '20px',
        padding: '28px',
        border: '1px solid var(--border-glass)',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{getLevelEmoji(level)}</div>
        <h2 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
          {getLevelTitle(level)}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Level {level} • {points} points
        </p>
        
        {/* Progress Bar */}
        <div style={{ marginTop: '16px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '4px'
          }}>
            <span>Progress to Level {level + 1}</span>
            <span>{Math.round(progressToNextLevel)}%</span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: 'var(--bg-secondary)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressToNextLevel}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              borderRadius: '4px',
              transition: 'width 0.5s'
            }} />
          </div>
        </div>

        {/* Equipped Badge */}
        {equippedBadge && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            padding: '6px 16px',
            background: 'var(--accent-soft)',
            borderRadius: '20px',
            fontSize: '14px'
          }}>
            <span style={{ fontSize: '20px' }}>{equippedBadge.icon}</span>
            <span>Equipped: {equippedBadge.name}</span>
            <button
              onClick={handleUnequipBadge}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '14px',
                padding: '0 4px'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats Summary */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{totalBadges}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Badges Earned</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{points}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Points</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{level}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Current Level</div>
          </div>
        </div>
      </div>

      {/* Streaks Section */}
      <div style={{
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-glass)',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={18} color="#f59e0b" />
          Streaks
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px'
        }}>
          {Object.entries(streakData).map(([type, data]) => {
            if (type === 'all_activity') return null;
            return (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontSize: '24px' }}>{getStreakEmoji(data.current)}</div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{getStreakLabel(type)}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{data.current} days</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Best: {data.longest}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Section */}
      <div style={{
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid var(--border-glass)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="var(--accent-primary)" />
            Badges
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
              ({totalBadges} earned)
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('badges')}
              style={{
                padding: '4px 16px',
                borderRadius: '20px',
                border: activeTab === 'badges' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                background: activeTab === 'badges' ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'badges' ? 600 : 400
              }}
            >
              All Badges
            </button>
            <button
              onClick={() => setActiveTab('locked')}
              style={{
                padding: '4px 16px',
                borderRadius: '20px',
                border: activeTab === 'locked' ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                background: activeTab === 'locked' ? 'var(--accent-soft)' : 'transparent',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: activeTab === 'locked' ? 600 : 400
              }}
            >
              Locked
            </button>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px'
        }}>
          {(activeTab === 'badges' ? badges : lockedBadges).map(badge => (
            <div
              key={badge.id}
              style={{
                padding: '16px',
                background: badge.is_earned ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                borderRadius: '12px',
                textAlign: 'center',
                opacity: badge.is_earned ? 1 : 0.5,
                border: badge.is_equipped ? '2px solid var(--accent-primary)' : '1px solid transparent',
                cursor: badge.is_earned && !badge.is_equipped ? 'pointer' : 'default',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onClick={() => {
                if (badge.is_earned && !badge.is_equipped) {
                  handleEquipBadge(badge.id);
                }
              }}
            >
              <div style={{ fontSize: '32px' }}>{badge.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>
                {badge.name}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {badge.is_earned 
                  ? (badge.is_equipped ? '✅ Equipped' : 'Tap to equip') 
                  : '🔒 Locked'}
              </div>
              {badge.is_earned && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  fontSize: '12px',
                  color: '#22c55e'
                }}>
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>

        {activeTab === 'badges' && badges.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            No badges earned yet. Keep using Lumora to unlock achievements! 🏆
          </p>
        )}

        {activeTab === 'locked' && lockedBadges.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            You've unlocked all badges! 🎉
          </p>
        )}
      </div>
    </div>
  );
}

export default GamificationDisplay;