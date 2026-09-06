// frontend/src/pages/components/NotificationBell.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, CheckCircle, CheckCheck, X } from "lucide-react";
import api from "../../utils/api";
import { showSuccessToast, showErrorToast } from "./ToastNotification";

function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const res = await api.get(`/notifications/unread/${userId}`);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Fetch unread notifications error:", err);
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get(`/notifications/count/${userId}`);
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error("Fetch unread count error:", err);
    }
  }, [userId]);

    useEffect(() => {
    if (userId) {
      fetchUnreadNotifications();
      fetchUnreadCount();
    }
    
    const interval = setInterval(() => {
      if (userId) {
        fetchUnreadNotifications();
        fetchUnreadCount();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [userId, fetchUnreadNotifications, fetchUnreadCount]);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await api.put(`/notifications/${id}/read`);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      showSuccessToast("Notification marked as read");
    } catch (err) {
      console.error("Mark read error:", err);
      showErrorToast("Failed to mark as read");
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    if (notifications.length === 0) return;
    
    try {
      setLoading(true);
      await api.put(`/notifications/mark-all-read/${userId}`);
      
      setNotifications([]);
      setUnreadCount(0);
      
      showSuccessToast("All notifications marked as read");
    } catch (err) {
      console.error("Mark all read error:", err);
      showErrorToast("Failed to mark all as read");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification, e) => {
    if (e.target.closest('.mark-read-btn')) return;
    
    if (notification.type === 'university') {
      window.location.href = '/student-support';
    } else {
      showSuccessToast(notification.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'ban': return '🚫';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'report_reviewed': return '📋';
      case 'university': return '🏛️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'ban': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'success': return '#22c55e';
      case 'info': return '#3b82f6';
      case 'report_reviewed': return '#8b5cf6';
      case 'university': return '#6366f1';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{ 
          position: 'relative', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          padding: '6px',
          borderRadius: '50%',
          transition: 'background 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          color: 'var(--text-primary)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            background: '#ef4444',
            color: 'white',
            fontSize: '9px',
            fontWeight: 'bold',
            borderRadius: '50%',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid var(--bg-primary)',
            lineHeight: '1'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '360px',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--card-bg-glass)',
          backdropFilter: 'var(--glass-blur-lg)',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: 'var(--card-bg-glass)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '20px',
                  padding: '1px 8px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  style={{
                    padding: '4px 10px',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '16px',
                    fontSize: '10px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    color: 'var(--accent-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{
            overflowY: 'auto',
            flex: 1,
            padding: '4px 0',
            maxHeight: '340px'
          }}>
            {notifications.length === 0 ? (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                color: 'var(--text-muted)'
              }}>
                <Bell size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>No new notifications</p>
                <p style={{ margin: '2px 0 0', fontSize: '11px' }}>You're all caught up! 🎉</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={(e) => handleNotificationClick(notif, e)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon */}
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: `${getNotificationColor(notif.type)}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  
                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                      marginBottom: '1px'
                    }}>
                      {notif.title}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-secondary)',
                      lineHeight: '1.3',
                      wordWrap: 'break-word'
                    }}>
                      {notif.message}
                    </div>
                    <div style={{ 
                      fontSize: '9px', 
                      color: 'var(--text-muted)',
                      marginTop: '2px'
                    }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Mark as Read button */}
                  <button
                    className="mark-read-btn"
                    onClick={(e) => markAsRead(notif.id, e)}
                    disabled={loading}
                    style={{
                      padding: '2px 8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '12px',
                      fontSize: '9px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      flexShrink: 0,
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.15s',
                      marginTop: '2px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--accent-soft)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.color = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <CheckCircle size={10} />
                    Read
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;