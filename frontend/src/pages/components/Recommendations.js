// frontend/src/pages/components/Recommendations.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Lightbulb, 
  Activity, 
  Sparkles, 
  Clock, 
  ChevronRight,
  AlertTriangle,
  Heart,
  Phone,
  Calendar,
  Brain,
  TrendingUp,
  Award,
  RefreshCw
} from "lucide-react";
import api from "../../utils/api";
import { showErrorToast, showSuccessToast } from "./ToastNotification";

function Recommendations({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [assessmentRec, setAssessmentRec] = useState(null);
  const [crisis, setCrisis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasEnoughData, setHasEnoughData] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedTip, setSelectedTip] = useState(null);
  const [showTipModal, setShowTipModal] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
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
  };

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

  const handleAssessmentClick = (type) => {
    window.dispatchEvent(new CustomEvent('openAssessment', { detail: { type } }));
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ fontSize: '13px', marginTop: '12px', color: 'var(--text-muted)' }}>
          Personalizing recommendations...
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

  // No data message
  if (!hasEnoughData) {
    return (
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
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleAssessmentClick('phq9')}
            style={{
              padding: '8px 20px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '30px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Take PHQ-9 Assessment
          </button>
          <button
            onClick={() => handleAssessmentClick('gad7')}
            style={{
              padding: '8px 20px',
              background: 'var(--accent-gradient)',
              border: 'none',
              borderRadius: '30px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Take GAD-7 Assessment
          </button>
        </div>
      </motion.div>
    );
  }

  // Check if assessmentRec is null before accessing its properties
  const hasPhq9Recommendation = assessmentRec?.phq9?.recommended || false;
  const hasGad7Recommendation = assessmentRec?.gad7?.recommended || false;
  const phq9LastScore = assessmentRec?.phq9?.lastScore;
  const gad7LastScore = assessmentRec?.gad7?.lastScore;
  const phq9LastTaken = assessmentRec?.phq9?.lastTaken;
  const gad7LastTaken = assessmentRec?.gad7?.lastTaken;
  const phq9Reason = assessmentRec?.phq9?.reason || '';
  const gad7Reason = assessmentRec?.gad7?.reason || '';

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Assessment Cards - Two Separate Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* PHQ-9 Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '16px',
            padding: '20px',
            border: hasPhq9Recommendation ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Depression Screening</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>PHQ-9 Questionnaire</p>
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
              <Brain size={18} color="var(--accent-primary)" />
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            {phq9LastScore !== null && phq9LastScore !== undefined ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {phq9LastScore}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 27</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0' }}>
                  Last taken: {phq9LastTaken ? new Date(phq9LastTaken).toLocaleDateString() : 'N/A'}
                </p>
                {hasPhq9Recommendation ? (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0 }}>
                      ⏰ {phq9Reason}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#22c55e', margin: '6px 0 0' }}>
                    ✓ Up to date - Retake recommended in 14 days
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0' }}>
                {phq9Reason || 'Take your first screening to establish a baseline.'}
              </p>
            )}
          </div>

          <button
            onClick={() => handleAssessmentClick('phq9')}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '10px',
              background: hasPhq9Recommendation ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              border: hasPhq9Recommendation ? 'none' : '1px solid var(--border-light)',
              borderRadius: '10px',
              color: hasPhq9Recommendation ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {phq9LastScore !== null && phq9LastScore !== undefined ? 'Retake Assessment' : 'Take Assessment'}
          </button>
        </motion.div>

        {/* GAD-7 Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--card-bg-glass)',
            backdropFilter: 'var(--glass-blur)',
            borderRadius: '16px',
            padding: '20px',
            border: hasGad7Recommendation ? '2px solid var(--accent-primary)' : '1px solid var(--border-glass)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Anxiety Screening</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>GAD-7 Questionnaire</p>
            </div>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={18} color="#ef4444" />
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            {gad7LastScore !== null && gad7LastScore !== undefined ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {gad7LastScore}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ 21</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0' }}>
                  Last taken: {gad7LastTaken ? new Date(gad7LastTaken).toLocaleDateString() : 'N/A'}
                </p>
                {hasGad7Recommendation ? (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                  }}>
                    <p style={{ fontSize: '12px', color: '#f59e0b', margin: 0 }}>
                      ⏰ {gad7Reason}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: '12px', color: '#22c55e', margin: '6px 0 0' }}>
                    ✓ Up to date - Retake recommended in 30 days
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0' }}>
                {gad7Reason || 'Take your first screening to establish a baseline.'}
              </p>
            )}
          </div>

          <button
            onClick={() => handleAssessmentClick('gad7')}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '10px',
              background: hasGad7Recommendation ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              border: hasGad7Recommendation ? 'none' : '1px solid var(--border-light)',
              borderRadius: '10px',
              color: hasGad7Recommendation ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {gad7LastScore !== null && gad7LastScore !== undefined ? 'Retake Assessment' : 'Take Assessment'}
          </button>
        </motion.div>
      </div>

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

                {/* Reason why recommended */}
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