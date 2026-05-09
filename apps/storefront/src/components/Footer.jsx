import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AbuAlAnasLogo from "./common/Logo";

// ─── Placeholder contact/social info — replace with real values before launch ─
const CONTACT = {
  phone:     '+972-XX-XXX-XXXX',
  whatsapp:  '+972-XX-XXX-XXXX',
  email:     'info@abualaanas.com',
  address:   'Galilee Region, Israel',
};

const SOCIAL = [
  { label: 'Instagram', href: '#', icon: '📸' },
  { label: 'Facebook',  href: '#', icon: '👥' },
];

// ─── Tokens ───────────────────────────────────────────────────────────────────
const colors = {
  primary:     '#1e6b3c',
  bg:          '#faf8f5',
  footerBg:    '#f0ece6',
  bottomBg:    '#e8e3dc',
  border:      '#e0d9d0',
  textPrimary: '#1c1917',
  textBody:    '#57534e',
  textMuted:   '#a8a29e',
  textInverse: '#ffffff',
};

// ─── Hover-aware link ─────────────────────────────────────────────────────────
const FooterLink = ({ to, href, target, children }) => {
  const [hovered, setHovered] = useState(false);
  const style = {
    color: hovered ? colors.primary : colors.textBody,
    textDecoration: 'none',
    fontSize: '14px',
    lineHeight: 1.6,
    transition: 'color 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  };
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
  if (to) return <Link to={to} style={style} {...handlers}>{children}</Link>;
  return <a href={href} target={target} rel="noreferrer" style={style} {...handlers}>{children}</a>;
};

// ─── Section heading ──────────────────────────────────────────────────────────
const ColHeading = ({ children }) => (
  <h4 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 700, color: colors.textPrimary, letterSpacing: '0.1px' }}>
    {children}
  </h4>
);

// ─── Contact row ──────────────────────────────────────────────────────────────
const ContactRow = ({ icon, href, children }) => (
  <FooterLink href={href}>
    <span style={{ fontSize: '15px', flexShrink: 0 }}>{icon}</span>
    <span>{children}</span>
  </FooterLink>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => {
  const { t } = useTranslation('nav');

  return (
    <footer>
      {/* Main columns */}
      <div style={{ background: colors.footerBg, borderTop: `1px solid ${colors.border}` }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '56px 24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
        }}>

          {/* ── About Us ─────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <AbuAlAnasLogo size={38} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
                  אבי אל-אנס
                </div>
                <div style={{ fontSize: '11px', color: colors.textMuted, letterSpacing: '0.3px' }}>
                  פירות וירקות
                </div>
              </div>
            </div>
            <p style={{ margin: '0 0 18px', fontSize: '14px', color: colors.textBody, lineHeight: 1.65 }}>
              Fresh produce from the Galilee region, delivered directly to your door. Quality you can taste, freshness you can trust.
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {SOCIAL.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', textDecoration: 'none',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Quick Links ──────────────────────────────────────── */}
          <div>
            <ColHeading>Quick Links</ColHeading>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><FooterLink to="/">{t('home')}</FooterLink></li>
              <li><FooterLink to="/#products-section">{t('products') || 'Products'}</FooterLink></li>
              <li><FooterLink to="/cart">{t('cart')}</FooterLink></li>
              <li><FooterLink to="/checkout">{t('checkout')}</FooterLink></li>
              <li><FooterLink to="/login">{t('login')}</FooterLink></li>
              <li><FooterLink to="/register">{t('register')}</FooterLink></li>
            </ul>
          </div>

          {/* ── Contact ──────────────────────────────────────────── */}
          <div>
            <ColHeading>Contact</ColHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ContactRow icon="📞" href={`tel:${CONTACT.phone}`}>{CONTACT.phone}</ContactRow>
              <ContactRow icon="💬" href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, '')}`}>{CONTACT.whatsapp}</ContactRow>
              <ContactRow icon="✉️" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</ContactRow>
              <ContactRow icon="📍" href="#">{CONTACT.address}</ContactRow>
            </div>
          </div>

          {/* ── Payment Methods ───────────────────────────────────── */}
          <div>
            <ColHeading>Payment Methods</ColHeading>
            <p style={{ margin: '0 0 12px', fontSize: '14px', color: colors.textBody, lineHeight: 1.6 }}>
              We accept the following payment methods:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['💳 Credit Card', '📱 Bit', '🏦 Bank Transfer'].map((method) => (
                <div
                  key={method}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '6px 12px', borderRadius: '8px',
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    fontSize: '13px', fontWeight: 500, color: colors.textBody,
                    width: 'fit-content',
                  }}
                >
                  {method}
                </div>
              ))}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: '12px', color: colors.textMuted, lineHeight: 1.5 }}>
              Delivery information and pricing details are shown at checkout.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ background: colors.bottomBg, borderTop: `1px solid ${colors.border}` }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>
            © {new Date().getFullYear()} Abu Al-Anas. All rights reserved.
          </span>
          <span style={{ fontSize: '13px', color: colors.textMuted }}>
            Designed &amp; Developed by{' '}
            <span style={{ color: colors.primary, fontWeight: 600 }}>YoSite</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
