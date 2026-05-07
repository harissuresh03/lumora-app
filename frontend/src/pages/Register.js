// pages/Register.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const { name, dob, gender, email, password, confirmPassword } = form;

    if (!name || !dob || !gender || !email || !password) {
      setError("Please fill in all fields 🌙");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match ⚠️");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        dob: form.dob,
        gender: form.gender,
      });

      console.log("Registration success:", response.data);

      if (response.data.user_id) {
        localStorage.setItem("user_id", response.data.user_id);
      }

      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.msg || "Something went wrong 🌙");
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
          <button onClick={() => navigate("/")} style={styles.backBtn}>
            ← Back to Login
          </button>

          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>✨</div>
            <h1 style={styles.logo}>Lumora</h1>
          </div>
          <p style={styles.subtitle}>Begin your calm journey 🌿</p>

          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                name="name"
                placeholder="e.g., Haris Smith"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                style={styles.select}
                disabled={loading}
              >
                <option value="" disabled hidden>
                  Select your gender
                </option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer to self-describe">Self-describe</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password (min. 6 characters)"
                value={form.password}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={styles.footer}>
            Already have an account?{" "}
            <span onClick={() => navigate("/")} style={styles.link}>
              Sign in
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
  const emojis = ["😊", "😌", "💙", "✨", "🌙", "🫶", "🌸", "🌟", "🌿", "🕯️"];

  return (
    <div style={styles.emojiLayer}>
      {Array.from({ length: 25 }).map((_, i) => {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];

        return (
          <span
            key={i}
            style={{
              ...styles.emoji,
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${18 + Math.random() * 22}px`,
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
    maxWidth: "500px",
    margin: "0 auto",
    padding: "40px 40px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.98)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
    position: "relative",
  },

  backBtn: {
    position: "absolute",
    top: "20px",
    left: "24px",
    background: "none",
    border: "none",
    color: "#667eea",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "color 0.2s",
    ":hover": {
      color: "#764ba2",
    },
  },

  logoSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "12px",
    marginTop: "8px",
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
    textAlign: "center",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
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
    padding: "12px 14px",
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

  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1.5px solid #e5e7eb",
    fontSize: "14px",
    transition: "all 0.2s",
    outline: "none",
    fontFamily: "inherit",
    backgroundColor: "white",
    cursor: "pointer",
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
    marginTop: "12px",
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
    marginTop: "-4px",
  },

  footer: {
    marginTop: "24px",
    fontSize: "13px",
    color: "#6b7280",
    textAlign: "center",
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

export default Register;