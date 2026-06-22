// frontend/src/pages/Counsellor/CounsellorMessages.js
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "../components/ToastNotification";
import { Send, Mail, User, CheckCircle, Clock, ArrowLeft, Search, RefreshCw } from "lucide-react";

function CounsellorMessages() {
  const navigate = useNavigate();
  const location = useLocation();
  const counsellorId = localStorage.getItem("user_id");
  const [messages, setMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Get studentId from URL params
  const queryParams = new URLSearchParams(location.search);
  const studentIdParam = queryParams.get('student');

  useEffect(() => {
    fetchStudents();
    if (studentIdParam) {
      setSelectedStudent(parseInt(studentIdParam));
      fetchMessages(studentIdParam);
    } else {
      fetchMessages();
    }
  }, [studentIdParam]);

  const fetchStudents = async () => {
    try {
      const res = await api.get(`/counsellor/students/${counsellorId}`, {
        params: { limit: 100 }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Fetch students error:", err);
      showErrorToast("Failed to fetch students");
    }
  };

  const fetchMessages = useCallback(async (studentId = null) => {
    setLoading(true);
    try {
      const params = studentId ? { student_id: studentId } : {};
      const res = await api.get(`/counsellor/messages/${counsellorId}`, { params });
      setMessages(res.data || []);
    } catch (err) {
      console.error("Fetch messages error:", err);
      showErrorToast("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [counsellorId]);

  useEffect(() => {
    if (selectedStudent) {
      fetchMessages(selectedStudent);
    } else {
      fetchMessages();
    }
  }, [selectedStudent, fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showErrorToast("Please select a student");
      return;
    }
    if (!newMessage.trim()) {
      showErrorToast("Please enter a message");
      return;
    }

    setSending(true);
    try {
      await api.post("/counsellor/messages", {
        counsellor_id: parseInt(counsellorId),
        student_id: selectedStudent,
        subject: newSubject || "Message from Counsellor",
        message: newMessage
      });
      showSuccessToast("Message sent successfully!");
      setNewMessage("");
      setNewSubject("");
      setShowCompose(false);
      fetchMessages(selectedStudent);
    } catch (err) {
      showErrorToast(err.response?.data?.msg || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudent(studentId);
    setShowCompose(false);
    fetchMessages(studentId);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.nickname || student.name : `Student ${studentId}`;
  };

  const filteredStudents = students.filter(s => 
    s.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && messages.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 200px)' }}>
      {/* Student List */}
      <div style={{
        width: '300px',
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        padding: '16px',
        overflowY: 'auto',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>Students</h4>
          <button
            onClick={() => setSelectedStudent(null)}
            style={{
              padding: '4px 12px',
              background: selectedStudent === null ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '20px',
              color: selectedStudent === null ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            All
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '30px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {filteredStudents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
            {searchTerm ? 'No students found' : 'No students available'}
          </p>
        ) : (
          filteredStudents.map(student => (
            <div
              key={student.id}
              onClick={() => handleSelectStudent(student.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                cursor: 'pointer',
                background: selectedStudent === student.id ? 'var(--accent-soft)' : 'transparent',
                border: selectedStudent === student.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (selectedStudent !== student.id) {
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedStudent !== student.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>
                    {student.nickname || student.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{student.email}</div>
                </div>
                {student.unread_messages > 0 && (
                  <span style={{ 
                    background: '#3b82f6', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: '20px', 
                    height: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {student.unread_messages}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        background: 'var(--card-bg-glass)',
        backdropFilter: 'var(--glass-blur)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <h4 style={{ margin: 0 }}>
              {selectedStudent ? `Messages with ${getStudentName(selectedStudent)}` : 'All Messages'}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                if (selectedStudent) {
                  setShowCompose(!showCompose);
                } else {
                  showErrorToast("Please select a student first");
                }
              }}
              style={{
                padding: '8px 16px',
                background: showCompose ? 'var(--bg-secondary)' : 'var(--accent-gradient)',
                border: showCompose ? '1px solid var(--border-light)' : 'none',
                borderRadius: '30px',
                color: showCompose ? 'var(--text-secondary)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              {showCompose ? '✕ Cancel' : '✏️ Compose'}
            </button>
            <button
              onClick={() => fetchMessages(selectedStudent)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '30px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px'
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Compose Box */}
        {showCompose && selectedStudent && (
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-secondary)',
            flexShrink: 0
          }}>
            <form onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Subject (optional)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-light)',
                  marginBottom: '10px',
                  background: 'var(--card-bg-glass)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Write your message to ${getStudentName(selectedStudent)}...`}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    background: 'var(--card-bg-glass)',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '80px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    padding: '10px 24px',
                    background: 'var(--accent-gradient)',
                    border: 'none',
                    borderRadius: '30px',
                    color: 'white',
                    cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                    opacity: newMessage.trim() && !sending ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  <Send size={16} /> {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Message List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              <Mail size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: 500 }}>No messages yet</p>
              {selectedStudent && (
                <p style={{ fontSize: '13px', marginTop: '8px' }}>
                  Send a message to {getStudentName(selectedStudent)} to start the conversation
                </p>
              )}
              {!selectedStudent && (
                <p style={{ fontSize: '13px', marginTop: '8px' }}>
                  Select a student from the list to view or send messages
                </p>
              )}
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: msg.is_from_counsellor ? 'var(--accent-soft)' : 'var(--bg-secondary)',
                  border: msg.is_from_counsellor ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                  alignSelf: msg.is_from_counsellor ? 'flex-end' : 'flex-start',
                  maxWidth: '80%'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ fontSize: '13px', color: msg.is_from_counsellor ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                      {msg.is_from_counsellor ? 'You' : getStudentName(msg.student_id)}
                    </strong>
                    {msg.is_from_counsellor && (
                      <span style={{ fontSize: '10px', color: '#22c55e' }}>✓ Sent</span>
                    )}
                    {!msg.is_from_counsellor && msg.is_read && (
                      <CheckCircle size={14} color="#22c55e" />
                    )}
                    {!msg.is_from_counsellor && !msg.is_read && (
                      <Clock size={14} color="#f59e0b" />
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {formatDate(msg.created_at)}
                  </span>
                </div>
                {msg.subject && (
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    📌 {msg.subject}
                  </div>
                )}
                <div style={{ fontSize: '14px', marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.message}
                </div>
              </motion.div>
            ))
          )}
          <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
        </div>
      </div>
    </div>
  );
}

export default CounsellorMessages;