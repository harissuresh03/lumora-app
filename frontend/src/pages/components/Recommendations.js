// frontend/src/pages/components/Recommendations.js
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Lightbulb, 
  Activity, 
  Sparkles, 
  ChevronRight,
  Heart,
  Phone,
  Brain,
  TrendingUp,
  Award,
  RefreshCw,
  BarChart3
} from "lucide-react";
import api from "../../utils/api";
import { showErrorToast } from "./ToastNotification";
import AssessmentHistoryGraph from "./AssessmentHistoryGraph";

function Recommendations({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [crisis, setCrisis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasEnoughData, setHasEnoughData] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedTip, setSelectedTip] = useState(null);
  const [showTipModal, setShowTipModal] = useState(false);
  
  // ✅ Assessment history state
  const [assessmentHistory, setAssessmentHistory] = useState({
    phq9: null,
    gad7: null,
    pss: null
  });
  
  // ✅ Single graph visibility
  const [showGraph, setShowGraph] = useState(false);

  // Fetch assessment history
  const fetchAssessmentHistory = useCallback(async () => {
    try {
      const res = await api.get(`/assessments/history/graph/${userId}`);
      
      // Get latest of each type
      const phq9Latest = res.data.phq9?.length > 0 ? res.data.phq9[res.data.phq9.length - 1] : null;
      const gad7Latest = res.data.gad7?.length > 0 ? res.data.gad7[res.data.gad7.length - 1] : null;
      const pssLatest = res.data.pss?.length > 0 ? res.data.pss[res.data.pss.length - 1] : null;
      
      setAssessmentHistory({
        phq9: phq9Latest,
        gad7: gad7Latest,
        pss: pssLatest
      });
      
    } catch (err) {
      console.error("Fetch assessment history error:", err);
    }
  }, [userId]);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await api.get(`/recommendations/${userId}`);
      
      if (res.data.crisis) {
        setCrisis(res.data);
        setLoading(false);
        return;
      }
      
      setHasEnoughData(res.data.hasEnoughData);
      setMessage(res.data.message || "");
      setRecommendations(res.data.recommendations || []);
      setAssessmentRec(res.data.assessmentRecommendation || null);
    } catch (err) {
      console.error("Fetch recommendations error:", err);
      showErrorToast("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
  if (userId) {
    fetchRecommendations();
    fetchAssessmentHistory();
  }
}, [userId, fetchRecommendations, fetchAssessmentHistory]);

  const handleOpenTip = (tip) => {
    setSelectedTip(tip);
    setShowTipModal(true);
  };

  const handleOpenArticle = (article) => {
    window.dispatchEvent(new CustomEvent('openArticle', { 
      detail: { 
        article: {
          id: article.id,
          title: article.title,
          category: article.category,
          summary: article.summary,
          content: article.content,
          image_url: article.image_url,
          read_time: article.readTime
        }
      } 
    }));
  };

  // ✅ Toggle graph visibility
  const toggleGraph = () => {
    setShowGraph(!showGraph);
  };

  const handleAssessmentClick = (type) => {
    window.dispatchEvent(new CustomEvent('openAssessment', { detail: { type } }));
  };

  const getIcon = (type) => {
    switch(type) {
      case 'article': return <BookOpen size={18} />;
      case 'tip': return <Lightbulb size={18} />;
      case 'activity': return <Activity size={18} />;
      default: return <Sparkles size={18} />;
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'article': return 'var(--accent-primary)';
      case 'tip': return '#f59e0b';
      case 'activity': return '#10b981';
      default: return 'var(--accent-secondary)';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'article': return 'Article';
      case 'tip': return 'Wellness Tip';
      case 'activity': return 'Activity';
      default: return 'Recommendation';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#ef4444';
    if (score >= 50) return '#f59e0b';
    return '#22c55e';
  };

  const getScoreLabel = (score) => {
    if (score >= 70) return 'High priority';
    if (score >= 50) return 'Medium priority';
    return 'Low priority';
  };

  // Get severity color for assessment display
  const getSeverityColor = (severity) => {
    if (!severity) return '#9ca3af';
    const colors = {
      'Minimal': '#22c55e',
      'Mild': '#eab308',
      'Moderate': '#f97316',
      'Moderately': '#ef4444',
      'Severe': '#dc2626',
      'Low': '#22c55e',
      'High': '#ef4444'
    };
    const key = Object.keys(colors).find(k => severity.includes(k));
    return key ? colors[key] : '#9ca3af';
  };

  // Get days since last assessment
  const getDaysSince = (takenAt) => {
    if (!takenAt) return null;
    const lastTaken = new Date(takenAt);
    const now = new Date();
    return Math.floor((now - lastTaken) / (1000 * 60 * 60 * 24));
  };

  // ✅ RENDER ASSESSMENT CARD
  const renderAssessmentCard = (type, data, label, icon, maxScore, retakeDays) => {
    const daysSince = data ? getDaysSince(data.taken_at) : null;
    const isOverdue = data ? daysSince >= retakeDays : true;
    const severityColor = data ? getSeverityColor(data.severity) : '#9ca3af';
    const hasData = data !== null;
    
    return (
      <div style={{
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '16px',
        padding: '20px',
        border: isOverdue && data ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-glass)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>{label}</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{icon} Questionnaire</p>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'var(--accent-soft)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {icon === '📋' ? <Brain size={18} color="var(--accent-primary)" /> : 
             icon === '😰' ? <Activity size={18} color="#ef4444" /> : 
             <Activity size={18} color="#f59e0b" />}
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          {hasData ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {data.score}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ {maxScore}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0' }}>
                Last taken: {new Date(data.taken_at).toLocaleDateString()}
              </p>
              {isOverdue ? (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>
                    ⏰ {daysSince} days ago - Time to retake
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: '#22c55e', margin: '6px 0 0' }}>
                  ✓ Up to date - Retake in {retakeDays - daysSince} days
                </p>
              )}
              <div style={{ 
                marginTop: '8px',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                background: severityColor,
                color: 'white',
                display: 'inline-block'
              }}>
                {data.severity || 'Unknown'}
              </div>
            </>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0' }}>
              Not taken yet
            </p>
          )}
        </div>

        {/* ✅ Only "Retake Assessment" button */}
        <button
          onClick={() => handleAssessmentClick(type)}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '10px',
            background: isOverdue && hasData ? '#ef4444' : 'var(--accent-gradient)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          {hasData ? (
            <>
              <RefreshCw size={14} />
              Retake Assessment
            </>
          ) : (
            'Take Assessment'
          )}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ fontSize: '13px', marginTop: '12px', color: 'var(--text-muted)' }}>
          Loading recommendations...
        </p>
      </div>
    );
  }

  // Crisis Mode
  if (crisis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '2px solid #ef4444',
          borderRadius: '20px',
          padding: '28px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Heart size={24} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444', margin: 0 }}>
              We're here for you ❤️
            </h3>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
              {crisis.crisisMessage}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
          {crisis.crisisResources.map((resource, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--card-bg-glass)',
                borderRadius: '12px',
                border: '1px solid var(--border-glass)'
              }}
            >
              <div>
                <strong>{resource.name}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {resource.hours}
                </div>
              </div>
              <a
                href={`tel:${resource.number.replace(/[^0-9+]/g, '')}`}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '30px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Phone size={14} /> Call {resource.number}
              </a>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px', textAlign: 'center' }}>
          You are not alone. Help is available 24/7.
        </p>
      </motion.div>
    );
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* ✅ Assessment Cards with "View Assessment History" button at top */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Brain size={20} color="var(--accent-primary)" />
            Mental Health Screenings
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 400, 
              color: 'var(--text-muted)',
              marginLeft: '8px'
            }}>
              (Retake regularly for accurate tracking)
            </span>
          </h3>
          
          {/* ✅ Single "View Assessment History" Button at top */}
          <button
            onClick={toggleGraph}
            style={{
              padding: '8px 20px',
              borderRadius: '30px',
              border: '1px solid var(--accent-primary)',
              background: showGraph ? 'var(--accent-soft)' : 'var(--card-bg-glass)',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-soft)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showGraph ? 'var(--accent-soft)' : 'var(--card-bg-glass)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <BarChart3 size={16} />
            {showGraph ? 'Hide History' : 'View Assessment History'}
          </button>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '16px' 
        }}>
          {/* PHQ-9 Card */}
          {renderAssessmentCard(
            'phq9', 
            assessmentHistory.phq9, 
            'Depression Screening', 
            '📋', 
            27, 
            14
          )}
          
          {/* GAD-7 Card */}
          {renderAssessmentCard(
            'gad7', 
            assessmentHistory.gad7, 
            'Anxiety Screening', 
            '😰', 
            21, 
            30
          )}
          
          {/* ✅ PSS-10 Card (Stress Screening) */}
          {renderAssessmentCard(
            'pss', 
            assessmentHistory.pss, 
            'Stress Screening', 
            '📊', 
            40, 
            30
          )}
        </div>

        {/* ✅ Assessment History Graph (using the existing component) */}
        <AnimatePresence>
          {showGraph && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              transition={{ duration: 0.3 }}
            >
              <AssessmentHistoryGraph userId={userId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* No data message */}
      {!hasEnoughData && recommendations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '20px',
            padding: '28px',
            border: '1px solid var(--border-glass)',
            textAlign: 'center',
            marginBottom: '28px'
          }}
        >
          <Sparkles size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Start Your Journey</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {message || 'Start logging your mood, sleep, or journal to get personalized recommendations!'}
          </p>
        </motion.div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--accent-primary)" />
            Recommended for You
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3 }}
                style={{
                  background: 'var(--card-bg-glass)',
                  backdropFilter: 'var(--glass-blur)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid var(--border-glass)',
                  transition: 'all 0.2s',
                  cursor: rec.type === 'tip' || rec.type === 'article' ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (rec.type === 'tip') handleOpenTip(rec);
                  if (rec.type === 'article') handleOpenArticle(rec);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    background: `rgba(${getColor(rec.type) === 'var(--accent-primary)' ? '99, 102, 241' : getColor(rec.type) === '#f59e0b' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: getColor(rec.type)
                  }}>
                    {getIcon(rec.type)}
                  </div>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: getColor(rec.type),
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {getTypeLabel(rec.type)}
                    </span>
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)'
                    }}>
                      {rec.duration && `⏱️ ${rec.duration}`}
                      {rec.readTime && `📖 ${rec.readTime} min read`}
                    </span>
                  </div>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>
                  {rec.title}
                </h4>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                  {rec.description || rec.summary || rec.reason}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-light)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} color={getScoreColor(rec.score)} />
                    <span>{getScoreLabel(rec.score)}</span>
                  </div>
                  {rec.type !== 'activity' && (
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {rec.type === 'article' ? 'Read Article' : 'Learn More'} <ChevronRight size={14} />
                    </button>
                  )}
                </div>

                <div style={{
                  marginTop: '12px',
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)'
                }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                    <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {rec.reason}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tip Detail Modal */}
      <AnimatePresence>
        {showTipModal && selectedTip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowTipModal(false)}
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 2000,
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '500px',
                maxHeight: '80vh',
                overflow: 'auto',
                borderRadius: '24px',
                padding: '0',
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur-lg)'
              }}
            >
              <div style={{
                padding: '24px 28px',
                borderBottom: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                zIndex: 10,
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px'
              }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#f59e0b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Wellness Tip
                  </span>
                  <h3 style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700 }}>{selectedTip.title}</h3>
                </div>
                <button
                  onClick={() => setShowTipModal(false)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-secondary)'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '24px 28px' }}>
                <div style={{
                  padding: '16px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedTip.description}
                  </p>
                </div>

                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)'
                }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Why this tip: {selectedTip.reason}
                  </p>
                </div>

                <button
                  onClick={() => setShowTipModal(false)}
                  className="primary-btn"
                  style={{ marginTop: '20px' }}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Recommendations;