// frontend/src/pages/Register.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast } from "./components/ToastNotification";

// ─── PAGE LAYOUT ────────────────────────────────────────────────────
const pageStyles = {
  // Ensure the card is wide and centered
  shell: {
    width: "min(1200px, calc(100% - 48px))",
    margin: "0 auto",
  },
};

function Register() {
  const navigate = useNavigate();
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [registerAs, setRegisterAs] = useState("student");

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
    matric_number: "",
    faculty: "",
    department: "",
    counsellor_consent: false,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    qualification: "",
    experience: "",
    parent_email: ""
  });

  // Real-time validation state
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtherUniversity, setShowOtherUniversity] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

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
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });

    // Real-time validation
    if (name === "email") {
      validateEmail(value);
    }
    if (name === "password") {
      validatePassword(value);
    }
    if (name === "confirmPassword") {
      validateConfirmPassword(value, form.password);
    }

    // University logic
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

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: "" }));
      return;
    }
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address (e.g., name@domain.com)." }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const validatePassword = (password) => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: "" }));
      return;
    }
    if (password.length < 6) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 6 characters." }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }
    if (form.confirmPassword) {
      validateConfirmPassword(form.confirmPassword, password);
    }
  };

  const validateConfirmPassword = (confirm, password = form.password) => {
    if (!confirm) {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
      return;
    }
    if (confirm !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match." }));
    } else {
      setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
  };

  const checkEmailExists = async () => {
    if (!form.email || errors.email) return;
    try {
      const res = await api.post("/auth/check-email", { email: form.email });
      if (res.data.exists) {
        setErrors(prev => ({ ...prev, email: "This email is already registered. Please use a different email or login." }));
      } else {
        setErrors(prev => ({ ...prev, email: "" }));
      }
    } catch (err) {
      console.error("Email check error:", err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!form.name || !form.dob || !form.gender || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (registerAs === "student") {
        const response = await api.post("/auth/register", {
          name: form.name,
          nickname: form.nickname,
          email: form.email,
          password: form.password,
          dob: form.dob,
          gender: form.gender,
          university_id: form.university_id || null,
          matric_number: form.matric_number || null,
          faculty: form.faculty || null,
          department: form.department || null,
          counsellor_consent: form.counsellor_consent,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
          emergency_contact_relationship: form.emergency_contact_relationship,
          parent_email: form.parent_email
        });

        if (response.data.user_id) {
          navigate(`/verify-email?email=${encodeURIComponent(form.email)}&userId=${response.data.user_id}`);
          const msg = response.data.parent_invited 
            ? "Registration successful! Please check your email for the verification code. A parent invitation has also been sent." 
            : "Registration successful! Please check your email for the verification code.";
          showSuccessToast(msg);
        }
        setLoading(false);
        return;
      }

      if (registerAs === "counsellor") {
        const counsellorRes = await api.post("/counsellor-requests/apply", {
          name: form.name,
          nickname: form.nickname || "",
          email: form.email,
          password: form.password,
          dob: form.dob,
          gender: form.gender,
          university_id: form.university_id || null,
          qualification: form.qualification || "",
          experience: form.experience || ""
        });

        if (counsellorRes.data.msg) {
          setRequestSubmitted(true);
          showSuccessToast("Application submitted! You will be notified once approved.");
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.response?.data?.msg || "Something went wrong.");
      setLoading(false);
    }
  };

  // ─── COUNSELLOR SUCCESS VIEW ──────────────────────────────────────
  if (requestSubmitted) {
    return (
      <div className="lumora-login">
        <div className="lumora-login__ambient" aria-hidden="true" />
        <div className="lumora-login__shell" style={pageStyles.shell}>
          <div className="lumora-login__card-wrap">
            <div className="lumora-login__card">
              <div className="lumora-login__logo-block">
                <img src="/logo.png" alt="Lumora" className="lumora-login__logo" />
                <h1 className="lumora-login__heading">Lumora</h1>
              </div>
              <div className="lumora-register__success">
                <h2 className="lumora-register__success-heading">Application Submitted!</h2>
                <p className="lumora-register__success-text">
                  Your counsellor registration request has been submitted.
                </p>
                <p className="lumora-register__success-text" style={{ fontSize: "14px" }}>
                  You will be notified once an admin reviews your application.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="lumora-login__submit"
                  style={{ marginTop: "24px" }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN REGISTRATION FORM ──────────────────────────────────────
  return (
    <div className="lumora-login">
      <div className="lumora-login__ambient" aria-hidden="true" />

      <div className="lumora-login__shell" style={pageStyles.shell}>
        <div className="lumora-login__card-wrap">
          <div className="lumora-login__card">
            {/* BACK BUTTON – with inline styles + hover via state */}
            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <button
                type="button"
                className="lumora-back-btn"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span className="lumora-back-btn__label">Back to Login</span>
              </button>
            </div>

            <div className="lumora-login__logo-block">
              <img src="/logo.png" alt="Lumora" className="lumora-login__logo" />
              <h1 className="lumora-login__heading">Create your account</h1>
              <p className="lumora-login__subhead">
                Begin your journey toward better wellbeing.
              </p>
            </div>

            <div className="lumora-register__tabs">
              <button
                type="button"
                className={`lumora-register__tab ${registerAs === "student" ? "is-active" : ""}`}
                onClick={() => setRegisterAs("student")}
              >
                Student
              </button>
              <button
                type="button"
                className={`lumora-register__tab ${registerAs === "counsellor" ? "is-active" : ""}`}
                onClick={() => setRegisterAs("counsellor")}
              >
                Counsellor
              </button>
            </div>

            {registerAs === "counsellor" && (
              <div className="lumora-register__note">
                <strong>Note:</strong> Counsellor registration requires admin approval. You will be notified once approved.
              </div>
            )}

            <form onSubmit={handleRegister} className="lumora-login__form" noValidate>
              
              <div className="lumora-register__section">
                <span className="lumora-register__section-title">Personal Information</span>
              </div>

              <div className="lumora-register__row">
                <div className="lumora-login__field">
                  <label className="lumora-login__label">Full Name *</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="name"
                      placeholder="e.g., Maria Khan"
                      value={form.name}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="lumora-login__field">
                  <label className="lumora-login__label">Username (Do not use real name)</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="nickname"
                      placeholder="e.g., Maria, Harry"
                      value={form.nickname}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="lumora-register__row">
                <div className="lumora-login__field">
                  <label className="lumora-login__label">Date of Birth *</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob}
                      onChange={handleChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="lumora-login__field">
                  <label className="lumora-login__label">Gender *</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`} style={{ padding: 0 }}>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      disabled={loading}
                      required
                      style={{
                        width: '100%', border: 0, outline: 'none', background: 'transparent',
                        fontSize: '15px', color: '#1E293B', fontFamily: 'inherit',
                        padding: '0 14px', appearance: 'none', cursor: 'pointer'
                      }}
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
              </div>

              <div className="lumora-register__section">
                <span className="lumora-register__section-title">Academic Information</span>
              </div>

              <div className="lumora-login__field">
                <label className="lumora-login__label">University</label>
                <div className={`lumora-login__control ${loading || loadingUniversities ? "is-disabled" : ""}`} style={{ padding: 0 }}>
                  {loadingUniversities ? (
                    <div style={{ padding: '0 14px', color: '#6B7280', fontSize: '15px', display: 'flex', alignItems: 'center' }}>Loading universities...</div>
                  ) : (
                    <select
                      name="university_id"
                      value={form.university_id}
                      onChange={handleChange}
                      disabled={loading}
                      style={{
                        width: '100%', border: 0, outline: 'none', background: 'transparent',
                        fontSize: '15px', color: '#1E293B', fontFamily: 'inherit',
                        padding: '0 14px', appearance: 'none', cursor: 'pointer', height: '100%'
                      }}
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
              </div>

              {showOtherUniversity && (
                <div className="lumora-login__field">
                  <label className="lumora-login__label">Please specify your university</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="university_other"
                      placeholder="Enter your university name"
                      value={form.university_other}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="lumora-register__row">
                <div className="lumora-login__field">
                  <label className="lumora-login__label">Matric Number (optional)</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="matric_number"
                      placeholder="e.g., B012310101"
                      value={form.matric_number}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="lumora-register__row">
                <div className="lumora-login__field">
                  <label className="lumora-login__label">Faculty (optional)</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="faculty"
                      placeholder="e.g., Faculty of Computer Science"
                      value={form.faculty}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="lumora-login__field">
                  <label className="lumora-login__label">Department (optional)</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="department"
                      placeholder="e.g., Software Engineering"
                      value={form.department}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="lumora-register__section">
                <span className="lumora-register__section-title">Parent/Guardian (Optional)</span>
                <span className="lumora-register__section-hint"> - Add a parent or guardian to view your well-being summary</span>
              </div>

              <div className="lumora-login__field">
                <label className="lumora-login__label">Parent/Guardian Email</label>
                <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                  <input
                    name="parent_email"
                    placeholder="parent@example.com"
                    value={form.parent_email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px" }}>
                  They will receive login credentials and can view your well-being summary.
                </p>
              </div>

              {registerAs === "student" && (
                <div className="lumora-register__consent">
                  <label className="lumora-register__consent-label">
                    <input
                      type="checkbox"
                      name="counsellor_consent"
                      checked={form.counsellor_consent}
                      onChange={handleChange}
                      className="lumora-register__consent-checkbox"
                    />
                    <span>
                      I consent to share my data with my university counsellor for the purpose of receiving mental health support.
                      <span className="lumora-register__consent-note"> (You can change this anytime in your profile settings)</span>
                    </span>
                  </label>
                </div>
              )}

              <div className="lumora-register__section">
                <span className="lumora-register__section-title">Emergency / Support Contact</span>
                <span className="lumora-register__section-hint"> - Someone you trust who can support you</span>
              </div>

              <div className="lumora-register__row">
                <div className="lumora-login__field">
                  <label className="lumora-login__label">Contact Name (optional)</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="emergency_contact_name"
                      placeholder="e.g., Ahmad Bin Abdullah"
                      value={form.emergency_contact_name}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="lumora-login__field">
                  <label className="lumora-login__label">Phone Number (optional)</label>
                  <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                    <input
                      name="emergency_contact_phone"
                      placeholder="e.g., 012-3456789"
                      value={form.emergency_contact_phone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="lumora-login__field">
                <label className="lumora-login__label">Relationship (optional)</label>
                <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                  <input
                    name="emergency_contact_relationship"
                    placeholder="e.g., Parent, Sibling, Close Friend"
                    value={form.emergency_contact_relationship}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {registerAs === "counsellor" && (
                <>
                  <div className="lumora-register__section">
                    <span className="lumora-register__section-title">Counsellor Information</span>
                  </div>

                  <div className="lumora-login__field">
                    <label className="lumora-login__label">Qualification</label>
                    <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                      <input
                        name="qualification"
                        placeholder="e.g., Master's in Counselling Psychology"
                        value={form.qualification}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="lumora-login__field">
                    <label className="lumora-login__label">Experience</label>
                    <div className={`lumora-login__control ${loading ? "is-disabled" : ""}`}>
                      <input
                        name="experience"
                        placeholder="e.g., 5 years of experience..."
                        value={form.experience}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="lumora-register__section">
                <span className="lumora-register__section-title">Account Information</span>
              </div>

              <div className="lumora-login__field">
                <label className="lumora-login__label">Email Address *</label>
                <div className={`lumora-login__control ${errors.email ? "is-error" : ""} ${loading ? "is-disabled" : ""}`}>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={checkEmailExists}
                    disabled={loading}
                    required
                  />
                </div>
                {errors.email && <div className="lumora-login__error" style={{ marginTop: '8px' }}>{errors.email}</div>}
              </div>

              {registerAs === "student" && (
                <div className="lumora-register__row">
                  <div className="lumora-login__field">
                    <label className="lumora-login__label">Password *</label>
                    <div className={`lumora-login__control ${errors.password ? "is-error" : ""} ${loading ? "is-disabled" : ""}`}>
                      <input
                        type="password"
                        name="password"
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.password && <div className="lumora-login__error" style={{ marginTop: '8px' }}>{errors.password}</div>}
                  </div>

                  <div className="lumora-login__field">
                    <label className="lumora-login__label">Confirm Password *</label>
                    <div className={`lumora-login__control ${errors.confirmPassword ? "is-error" : ""} ${loading ? "is-disabled" : ""}`}>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.confirmPassword && <div className="lumora-login__error" style={{ marginTop: '8px' }}>{errors.confirmPassword}</div>}
                  </div>
                </div>
              )}

              {registerAs === "counsellor" && (
                <div className="lumora-register__note" style={{ marginBottom: 0 }}>
                  You will receive login credentials via email upon approval.
                </div>
              )}

              {error && (
                <div className="lumora-login__error" role="alert">
                  {error}
                </div>
              )}

              <button type="submit" className="lumora-login__submit" disabled={loading} style={{ marginTop: '16px' }}>
                {loading ? (
                  <span className="lumora-login__submit-inner">
                    <span className="lumora-login__spinner" aria-hidden="true" />
                    Processing…
                  </span>
                ) : registerAs === "counsellor" ? (
                  "Submit Application"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="lumora-login__footer">
              Already have an account?{" "}
              <button
                type="button"
                className="lumora-login__text-link lumora-login__text-link--strong"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Sign in
              </button>
            </p>

            <p className="lumora-login__trust" style={{ marginTop: '32px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 11V8.4a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Your information is kept private and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── STYLE TAG ─────────────────────────────────────────────────────
const styleSheetId = "lumora-register-styles";
if (typeof document !== "undefined" && !document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    /* ---- REGISTER PAGE SPECIFIC STYLES (override theme) ---- */
    .lumora-register__shell {
      width: min(760px, calc(100% - 40px)) !important;
      margin: 0 auto !important;
    }
    
    .lumora-register__tabs {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .lumora-register__tab {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid rgba(79, 70, 229, 0.12);
      background: transparent;
      color: #6B7280;
      font-weight: 500;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .lumora-register__tab.is-active {
      border-color: #4F46E5;
      background: rgba(79, 70, 229, 0.04);
      color: #312E81;
      font-weight: 600;
    }
    
    .lumora-register__section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 32px 0 16px;
      color: #312E81 !important;
      font-weight: 600;
      font-size: 15px;
    }
    
    .lumora-register__section::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(79, 70, 229, 0.12);
    }

    /* Bare <span> tags are directly targeted by a global reset in index.css
       (h1..h6, p, span, div, label { color: var(--text-primary); }), which
       overrides the *inherited* color from .lumora-register__section since a
       rule matching the element itself always wins over inheritance. Target
       the span's own class directly so it wins on specificity instead. */
    .lumora-register__section-title {
      color: #312E81 !important;
      opacity: 1;
    }
    
    .lumora-register__section-hint {
      font-size: 12px;
      color: #6B7280 !important;
      font-weight: 400;
      margin-left: -4px;
    }

    .lumora-register__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .lumora-register__row {
        grid-template-columns: 1fr;
      }
    }

    .lumora-register__consent {
      background: rgba(79, 70, 229, 0.04);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid rgba(79, 70, 229, 0.12);
      margin-bottom: 16px;
    }

    .lumora-register__consent-label {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 13px;
      color: #1E293B !important;
      cursor: pointer;
    }

    .lumora-register__consent-checkbox {
      margin-top: 2px;
      width: 16px;
      height: 16px;
      accent-color: #4F46E5;
      cursor: pointer;
    }

    .lumora-register__consent-note {
      color: #6B7280 !important;
      font-size: 12px;
    }

    .lumora-register__note {
      padding: 12px 16px;
      background: rgba(79, 70, 229, 0.04);
      border-radius: 10px;
      font-size: 13px;
      color: #6B7280 !important;
      margin-bottom: 16px;
      border: 1px solid rgba(79, 70, 229, 0.12);
    }

    .lumora-register__success {
      text-align: center;
      padding: 24px 0;
    }

    .lumora-register__success-heading {
      margin-bottom: 12px;
      font-size: 24px;
      font-weight: 600;
      color: #312E81 !important;
    }

    .lumora-register__success-text {
      color: #6B7280 !important;
      font-size: 15px;
      margin-bottom: 8px;
    }

    /* Force all labels and inputs to use fixed colors */
    .lumora-login__label {
      color: #374151 !important;
    }
    .lumora-login__subhead {
      color: #6B7280 !important;
    }
    .lumora-login__heading {
      color: #312E81 !important;
    }
    .lumora-login__footer {
      color: #6B7280 !important;
    }
    .lumora-login__trust {
      color: #9CA3AF !important;
    }
    .lumora-login__text-link {
      color: #4F46E5 !important;
    }
    .lumora-login__text-link--strong {
      font-weight: 600;
    }
    .lumora-login__control input,
    .lumora-login__control select {
      color: #1E293B !important;
    }
    .lumora-login__control input::placeholder {
      color: #9CA3AF !important;
    }
    .lumora-login__error {
      color: #B91C1C !important;
      background: #FEF2F2 !important;
      border-color: #FECACA !important;
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Register;