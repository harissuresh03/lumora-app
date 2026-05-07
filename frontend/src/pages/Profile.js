// pages/Profile.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ Import api

function Profile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [user, setUser] = useState(null);

  useEffect(() => {
    api
      .get(`/profile/${user_id}`) // ✅ Use api
      .then((res) => setUser(res.data))
      .catch((err) => {
        console.log("Profile fetch error:", err);
        if (err.response?.status === 401) {
          navigate("/");
        }
      });
  }, [user_id, navigate]);

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.loadingText}>Loading profile 🌿</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </div>

      {/* Profile Card */}
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.avatar}>👤</div>
          <div>
            <h2 style={{ margin: 0 }}>Your Profile</h2>
            <p style={styles.subText}>Personal information & account details</p>
          </div>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.label}>Name</span>
            <span style={styles.value}>{user.name}</span>
          </div>

          <div style={styles.infoItem}>
            <span style={styles.label}>Date of Birth</span>
            <span style={styles.value}>
              {user.dob ? new Date(user.dob).toLocaleDateString() : "-"}
            </span>
          </div>

          <div style={styles.infoItem}>
            <span style={styles.label}>Gender</span>
            <span style={styles.value}>{user.gender || "-"}</span>
          </div>

          <div style={styles.infoItem}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{user.email}</span>
          </div>
        </div>

        <button
          style={styles.primaryBtn}
          onClick={() => navigate("/profile/edit")}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

/* 🌿 Styles */
const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    background:
      "linear-gradient(180deg, #dbeafe 0%, #f8fbff 40%, #ffffff 100%)",
  },

  topBar: {
    marginBottom: "20px",
  },

  backBtn: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "pointer",
  },

  card: {
    maxWidth: "520px",
    margin: "0 auto",
    background: "white",
    borderRadius: "18px",
    padding: "25px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
  },

  header: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "25px",
  },

  avatar: {
    fontSize: "32px",
    background: "#eff6ff",
    padding: "10px",
    borderRadius: "12px",
  },

  subText: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
  },

  infoGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginBottom: "20px",
  },

  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #eef2f7",
  },

  label: {
    fontSize: "13px",
    color: "#6b7280",
  },

  value: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#111827",
  },

  primaryBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontWeight: "500",
  },

  loadingText: {
    textAlign: "center",
    color: "#6b7280",
  },
};

export default Profile;