// frontend/src/pages/VerifyResetCode.js
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast } from "./components/ToastNotification";

const styleSheetId = "lumora-verify-reset-styles";
if (typeof document !== "undefined" && !document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    /* Verify Reset Code - Fixed White/Calm Style */
    .lumora-verify__info-box {
      padding: 12px 16px;
      background: #F8FAFC;
      border: 1px solid rgba(79, 70, 229, 0.08);
      border-radius: 12px;
      margin-bottom: 24px;
      text-align: center;
    }
    .lumora-verify__info-text {
      margin: 0;
      font-size: 14px;
      color: #475569;
    }
    .lumora-verify__info-subtext {
      margin: 4px 0 0;
      font-size: 13px;
      color: #94A3B8;
    }
    .lumora-verify__otp-wrap {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 24px;
    }
    .lumora-verify__otp-input {
      width: 48px;
      height: 52px;
      text-align: center;
      font-size: 22px;
      font-weight: 600;
      border-radius: 12px;
      border: 1px solid rgba(79, 70, 229, 0.12);
      background: #FFFFFF;
      color: #1E293B;
      transition: all 0.2s ease;
      font-family: inherit;
      outline: none;
    }
    .lumora-verify__otp-input:focus {
      border-color: #4F46E5;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    }
    .lumora-verify__otp-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .lumora-verify__resend-wrap {
      margin-top: 16px;
      text-align: center;
    }
    .lumora-verify__resend-btn {
      border: none;
      background: none;
      padding: 0;
      font: inherit;
      color: #4F46E5;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
    }
    .lumora-verify__resend-btn:hover:not(:disabled) {
      color: #312E81;
      text-decoration: underline;
    }
    .lumora-verify__resend-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      text-decoration: none;
    }
    .lumora-verify__success {
      background: #F0FDF4;
      border: 1px solid #BBF7D0;
      color: #166534;
      font-size: 13px;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 20px;
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

function VerifyResetCode() {
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
      const res = await api.post("/verification/verify-reset-code", {
        userId: parseInt(userId),
        otp: code,
      });

      setSuccess(res.data.msg);
      showSuccessToast("Code verified! Set your new password.");

      setTimeout(() => {
        navigate(`/reset-password?token=${encodeURIComponent(res.data.resetToken)}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to verify code");
      showErrorToast(err.response?.data?.msg || "Failed to verify code");
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
      await api.post("/verification/resend-reset-code", { email });

      setSuccess("A new reset code has been sent to your email.");
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
              <h1 className="lumora-login__heading">Verify reset code</h1>
              <p className="lumora-login__subhead">Enter the 6-digit code sent to your email</p>
            </div>

            <div className="lumora-verify__info-box">
              <p className="lumora-verify__info-text">
                We sent a reset code to <strong>{email}</strong>
              </p>
              <p className="lumora-verify__info-subtext">
                Please enter the 6-digit code below. It expires in 10 minutes.
              </p>
            </div>

            <div className="lumora-verify__otp-wrap">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="lumora-verify__otp-input"
                  autoFocus={index === 0}
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <div className="lumora-login__error" role="alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="lumora-verify__success" role="status">
                {success}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || otp.join("").length !== 6}
              className="lumora-login__submit"
              style={{ opacity: loading || otp.join("").length !== 6 ? 0.6 : 1 }}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <div className="lumora-verify__resend-wrap">
              <button
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="lumora-verify__resend-btn"
              >
                {resending
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend (${cooldown}s)`
                  : "Resend Code"}
              </button>
            </div>

            <p className="lumora-login__footer">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="lumora-login__text-link lumora-login__text-link--strong"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Back to Login
              </button>
            </p>

            <p className="lumora-login__trust">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="11" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 11V8.4a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Secure password recovery
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyResetCode;