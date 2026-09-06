// frontend/src/pages/components/CrisisModal.js
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, X, Shield, Clock, Heart } from "lucide-react";
import api from "../../utils/api";
import { showErrorToast } from "./ToastNotification";

function CrisisModal({ onClose }) {
  const [hotlines, setHotlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrisisResources();
  }, []);

  const fetchCrisisResources = async () => {
    try {
      const res = await api.get("/support/crisis-resources");
      setHotlines(res.data);
    } catch (err) {
      console.error("Fetch crisis resources error:", err);
      showErrorToast("Failed to load crisis resources");
      
      // Fallback: Try to get from main support endpoint
      try {
        const userId = localStorage.getItem("user_id");
        const fallbackRes = await api.get(`/support/${userId}`);
        if (fallbackRes.data?.resources?.general?.crisisResources) {
          setHotlines(fallbackRes.data.resources.general.crisisResources);
        }
      } catch (fallbackErr) {
        console.error("Fallback also failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number) => {
    const phoneNumber = number.replace(/[^0-9+]/g, '');
    window.location.href = `tel:${phoneNumber}`;
  };

  const emergencyServices = [
    { name: "Police", number: "999", icon: "🚓" },
    { name: "Ambulance", number: "999", icon: "🚑" },
    { name: "Fire", number: "999", icon: "🔥" }
  ];

  const getColorByIndex = (index) => {
    const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];
    return colors[index % colors.length];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={onClose}
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        zIndex: 2000,
        padding: "20px"
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "550px",
          maxHeight: "85vh",
          overflow: "auto",
          borderRadius: "28px",
          padding: "0",
          background: "var(--card-bg-glass)",
          backdropFilter: "var(--glass-blur-lg)"
        }}
      >
        {/* Header */}
        <div style={{
          padding: "24px 28px",
          borderBottom: "1px solid var(--border-light)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "var(--card-bg-glass)",
          backdropFilter: "var(--glass-blur)",
          zIndex: 10,
          borderTopLeftRadius: "28px",
          borderTopRightRadius: "28px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              background: "rgba(239, 68, 68, 0.15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Heart size={24} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Need Help Now?</h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                You're not alone. Help is available.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-light)",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-secondary)"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px" }}>
          {/* Crisis Message */}
          <div style={{
            padding: "16px",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            marginBottom: "24px"
          }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "#ef4444" }}>If you're in immediate danger or having thoughts of self-harm, please call emergency services (999) or go to your nearest hospital emergency room.</strong>
            </p>
          </div>

          {/* Hotlines */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <div className="spinner" style={{ width: "30px", height: "30px" }}></div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px" }}>Loading resources...</p>
            </div>
          ) : (
            <>
              <h4 style={{ fontSize: "16px", marginBottom: "16px", fontWeight: 600 }}>
                <Phone size={18} style={{ display: "inline", marginRight: "8px" }} />
                Crisis Hotlines
              </h4>

              {hotlines.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                  No crisis resources available.
                </p>
              ) : (
                hotlines.map((hotline, index) => {
                  const color = getColorByIndex(index);
                  return (
                    <motion.div
                      key={hotline.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 16px",
                        marginBottom: "10px",
                        background: "var(--bg-secondary)",
                        borderRadius: "12px",
                        border: "1px solid var(--border-light)",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent-soft)";
                        e.currentTarget.style.borderColor = color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-secondary)";
                        e.currentTarget.style.borderColor = "var(--border-light)";
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{hotline.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {hotline.description}
                          {hotline.hours && (
                            <span>
                              <span style={{ margin: "0 4px" }}>·</span>
                              <Clock size={12} style={{ display: "inline", marginRight: "2px" }} /> {hotline.hours}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCall(hotline.number)}
                        style={{
                          padding: "8px 16px",
                          background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                          border: "none",
                          borderRadius: "30px",
                          color: "white",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      >
                        <Phone size={14} /> Call
                      </button>
                    </motion.div>
                  );
                })
              )}
            </>
          )}

          {/* Emergency Services */}
          <div style={{ marginTop: "24px" }}>
            <h4 style={{ fontSize: "16px", marginBottom: "12px", fontWeight: 600 }}>
              <Shield size={18} style={{ display: "inline", marginRight: "8px" }} />
              Emergency Services
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {emergencyServices.map((service, index) => (
                <button
                  key={index}
                  onClick={() => handleCall(service.number)}
                  style={{
                    padding: "12px",
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    borderRadius: "12px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ fontSize: "24px" }}>{service.icon}</div>
                  <div style={{ fontSize: "12px", fontWeight: 600, marginTop: "4px" }}>{service.name}</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#ef4444" }}>{service.number}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-light)",
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-muted)"
          }}>
            <p style={{ margin: 0 }}>
              All hotlines are confidential and free to call.
            </p>
            <p style={{ margin: "4px 0 0" }}>
              You are not alone. 💙
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CrisisModal;