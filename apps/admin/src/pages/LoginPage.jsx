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

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '15px',
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  display: 'block',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AbuAlAnasLogo size={48} />
            <div style={{ textAlign: 'start' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: colors.textPrimary }}>Abu Al-Anas</div>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1px', color: colors.textMuted, textTransform: 'uppercase' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)',
          padding: '32px',
        }}>
          <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 700, color: colors.textPrimary }}>
            Sign In
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500, color: colors.textSecondary }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={inputStyle('email')}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500, color: colors.textSecondary }}>
              Password
              <input
                type="password"
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
              <div role="alert" style={{ padding: '10px 14px', borderRadius: '8px', background: colors.errorBg, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '13px', lineHeight: 1.5 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: '4px',
                padding: '11px 20px',
                borderRadius: '10px',
                border: 'none',
                background: submitting ? colors.border : colors.primary,
                color: submitting ? colors.textMuted : colors.textInverse,
                fontSize: '15px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.28)',
                width: '100%',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
