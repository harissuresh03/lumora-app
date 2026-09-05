// frontend/src/pages/Login.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { showSuccessToast, showErrorToast, showInfoToast } from "./components/ToastNotification";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your details gently 💙");
      return;
    }

    try {
      setLoading(true);

      // Try regular login first
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("user_role", res.data.role);
      localStorage.setItem("user_name", res.data.name);
      localStorage.setItem("user_nickname", res.data.nickname || "");

      // Redirect based on role
      if (res.data.role === 'admin') {
        navigate("/admin");
      } else if (res.data.role === 'counsellor') {
        navigate("/counsellor");
      } else if (res.data.role === 'parent') {
        navigate("/parent/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);

      // ✅ Check if user needs email verification
      if (err.response?.status === 403 && err.response?.data?.needsVerification) {
        // Redirect to verification page
        navigate(`/verify-email?email=${encodeURIComponent(err.response.data.email)}&userId=${err.response.data.user_id}`);
        showInfoToast("Please verify your email before logging in. A verification code has been sent.");
        return;
      }

      // If student login fails, try parent login
      try {
        const parentRes = await api.post("/parent/login", {
          email,
          password,
        });

        localStorage.setItem("token", parentRes.data.token);
        localStorage.setItem("user_id", parentRes.data.user_id);
        localStorage.setItem("user_role", parentRes.data.role);
        localStorage.setItem("user_name", parentRes.data.name || "Parent");

        navigate("/parent/dashboard");
      } catch (parentErr) {
        setError(err.response?.data?.msg || "We couldn't log you in 🌙");
      }
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
            <div className="lumora-login__logo-block">
              <img
                src="/logo.png"
                alt="Lumora"
                className="lumora-login__logo"
              />
              <h1 className="lumora-login__heading">Welcome back</h1>
              <p className="lumora-login__subhead">
                Continue your journey toward better wellbeing.
              </p>
            </div>

            <form onSubmit={handleLogin} className="lumora-login__form" noValidate>
              <div className="lumora-login__field">
                <label htmlFor="lumora-email" className="lumora-login__label">
                  Email address
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
                    name="email"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    disabled={loading}
                    aria-invalid={Boolean(error && !email)}
                    aria-describedby={error ? "lumora-login-error" : undefined}
                  />
                </div>
              </div>

              <div className="lumora-login__field">
                <label htmlFor="lumora-password" className="lumora-login__label">
                  Password
                </label>
                <div
                  className={[
                    "lumora-login__control",
                    passwordFocused ? "is-focused" : "",
                    error && !password ? "is-error" : "",
                    loading ? "is-disabled" : "",
                  ].join(" ").trim()}
                >
                  <span className="lumora-login__icon" aria-hidden="true">
                    <LockIcon />
                  </span>
                  <input
                    id="lumora-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    disabled={loading}
                    aria-invalid={Boolean(error && !password)}
                    aria-describedby={error ? "lumora-login-error" : undefined}
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

              <div className="lumora-login__row">
                <button
                  type="button"
                  className="lumora-login__text-link"
                  onClick={() => navigate("/forgot-password")}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div
                  id="lumora-login-error"
                  className="lumora-login__error"
                  role="alert"
                >
                  {error}
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
                    Signing in…
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="lumora-login__footer">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="lumora-login__text-link lumora-login__text-link--strong"
                onClick={() => navigate("/register")}
                disabled={loading}
              >
                Sign up
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

function LockSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9.5" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 11V8.4a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const styleSheetId = "lumora-login-styles";
if (typeof document !== "undefined" && !document.getElementById(styleSheetId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleSheetId;
  styleSheet.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650&display=swap');

    .lumora-login {
      --lavender: #8B5CF6;
      --indigo: #4F46E5;
      --navy: #312E81;
      --text: #1F2937;
      --muted: #6B7280;
      --soft: #EDE9FE;
      --wash: #F5F3FF;
      --page: #F8F7FC;
      --border: rgba(79, 70, 229, 0.12);
      min-height: 100vh;
      width: 100%;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #FFFFFF 0%, #FFFFFF 62%, #F7F5FF 86%, #EDE9FE 100%);
      font-family: Inter, "Segoe UI", system-ui, sans-serif;
      color: var(--text);
    }

    .lumora-login__ambient {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: radial-gradient(ellipse at 50% 118%, rgba(139, 92, 246, 0.12), transparent 42%);
    }

    .lumora-login__shell {
      position: relative;
      z-index: 1;
      width: min(560px, calc(100% - 40px));
      display: flex;
      justify-content: center;
      padding: 40px 0;
    }

    .lumora-login__card-wrap {
      width: 100%;
    }

    .lumora-login__card {
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.9);
      box-shadow:
        0 1px 2px rgba(49, 46, 129, 0.04),
        0 22px 48px rgba(49, 46, 129, 0.08);
      border-radius: 24px;
      padding: 48px 44px 36px;
      animation: lumoraCardIn 300ms ease-out;
    }

    .lumora-login__logo-block {
      text-align: center;
      margin-bottom: 32px;
    }

    .lumora-login__logo {
      width: 96px;
      height: 96px;
      object-fit: contain;
      margin: 0 auto 18px;
      display: block;
      animation: lumoraLogoIn 280ms ease-out;
    }

    .lumora-login__heading {
      margin: 0 0 8px;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 600;
      color: var(--navy);
      letter-spacing: -0.03em;
    }

    .lumora-login__subhead {
      margin: 0;
      font-size: 15px;
      line-height: 1.55;
      color: var(--muted);
    }

    .lumora-login__form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .lumora-login__field {
      text-align: left;
    }

    .lumora-login__label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .lumora-login__control {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 50px;
      padding: 0 14px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(79, 70, 229, 0.12);
      transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
    }

    .lumora-login__control:hover:not(.is-disabled):not(.is-focused) {
      border-color: rgba(79, 70, 229, 0.22);
    }

    .lumora-login__control.is-focused {
      border-color: rgba(79, 70, 229, 0.55);
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
      background: #FFFFFF;
    }

    .lumora-login__control.is-error {
      border-color: #DC2626;
      box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.08);
    }

    .lumora-login__control.is-disabled {
      opacity: 0.65;
      background: #F9FAFB;
    }

    .lumora-login__icon {
      display: flex;
      color: #9CA3AF;
      flex-shrink: 0;
    }

    .lumora-login__control.is-focused .lumora-login__icon {
      color: var(--indigo);
    }

    .lumora-login__control input {
      width: 100%;
      border: 0;
      outline: none;
      background: transparent;
      font-size: 15px;
      color: var(--text);
      font-family: inherit;
      min-width: 0;
    }

    .lumora-login__control input::placeholder {
      color: #9CA3AF;
    }

    .lumora-login__control input:disabled {
      cursor: not-allowed;
    }

    .lumora-login__toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border: 0;
      background: transparent;
      color: #9CA3AF;
      cursor: pointer;
      border-radius: 8px;
      transition: color 180ms ease, background 180ms ease, transform 160ms ease;
    }

    .lumora-login__toggle:hover:not(:disabled) {
      color: var(--indigo);
      background: var(--wash);
    }

    .lumora-login__toggle:active:not(:disabled) {
      transform: scale(0.96);
    }

    .lumora-login__toggle:focus-visible {
      outline: 2px solid var(--indigo);
      outline-offset: 2px;
    }

    .lumora-login__row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: -2px;
    }

    .lumora-login__text-link {
      border: 0;
      background: none;
      padding: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--indigo);
      cursor: pointer;
      font-family: inherit;
      transition: color 180ms ease, opacity 180ms ease;
    }

    .lumora-login__text-link:hover:not(:disabled) {
      color: var(--lavender);
    }

    .lumora-login__text-link:focus-visible {
      outline: 2px solid var(--indigo);
      outline-offset: 3px;
      border-radius: 4px;
    }

    .lumora-login__text-link--strong {
      font-weight: 600;
    }

    .lumora-login__error {
      color: #B91C1C;
      font-size: 13px;
      line-height: 1.45;
      padding: 10px 12px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 10px;
    }

    .lumora-login__submit {
      width: 100%;
      height: 50px;
      margin-top: 6px;
      border: 0;
      border-radius: 13px;
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.01em;
      cursor: pointer;
      font-family: inherit;
      background: linear-gradient(135deg, #8B5CF6 0%, #4F46E5 100%);
      box-shadow: 0 8px 18px rgba(79, 70, 229, 0.18);
      transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
    }

    .lumora-login__submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 22px rgba(79, 70, 229, 0.22);
      filter: brightness(1.03);
    }

    .lumora-login__submit:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.16);
    }

    .lumora-login__submit:disabled {
      cursor: wait;
      opacity: 0.82;
    }

    .lumora-login__submit:focus-visible {
      outline: 2px solid var(--indigo);
      outline-offset: 3px;
    }

    .lumora-login__submit-inner {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    .lumora-login__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: lumoraSpin 700ms linear infinite;
    }

    .lumora-login__footer {
      margin: 24px 0 0;
      text-align: center;
      font-size: 14px;
      color: var(--muted);
    }

    .lumora-login__trust {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 20px 0 0;
      font-size: 12px;
      color: #9CA3AF;
    }

    .lumora-login__trust svg {
      color: #9CA3AF;
    }

    @keyframes lumoraCardIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes lumoraLogoIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes lumoraSpin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 900px) {
      .lumora-login__shell {
        width: min(560px, calc(100% - 32px));
      }

      .lumora-login__card {
        padding: 40px 28px 28px;
        border-radius: 22px;
      }

      .lumora-login__logo {
        width: 84px;
        height: 84px;
      }

      .lumora-login__heading {
        font-size: 26px;
      }
    }

    @media (max-width: 480px) {
      .lumora-login {
        align-items: stretch;
      }

      .lumora-login__shell {
        width: 100%;
        padding: 20px 16px 28px;
      }

      .lumora-login__card {
        box-shadow: 0 10px 28px rgba(49, 46, 129, 0.06);
      }

      .lumora-login__row {
        flex-wrap: wrap;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .lumora-login__card,
      .lumora-login__logo,
      .lumora-login__submit,
      .lumora-login__spinner {
        animation: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Login;
