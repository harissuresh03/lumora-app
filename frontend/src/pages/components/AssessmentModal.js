// frontend/src/pages/components/AssessmentModal.js
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast, showWarningToast } from "./ToastNotification";
import ExportButton from "./ExportButton";
import { Heart, Brain, AlertTriangle, X, ChevronRight, ChevronLeft, FileText } from "lucide-react";

function AssessmentModal({ type, onClose, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, [type]);

  const fetchQuestions = async () => {
    try {
      const endpoint = type === 'phq9' ? '/assessments/phq9/questions' : '/assessments/gad7/questions';
      const res = await api.get(endpoint);
      setQuestions(res.data.questions);
      setLoading(false);
    } catch (err) {
      console.error("Fetch questions error:", err);
      showErrorToast("Failed to load assessment");
      onClose();
    }
  };

  const handleAnswer = (score) => {
    setAnswers({ ...answers, [currentQuestion]: score });
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      showErrorToast("Please answer all questions");
      return;
    }

    const answerArray = [];
    for (let i = 0; i < questions.length; i++) {
      answerArray.push(answers[i]);
    }

    setSubmitting(true);
    try {
      const endpoint = type === 'phq9' ? '/assessments/phq9' : '/assessments/gad7';
      const res = await api.post(endpoint, {
        user_id: parseInt(localStorage.getItem("user_id")),
        answers: answerArray
      });
      
      // ✅ Store assessment ID for export
      setAssessmentId(res.data.id || null);
      setResult(res.data);
      
      if (res.data.hasSelfHarmRisk) {
        showWarningToast("Please review your results - support is available");
      } else {
        showSuccessToast("Assessment completed!");
      }
    } catch (err) {
      console.error("Submit assessment error:", err);
      showErrorToast("Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    if (onComplete) onComplete();
    onClose();
  };

  const getScoreLabel = (score) => {
    const labels = {
      0: "Not at all",
      1: "Several days",
      2: "More than half the days",
      3: "Nearly every day"
    };
    return labels[score] || "";
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading-container" style={{ padding: "40px" }}>
            <div className="spinner"></div>
            <p>Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const severityColors = {
      "Minimal depression": "#22c55e",
      "Mild depression": "#eab308",
      "Moderate depression": "#f97316",
      "Moderately severe depression": "#ef4444",
      "Severe depression": "#dc2626",
      "Minimal anxiety": "#22c55e",
      "Mild anxiety": "#eab308",
      "Moderate anxiety": "#f97316",
      "Severe anxiety": "#ef4444"
    };

    return (
      <div className="modal-overlay" onClick={resetAndClose}>
        <motion.div 
          className="modal" 
          onClick={(e) => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ maxWidth: "500px" }}
        >
          <div className="modal-header">
            <h3>{type === 'phq9' ? 'PHQ-9 Results' : 'GAD-7 Results'}</h3>
            <button className="modal-close" onClick={resetAndClose}>✕</button>
          </div>
          <div className="modal-content">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ 
                fontSize: "48px", 
                fontWeight: "bold", 
                color: severityColors[result.severity] || "#6366f1",
                marginBottom: "8px"
              }}>
                {result.score}/{result.maxScore}
              </div>
              <div style={{ 
                fontSize: "18px", 
                fontWeight: "600",
                color: severityColors[result.severity] || "#6366f1"
              }}>
                {result.severity}
              </div>
            </div>
            
            <div style={{ 
              padding: "16px", 
              background: result.hasSelfHarmRisk ? "rgba(239, 68, 68, 0.1)" : "var(--accent-soft)",
              borderRadius: "12px",
              marginBottom: "20px"
            }}>
              {result.hasSelfHarmRisk && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#ef4444" }}>
                  <AlertTriangle size={20} />
                  <strong>Important Note:</strong>
                </div>
              )}
              <p style={{ margin: 0, lineHeight: 1.5 }}>{result.recommendation}</p>
            </div>
            
            {result.hasSelfHarmRisk && (
              <div style={{ 
                padding: "16px", 
                background: "#fee2e2", 
                borderRadius: "12px",
                marginBottom: "20px"
              }}>
                <strong style={{ color: "#dc2626" }}>📞 Immediate Support Available:</strong>
                <ul style={{ marginTop: "8px", marginBottom: 0, paddingLeft: "20px" }}>
                  <li>Talian Kasih: 15999 (24/7)</li>
                  <li>Befrienders KL: 03-7627 2929 (24/7)</li>
                  <li>Talian HEAL: 15555 (8am-12am)</li>
                </ul>
              </div>
            )}

            {/* ✅ ADD: Export Button */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '16px',
              justifyContent: 'center'
            }}>
              {assessmentId && (
                <ExportButton 
                  type="assessment" 
                  userId={parseInt(localStorage.getItem("user_id"))} 
                  assessmentId={assessmentId}
                  label="Export PDF"
                  icon={<FileText size={16} />}
                />
              )}
            </div>
            
            <button onClick={resetAndClose} className="primary-btn">
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ maxWidth: "550px" }}
      >
        <div className="modal-header">
          <div>
            <h3>{type === 'phq9' ? 'Depression Screening (PHQ-9)' : 'Anxiety Assessment (GAD-7)'}</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-content">
          <div style={{ marginBottom: "24px" }}>
            <div style={{ 
              width: "100%", 
              height: "4px", 
              background: "var(--border-light)", 
              borderRadius: "2px",
              marginBottom: "24px"
            }}>
              <div style={{ 
                width: `${((currentQuestion + 1) / questions.length) * 100}%`, 
                height: "100%", 
                background: "var(--accent-gradient)", 
                borderRadius: "2px",
                transition: "width 0.3s"
              }} />
            </div>
            
            <h3 style={{ fontSize: "18px", marginBottom: "16px", lineHeight: 1.4 }}>
              {currentQ?.text}
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentQ?.scores.map((score, idx) => (
                <button
                  key={score}
                  onClick={() => handleAnswer(score)}
                  className={`answer-option ${answers[currentQuestion] === score ? 'selected' : ''}`}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: answers[currentQuestion] === score ? "2px solid var(--accent-primary)" : "1px solid var(--border-light)",
                    background: answers[currentQuestion] === score ? "var(--accent-soft)" : "var(--card-bg-solid)",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "14px"
                  }}
                >
                  {getScoreLabel(score)}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            {currentQuestion > 0 && (
              <button
                onClick={() => setCurrentQuestion(currentQuestion - 1)}
                className="secondary-btn"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
            )}
            {isLastQuestion ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || Object.keys(answers).length !== questions.length}
                className="primary-btn"
                style={{ marginLeft: "auto" }}
              >
                {submitting ? "Submitting..." : "See Results"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                disabled={answers[currentQuestion] === undefined}
                className="primary-btn"
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}
              >
                Next <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AssessmentModal;