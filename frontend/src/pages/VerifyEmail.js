// frontend/src/pages/VerifyEmail.js
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";

const styleSheetId = "lumora-verify-email-styles";
if (typeof document !== "undefined" && !document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    /* Verify Email Page - Fixed White/Calm Style */
    .lumora-verify-email__message-box {
      padding: 16px;
      background: #F1F5F9;
      border-radius: 12px;
      margin-bottom: 24px;
      text-align: left;
      border: 1px solid rgba(79, 70, 229, 0.12);
    }
    .lumora-verify-email__message-text {
      margin: 0;
      font-size: 14px;
      color: #475569;
      line-height: 1.5;
    }
    .lumora-verify-email__message-subtext {
      margin: 4px 0 0;
      font-size: 13px;
      color: #94A3B8;
    }
    .lumora-verify-email__otp-container {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-bottom: 24px;
    }
    .lumora-verify-email__otp-input {
      width: 48px;
      height: 56px;
      text-align: center;
      font-size: 24px;
      font-weight: 600;
      border-radius: 12px;
      border: 1px solid rgba(79, 70, 229, 0.12);
      outline: none;
      transition: all 0.2s;
      background: #FFFFFF;
      font-family: inherit;
      color: #1E293B;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .lumora-verify-email__otp-input:focus {
      border-color: #4F46E5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .lumora-verify-email__otp-input:disabled {
      background-color: #F8FAFC;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .lumora-verify-email__resend-container {
      margin-top: 16px;
      text-align: center;
    }
    .lumora-login__success {
      background-color: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 16px;
      text-align: left;
    }
    .lumora-verify-email__resend-btn {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #4F46E5;
      font-weight: 500;
      font-size: 13px;
    }
    .lumora-verify-email__resend-btn:hover:not(:disabled) {
      color: #312E81;
      text-decoration: underline;
    }
    .lumora-verify-email__resend-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
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
              <img src="/logo.png" alt="Lumora" className="lumora-login__logo" />
              <h1 className="lumora-login__heading">Verify your email</h1>
              <p className="lumora-login__subhead">We need to verify your email address before you can sign in.</p>
            </div>

            <div className="lumora-verify-email__message-box">
              <p className="lumora-verify-email__message-text">
                We sent a verification code to <strong>{email}</strong>
              </p>
              <p className="lumora-verify-email__message-subtext">
                Please enter the 6-digit code below. It expires in 10 minutes.
              </p>
            </div>

            <div className="lumora-verify-email__otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="lumora-verify-email__otp-input"
                  autoFocus={index === 0}
                  disabled={loading}
                />
              ))}
            </div>

            {error && <div className="lumora-login__error" role="alert">{error}</div>}
            {success && <div className="lumora-login__success" role="alert">{success}</div>}

            <button
              onClick={handleVerify}
              disabled={loading || otp.join("").length !== 6}
              className="lumora-login__submit"
              style={{ opacity: loading || otp.join("").length !== 6 ? 0.6 : 1 }}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="lumora-verify-email__resend-container">
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="lumora-verify-email__resend-btn"
              >
                {resending
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend (${cooldown}s)`
                  : "Resend Code"}
              </button>
            </div>

            <p className="lumora-login__footer">
              Already verified?{" "}
              <button
                type="button"
                onClick={() => navigate("/")}
                className="lumora-login__text-link lumora-login__text-link--strong"
              >
                Sign in
              </button>
            </p>

            <p className="lumora-login__trust">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 11V8.4a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Secure, encrypted, and confidential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;