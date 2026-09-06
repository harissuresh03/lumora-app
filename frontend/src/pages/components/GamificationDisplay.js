// frontend/src/pages/components/GamificationDisplay.js
import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import {
  Star,
  Flame,
  Award,
  MessageCircle,
  BookOpen,
  Moon,
  Smile,
  Sprout,
  Leaf,
  Flower2,
  TreePine,
  Rainbow,
  Dumbbell,
  Scale,
  Rocket,
  ShieldCheck,
  Trophy,
  Lock,
  CheckCircle2,
  Check,
  X,
  Sun,
  Brain,
  Heart,
} from "lucide-react";
import { showSuccessToast } from "./ToastNotification";

// Icon name → component mapping (for dynamic rendering)
const ICON_MAP = {
  Sun,
  Moon,
  BookOpen,
  Brain,
  ShieldCheck,
  MessageCircle,
  Flame,
  Leaf,
  Rocket,
  Sprout,
  Award,
  Heart,
  Trophy,
  Star,
  Smile,
  // Add any other icons you might use
};

function GamificationDisplay({ userId }) {
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [equippedBadge, setEquippedBadge] = useState(null);
  const [activeTab, setActiveTab] = useState('badges');

  const fetchGamificationData = useCallback(async () => {
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
  }, [userId]);

  useEffect(() => {
  if (userId) {
    fetchGamificationData();
  }
}, [userId, fetchGamificationData]);

  const handleEquipBadge = async (badgeId) => {
    try {
      await api.post("/gamification/badges/equip", { badge_id: badgeId });
      showSuccessToast("Badge equipped!");
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

  // Helper to render a Lucide icon from the stored name
  const renderBadgeIcon = (iconName, size = 32, props = {}) => {
    const IconComponent = ICON_MAP[iconName] || Star; // fallback
    return <IconComponent size={size} {...props} />;
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

  const getLevelIcon = (level) => {
    const icons = {
      1: Sprout,
      2: Leaf,
      3: Flower2,
      4: TreePine,
      5: Rainbow,
      6: Dumbbell,
      7: Scale,
      8: Rocket,
      9: ShieldCheck,
      10: Trophy
    };
    return icons[level] || Star;
  };

  const getStreakLengthIcon = (streak) => {
    if (streak >= 30) return Flame;
    if (streak >= 14) return Dumbbell;
    if (streak >= 7) return Star;
    return Sprout;
  };

  const getStreakLabel = (type) => {
    const labels = { mood: 'Mood', sleep: 'Sleep', journal: 'Journal', chat: 'Chat' };
    return labels[type] || type;
  };

  const getStreakIcon = (type) => {
    const icons = { mood: Smile, sleep: Moon, journal: BookOpen, chat: MessageCircle };
    const Icon = icons[type] || Star;
    return <Icon size={14} />;
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
  const LevelIcon = getLevelIcon(level);

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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--accent-primary)' }}>
          <LevelIcon size={48} strokeWidth={1.75} />
        </div>
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
            {renderBadgeIcon(equippedBadge.icon, 20)}
            <span>Equipped: {equippedBadge.name}</span>
            <button
              onClick={handleUnequipBadge}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0 4px'
              }}
              aria-label="Unequip badge"
            >
              <X size={14} strokeWidth={2} />
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
            const StreakIcon = getStreakLengthIcon(data.current);
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
                <div style={{ color: '#f59e0b' }}>
                  <StreakIcon size={24} strokeWidth={1.75} />
                </div>
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
                fontWeight: activeTab === 'badges' ? 600 : 400,
                color: activeTab === 'badges' ? 'var(--accent-primary)' : 'var(--text-secondary)'
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
                fontWeight: activeTab === 'locked' ? 600 : 400,
                color: activeTab === 'locked' ? 'var(--accent-primary)' : 'var(--text-secondary)'
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
                background: badge.is_earned ? 'var(--accent-soft)' : 'var(--card-bg-solid)',
                borderRadius: '12px',
                textAlign: 'center',
                opacity: badge.is_earned ? 1 : 0.6,
                border: badge.is_equipped ? '2px solid var(--accent-primary)' : '1px solid var(--border-light)',
                cursor: badge.is_earned && !badge.is_equipped ? 'pointer' : 'default',
                transition: 'all 0.2s',
                position: 'relative',
                filter: badge.is_earned ? 'none' : 'grayscale(0.4)',
              }}
              onClick={() => {
                if (badge.is_earned && !badge.is_equipped) {
                  handleEquipBadge(badge.id);
                }
              }}
            >
              {/* Render Lucide icon based on database icon name */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                {renderBadgeIcon(badge.icon, 32)}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '6px' }}>
                {badge.name}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '9px',
                color: 'var(--text-muted)',
                marginTop: '2px'
              }}>
                {badge.is_earned ? (
                  badge.is_equipped ? (
                    <>
                      <CheckCircle2 size={11} />
                      Equipped
                    </>
                  ) : (
                    'Tap to equip'
                  )
                ) : (
                  <>
                    <Lock size={11} />
                    Locked
                  </>
                )}
              </div>
              {badge.is_earned && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  color: '#22c55e',
                  display: 'flex'
                }}>
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </div>
          ))}
        </div>

        {activeTab === 'badges' && badges.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            No badges earned yet. Keep using Lumora to unlock achievements!
          </p>
        )}

        {activeTab === 'locked' && lockedBadges.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            You've unlocked all badges!
          </p>
        )}
      </div>
    </div>
  );
}

export default GamificationDisplay;