// frontend/src/pages/components/ModerationStatus.js
import React from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react";

function ModerationStatus({ status, reason, score }) {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <Loader2 className="spinning" size={20} />,
          color: '#3b82f6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          title: 'Checking your content...',
          description: 'Our AI is reviewing your content to keep the community safe.'
        };
      case 'approved':
        return {
          icon: <CheckCircle size={20} />,
          color: '#22c55e',
          bgColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          title: 'Content Approved ✅',
          description: 'Your content is safe and has been published!'
        };
      case 'flagged':
        return {
          icon: <AlertTriangle size={20} />,
          color: '#f59e0b',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          title: 'Content Flagged for Review',
          description: reason || 'Our moderators will review this content shortly.'
        };
      case 'blocked':
        return {
          icon: <XCircle size={20} />,
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          title: 'Content Blocked 🚫',
          description: reason || 'This content violates our community guidelines.'
        };
      case 'crisis':
        return {
          icon: <Shield size={20} />,
          color: '#ef4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          title: "We're Here For You ❤️",
          description: reason || 'Your message shows signs of distress. Help is available.'
        };
      default:
        return {
          icon: <Shield size={20} />,
          color: '#6366f1',
          bgColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          title: 'Moderating...',
          description: 'Please wait while we check your content.'
        };
    }
  };

  const config = getStatusConfig();

  // ✅ FIXED: Score is already a safety score (0-1), not toxicity
  // If score is 0.9 (safe), safety should be 90%
  // If score is 0.1 (toxic), safety should be 10%
  const safetyScore = Math.round((score || 0) * 100);
  
  // Ensure safety score is between 0 and 100
  const displayScore = Math.max(0, Math.min(100, safetyScore));

  // Color coding based on safety score (higher = safer)
  const getScoreColor = () => {
    if (displayScore > 70) return '#22c55e';  // Safe
    if (displayScore > 40) return '#f59e0b';  // Caution
    return '#ef4444';  // High Risk
  };

  const getScoreLabel = () => {
    if (displayScore > 70) return 'Safe';
    if (displayScore > 40) return 'Caution';
    return 'High Risk';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        marginTop: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: config.color,
        flexShrink: 0,
        background: `${config.color}15`
      }}>
        {config.icon}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: 600,
          fontSize: '14px',
          color: config.color,
          marginBottom: '4px'
        }}>
          {config.title}
        </div>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          margin: '0 0 8px 0',
          lineHeight: '1.4'
        }}>
          {config.description}
        </p>

        {/* Show safety score for all statuses except 'checking' and 'crisis' */}
        {status !== 'checking' && status !== 'crisis' && (
          <div style={{ marginTop: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginBottom: '4px'
            }}>
              <span>Safety Score</span>
              <span style={{ color: getScoreColor(), fontWeight: 600 }}>
                {displayScore}% {getScoreLabel()}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              background: 'var(--bg-secondary)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${displayScore}%`,
                height: '100%',
                background: displayScore > 70 ? '#22c55e' : displayScore > 40 ? '#f59e0b' : '#ef4444',
                borderRadius: '2px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            {reason && (
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                padding: '4px 8px',
                background: 'var(--bg-secondary)',
                borderRadius: '4px'
              }}>
                <strong>Reason:</strong> {reason}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ModerationStatus;