// frontend/src/pages/components/AssessmentModal.js
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast, showWarningToast } from "./ToastNotification";
import ExportButton from "./ExportButton";
import { AlertTriangle, ChevronRight, ChevronLeft, FileText } from "lucide-react";

// Local PSS questions - static, defined outside component
const PSS_QUESTIONS = [
  { id: 1, text: "In the last month, how often have you been upset because of something that happened unexpectedly?", scores: [0, 1, 2, 3, 4] },
  { id: 2, text: "In the last month, how often have you felt that you were unable to control the important things in your life?", scores: [0, 1, 2, 3, 4] },
  { id: 3, text: "In the last month, how often have you felt nervous and 'stressed'?", scores: [0, 1, 2, 3, 4] },
  { id: 4, text: "In the last month, how often have you felt confident about your ability to handle your personal problems?", scores: [0, 1, 2, 3, 4] },
  { id: 5, text: "In the last month, how often have you felt that things were going your way?", scores: [0, 1, 2, 3, 4] },
  { id: 6, text: "In the last month, how often have you found that you could not cope with all the things that you had to do?", scores: [0, 1, 2, 3, 4] },
  { id: 7, text: "In the last month, how often have you been able to control irritations in your life?", scores: [0, 1, 2, 3, 4] },
  { id: 8, text: "In the last month, how often have you felt that you were on top of things?", scores: [0, 1, 2, 3, 4] },
  { id: 9, text: "In the last month, how often have you been angered because of things that happened that were outside of your control?", scores: [0, 1, 2, 3, 4] },
  { id: 10, text: "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?", scores: [0, 1, 2, 3, 4] }
];

function AssessmentModal({ type, onClose, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    try {
      let endpoint;
      if (type === 'phq9') {
        endpoint = '/assessments/phq9/questions';
      } else if (type === 'gad7') {
        endpoint = '/assessments/gad7/questions';
      } else if (type === 'pss') {
        // Use local PSS questions
        setQuestions(PSS_QUESTIONS);
        setLoading(false);
        return;
      }
      
      const res = await api.get(endpoint);
      setQuestions(res.data.questions);
      setLoading(false);
    } catch (err) {
      console.error("Fetch questions error:", err);
      showErrorToast("Failed to load assessment");
      onClose();
    }
  }, [type, onClose]); // PSS_QUESTIONS is now stable

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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
      let endpoint;
      if (type === 'phq9') endpoint = '/assessments/phq9';
      else if (type === 'gad7') endpoint = '/assessments/gad7';
      else if (type === 'pss') endpoint = '/assessments/pss';
      
      const res = await api.post(endpoint, {
        user_id: parseInt(localStorage.getItem("user_id")),
        answers: answerArray
      });
      
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

  // Get score label for PSS
  const getScoreLabel = (score) => {
    if (type === 'phq9' || type === 'gad7') {
      const labels = {
        0: "Not at all",
        1: "Several days",
        2: "More than half the days",
        3: "Nearly every day"
      };
      return labels[score] || "";
    } else if (type === 'pss') {
      const labels = {
        0: "Never",
        1: "Almost never",
        2: "Sometimes",
        3: "Fairly often",
        4: "Very often"
      };
      return labels[score] || "";
    }
    return "";
  };

  // Get color for severity
  const getSeverityColor = (severity) => {
    const colors = {
      "Minimal depression": "#22c55e",
      "Mild depression": "#eab308",
      "Moderate depression": "#f97316",
      "Moderately severe depression": "#ef4444",
      "Severe depression": "#dc2626",
      "Minimal anxiety": "#22c55e",
      "Mild anxiety": "#eab308",
      "Moderate anxiety": "#f97316",
      "Severe anxiety": "#ef4444",
      "Low stress": "#22c55e",
      "Moderate stress": "#f97316",
      "High stress": "#ef4444"
    };
    return colors[severity] || "#6366f1";
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
    const severityColor = getSeverityColor(result.severity);
    const maxScore = result.maxScore || (type === 'phq9' ? 27 : type === 'gad7' ? 21 : 40);

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
            <h3>
              {type === 'phq9' ? 'PHQ-9 Results' : type === 'gad7' ? 'GAD-7 Results' : 'PSS-10 Results'}
            </h3>
            <button className="modal-close" onClick={resetAndClose}>✕</button>
          </div>
          <div className="modal-content">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ 
                fontSize: "48px", 
                fontWeight: "bold", 
                color: severityColor,
                marginBottom: "8px"
              }}>
                {result.score}/{maxScore}
              </div>
              <div style={{ 
                fontSize: "18px", 
                fontWeight: "600",
                color: severityColor
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
            <h3>
              {type === 'phq9' ? 'Depression Screening (PHQ-9)' : 
               type === 'gad7' ? 'Anxiety Assessment (GAD-7)' : 
               'Perceived Stress Scale (PSS-10)'}
            </h3>
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