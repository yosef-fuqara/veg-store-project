import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../features/auth/AuthContext";
import { PasswordFieldWithToggle } from "../components/common/PasswordFieldWithToggle";

const colors = {
  primary:        '#1e6b3c',
  primarySurface: '#eef7f1',
  primaryBorder:  '#a3cfb4',
  surface:        '#ffffff',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textInverse:    '#ffffff',
  textMuted:      '#a8a29e',
  bg:             '#faf8f5',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
};

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: '10px',
  border: `1.5px solid ${colors.border}`,
  fontSize: '15px',
  color: colors.textPrimary,
  background: colors.surface,
  outline: 'none',
  display: 'block',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const inputFocused  = { ...inputBase, borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(30,107,60,0.12)' };
const inputError    = { ...inputBase, borderColor: colors.error, boxShadow: '0 0 0 3px rgba(153,27,27,0.08)' };

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: 600,
  color: colors.textSecondary,
};

const fieldErrorsFromResponse = (err) => {
  const fields = err.response?.data?.details?.fields;
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, item) => {
    const key = Array.isArray(item.path) ? item.path.join('.') : item.path;
    if (key && !acc[key]) acc[key] = item.message;
    return acc;
  }, {});
};

const FieldError = ({ message }) => (
  <AnimatePresence>
    {message && (
      <motion.span
        key="fe"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        style={{ overflow: 'hidden', display: 'block' }}
      >
        <span style={{ fontSize: '12px', color: colors.error, display: 'block', marginTop: '2px' }}>
          {message}
        </span>
      </motion.span>
    )}
  </AnimatePresence>
);

const RegisterPage = () => {
  const { register } = useAuth();
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);

  const redirectTo = searchParams.get('redirect') || '/';
  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const focus  = (field) => () => setFocused(field);
  const blur   = () => setFocused(null);

  const inputStyle = (field) => {
    if (fieldErrors[field]) return inputError;
    if (focused === field)  return inputFocused;
    return inputBase;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setError(err.userMessage || t('registerFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: 'clamp(32px, 6vh, 60px) 20px 48px',
      background: colors.bg,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <div style={{
          background: `linear-gradient(to bottom, #f2fbf5 0%, ${colors.surface} 90px)`,
          border: `1px solid ${colors.border}`,
          borderTop: `1px solid ${colors.primaryBorder}`,
          borderRadius: '20px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          padding: '32px',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 6px',
              fontSize: '26px',
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}>
              {t('registerTitle')}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary, lineHeight: 1.5 }}>
              {t('registerSubtitle', { defaultValue: 'Create your account to start ordering.' })}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            <label style={labelStyle}>
              {t('name')}
              <input
                value={form.name}
                onChange={update('name')}
                minLength={2} maxLength={80} required
                onFocus={focus('name')} onBlur={blur}
                style={inputStyle('name')}
              />
              <FieldError message={fieldErrors.name} />
            </label>

            <label style={labelStyle}>
              {t('phone')}
              <input
                value={form.phone}
                onChange={update('phone')}
                minLength={7} maxLength={20} required
                onFocus={focus('phone')} onBlur={blur}
                style={inputStyle('phone')}
              />
              <FieldError message={fieldErrors.phone} />
            </label>

            <label style={labelStyle}>
              {t('email')}
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email" required
                onFocus={focus('email')} onBlur={blur}
                style={inputStyle('email')}
              />
              <FieldError message={fieldErrors.email} />
            </label>

            <label style={labelStyle}>
              {t('password')}
              <PasswordFieldWithToggle
                value={form.password}
                onChange={update('password')}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                onFocus={focus('password')}
                onBlur={blur}
                inputStyle={inputStyle('password')}
              />
              <FieldError message={fieldErrors.password} />
            </label>

            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    role="alert"
                    style={{
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: colors.errorSurface,
                      border: `1px solid ${colors.errorBorder}`,
                      color: colors.error,
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={!submitting ? { scale: 1.02 } : {}}
              whileTap={!submitting ? { scale: 0.97 } : {}}
              transition={{ duration: 0.12 }}
              style={{
                marginTop: '6px',
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
                letterSpacing: '0.1px',
              }}
            >
              {submitting ? t('creating') : t('register')}
            </motion.button>
          </form>

          <div style={{
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: `1px solid ${colors.border}`,
            textAlign: 'center',
            fontSize: '14px',
            color: colors.textSecondary,
          }}>
            {t('alreadyHaveAccount')}{' '}
            <Link
              to={`/login?redirect=${encodeURIComponent(redirectTo)}`}
              style={{ color: colors.primary, fontWeight: 700, textDecoration: 'none' }}
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
