import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DEVELOPER_CREDIT } from "../config/developerCredit";
import { Link } from "react-router-dom";
import AbuAlAnasLogo from "./common/Logo";
import DeveloperBrandMark from "./DeveloperBrandMark";
import { CATEGORY_NAV_IDS } from "../utils/categoryFilter";

const PHONES = [
  { display: "054-348-6348", tel: "+972543486348" },
  { display: "055-289-2790", tel: "+972552892790" },
];

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e",
  /** Footer credit strip + logo tile — matches frosted bar over gradient (#e4f0ea @ ~55% + white @ 45%) */
  footerCreditSurface: "#f0f7f3",
};

const linkReset = {
  color: "inherit",
  textDecoration: "none",
};

/** Default mark when DEVELOPER_CREDIT.logoSrc is not set */
const DeveloperMark = ({ logoSrc, hovered, size = 20 }) => {
  const wrapStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.2s ease, opacity 0.2s ease",
    transform: hovered ? "scale(1.04)" : "scale(1)",
    opacity: hovered ? 1 : 0.88,
  };

  if (logoSrc) {
    const h = Math.max(size, 22);
    return (
      <div
        style={{
          ...wrapStyle,
          background: colors.footerCreditSurface,
          borderRadius: 8,
          paddingInline: 6,
          paddingBlock: 2,
          boxSizing: "border-box",
        }}
      >
        <img
          src={logoSrc}
          alt=""
          style={{
            display: "block",
            objectFit: "contain",
            height: h,
            width: "auto",
            maxWidth: 120,
            mixBlendMode: "multiply",
          }}
        />
      </div>
    );
  }

  return (
    <DeveloperBrandMark
      size={Math.max(size, 26)}
      hovered={hovered}
      ring={colors.primary}
      orbit={colors.primaryBorder}
      detail={colors.primary}
    />
  );
};

const Footer = () => {
  const [creditHovered, setCreditHovered] = useState(false);
  const { t, i18n } = useTranslation(["home", "nav"]);
  const lang = String(i18n.language || "he").split("-")[0].toLowerCase();
  const dir = lang === "he" || lang === "ar" ? "rtl" : "ltr";
  const devUrl = (DEVELOPER_CREDIT.websiteUrl || "").trim();
  const devName = (DEVELOPER_CREDIT.name || "").trim() || "Studio";

  const nameAccentStyle = {
    fontWeight: 600,
    color: creditHovered ? colors.primary : colors.textSecondary,
    textDecoration: "none",
    transition: "color 0.2s ease, border-color 0.2s ease",
    borderBottom: `1px solid ${
      creditHovered && devUrl ? colors.primaryBorder : "transparent"
    }`,
  };

  return (
    <footer
      style={{
        background: `linear-gradient(180deg, ${colors.primarySurface} 0%, #e4f0ea 100%)`,
        borderTop: `1px solid ${colors.primaryBorder}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 20px 20px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "24px 28px",
          alignItems: "start",
        }}
        className="storefront-footer-grid"
      >
        <style>{`
          @media (max-width: 640px) {
            .storefront-footer-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* Brand + contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>
          <Link to="/" style={{ ...linkReset, display: "flex", alignItems: "center", gap: "12px", width: "fit-content" }}>
            <AbuAlAnasLogo size={48} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", lineHeight: 1.25 }}>
              <span style={{ fontSize: "15px", fontWeight: 700, color: colors.textPrimary, letterSpacing: "-0.2px" }}>
                {t("nav:brandName")}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: colors.primary }}>{t("nav:brandTagline")}</span>
            </div>
          </Link>

          <div>
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "18px",
                fontWeight: 700,
                color: colors.textPrimary,
                letterSpacing: "-0.2px",
                lineHeight: 1.2,
              }}
            >
              {t("home:footer.stayInTouch")}
            </h2>
            <p style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: 600, color: colors.textSecondary }}>
              {t("home:footer.phoneLabel")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {PHONES.map(({ display, tel }) => (
                <a
                  key={tel}
                  href={`tel:${tel}`}
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: colors.primary,
                    textDecoration: "none",
                    width: "fit-content",
                    borderBottom: `1px solid transparent`,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.primaryHover;
                    e.currentTarget.style.borderBottomColor = colors.primaryBorder;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.primary;
                    e.currentTarget.style.borderBottomColor = "transparent";
                  }}
                >
                  {display}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <nav aria-label={t("home:footer.categoriesAria")} style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: "0 0 10px",
              fontSize: "12px",
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: "0.2px",
              textTransform: "uppercase",
            }}
          >
            {t("home:footer.categoriesTitle")}
          </h3>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: "8px 14px",
              alignItems: "center",
            }}
          >
            {CATEGORY_NAV_IDS.map((id) => (
              <li key={id}>
                <Link
                  to={{ pathname: "/", search: `?cat=${id}` }}
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: colors.textSecondary,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "9999px",
                      background: colors.primaryBorder,
                      flexShrink: 0,
                    }}
                  />
                  {t(`home:categories.${id}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div
        dir={dir}
        style={{
          borderTop: `1px solid ${colors.primaryBorder}`,
          background: colors.footerCreditSurface,
          padding: "10px 20px 12px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              lineHeight: "16px",
              color: colors.textMuted,
              textAlign: "center",
            }}
          >
            © {new Date().getFullYear()} {t("nav:brandName")}. {t("home:footer.rights")}
          </p>
          <div
            onMouseEnter={() => setCreditHovered(true)}
            onMouseLeave={() => setCreditHovered(false)}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                margin: 0,
                fontSize: "11px",
                lineHeight: "16px",
                color: colors.textMuted,
                textAlign: "center",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "6px",
              }}
            >
              <span>{t("home:footer.creditPrefix")}</span>
              <DeveloperMark logoSrc={DEVELOPER_CREDIT.logoSrc} hovered={creditHovered} size={24} />
              {devUrl ? (
                <a
                  href={devUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={nameAccentStyle}
                >
                  {devName}
                </a>
              ) : (
                <span style={nameAccentStyle}>{devName}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
