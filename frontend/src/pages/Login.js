// pages/Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your details gently 💙");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user_id);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.msg || "We couldn't log you in 🌙");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Decoration */}
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
          <p style={styles.subtitle}>A calm space for your mind</p>

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Entering..." : "Enter Lumora"}
            </button>
          </form>

          <p style={styles.footer}>
            Don't have an account?{" "}
            <span onClick={() => navigate("/register")} style={styles.link}>
              Create one
            </span>
          </p>
        </div>
      </div>

      {/* Floating Emojis */}
      <FloatingEmojis />
    </div>
  );
}

function FloatingEmojis() {
  const emojis = ["😊", "😌", "💙", "✨", "🌙", "🫶", "🌸", "🌟"];

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
    padding: "20px",
  },

  card: {
    maxWidth: "440px",
    margin: "0 auto",
    padding: "48px 40px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
    textAlign: "center",
    transition: "transform 0.3s ease",
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
  },

  logoIcon: {
    fontSize: "36px",
  },

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
    marginBottom: "32px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  inputGroup: {
    textAlign: "left",
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
    ":focus": {
      borderColor: "#667eea",
      boxShadow: "0 0 0 3px rgba(102,126,234,0.1)",
    },
    ":disabled": {
      backgroundColor: "#f9fafb",
      cursor: "not-allowed",
    },
  },

  button: {
    marginTop: "8px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 20px rgba(102,126,234,0.4)",
    },
    ":active": {
      transform: "translateY(0)",
    },
    ":disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
      transform: "none",
    },
  },

  error: {
    color: "#ef4444",
    fontSize: "13px",
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    borderRadius: "10px",
    marginTop: "-8px",
  },

  footer: {
    marginTop: "28px",
    fontSize: "13px",
    color: "#6b7280",
  },

  link: {
    color: "#667eea",
    cursor: "pointer",
    fontWeight: "600",
    transition: "color 0.2s",
    ":hover": {
      color: "#764ba2",
      textDecoration: "underline",
    },
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

// Add keyframes for floating animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes floatUp {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) rotate(360deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(styleSheet);

export default Login;