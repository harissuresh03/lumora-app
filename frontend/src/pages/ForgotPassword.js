// frontend/src/pages/ForgotPassword.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";
import { ArrowLeft } from "lucide-react";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/verification/forgot-password", { email });
      setSuccess(res.data.msg);
      showSuccessToast("Check your email for the reset code");

      if (res.data.userId) {
        setUserId(res.data.userId);
        // Redirect to verify reset code page after 2 seconds
        setTimeout(() => {
          navigate(`/verify-reset-code?email=${encodeURIComponent(email)}&userId=${res.data.userId}`);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send reset code");
      showErrorToast(err.response?.data?.msg || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDecoration}>
        <div style={styles.blob1}></div>
        <div style={styles.blob2}></div>
        <div style={styles.blob3}></div>
      </div>

      <div style={styles.contentWrapper}>
        <div style={styles.card}>
          {/* ✅ Back Button */}
          <button
            onClick={() => navigate("/")}
            style={styles.backBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--accent-soft)";
              e.currentTarget.style.transform = "translateX(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <ArrowLeft size={18} style={{ color: "var(--accent-primary)" }} />
            <span style={{ marginLeft: "6px", fontSize: "13px", color: "var(--accent-primary)" }}>
              Back to Login
            </span>
          </button>

          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>✨</div>
            <h1 style={styles.logo}>Lumora</h1>
          </div>
          <p style={styles.subtitle}>Reset your password</p>

          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>

          <p style={styles.footer}>
            Remember your password?{" "}
            <span onClick={() => navigate("/")} style={styles.link}>
              Sign in
            </span>
          </p>
        </div>
      </div>

      <FloatingEmojis />
    </div>
  );
}

function FloatingEmojis() {
  const emojis = ["😊", "😌", "💙", "✨", "🌙", "🫶", "🌸", "🌟", "🌿"];

  return (
    <div style={styles.emojiLayer}>
      {Array.from({ length: 20 }).map((_, i) => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        return (
          <span
            key={i}
            style={{
              ...styles.emoji,
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${20 + Math.random() * 24}px`,
              opacity: 0.4 + Math.random() * 0.3,
            }}
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  bgDecoration: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute",
    top: "-20%",
    right: "-10%",
    width: "600px",
    height: "600px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
    filter: "blur(80px)",
  },
  blob2: {
    position: "absolute",
    bottom: "-20%",
    left: "-10%",
    width: "500px",
    height: "500px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.1), rgba(255,255,255,0.03))",
    filter: "blur(70px)",
  },
  blob3: {
    position: "absolute",
    top: "40%",
    left: "30%",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
    filter: "blur(60px)",
  },
  contentWrapper: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "440px",
  },
  card: {
    margin: "0 auto",
    padding: "48px 40px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
    textAlign: "center",
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: "20px",
    left: "24px",
    display: "flex",
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "8px",
    transition: "all 0.2s",
    color: "var(--accent-primary)",
    fontSize: "13px",
    fontWeight: "500",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
    marginTop: "8px",
  },
  logoIcon: { fontSize: "36px" },
  logo: {
    fontSize: "32px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "24px",
  },
  inputGroup: {
    textAlign: "left",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1.5px solid #e5e7eb",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    background: "white",
  },
  error: {
    color: "#ef4444",
    fontSize: "13px",
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  success: {
    color: "#22c55e",
    fontSize: "13px",
    padding: "8px 12px",
    backgroundColor: "#f0fdf4",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  footer: {
    marginTop: "24px",
    fontSize: "13px",
    color: "#6b7280",
  },
  link: {
    color: "#667eea",
    cursor: "pointer",
    fontWeight: "600",
  },
  emojiLayer: {
    position: "fixed",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    pointerEvents: "none",
    zIndex: 1,
    overflow: "hidden",
  },
  emoji: {
    position: "absolute",
    bottom: "-50px",
    animation: "floatUp linear infinite",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes floatUp {
    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
  }
`;
document.head.appendChild(styleSheet);

export default ForgotPassword;