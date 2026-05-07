// pages/EditProfile.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api"; // ✅ Import api

function EditProfile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* =========================
     GET PROFILE
  ========================= */
  useEffect(() => {
    api
      .get(`/profile/${user_id}`) // ✅ Use api
      .then((res) => {
        setForm((prev) => ({
          ...prev,
          name: res.data.name || "",
          dob: res.data.dob || "",
          gender: res.data.gender || "",
          email: res.data.email || "",
        }));
      })
      .catch((err) => {
        console.log("GET PROFILE ERROR:", err);
        if (err.response?.status === 401) {
          navigate("/");
        }
      });
  }, [user_id, navigate]);

  /* =========================
     HANDLE INPUT
  ========================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* =========================
     UPDATE PROFILE
  ========================= */
  const updateProfile = async (e) => {
    e.preventDefault();

    if (form.password && form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      dob: form.dob,
      gender: form.gender,
      password: form.password ? form.password : "",
    };

    console.log("📤 SENDING:", payload);

    try {
      const res = await api.put( // ✅ Use api
        `/profile/update/${user_id}`,
        payload
      );

      console.log("✅ RESPONSE:", res.data);

      alert("Profile updated 🌿");
      navigate("/profile");
    } catch (err) {
      console.log("❌ ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.msg || "Update failed ❌");
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button style={styles.backBtn} onClick={() => navigate("/profile")}>
          ← Back
        </button>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h2>Edit Profile ✨</h2>
        <p style={styles.subText}>Update your personal information</p>

        <form onSubmit={updateProfile} style={styles.form}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} style={styles.input} />

          <label>Date of Birth</label>
          <input type="date" name="dob" value={form.dob} onChange={handleChange} style={styles.input} />

          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} style={styles.input}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>

          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} style={styles.input} />

          <hr />

          <label>Password (optional)</label>
          <input type="password" name="password" onChange={handleChange} style={styles.input} />

          <label>Confirm Password</label>
          <input type="password" name="confirmPassword" onChange={handleChange} style={styles.input} />

          <button style={styles.button}>Save Changes</button>
        </form>
      </div>
    </div>
  );
}

/* 🌿 STYLES */
const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    background: "linear-gradient(180deg, #dbeafe 0%, #f8fbff 40%, #ffffff 100%)",
  },
  topBar: { marginBottom: "20px" },
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
  subText: { fontSize: "13px", color: "#6b7280" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
  },
};

export default EditProfile;