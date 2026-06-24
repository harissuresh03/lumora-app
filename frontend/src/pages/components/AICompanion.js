// frontend/src/pages/components/AICompanion.js
import { useState, useRef, useEffect } from "react";
import api from "../../utils/api";

function AICompanion({ onClose, onJournalSaved }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [moodAnalysis, setMoodAnalysis] = useState(null);
  const [autoSaveMood, setAutoSaveMood] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        user_id: parseInt(localStorage.getItem("user_id")),
        message: userMessage,
        conversationHistory: conversationHistory,
        autoSaveMood: autoSaveMood
      });

      // Check if AI service returned an error
      if (!response.data.success) {
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: response.data.response || "I'm sorry, the AI service is currently unavailable. Please try again in a few moments. 🌙"
        }]);
        setIsLoading(false);
        return;
      }

      // ✅ SHOW CRISIS RESOURCES IF DETECTED
      if (response.data.crisisDetected && response.data.crisisResources) {
        const crisisMessage = 
          `💙 I want you to know that you're not alone. What you've shared is important, and there is support available. Here are some resources that can help:\n\n` +
          response.data.crisisResources.map(r => 
            `📞 **${r.name}** — ${r.number} (${r.hours})`
          ).join('\n') +
          `\n\nYou are not alone. 💙 Please reach out to one of these services if you need immediate support.`;
        
        setMessages(prev => [...prev, { 
          role: "ai", 
          content: crisisMessage
        }]);
        
        setIsLoading(false);
        return;
      }

      // Update conversation history
      const newHistory = [
        ...conversationHistory,
        { role: "user", content: userMessage },
        { role: "ai", content: response.data.response }
      ];
      setConversationHistory(newHistory);

      // Add AI response to chat
      setMessages(prev => [...prev, { role: "ai", content: response.data.response }]);
      
      // Update mood analysis
      if (response.data.moodAnalysis) {
        setMoodAnalysis(response.data.moodAnalysis);
      }
      
    } catch (error) {
      console.error("Chat error:", error);
      
      let errorMessage = "I'm having trouble connecting. Please try again.";
      
      // Check for specific error types
      if (error.response?.status === 503) {
        errorMessage = error.response?.data?.response || "AI service is currently unavailable. Please try again later. 🌙";
      } else if (error.response?.status === 403) {
        errorMessage = "Session expired. Please refresh the page and log in again.";
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message?.includes('Network Error')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setMessages(prev => [...prev, { 
        role: "ai", 
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToJournal = async () => {
    if (conversationHistory.length === 0) {
      alert("No conversation to save yet. Start chatting first!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/ai/save-journal", {
        user_id: parseInt(localStorage.getItem("user_id")),
        conversationHistory: conversationHistory,
        moodAnalysis: moodAnalysis
      });

      if (response.data.success) {
        alert("Journal entry saved! ✨");
        if (onJournalSaved) onJournalSaved(response.data.content);
        onClose();
      } else {
        alert(response.data.msg || "Failed to save journal entry. AI service may be unavailable.");
      }
    } catch (error) {
      console.error("Save journal error:", error);
      
      if (error.response?.status === 503) {
        alert("AI service is currently unavailable. Cannot save journal entry. Please try again later.");
      } else {
        alert("Failed to save journal entry. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const moodLabels = {
    1: "Terrible",
    2: "Sad",
    3: "Okay",
    4: "Good",
    5: "Great"
  };

  const getMoodColor = (mood) => {
    const colors = { 
      1: "#ef4444", 
      2: "#f97316", 
      3: "#eab308", 
      4: "#22c55e", 
      5: "#16a34a" 
    };
    return colors[mood] || "#6b7280";
  };

  const getMoodEmoji = (mood) => {
    const emojis = { 
      1: "😭", 
      2: "😔", 
      3: "😐", 
      4: "🙂", 
      5: "😄" 
    };
    return emojis[mood] || "😐";
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.icon}>🤖</span>
            <h3 style={styles.title}>AI Companion</h3>
            <span style={styles.beta}>Beta</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Mood Analysis Display */}
        {moodAnalysis && (
          <div style={styles.analysisBar}>
            <div style={styles.moodTag}>
              <span>Detected mood:</span>
              <span style={{
                ...styles.moodValue,
                backgroundColor: getMoodColor(moodAnalysis.detectedMood),
                color: moodAnalysis.detectedMood <= 2 ? "white" : "#1f2937"
              }}>
                {getMoodEmoji(moodAnalysis.detectedMood)} {moodLabels[moodAnalysis.detectedMood]}
              </span>
            </div>
            <div style={styles.emotionTag}>
              <span>🎭 {moodAnalysis.primaryEmotion}</span>
              <span style={styles.confidence}>{Math.round(moodAnalysis.confidence * 100)}%</span>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div style={styles.chatContainer}>
          {messages.length === 0 ? (
            <div style={styles.welcomeMessage}>
              <span style={styles.waveEmoji}>👋</span>
              <p>Hi! I'm your AI companion, Lumora.</p>
              <p>How are you feeling today? Share whatever's on your mind - I'm here to listen. 💙</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={msg.role === "user" ? styles.userMessage : styles.aiMessage}>
                <div style={styles.messageAvatar}>
                  {msg.role === "user" ? "👤" : "🤖"}
                </div>
                <div style={styles.messageBubble}>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div style={styles.aiMessage}>
              <div style={styles.messageAvatar}>🤖</div>
              <div style={styles.typingIndicator}>
                <span>●</span><span>●</span><span>●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          <div style={styles.toggleSection}>
            <label style={styles.toggleLabel}>
              <input 
                type="checkbox" 
                checked={autoSaveMood}
                onChange={(e) => setAutoSaveMood(e.target.checked)}
              />
              Auto-save mood to today's log
            </label>
          </div>
          <div style={styles.inputRow}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              style={styles.input}
              disabled={isLoading}
            />
            <button onClick={sendMessage} style={styles.sendBtn} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </button>
          </div>
          <button 
            onClick={saveToJournal} 
            style={styles.saveBtn}
            disabled={conversationHistory.length === 0 || isLoading}
          >
            📓 Save conversation as journal entry
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(8px)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modal: {
    background: "white",
    borderRadius: "24px",
    maxWidth: "550px",
    width: "100%",
    height: "650px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  icon: { fontSize: "24px" },
  title: { margin: 0, fontSize: "18px", fontWeight: "600" },
  beta: {
    fontSize: "10px",
    background: "rgba(255,255,255,0.3)",
    padding: "2px 8px",
    borderRadius: "20px",
  },
  closeBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "none",
    color: "white",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "16px",
  },
  analysisBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
  },
  moodTag: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  moodValue: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  emotionTag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    textTransform: "capitalize",
  },
  confidence: {
    fontSize: "10px",
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  chatContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  welcomeMessage: {
    textAlign: "center",
    padding: "30px 20px",
    color: "#9ca3af",
  },
  waveEmoji: { fontSize: "40px", display: "block", marginBottom: "12px" },
  userMessage: {
    display: "flex",
    gap: "10px",
    flexDirection: "row-reverse",
  },
  aiMessage: {
    display: "flex",
    gap: "10px",
  },
  messageAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "18px",
    background: "#f3f4f6",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  typingIndicator: {
    padding: "10px 14px",
    background: "#f3f4f6",
    borderRadius: "18px",
    fontSize: "14px",
    display: "flex",
    gap: "4px",
  },
  inputContainer: {
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
    background: "white",
  },
  toggleSection: {
    marginBottom: "10px",
  },
  toggleLabel: {
    fontSize: "12px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer",
  },
  inputRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  input: {
    flex: 1,
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    fontSize: "14px",
    outline: "none",
  },
  sendBtn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    border: "none",
    borderRadius: "24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      transform: "scale(1.02)",
    },
    ":disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  saveBtn: {
    width: "100%",
    padding: "10px",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    color: "#374151",
    transition: "all 0.2s",
    ":hover": {
      background: "#e5e7eb",
    },
    ":disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
};

export default AICompanion;