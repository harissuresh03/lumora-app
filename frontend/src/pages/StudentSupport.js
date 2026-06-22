// frontend/src/pages/StudentSupport.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import Layout from "./components/Layout";
import ExportButton from "./components/ExportButton";
import { showSuccessToast, showErrorToast, showInfoToast } from "./components/ToastNotification";
import { 
  Phone, 
  Mail, 
  Globe, 
  Heart, 
  LogOut, 
  ArrowLeft, 
  User, 
  MessageCircle, 
  Shield, 
  Building, 
  ExternalLink, 
  Clock,
  Inbox,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Calendar,
  BookOpen,
  MessageSquare,
  Plus,
  X,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

function StudentSupport() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [supportData, setSupportData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Message state
  const [messages, setMessages] = useState([]);
  const [counsellor, setCounsellor] = useState(null);
  const [messageLoading, setMessageLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState("resources");
  
  // Appointment state
  const [appointments, setAppointments] = useState([]);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    counsellor_id: "",
    session_date: "",
    duration: 60,
    notes: ""
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        if (res.data.nickname) setUserNickname(res.data.nickname);
        else setUserNickname(res.data.name.split(" ")[0]);
      } catch (err) { console.log("Profile fetch error:", err); }
    };
    
    const fetchSupportResources = async () => {
      try {
        const res = await api.get(`/support/${user_id}`);
        setSupportData(res.data);
      } catch (err) { console.error("Support resources error:", err); }
      finally { setLoading(false); }
    };

    const fetchMessages = async () => {
      try {
        setMessageLoading(true);
        const res = await api.get(`/student-message/messages/${user_id}`);
        setMessages(res.data.messages || []);
        setCounsellor(res.data.counsellor || null);
        
        // Auto-fill counsellor ID for appointment form
        if (res.data.counsellor) {
          setAppointmentForm(prev => ({
            ...prev,
            counsellor_id: res.data.counsellor.id
          }));
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      } finally {
        setMessageLoading(false);
      }
    };

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get(`/student-message/messages/unread-count/${user_id}`);
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error("Fetch unread count error:", err);
      }
    };

    const fetchAppointments = async () => {
      try {
        setAppointmentLoading(true);
        const res = await api.get(`/counsellor/appointments/student/${user_id}`);
        setAppointments(res.data || []);
      } catch (err) {
        console.error("Fetch appointments error:", err);
      } finally {
        setAppointmentLoading(false);
      }
    };

    fetchUserProfile();
    fetchSupportResources();
    fetchMessages();
    fetchUnreadCount();
    fetchAppointments();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMessages();
      fetchUnreadCount();
      fetchAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, [user_id]);

  const logout = () => {
    localStorage.clear();
    navigate("/");
    showInfoToast("Logged out successfully. Take care! 💙");
  };

  const openExternalLink = (url) => { 
    if (url) window.open(url, "_blank", "noopener noreferrer"); 
  };

  const handleCall = (number) => {
    const phoneNumber = number.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${phoneNumber}`;
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

  const formatDateTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleMessageExpand = (id) => {
    setExpandedMessage(expandedMessage === id ? null : id);
  };

  // ============================================
  // APPOINTMENT FUNCTIONS
  // ============================================

  const handleScheduleAppointment = async (e) => {
    e.preventDefault();
    
    if (!appointmentForm.session_date) {
      showErrorToast("Please select a date and time");
      return;
    }

    if (!appointmentForm.counsellor_id) {
      showErrorToast("No counsellor available for your university");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/counsellor/appointments/student", {
        student_id: parseInt(user_id),
        counsellor_id: parseInt(appointmentForm.counsellor_id),
        session_date: appointmentForm.session_date,
        duration: appointmentForm.duration || 60,
        notes: appointmentForm.notes || null
      });
      
      showSuccessToast("Appointment request sent! Waiting for counsellor confirmation.");
      setShowAppointmentModal(false);
      setAppointmentForm({
        counsellor_id: appointmentForm.counsellor_id,
        session_date: "",
        duration: 60,
        notes: ""
      });
      
      // Refresh appointments
      const refreshRes = await api.get(`/counsellor/appointments/student/${user_id}`);
      setAppointments(refreshRes.data || []);
    } catch (err) {
      console.error("Schedule appointment error:", err);
      showErrorToast(err.response?.data?.msg || "Failed to schedule appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      completed: '#22c55e',
      cancelled: '#ef4444'
    };
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      completed: '✔️',
      cancelled: '❌'
    };
    return (
      <span style={{ 
        padding: '4px 12px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        background: colors[status] || '#9ca3af', 
        color: 'white',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {icons[status]} {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading resources...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>

      {/* Page Header */}
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={() => navigate("/dashboard")} className="back-arrow-btn">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title">Student Support</h1>
          <p className="page-subtitle">
            {supportData?.hasUniversity && supportData.universityName 
              ? `Resources for ${supportData.universityName} students` 
              : "Counselling and support services at your university"}
          </p>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="support-tab-container" style={{ 
        marginBottom: '24px',
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid var(--border-light)',
        paddingBottom: '0',
        flexWrap: 'wrap'
      }}>
        <button 
          className={`support-tab ${activeTab === "resources" ? "support-tab-active" : ""}`} 
          onClick={() => setActiveTab("resources")}
          style={{
            padding: '12px 24px',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: activeTab === "resources" ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === "resources" ? 'white' : 'var(--text-secondary)',
            fontWeight: activeTab === "resources" ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={16} /> Resources
        </button>
        <button 
          className={`support-tab ${activeTab === "messages" ? "support-tab-active" : ""}`} 
          onClick={() => setActiveTab("messages")}
          style={{
            padding: '12px 24px',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: activeTab === "messages" ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === "messages" ? 'white' : 'var(--text-secondary)',
            fontWeight: activeTab === "messages" ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
          }}
        >
          <MessageSquare size={16} /> Messages
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#ef4444',
              color: 'white',
              fontSize: '10px',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button 
          className={`support-tab ${activeTab === "appointments" ? "support-tab-active" : ""}`} 
          onClick={() => setActiveTab("appointments")}
          style={{
            padding: '12px 24px',
            borderRadius: '12px 12px 0 0',
            border: 'none',
            background: activeTab === "appointments" ? 'var(--accent-gradient)' : 'transparent',
            color: activeTab === "appointments" ? 'white' : 'var(--text-secondary)',
            fontWeight: activeTab === "appointments" ? 600 : 500,
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={16} /> Appointments
        </button>
      </div>

      {/* ============================================ */}
      {/* RESOURCES TAB */}
      {/* ============================================ */}
      {activeTab === "resources" && (
        <>
          {/* University Banner */}
          {supportData?.hasUniversity && supportData.universityName && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'var(--accent-gradient)',
                borderRadius: '20px',
                padding: '24px 28px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 150,
                height: 150,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }} />
              <Building size={40} />
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: 'white' }}>
                  {supportData.universityName}
                </h3>
                <p style={{ margin: '8px 0 0', opacity: 0.9, color: 'white' }}>
                  {supportData.hasCustomResources 
                    ? "Your university has dedicated mental health support services below." 
                    : "We're working to add more university-specific resources."}
                </p>
              </div>
            </motion.div>
          )}

          {/* University Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {supportData?.resources?.university && Object.values(supportData.resources.university).some(v => v) ? (
              <div>
                <h3 style={{ 
                  fontSize: '18px', 
                  marginBottom: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  <Heart size={22} color="var(--accent-primary)" />
                  Counselling Services
                </h3>
                
                {supportData.resources.university.counselling_contact && (
                  <motion.div 
                    whileHover={{ y: -2 }}
                    style={{
                      background: 'var(--card-bg-glass)',
                      backdropFilter: 'var(--glass-blur)',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '16px',
                      display: 'flex',
                      gap: '20px',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <Phone size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>Contact Number</h4>
                      <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-primary)', margin: '0 0 12px' }}>
                        {supportData.resources.university.counselling_contact}
                      </p>
                      <button 
                        onClick={() => handleCall(supportData.resources.university.counselling_contact)}
                        style={{
                          padding: '10px 24px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '40px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Phone size={16} /> Call Now
                      </button>
                    </div>
                  </motion.div>
                )}

                {supportData.resources.university.counselling_email && (
                  <motion.div 
                    whileHover={{ y: -2 }}
                    style={{
                      background: 'var(--card-bg-glass)',
                      backdropFilter: 'var(--glass-blur)',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '16px',
                      display: 'flex',
                      gap: '20px',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <Mail size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>Email Support</h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                        {supportData.resources.university.counselling_email}
                      </p>
                      <button 
                        onClick={() => window.location.href = `mailto:${supportData.resources.university.counselling_email.split(' ')[0]}`}
                        style={{
                          padding: '10px 24px',
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '40px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Mail size={16} /> Send Email
                      </button>
                    </div>
                  </motion.div>
                )}

                {supportData.resources.university.counselling_website && (
                  <motion.div 
                    whileHover={{ y: -2 }}
                    style={{
                      background: 'var(--card-bg-glass)',
                      backdropFilter: 'var(--glass-blur)',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '16px',
                      display: 'flex',
                      gap: '20px',
                      border: '1px solid var(--border-glass)'
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}>
                      <Globe size={28} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>Website</h4>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                        {supportData.resources.university.counselling_website}
                      </p>
                      <button 
                        onClick={() => openExternalLink(supportData.resources.university.counselling_website)}
                        style={{
                          padding: '10px 24px',
                          background: 'var(--accent-gradient)',
                          border: 'none',
                          borderRadius: '40px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <ExternalLink size={16} /> Visit Website
                      </button>
                    </div>
                  </motion.div>
                )}

                {supportData.resources.university.support_notes && (
                  <div style={{
                    background: 'var(--accent-soft)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    gap: '16px',
                    border: '1px solid var(--border-glass)',
                    marginTop: '16px'
                  }}>
                    <MessageCircle size={24} color="var(--accent-primary)" />
                    <div>
                      <h4 style={{ margin: '0 0 8px' }}>Additional Information</h4>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                        {supportData.resources.university.support_notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 40px',
                background: 'var(--card-bg-glass)',
                backdropFilter: 'var(--glass-blur)',
                borderRadius: '24px',
                border: '1px solid var(--border-glass)'
              }}>
                <Shield size={64} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
                <h3>No university resources found</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {supportData?.hasUniversity 
                    ? "We don't have specific resources for your university in our database yet."
                    : "Please update your profile with your university to see resources."}
                </p>
                <button 
                  onClick={() => navigate("/profile/edit")}
                  className="primary-btn"
                  style={{ width: 'auto', padding: '12px 32px' }}
                >
                  Update Profile
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* ============================================ */}
      {/* MESSAGES TAB */}
      {/* ============================================ */}
      {activeTab === "messages" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Counsellor Info */}
          {counsellor ? (
            <div style={{
              background: 'var(--card-bg-glass)',
              backdropFilter: 'var(--glass-blur)',
              borderRadius: '16px',
              padding: '20px 24px',
              border: '1px solid var(--border-glass)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--accent-gradient)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                fontWeight: 600
              }}>
                {counsellor.nickname?.charAt(0) || counsellor.name?.charAt(0) || 'C'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '16px' }}>
                  Your Counsellor: {counsellor.nickname || counsellor.name}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {unreadCount > 0 ? `📬 ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
                </p>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: 'var(--card-bg-glass)',
              borderRadius: '16px',
              border: '1px solid var(--border-glass)',
              marginBottom: '24px'
            }}>
              <Shield size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                No counsellor assigned to your university yet.
              </p>
            </div>
          )}

          {/* Messages List */}
          <h3 style={{ 
            fontSize: '16px', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <Inbox size={18} /> Messages {messages.length > 0 && `(${messages.length})`}
          </h3>

          {messageLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 40px',
              background: 'var(--card-bg-glass)',
              borderRadius: '16px',
              border: '1px solid var(--border-glass)'
            }}>
              <MessageCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h4>No messages yet</h4>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your counsellor will send you messages here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map((msg) => (
                <motion.div                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: msg.is_read ? 'var(--card-bg-glass)' : 'var(--accent-soft)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    border: msg.is_read ? '1px solid var(--border-glass)' : '1px solid var(--accent-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => toggleMessageExpand(msg.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'var(--accent-gradient)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600
                      }}>
                        {counsellor?.nickname?.charAt(0) || counsellor?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>
                          {counsellor?.nickname || counsellor?.name || 'Counsellor'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatDate(msg.created_at)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {msg.is_read ? (
                        <CheckCircle size={14} color="#22c55e" />
                      ) : (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#ef4444',
                          color: 'white',
                          fontSize: '9px',
                          fontWeight: 'bold'
                        }}>
                          NEW
                        </span>
                      )}
                      {expandedMessage === msg.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    {msg.subject && (
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}>
                        📌 {msg.subject}
                      </div>
                    )}
                    <p style={{
                      margin: 0,
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: expandedMessage === msg.id ? 'none' : '60px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      {msg.message}
                      {expandedMessage !== msg.id && msg.message.length > 100 && (
                        <span style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          right: 0,
                          background: 'linear-gradient(to right, transparent, var(--card-bg-glass))',
                          paddingLeft: '20px'
                        }}>
                          ...
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

{/* ============================================ */}
{/* APPOINTMENTS TAB */}
{/* ============================================ */}
{activeTab === "appointments" && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    {/* Counsellor Info / Schedule Button */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        {counsellor ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--accent-gradient)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600
            }}>
              {counsellor.nickname?.charAt(0) || counsellor.name?.charAt(0) || 'C'}
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px' }}>
                Counsellor: {counsellor.nickname || counsellor.name}
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {appointments.filter(a => a.status === 'pending').length} pending appointment{appointments.filter(a => a.status === 'pending').length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '12px 20px',
            background: 'rgba(245, 158, 11, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px', color: '#f59e0b' }} />
            <span style={{ fontSize: '13px', color: '#f59e0b' }}>
              No counsellor assigned to your university yet.
            </span>
          </div>
        )}
      </div>
      
      {/* ✅ Export + Request Appointment buttons together */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {appointments.length > 0 && (
          <ExportButton 
            type="appointments" 
            userId={parseInt(user_id)} 
            label="Export CSV"
            icon={<FileSpreadsheet size={16} />}
            variant="primary"
          />
        )}
        
        <button
          onClick={() => setShowAppointmentModal(true)}
          disabled={!counsellor}
          style={{
            padding: '10px 24px',
            background: counsellor ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
            border: 'none',
            borderRadius: '30px',
            color: counsellor ? 'white' : 'var(--text-muted)',
            cursor: counsellor ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            opacity: counsellor ? 1 : 0.6
          }}
        >
          <Plus size={16} /> Request Appointment
        </button>
      </div>
    </div>

    {/* Appointments List */}
    {appointmentLoading ? (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="spinner" style={{ width: '30px', height: '30px' }}></div>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Loading appointments...</p>
      </div>
    ) : appointments.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '60px 40px',
        background: 'var(--card-bg-glass)',
        borderRadius: '16px',
        border: '1px solid var(--border-glass)'
      }}>
        <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
        <h4>No appointments yet</h4>
        <p style={{ color: 'var(--text-secondary)' }}>
          Request an appointment with your counsellor using the button above.
        </p>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {appointments.map((appt) => (
          <motion.div
            key={appt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--card-bg-glass)',
              backdropFilter: 'var(--glass-blur)',
              borderRadius: '14px',
              padding: '16px 20px',
              border: appt.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.3)' : 
                      appt.status === 'confirmed' ? '1px solid rgba(59, 130, 246, 0.3)' :
                      appt.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.3)' :
                      '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '15px' }}>
                    {appt.counsellor_nickname || appt.counsellor_name || 'Counsellor'}
                  </strong>
                  {getStatusBadge(appt.status)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  {formatDateTime(appt.session_date)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <Clock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Duration: {appt.duration || 60} minutes
                </div>
                {appt.notes && (
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    📝 {appt.notes}
                  </div>
                )}
                {appt.status === 'pending' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    fontSize: '12px',
                    color: '#f59e0b'
                  }}>
                    ⏳ Waiting for counsellor confirmation
                  </div>
                )}
                {appt.status === 'confirmed' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '12px',
                    color: '#3b82f6'
                  }}>
                    ✅ Appointment confirmed! Check your calendar.
                  </div>
                )}
                {appt.status === 'completed' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    fontSize: '12px',
                    color: '#22c55e'
                  }}>
                    ✔️ Appointment completed
                  </div>
                )}
                {appt.status === 'cancelled' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '12px',
                    color: '#ef4444'
                  }}>
                    ❌ Appointment cancelled
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
)}

      {/* ============================================ */}
      {/* APPOINTMENT MODAL */}
      {/* ============================================ */}
      <AnimatePresence>
        {showAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowAppointmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '500px' }}
            >
              <div className="modal-header">
                <h3>Request Appointment</h3>
                <button className="modal-close" onClick={() => setShowAppointmentModal(false)}>✕</button>
              </div>
              <div className="modal-content">
                {counsellor && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--accent-soft)',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <User size={16} color="var(--accent-primary)" />
                    <span style={{ fontSize: '14px' }}>
                      Counsellor: <strong>{counsellor.nickname || counsellor.name}</strong>
                    </span>
                  </div>
                )}
                <form onSubmit={handleScheduleAppointment}>
                  <div className="input-group">
                    <label className="input-label">Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={appointmentForm.session_date}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, session_date: e.target.value })}
                      className="input-field"
                      required
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Duration (minutes)</label>
                    <select
                      value={appointmentForm.duration}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, duration: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                      <option value="120">120 minutes</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label">Notes (Optional)</label>
                    <textarea
                      value={appointmentForm.notes}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      className="peer-textarea"
                      rows="3"
                      placeholder="Any specific topics you'd like to discuss..."
                    />
                  </div>
                  <div style={{
                    padding: '12px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    fontSize: '12px',
                    color: '#f59e0b',
                    marginBottom: '16px'
                  }}>
                    ⏳ Your request will be sent to the counsellor for approval.
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowAppointmentModal(false)} className="peer-btn-secondary">Cancel</button>
                    <button type="submit" disabled={submitting} className="peer-btn-primary">
                      {submitting ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
}

export default StudentSupport;