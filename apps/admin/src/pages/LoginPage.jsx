import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { USER_ROLES } from "../constants/roles";
import { useToast } from "../features/toast/ToastContext";
import AbuAlAnasLogo from "../components/common/Logo";

const colors = {
  primary:      '#1e6b3c',
  primaryHover: '#165430',
  bg:           '#faf8f5',
  surface:      '#ffffff',
  border:       '#e8e3dc',
  textPrimary:  '#1c1917',
  textSecondary:'#57534e',
  textMuted:    '#a8a29e',
  textInverse:  '#ffffff',
  error:        '#991b1b',
  errorBg:      '#fef2f2',
  errorBorder:  '#fecaca',
};

const fontStack = "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '15px',
  lineHeight: 1.45,
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  display: 'block',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: fontStack,
};

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRedirect = searchParams.get("redirect");
  const redirectTo = requestedRedirect && requestedRedirect.startsWith("/") ? requestedRedirect : "/products";
  const reason = searchParams.get("reason");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    if (reason !== "session_expired") return;
    showToast("Session expired. Please sign in again.", "error");
    const next = new URLSearchParams(searchParams);
    next.delete("reason");
    const nextQuery = next.toString();
    navigate(`/login${nextQuery ? `?${nextQuery}` : ""}`, { replace: true });
  }, [navigate, reason, searchParams, showToast]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      if (user.role !== USER_ROLES.ADMIN) {
        showToast("This account is not an admin account.", "error");
        navigate("/unauthorized", { replace: true });
        return;
      }
      showToast("Signed in successfully.");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.userMessage || "Login failed";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field) => ({
    ...inputBase,
    ...(focused === field
      ? { borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(30,107,60,0.12)' }
      : {}),
    ...(error && !focused ? { borderColor: colors.errorBorder } : {}),
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: fontStack,
      color: colors.textPrimary,
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes adminLoginSpin {
          to { transform: rotate(360deg); }
        }
        .admin-login-input:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .admin-login-submit:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        .admin-login-spinner {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          animation: adminLoginSpin 0.9s linear infinite;
          display: inline-block;
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: '400px', minWidth: 0 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <AbuAlAnasLogo size={48} />
            <div style={{ textAlign: 'start' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: colors.textPrimary }}>Abu Al-Anas</div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: colors.textMuted, textTransform: 'uppercase', marginTop: '4px' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          padding: 'clamp(24px, 5vw, 32px)',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.02em' }}>
            Sign In
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 500, color: colors.textSecondary }}>
              Email
              <input
                type="email"
                className="admin-login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={inputStyle('email')}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: 500, color: colors.textSecondary }}>
              Password
              <input
                type="password"
                className="admin-login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={8}
                required
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                style={inputStyle('password')}
              />
            </label>

            {error && (
              <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={submitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
                padding: '12px 20px',
                borderRadius: '10px',
                border: 'none',
                background: submitting ? colors.border : colors.primary,
                color: submitting ? colors.textMuted : colors.textInverse,
                fontSize: '15px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.30)',
                width: '100%',
                fontFamily: fontStack,
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = colors.primaryHover; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = colors.primary; }}
            >
              {submitting && (
                <svg className="admin-login-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.22-8.56"/>
                </svg>
              )}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
