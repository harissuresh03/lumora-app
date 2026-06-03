// pages/Register.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

function Register() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    dob: "",
    gender: "",
    email: "",
    password: "",
    confirmPassword: "",
    university_id: "",
    university_other: "",
    student_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtherUniversity, setShowOtherUniversity] = useState(false);

  // Fetch universities on component mount
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await api.get("/universities");
        setUniversities(res.data);
      } catch (err) {
        console.error("Failed to fetch universities:", err);
      } finally {
        setLoadingUniversities(false);
      }
    };
    fetchUniversities();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (name === "university_id") {
      const selectedUniversity = universities.find(u => u.id === parseInt(value));
      if (selectedUniversity?.short_name === "Other") {
        setShowOtherUniversity(true);
      } else {
        setShowOtherUniversity(false);
        setForm(prev => ({ ...prev, university_other: "" }));
      }
    }
  };

  const handleRegister = async (e) => {
  e.preventDefault();
  setError("");

  const { name, nickname, dob, gender, email, password, confirmPassword, 
          university_id, university_other, student_id,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship } = form;

  if (!name || !dob || !gender || !email || !password) {
    setError("Please fill in all required fields 🌙");
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
      nickname: form.nickname,
      email: form.email,
      password: form.password,
      dob: form.dob,
      gender: form.gender,
      university_id: form.university_id || null,  // Only send the ID
      student_id: form.student_id,
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      emergency_contact_relationship: form.emergency_contact_relationship,
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
            {/* Personal Information Section */}
            <div style={styles.sectionTitle}>
              <span>👤 Personal Information</span>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name *</label>
                <input
                  name="name"
                  placeholder="e.g., Haris Khan"
                  value={form.name}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Nickname (optional)</label>
                <input
                  name="nickname"
                  placeholder="e.g., Haris, Harry"
                  value={form.nickname}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={loading}
                  required
                >
                  <option value="" disabled hidden>Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer to self-describe">Self-describe</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Academic Information Section */}
            <div style={styles.sectionTitle}>
              <span>🎓 Academic Information</span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>University</label>
              {loadingUniversities ? (
                <div style={styles.loadingText}>Loading universities...</div>
              ) : (
                <select
                  name="university_id"
                  value={form.university_id}
                  onChange={handleChange}
                  style={styles.select}
                  disabled={loading}
                >
                  <option value="">Select your university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name} ({uni.short_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {showOtherUniversity && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Please specify your university</label>
                <input
                  name="university_other"
                  placeholder="Enter your university name"
                  value={form.university_other}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Student ID (optional)</label>
              <input
                name="student_id"
                placeholder="e.g., B012310101"
                value={form.student_id}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Emergency Contact Section */}
            <div style={styles.sectionTitle}>
              <span>🆘 Emergency / Support Contact</span>
              <p style={styles.sectionHint}>Someone you trust who can support you</p>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Contact Name (optional)</label>
                <input
                  name="emergency_contact_name"
                  placeholder="e.g., Ahmad Bin Abdullah"
                  value={form.emergency_contact_name}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Phone Number (optional)</label>
                <input
                  name="emergency_contact_phone"
                  placeholder="e.g., 012-3456789"
                  value={form.emergency_contact_phone}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Relationship (optional)</label>
              <input
                name="emergency_contact_relationship"
                placeholder="e.g., Parent, Sibling, Close Friend"
                value={form.emergency_contact_relationship}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
              />
            </div>

            {/* Account Information Section */}
            <div style={styles.sectionTitle}>
              <span>🔐 Account Information</span>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={form.password}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>
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
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
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
    maxWidth: "850px",
  },

  card: {
    margin: "0 auto",
    padding: "40px",
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
    gap: "18px",
  },

  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginTop: "16px",
    marginBottom: "4px",
    paddingBottom: "8px",
    borderBottom: "2px solid #e5e7eb",
  },

  sectionHint: {
    fontSize: "11px",
    fontWeight: "normal",
    color: "#9ca3af",
    marginTop: "4px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
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
  },

  error: {
    color: "#ef4444",
    fontSize: "13px",
    padding: "8px 12px",
    backgroundColor: "#fef2f2",
    borderRadius: "10px",
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

  loadingText: {
    fontSize: "13px",
    color: "#6b7280",
    padding: "12px",
    textAlign: "center",
  },
};

// Add keyframes
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