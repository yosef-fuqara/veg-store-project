import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useDir } from "../../i18n/useDir";
import { fillLegalTokens } from "../../config/legalEntity";

const colors = {
  primary: "#1e6b3c",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  border: "#e8e3dc",
  bg: "#faf8f5",
  surface: "#ffffff",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textMuted: "#a8a29e"
};

const fill = (value) =>
  Array.isArray(value) ? value.map(fillLegalTokens) : fillLegalTokens(value);

/**
 * Generic renderer for a legal/policy document defined in the `legal` i18n
 * namespace under `pages.<pageKey>`. Each document has a title, optional intro,
 * and an array of sections ({ heading, body[], items[] }).
 *
 * @param {{ pageKey: string }} props
 */
const LegalDocPage = ({ pageKey }) => {
  const { t } = useTranslation("legal");
  const { dir } = useDir();

  const page = useMemo(
    () => t(`pages.${pageKey}`, { returnObjects: true }) || {},
    [t, pageKey]
  );
  const sections = Array.isArray(page.sections) ? page.sections : [];
  const lastUpdated = `${t("meta.lastUpdatedLabel")}: ${t("meta.lastUpdated")}`;

  return (
    <section
      dir={dir}
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "40px 20px 64px",
        background: colors.bg
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          padding: "clamp(20px, 4vw, 40px)"
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            color: colors.textPrimary,
            lineHeight: 1.2,
            textAlign: "start"
          }}
        >
          {fillLegalTokens(page.title)}
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: "13px", color: colors.textMuted }}>
          {lastUpdated}
        </p>

        {page.intro ? (
          <p
            style={{
              margin: "0 0 24px",
              fontSize: "16px",
              color: colors.textSecondary,
              lineHeight: 1.7,
              textAlign: "start"
            }}
          >
            {fillLegalTokens(page.intro)}
          </p>
        ) : null}

        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "24px" }}>
            <h2
              style={{
                margin: "0 0 10px",
                fontSize: "18px",
                fontWeight: 700,
                color: colors.textPrimary,
                lineHeight: 1.35,
                textAlign: "start"
              }}
            >
              {fillLegalTokens(section.heading)}
            </h2>
            {(Array.isArray(section.body) ? section.body : []).map((para, pIdx) => (
              <p
                key={pIdx}
                style={{
                  margin: "0 0 10px",
                  fontSize: "15px",
                  color: colors.textSecondary,
                  lineHeight: 1.7,
                  textAlign: "start"
                }}
              >
                {fillLegalTokens(para)}
              </p>
            ))}
            {Array.isArray(section.items) && section.items.length ? (
              <ul
                style={{
                  margin: "8px 0 0",
                  paddingInlineStart: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                {section.items.map((item, iIdx) => (
                  <li
                    key={iIdx}
                    style={{
                      fontSize: "15px",
                      color: colors.textSecondary,
                      lineHeight: 1.6,
                      textAlign: "start"
                    }}
                  >
                    {fillLegalTokens(item)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}

        {/* Law prevails + cautious note */}
        <div
          style={{
            marginTop: "8px",
            padding: "16px 18px",
            borderRadius: "12px",
            background: colors.primarySurface,
            border: `1px solid ${colors.primaryBorder}`
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "15px",
              fontWeight: 700,
              color: colors.primary,
              textAlign: "start"
            }}
          >
            {t("meta.lawPrevailsHeading")}
          </h2>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: colors.textSecondary, lineHeight: 1.6, textAlign: "start" }}>
            {t("meta.lawPrevails")}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: colors.textMuted, lineHeight: 1.6, textAlign: "start" }}>
            {t("meta.cautiousNote")}
          </p>
        </div>

        {/* Contact */}
        <div style={{ marginTop: "20px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 700, color: colors.textPrimary, textAlign: "start" }}>
            {t("meta.contactHeading")}
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: colors.textSecondary, lineHeight: 1.6, textAlign: "start" }}>
            {fill(t("meta.contactBody"))}
          </p>
        </div>

        <div style={{ marginTop: "28px" }}>
          <Link
            to="/"
            style={{
              color: colors.primary,
              fontWeight: 600,
              fontSize: "14px",
              textDecoration: "none"
            }}
          >
            ← {t("meta.backHome")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
};

export default LegalDocPage;
