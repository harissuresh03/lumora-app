// frontend/src/pages/VerifyEmail.js
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");
  const userId = queryParams.get("userId");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email || !userId) {
      navigate("/");
    }
  }, [email, userId, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/verification/verify-email", {
        userId: parseInt(userId),
        otp: code,
      });

      setSuccess(res.data.msg);
      showSuccessToast("Email verified! You can now log in.");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to verify email");
      showErrorToast(err.response?.data?.msg || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    setResending(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/verification/send-verification", {
        userId: parseInt(userId),
      });

      setSuccess("A new verification code has been sent to your email.");
      showSuccessToast("New code sent!");
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to resend code");
      showErrorToast(err.response?.data?.msg || "Failed to resend code");
    } finally {
      setResending(false);
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
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>✨</div>
            <h1 style={styles.logo}>Lumora</h1>
          </div>
          <p style={styles.subtitle}>Verify your email address</p>

          <div style={styles.messageBox}>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>
              We sent a verification code to <strong>{email}</strong>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#94a3b8" }}>
              Please enter the 6-digit code below. It expires in 10 minutes.
            </p>
          </div>

          <div style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={styles.otpInput}
                autoFocus={index === 0}
                disabled={loading}
              />
            ))}
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <button
            onClick={handleVerify}
            disabled={loading || otp.join("").length !== 6}
            style={{
              ...styles.button,
              opacity: loading || otp.join("").length !== 6 ? 0.6 : 1,
            }}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <div style={styles.resendContainer}>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              style={styles.resendButton}
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                ? `Resend (${cooldown}s)`
                : "Resend Code"}
            </button>
          </div>

          <p style={styles.footer}>
            Already verified?{" "}
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

// Floating Emojis Component
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
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
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
  messageBox: {
    padding: "12px 16px",
    background: "#f1f5f9",
    borderRadius: "12px",
    marginBottom: "24px",
  },
  otpContainer: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "20px",
  },
  otpInput: {
    width: "44px",
    height: "52px",
    textAlign: "center",
    fontSize: "22px",
    fontWeight: "600",
    borderRadius: "12px",
    border: "1.5px solid #e5e7eb",
    outline: "none",
    transition: "all 0.2s",
    background: "white",
    fontFamily: "inherit",
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
  resendContainer: {
    marginTop: "16px",
  },
  resendButton: {
    background: "none",
    border: "none",
    color: "#6366f1",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
    textDecoration: "underline",
    opacity: (props) => (props.disabled ? 0.5 : 1),
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

export default VerifyEmail;