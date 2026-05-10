import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getActiveAnnouncement } from "../services/announcementService";

const STORAGE_KEY = "vegstore_promotion_dismissed_ids";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primaryLight: "#2d8a55",
  surface: "#ffffff",
  cream: "#faf7f0",
  creamDeep: "#f3ede2",
  mint: "#e8f4ec",
  mintSoft: "#d4eadc",
  border: "#e8e3dc",
  borderSoft: "rgba(30, 107, 60, 0.12)",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  textInverse: "#ffffff",
  primarySurface: "#eef7f1",
  leaf: "rgba(30, 107, 60, 0.12)",
  leafDeep: "rgba(30, 107, 60, 0.2)",
  accentGold: "#c9a227",
  accentWarm: "#c47f17",
  accentBrown: "#9a5c1a"
};

const shadow = {
  overlay: "0 32px 64px rgba(28, 25, 23, 0.14), 0 12px 28px rgba(28, 25, 23, 0.08)",
  cta: "0 10px 28px rgba(30, 107, 60, 0.35), 0 4px 14px rgba(154, 92, 26, 0.2)",
  close: "0 2px 10px rgba(30, 107, 60, 0.12)"
};

const fontStack =
  "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";

function loadDismissedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

function rememberDismissed(id) {
  const set = loadDismissedIds();
  set.add(String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/** Reference-style scattered leaves: brand green + warm gold accents, RTL-aware. */
function PromoDecor({ isRtl }) {
  const flip = isRtl ? { transform: "scaleX(-1)" } : {};
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none",
        zIndex: 0
      }}
    >
      <svg
        width="90"
        height="110"
        viewBox="0 0 90 110"
        style={{
          position: "absolute",
          top: "18%",
          left: isRtl ? undefined : "4px",
          right: isRtl ? "4px" : undefined,
          opacity: 0.85,
          ...flip
        }}
      >
        <path
          d="M12 88 C8 52 28 22 48 8 C38 38 32 68 12 88Z"
          fill={colors.accentGold}
          opacity={0.35}
        />
        <path
          d="M22 92 C18 58 42 32 62 18 C48 48 38 72 22 92Z"
          fill={colors.primary}
          opacity={0.2}
        />
      </svg>
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          top: "8px",
          right: isRtl ? undefined : "8px",
          left: isRtl ? "8px" : undefined,
          opacity: 0.9,
          ...flip
        }}
      >
        <path
          d="M72 12 C88 32 84 58 68 78 C62 48 66 28 72 12Z"
          fill={colors.primaryLight}
          opacity={0.25}
        />
        <path
          d="M78 18 C92 40 86 62 70 82 C70 52 74 32 78 18Z"
          fill={colors.accentWarm}
          opacity={0.28}
        />
      </svg>
      <svg
        width="120"
        height="90"
        viewBox="0 0 120 90"
        style={{
          position: "absolute",
          bottom: "6px",
          left: isRtl ? undefined : "6px",
          right: isRtl ? "6px" : undefined,
          opacity: 0.88,
          ...flip
        }}
      >
        <path
          d="M8 72 C28 48 52 32 80 28 C52 44 28 60 8 72Z"
          fill={colors.accentGold}
          opacity={0.32}
        />
        <path
          d="M4 78 C32 54 58 40 88 36 C56 52 28 68 4 78Z"
          fill={colors.primary}
          opacity={0.18}
        />
      </svg>
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        style={{
          position: "absolute",
          top: "-40px",
          ...(isRtl ? { left: "-48px" } : { right: "-48px" }),
          opacity: 0.55,
          ...flip
        }}
      >
        <ellipse cx="100" cy="72" rx="56" ry="88" fill={colors.leaf} transform="rotate(-28 100 72)" />
        <ellipse cx="118" cy="96" rx="32" ry="62" fill={colors.leafDeep} transform="rotate(12 118 96)" />
      </svg>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M4.5 4.5l9 9M13.5 4.5l-9 9"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PromoCta({ href, onNavigate, children, nativeButton = false }) {
  const isInternal =
    typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
  const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 28px",
    borderRadius: "9999px",
    background: `linear-gradient(105deg, ${colors.accentBrown} 0%, ${colors.accentWarm} 18%, ${colors.primaryLight} 42%, ${colors.primary} 72%, ${colors.primaryHover} 100%)`,
    color: colors.textInverse,
    fontSize: "16px",
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: shadow.cta,
    border: "none",
    cursor: "pointer",
    fontFamily: fontStack,
    transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease"
  };
  const hoverOn = (e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.filter = "brightness(1.05)";
    e.currentTarget.style.boxShadow =
      "0 14px 32px rgba(30, 107, 60, 0.38), 0 6px 16px rgba(154, 92, 26, 0.22)";
  };
  const hoverOff = (e) => {
    e.currentTarget.style.transform = "";
    e.currentTarget.style.filter = "";
    e.currentTarget.style.boxShadow = shadow.cta;
  };
  if (nativeButton) {
    return (
      <button
        type="button"
        onClick={onNavigate}
        style={{ ...btnStyle, width: "100%" }}
        onMouseEnter={hoverOn}
        onMouseLeave={hoverOff}
      >
        {children}
      </button>
    );
  }
  if (isInternal) {
    return (
      <Link to={href} onClick={onNavigate} style={btnStyle} onMouseEnter={hoverOn} onMouseLeave={hoverOff}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      style={btnStyle}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
    >
      {children}
    </a>
  );
}

function pickCtaLabel(cta, lang, fallback) {
  if (!cta || !cta.text || typeof cta.text !== "object") return fallback;
  const key = (lang || "he").split("-")[0].toLowerCase();
  const t = cta.text;
  const fromLang = t[key] || t.he || t.en || t.ar || "";
  const s = typeof fromLang === "string" ? fromLang.trim() : "";
  return s || fallback;
}

function isCtaActionable(cta) {
  if (!cta || !cta.type) return false;
  if (cta.type === "product") return Boolean(cta.productId && String(cta.productId).trim());
  if (cta.type === "category") return Boolean(cta.categoryId && String(cta.categoryId).trim());
  if (cta.type === "custom") return Boolean(cta.url && String(cta.url).trim());
  return false;
}

/**
 * Fetches the active promotion after a short delay and shows a dismissible modal.
 */
const PromotionPopup = () => {
  const { t, i18n } = useTranslation("promotion");
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    const read = () => setIsRtl(document.documentElement.getAttribute("dir") === "rtl");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
    return () => observer.disconnect();
  }, []);

  const close = useCallback(() => {
    if (announcement?.id) {
      rememberDismissed(announcement.id);
    }
    setOpen(false);
  }, [announcement]);

  useEffect(() => {
    const delayMs = 2000 + Math.floor(Math.random() * 3001);
    const timer = setTimeout(async () => {
      try {
        const data = await getActiveAnnouncement();
        if (!data?.id) return;
        const end = new Date(data.endsAt).getTime();
        if (Number.isFinite(end) && end < Date.now()) return;
        if (loadDismissedIds().has(String(data.id))) return;
        setAnnouncement(data);
        setOpen(true);
      } catch {
        /* ignore network errors — popup is non-critical */
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (typeof document === "undefined") return null;

  const cta = announcement?.cta;
  const showCta = announcement && isCtaActionable(cta);
  const ctaLabel = pickCtaLabel(cta, i18n.language, t("shopNow"));

  const runCtaNavigation = () => {
    if (!announcement || !cta) return;
    close();
    if (cta.type === "product" && cta.productId) {
      navigate(`/?product=${encodeURIComponent(String(cta.productId))}`);
      return;
    }
    if (cta.type === "category" && cta.categoryId) {
      navigate(`/?categoryId=${encodeURIComponent(String(cta.categoryId))}`);
      return;
    }
    if (cta.type === "custom" && cta.url?.trim()) {
      const url = cta.url.trim();
      const isInternal = url.startsWith("/") && !url.startsWith("//");
      if (isInternal) {
        navigate(url);
      } else {
        window.location.assign(url);
      }
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && announcement && (
        <motion.div
          key="promo-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10050,
            background: "rgba(28, 25, 23, 0.45)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box"
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="promotion-popup-title"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? "rtl" : "ltr"}
            style={{
              width: "100%",
              maxWidth: "min(420px, calc(100vw - 32px))",
              maxHeight: "min(90vh, 720px)",
              overflow: "auto",
              background: `linear-gradient(110deg, ${colors.cream} 0%, ${colors.surface} 42%, ${colors.mint} 88%, ${colors.mintSoft} 100%)`,
              borderRadius: "28px",
              border: `1px solid ${colors.border}`,
              boxShadow: shadow.overlay,
              position: "relative",
              fontFamily: fontStack,
              isolation: "isolate",
              padding: "14px 14px 22px",
              boxSizing: "border-box"
            }}
          >
            <PromoDecor isRtl={isRtl} />

            <button
              type="button"
              aria-label="Close"
              onClick={close}
              style={{
                position: "absolute",
                top: "12px",
                insetInlineEnd: "12px",
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                border: `1.5px solid ${colors.primary}`,
                background: colors.mintSoft,
                color: colors.primary,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                zIndex: 4,
                boxShadow: shadow.close,
                transition: "color 0.15s ease, background 0.15s ease, transform 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.primarySurface;
                e.currentTarget.style.color = colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.mintSoft;
                e.currentTarget.style.color = colors.primary;
              }}
            >
              <CloseIcon />
            </button>

            {announcement.imageUrl ? (
              <div
                style={{
                  position: "relative",
                  zIndex: 1,
                  marginTop: "4px",
                  borderRadius: "22px",
                  overflow: "hidden",
                  background: colors.creamDeep,
                  boxShadow: `0 8px 24px ${colors.borderSoft}`
                }}
              >
                <img
                  src={announcement.imageUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    maxHeight: "min(220px, 34vh)",
                    objectFit: "cover",
                    verticalAlign: "middle"
                  }}
                />
              </div>
            ) : (
              <div aria-hidden style={{ height: "36px", position: "relative", zIndex: 1 }} />
            )}

            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: announcement.imageUrl ? "16px 8px 0" : "12px 8px 0",
                textAlign: "center"
              }}
            >
              <h2
                id="promotion-popup-title"
                style={{
                  fontSize: "clamp(26px, 6vw, 34px)",
                  fontWeight: 800,
                  color: colors.textPrimary,
                  margin: "0 0 14px",
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em"
                }}
              >
                {announcement.title}
              </h2>
              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.65,
                  color: colors.textSecondary,
                  margin: "0 0 22px",
                  whiteSpace: "pre-wrap",
                  fontWeight: 500,
                  maxWidth: "36em",
                  marginInline: "auto"
                }}
              >
                {announcement.message}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  maxWidth: "320px",
                  marginInline: "auto"
                }}
              >
                {showCta ? (
                  cta.type === "custom" ? (
                    <PromoCta href={cta.url.trim()} onNavigate={close}>
                      {ctaLabel}
                    </PromoCta>
                  ) : (
                    <PromoCta href="/" nativeButton onNavigate={runCtaNavigation}>
                      {ctaLabel}
                    </PromoCta>
                  )
                ) : null}
                <button
                  type="button"
                  onClick={close}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "9999px",
                    border: "none",
                    background: "transparent",
                    color: colors.textSecondary,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: fontStack,
                    textDecoration: "underline",
                    textUnderlineOffset: "3px"
                  }}
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PromotionPopup;
