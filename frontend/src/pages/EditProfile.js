// frontend/src/pages/EditProfile.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import {
  User,
  Mail,
  BookOpen,
  Heart,
  LogOut,
  ArrowLeft,
  Save,
  Building,
  Lock,
  Calendar,
  Users,
  GraduationCap,
  Shield
} from "lucide-react";

function EditProfile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem("user_id");
  const [userNickname, setUserNickname] = useState("");
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);

  const [form, setForm] = useState({
    name: "",
    nickname: "",
    dob: "",
    gender: "",
    email: "",
    university: "",
    university_id: "",
    student_id: "",
    faculty: "",           // ✅ New field
    department: "",        // ✅ New field
    counsellor_consent: 0, // ✅ New field - consent (0 or 1)
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtherUniversity, setShowOtherUniversity] = useState(false);

  // Fetch universities
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

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/profile/${user_id}`);
        
        const matchedUni = universities.find(u => 
          u.name === res.data.university || 
          (res.data.university && res.data.university.includes(u.name))
        );
        
        setForm((prev) => ({
          ...prev,
          name: res.data.name || "",
          nickname: res.data.nickname || "",
          dob: res.data.dob || "",
          gender: res.data.gender || "",
          email: res.data.email || "",
          university: res.data.university || "",
          university_id: matchedUni?.id || "",
          student_id: res.data.student_id || "",
          faculty: res.data.faculty || "",           // ✅ New field
          department: res.data.department || "",     // ✅ New field
          counsellor_consent: res.data.counsellor_consent || 0, // ✅ New field
          emergency_contact_name: res.data.emergency_contact_name || "",
          emergency_contact_phone: res.data.emergency_contact_phone || "",
          emergency_contact_relationship: res.data.emergency_contact_relationship || "",
        }));
        
        setUserNickname(res.data.nickname || res.data.name.split(" ")[0]);
        
        if (matchedUni?.short_name === "Other" || (res.data.university && !matchedUni)) {
          setShowOtherUniversity(true);
        }
      } catch (err) {
        console.log("GET PROFILE ERROR:", err);
        if (err.response?.status === 401) {
          navigate("/");
        }
      }
    };
    
    if (universities.length > 0) {
      fetchProfile();
    }
  }, [user_id, navigate, universities]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value 
    });
    setError("");
    
    if (name === "university_id") {
      const selectedUniversity = universities.find(u => u.id === parseInt(value));
      if (selectedUniversity?.short_name === "Other") {
        setShowOtherUniversity(true);
        setForm(prev => ({ ...prev, university: "" }));
      } else if (selectedUniversity) {
        setShowOtherUniversity(false);
        setForm(prev => ({ ...prev, university: selectedUniversity.name }));
      }
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const payload = {
      name: form.name,
      nickname: form.nickname,
      email: form.email,
      dob: form.dob,
      gender: form.gender,
      university_id: form.university_id || null,
      student_id: form.student_id,
      faculty: form.faculty || null,              // ✅ New field
      department: form.department || null,        // ✅ New field
      counsellor_consent: form.counsellor_consent, // ✅ New field
      emergency_contact_name: form.emergency_contact_name,
      emergency_contact_phone: form.emergency_contact_phone,
      emergency_contact_relationship: form.emergency_contact_relationship,
      password: form.password ? form.password : "",
    };

    setLoading(true);

    try {
      await api.put(`/profile/update/${user_id}`, payload);
      alert("Profile updated successfully");
      navigate("/profile");
    } catch (err) {
      console.log("❌ ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="app-container">
      <div className="bg-decoration">
        <div className="blob1"></div>
        <div className="blob2"></div>
        <div className="blob3"></div>
      </div>

      <div className="content-wrapper-no-sidebar">
        {/* Page Header */}
        <div className="page-header">
          <button onClick={() => navigate("/profile")} className="back-arrow-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title">Edit Profile</h1>
            <p className="page-subtitle">Update your personal information</p>
          </div>
        </div>

        {/* Edit Profile Card */}
        <div className="edit-profile-card">
          <form onSubmit={updateProfile} className="edit-profile-form">
            {/* Personal Information */}
            <div className="form-section-title">
              <User size={14} style={{ display: "inline", marginRight: "8px" }} />
              Personal Information
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} className="input-field" required />
              </div>

              <div className="input-group">
                <label className="input-label">Username (Do not use real name)</label>
                <input name="nickname" value={form.nickname} onChange={handleChange} className="input-field" placeholder="e.g., Emma" />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} className="input-field" />
              </div>

              <div className="input-group">
                <label className="input-label">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer to self-describe">Self-describe</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section-title">
              <BookOpen size={14} style={{ display: "inline", marginRight: "8px" }} />
              Academic Information
            </div>

            <div className="input-group">
              <label className="input-label">University</label>
              {loadingUniversities ? (
                <div className="loading-text">Loading universities...</div>
              ) : (
                <select
                  name="university_id"
                  value={form.university_id}
                  onChange={handleChange}
                  className="input-field"
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
              <div className="input-group">
                <label className="input-label">Please specify your university</label>
                <input
                  name="university"
                  value={form.university}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your university name"
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Student ID (optional)</label>
              <input
                name="student_id"
                value={form.student_id}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., B012310101"
              />
            </div>

            {/* ✅ NEW: Faculty and Department */}
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Faculty (optional)</label>
                <input
                  name="faculty"
                  value={form.faculty}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Faculty of Computer Science"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Department (optional)</label>
                <input
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Software Engineering"
                />
              </div>
            </div>

            {/* ✅ NEW: Privacy & Consent Section */}
            <div className="form-section-title">
              <Shield size={14} style={{ display: "inline", marginRight: "8px" }} />
              Privacy & Consent
              <p className="form-section-hint">Control how your data is shared</p>
            </div>

            <div style={{ 
              padding: "16px", 
              background: "rgba(102, 126, 234, 0.05)", 
              borderRadius: "12px", 
              border: "1px solid rgba(102, 126, 234, 0.2)",
              marginBottom: "16px"
            }}>
              <label style={{ 
                display: "flex", 
                alignItems: "flex-start", 
                gap: "12px", 
                cursor: "pointer" 
              }}>
                <input
                  type="checkbox"
                  name="counsellor_consent"
                  checked={form.counsellor_consent === 1}
                  onChange={handleChange}
                  style={{
                    marginTop: "3px",
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                />
                <div>
                  <span style={{ fontSize: "14px", color: "#374151", lineHeight: "1.5" }}>
                    I consent to share my mood, sleep, journal entries, and assessment data with my university counsellor for the purpose of receiving mental health support.
                  </span>
                  <span style={{ 
                    display: "block", 
                    fontSize: "12px", 
                    color: "#9ca3af", 
                    marginTop: "4px",
                    fontStyle: "italic" 
                  }}>
                    {form.counsellor_consent === 1 
                      ? "✅ You have given consent. Your counsellor can see your data." 
                      : "❌ You have not given consent. Your counsellor cannot see your data."}
                  </span>
                </div>
              </label>
            </div>

            {/* Emergency Contact */}
            <div className="form-section-title">
              <Heart size={14} style={{ display: "inline", marginRight: "8px" }} />
              Emergency Contact
              <p className="form-section-hint">Someone you trust who can support you</p>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Contact Name</label>
                <input
                  name="emergency_contact_name"
                  value={form.emergency_contact_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Ahmad Bin Abdullah"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  name="emergency_contact_phone"
                  value={form.emergency_contact_phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 012-3456789"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Relationship</label>
              <input
                name="emergency_contact_relationship"
                value={form.emergency_contact_relationship}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Parent, Sibling, Close Friend"
              />
            </div>

            {/* Account Information */}
            <div className="form-section-title">
              <Lock size={14} style={{ display: "inline", marginRight: "8px" }} />
              Account Information
            </div>

            <div className="input-group">
              <label className="input-label">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <hr className="form-divider" />

            <div className="form-row">
              <div className="input-group">
                <label className="input-label">New Password (optional)</label>
                <input
                  type="password"
                  name="password"
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="primary-btn" type="submit" disabled={loading}>
              <Save size={16} style={{ display: "inline", marginRight: "8px" }} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;