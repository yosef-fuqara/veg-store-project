import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import { getNavStoreHoursCompact } from "../utils/storeHoursDisplay";
import {
  STOREFRONT_BUSINESS_HOURS_ID,
  STOREFRONT_STICKY_HEADER_SCROLL_MARGIN,
} from "../utils/storefrontNavScroll";

const colors = {
  primary: "#1e6b3c",
  primarySurface: "#eef7f1",
  primaryBorder: "#a3cfb4",
  textPrimary: "#1c1917",
};

/** Homepage/footer anchor for nav “business hours” deep links. */
export default function BusinessHoursSection() {
  const { t } = useTranslation("nav");
  const { settings, loading } = useStoreSettings();
  const compact = loading ? null : getNavStoreHoursCompact(settings);

  if (!loading && !compact) return null;

  return (
    <section
      id={STOREFRONT_BUSINESS_HOURS_ID}
      aria-labelledby={compact ? "business-hours-heading" : undefined}
      aria-busy={loading || undefined}
      style={{
        scrollMarginTop: STOREFRONT_STICKY_HEADER_SCROLL_MARGIN,
        marginTop: 16,
      }}
    >
      {compact ? (
        <>
          <h3
            id="business-hours-heading"
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: "0.2px",
              textTransform: "uppercase",
            }}
          >
            {t("storeHoursLabel")}
          </h3>
          <p
            style={{
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: colors.primarySurface,
              border: `1px solid ${colors.primaryBorder}`,
              color: colors.primary,
              fontSize: 14,
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            <Clock size={17} strokeWidth={2} aria-hidden />
            <span>{compact}</span>
          </p>
        </>
      ) : null}
    </section>
  );
}
