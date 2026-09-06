// frontend/src/pages/ForgotPassword.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [emailFocused, setEmailFocused] = useState(false);

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
    <div className="lumora-login">
      <div className="lumora-login__ambient" aria-hidden="true" />

      <div className="lumora-login__shell">
        <div className="lumora-login__card-wrap">
          <div className="lumora-login__card">
            
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
              <img
                src="/logo.png"
                alt="Lumora"
                className="lumora-login__logo"
              />
              <h1 className="lumora-login__heading">Reset your password</h1>
              <p className="lumora-login__subhead">
                Enter your email and we'll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="lumora-login__form" noValidate>
              <div className="lumora-login__field">
                <label htmlFor="lumora-email" className="lumora-login__label">
                  Email Address
                </label>
                <div
                  className={[
                    "lumora-login__control",
                    emailFocused ? "is-focused" : "",
                    error && !email ? "is-error" : "",
                    loading ? "is-disabled" : "",
                  ].join(" ").trim()}
                >
                  <span className="lumora-login__icon" aria-hidden="true">
                    <EmailIcon />
                  </span>
                  <input
                    id="lumora-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="lumora-login__error" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="lumora-forgot-password__success" role="status">
                  {success}
                </div>
              )}

              <button type="submit" className="lumora-login__submit" disabled={loading}>
                {loading ? (
                  <span className="lumora-login__submit-inner">
                    <span className="lumora-login__spinner" aria-hidden="true" />
                    Sending...
                  </span>
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>

            <p className="lumora-login__footer">
              Remember your password?{" "}
              <button
                type="button"
                className="lumora-login__text-link lumora-login__text-link--strong"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Sign in
              </button>
            </p>

            <p className="lumora-login__trust">
              <LockSmallIcon />
              Your information is kept private and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 7.5L12 13l8-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11V8.4a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const styleSheetId = "lumora-forgot-password-styles";
if (typeof document !== "undefined" && !document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    .lumora-forgot-password__success {
      color: #166534;
      font-size: 13px;
      line-height: 1.45;
      padding: 10px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
    }
    /* Fixed colors for this page */
    .lumora-login__heading {
      color: #312E81 !important;
    }
    .lumora-login__subhead {
      color: #6B7280 !important;
    }
    .lumora-login__label {
      color: #374151 !important;
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
  `;
  document.head.appendChild(styleSheet);
}

export default ForgotPassword;