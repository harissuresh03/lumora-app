// frontend/src/pages/ResetPassword.js
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";

const styleSheetId = "lumora-reset-password-styles";
if (typeof document !== "undefined" && !document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    /* Reset Password - Fixed White/Calm Style */
    .lumora-reset__success {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      font-size: 13px;
      line-height: 1.45;
      padding: 10px 14px;
      border-radius: 10px;
      text-align: left;
    }
    /* Fixed colors - not affected by theme */
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
    .lumora-login__text-link:hover {
      color: #312E81 !important;
    }
  `;
  document.head.appendChild(styleSheet);
}

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/verification/reset-password", {
        resetToken: token,
        newPassword,
        confirmPassword,
      });

      setSuccess(res.data.msg);
      showSuccessToast("Password reset successfully! You can now log in.");

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to reset password");
      showErrorToast(err.response?.data?.msg || "Failed to reset password");
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
              <h1 className="lumora-login__heading">Create new password</h1>
              <p className="lumora-login__subhead">
                Your new password must be at least 6 characters.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="lumora-login__form" noValidate>
              <div className="lumora-login__field">
                <label htmlFor="lumora-new-password" className="lumora-login__label">
                  New Password
                </label>
                <div
                  className={[
                    "lumora-login__control",
                    newPasswordFocused ? "is-focused" : "",
                    error && (!newPassword || newPassword.length < 6) ? "is-error" : "",
                    loading ? "is-disabled" : "",
                  ].join(" ").trim()}
                >
                  <span className="lumora-login__icon" aria-hidden="true">
                    <LockIcon />
                  </span>
                  <input
                    id="lumora-new-password"
                    type={showPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setNewPasswordFocused(true)}
                    onBlur={() => setNewPasswordFocused(false)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="lumora-login__toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="lumora-login__field">
                <label htmlFor="lumora-confirm-password" className="lumora-login__label">
                  Confirm Password
                </label>
                <div
                  className={[
                    "lumora-login__control",
                    confirmPasswordFocused ? "is-focused" : "",
                    error && (newPassword !== confirmPassword) ? "is-error" : "",
                    loading ? "is-disabled" : "",
                  ].join(" ").trim()}
                >
                  <span className="lumora-login__icon" aria-hidden="true">
                    <LockIcon />
                  </span>
                  <input
                    id="lumora-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="lumora-login__toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    aria-pressed={showConfirmPassword}
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="lumora-login__error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="lumora-reset__success"
                  role="alert"
                >
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="lumora-login__submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="lumora-login__submit-inner">
                    <span className="lumora-login__spinner" aria-hidden="true" />
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
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

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8.4a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.8 12S6.2 6.8 12 6.8 21.2 12 21.2 12 17.8 17.2 12 17.2 2.8 12 2.8 12Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.9 9.95A3 3 0 0 0 12 15a3 3 0 0 0 2.9-2.1M6.1 6.7C4.2 8 2.8 12 2.8 12S6.2 17.2 12 17.2c1.7 0 3.2-.4 4.5-1M17.7 15.5C19.7 14 21.2 12 21.2 12S17.8 6.8 12 6.8c-.6 0-1.2.05-1.7.14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default ResetPassword;