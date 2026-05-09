import { useTranslation } from "react-i18next";

const CONTACT = {
  phone: '+972-XX-XXX-XXXX',
  email: 'info@abualaanas.com',
};

const PAYMENT_METHODS = ['Credit Card', 'Bit', 'Bank Transfer'];

const colors = {
  primary:        '#1e6b3c',
  surface:        '#ffffff',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
};

// ─── Column heading ───────────────────────────────────────────────────────────
const ColHeading = ({ children }) => (
  <h4 style={{
    margin: '0 0 12px',
    fontSize: '15px',
    fontWeight: 700,
    color: colors.textPrimary,
    letterSpacing: '0.1px',
  }}>
    {children}
  </h4>
);

const bodyTextStyle = {
  margin: 0,
  fontSize: '14px',
  lineHeight: 1.7,
  color: colors.textSecondary,
};

const linkStyle = {
  color: colors.textSecondary,
  textDecoration: 'none',
  transition: 'color 0.15s',
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => {
  const { t, i18n } = useTranslation('nav');
  const lang = (i18n.language || 'he').split('-')[0];

  // Localized labels — fall back to English so the footer reads naturally in any locale.
  const labels = {
    he: {
      about:       'אודות',
      aboutBody:   'תוצרת טרייה מאזור הגליל, מגיעה היישר עד דלתכם.',
      contact:     'יצירת קשר',
      phoneLabel:  'טלפון',
      emailLabel:  'אימייל',
      payment:     'אמצעי תשלום',
      rights:      'כל הזכויות שמורות.',
      crafted:     'נוצר על ידי',
    },
    ar: {
      about:       'من نحن',
      aboutBody:   'منتجات طازجة من منطقة الجليل، توصل مباشرة إلى بابك.',
      contact:     'تواصل معنا',
      phoneLabel:  'هاتف',
      emailLabel:  'البريد الإلكتروني',
      payment:     'طرق الدفع',
      rights:      'جميع الحقوق محفوظة.',
      crafted:     'تم تصميمه بواسطة',
    },
    en: {
      about:       'About Us',
      aboutBody:   'Fresh produce from the Galilee region, delivered directly to your door.',
      contact:     'Contact',
      phoneLabel:  'Phone',
      emailLabel:  'Email',
      payment:     'Payment Methods',
      rights:      'All rights reserved.',
      crafted:     'Crafted by',
    },
  };
  const L = labels[lang] || labels.en;

  return (
    <footer style={{
      background: colors.surface,
      borderTop: `1px solid ${colors.border}`,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '32px 48px',
      }}>

        {/* About Us */}
        <div>
          <ColHeading>{L.about}</ColHeading>
          <p style={bodyTextStyle}>
            {L.aboutBody}
          </p>
        </div>

        {/* Contact */}
        <div>
          <ColHeading>{L.contact}</ColHeading>
          <p style={bodyTextStyle}>
            {L.phoneLabel}:{' '}
            <a
              href={`tel:${CONTACT.phone}`}
              style={linkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; }}
            >
              {CONTACT.phone}
            </a>
            <br />
            {L.emailLabel}:{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              style={linkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = colors.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; }}
            >
              {CONTACT.email}
            </a>
          </p>
        </div>

        {/* Payment Methods */}
        <div>
          <ColHeading>{L.payment}</ColHeading>
          <p style={bodyTextStyle}>
            {PAYMENT_METHODS.join('  •  ')}
          </p>
        </div>

      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: `1px solid ${colors.border}`,
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '13px',
        color: colors.textMuted,
      }}>
        © {new Date().getFullYear()} Abu Al-Anas. {L.rights}
      </div>
    </footer>
  );
};

export default Footer;
