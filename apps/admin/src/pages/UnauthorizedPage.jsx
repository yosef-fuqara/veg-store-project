import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import { getStorefrontHomeUrl } from "../utils/storefrontUrl";

const colors = {
  primary:     '#1e6b3c',
  primaryHover:'#165430',
  bg:          '#faf8f5',
  textPrimary: '#1c1917',
  textSecondary:'#57534e',
  textInverse: '#ffffff',
  errorIcon:   '#ef4444',
  errorIconBg: '#fee2e2',
};

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const storefrontHomeUrl = useMemo(() => getStorefrontHomeUrl(), []);
  const [btnHovered, setBtnHovered] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  const handleBackToStorefront = () => {
    if (!storefrontHomeUrl) return;
    // Full navigation to the storefront app (not admin "/" → /products → /unauthorized).
    window.location.assign(storefrontHomeUrl);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: '16px', insetInlineEnd: '16px' }}>
        <LanguageSwitcher size="sm" />
      </div>
      <div style={{ maxWidth: '420px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

        {/* Icon */}
        <div style={{
          width: '88px',
          height: '88px',
          borderRadius: '50%',
          background: colors.errorIconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z"
              stroke={colors.errorIcon}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <line x1="12" y1="8" x2="12" y2="12" stroke={colors.errorIcon} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="12" cy="15.5" r="1.25" fill={colors.errorIcon} />
          </svg>
        </div>

        {/* Heading */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: colors.textPrimary, letterSpacing: '-0.3px' }}>
            {t('unauthorized.title')}
          </h1>
          <p style={{ margin: 0, fontSize: '15px', color: colors.textSecondary, lineHeight: 1.6 }}>
            {t('unauthorized.description')}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              width: '100%',
              padding: '13px 24px',
              borderRadius: '10px',
              border: 'none',
              background: btnHovered ? colors.primaryHover : colors.primary,
              color: colors.textInverse,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(30,107,60,0.30)',
              transition: 'background 0.15s',
            }}
          >
            {t('unauthorized.tryAdminLogin')}
          </button>

          <button
            type="button"
            onClick={handleBackToStorefront}
            disabled={!storefrontHomeUrl}
            onMouseEnter={() => setLinkHovered(true)}
            onMouseLeave={() => setLinkHovered(false)}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: linkHovered ? colors.primary : colors.textSecondary,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'color 0.15s',
              background: 'none',
              border: 'none',
              cursor: storefrontHomeUrl ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              padding: 0,
              width: '100%',
              opacity: storefrontHomeUrl ? 1 : 0.5,
            }}
          >
            {t('unauthorized.backToStorefront')}
            <span style={{ fontSize: '16px' }} aria-hidden>←</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
