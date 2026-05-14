import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, X } from "lucide-react";
import {
  FLOATING_NAV_OVERLAY_Z,
  dismissGlassChipStyle,
  liquidGlassBrandFabBase,
  liquidGlassFabPointerHover,
} from "./floatingFabGlass";

/** sessionStorage: hidden until tab/window is closed (refresh keeps hidden). */
export const FLOATING_NAVIGATION_HIDDEN_SESSION_KEY =
  "floating_navigation_hidden_session";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=32.807389,35.364750&travelmode=driving";
const WAZE_URL = "https://waze.com/ul?ll=32.807389,35.364750&navigate=yes";

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
  primarySurface: "rgba(238, 247, 241, 0.72)",
  primaryBorder: "rgba(163, 207, 180, 0.65)",
  textPrimary: "#1c1917",
  textSecondary: "#57534e",
  surface: "rgba(255, 255, 255, 0.82)",
  border: "rgba(232, 227, 220, 0.85)",
};

const linkBase = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: 600,
  color: colors.textPrimary,
  textDecoration: "none",
  borderRadius: "8px",
  transition: "background 0.15s, color 0.15s",
  textAlign: "start",
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
  wordBreak: "break-word",
};

function readSessionHidden(key) {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeSessionHidden(key) {
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

function useFloatingNavSheetLayout() {
  const [useSheet, setUseSheet] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setUseSheet(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return useSheet;
}

function getAnchoredPanelPosition(placement, mode) {
  const edgeStyle =
    placement === "above"
      ? {
          bottom: "100%",
          marginBottom: "8px",
          marginTop: 0,
          top: "auto",
        }
      : {
          top: "100%",
          marginTop: "8px",
          marginBottom: 0,
          bottom: "auto",
        };

  if (placement === "above" && mode === "fabEdge") {
    return {
      ...edgeStyle,
      insetInlineEnd: 0,
      insetInlineStart: "auto",
      transform: "none",
    };
  }
  if (placement === "above") {
    return {
      ...edgeStyle,
      insetInlineStart: "50%",
      insetInlineEnd: "auto",
      transform: "translateX(-50%)",
    };
  }
  return {
    ...edgeStyle,
    insetInlineStart: 0,
    insetInlineEnd: "auto",
    transform: "none",
  };
}

function NavMapsLinks({ onPick }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <a
        href={GOOGLE_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseDown={onPick}
        style={linkBase}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primarySurface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span>Google Maps</span>
      </a>
      <a
        href={WAZE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseDown={onPick}
        style={linkBase}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primarySurface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <span>Waze</span>
      </a>
    </div>
  );
}

function NavLinksPanel({ menuId, onClose, placement, horizontalMode }) {
  const { t } = useTranslation("home");
  const close = onClose;
  const pos = getAnchoredPanelPosition(placement, horizontalMode);

  const motionFrom =
    placement === "above" ? { opacity: 0, y: 8 } : { opacity: 0, y: -6 };
  const motionExit =
    placement === "above" ? { opacity: 0, y: 4 } : { opacity: 0, y: -4 };

  return (
    <motion.div
      key="store-nav-panel"
      id={menuId}
      role="region"
      aria-label={t("footer.navigateMenuAria")}
      initial={motionFrom}
      animate={{ opacity: 1, y: 0 }}
      exit={motionExit}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        position: "absolute",
        zIndex: 10,
        ...pos,
        width: "min(260px, calc(100vw - 32px))",
        maxWidth: "calc(100vw - 16px)",
        padding: "8px",
        borderRadius: "12px",
        boxSizing: "border-box",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.72) 100%)",
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(20px) saturate(165%)",
        WebkitBackdropFilter: "blur(20px) saturate(165%)",
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.65)",
      }}
    >
      <p
        style={{
          margin: "0 0 6px",
          paddingInline: "8px",
          fontSize: "12px",
          fontWeight: 700,
          color: colors.textSecondary,
          lineHeight: 1.35,
          textAlign: "start",
          wordBreak: "break-word",
        }}
      >
        {t("footer.navigateToStore")}
      </p>
      <NavMapsLinks onPick={close} />
    </motion.div>
  );
}

function FloatingNavMobileSheet({ menuId, open, dir, onClose }) {
  const { t } = useTranslation(["home", "cart"]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="store-nav-sheet-backdrop"
            type="button"
            aria-label={t("cart:drawerClose")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              margin: 0,
              padding: 0,
              border: "none",
              cursor: "pointer",
              background: "rgba(0,0,0,0.28)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: FLOATING_NAV_OVERLAY_Z,
            }}
          />
          <motion.div
            key="store-nav-sheet-panel"
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={t("footer.navigateMenuAria")}
            dir={dir}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              position: "fixed",
              left: "max(16px, env(safe-area-inset-left, 0px))",
              right: "max(16px, env(safe-area-inset-right, 0px))",
              bottom:
                "max(140px, calc(env(safe-area-inset-bottom, 0px) + 120px))",
              zIndex: FLOATING_NAV_OVERLAY_Z + 1,
              maxHeight: "min(320px, 70vh)",
              overflow: "auto",
              padding: "12px",
              borderRadius: "16px",
              boxSizing: "border-box",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
              border: `1px solid ${colors.border}`,
              backdropFilter: "blur(22px) saturate(170%)",
              WebkitBackdropFilter: "blur(22px) saturate(170%)",
              boxShadow:
                "0 16px 48px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                paddingInline: "4px",
                fontSize: "13px",
                fontWeight: 700,
                color: colors.textSecondary,
                lineHeight: 1.35,
                textAlign: "start",
                wordBreak: "break-word",
              }}
            >
              {t("footer.navigateToStore")}
            </p>
            <NavMapsLinks onPick={onClose} />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function useDismissOnOpen(open, setOpen, rootRef, useSheet) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open || useSheet) return;
    const onDocMouseDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, setOpen, rootRef, useSheet]);
}

/**
 * Compact header control (next to operating hours). Reuses the same Google Maps / Waze
 * menu as the footer and floating FAB — no duplicate URLs or link markup.
 */
export function HeaderStoreNavigation({ menuOpen = false }) {
  const { t, i18n } = useTranslation(["nav", "home"]);
  const location = useLocation();
  const dir = i18n.dir();
  const useSheet = useFloatingNavSheetLayout();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  useDismissOnOpen(open, setOpen, rootRef, useSheet);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) setOpen(false);
  }, [menuOpen]);

  const title = t("nav:navigateToStoreTooltip");

  return (
    <>
      <div
        ref={rootRef}
        style={{
          position: "relative",
          flexShrink: 0,
          zIndex: open ? 160 : undefined,
        }}
      >
        <motion.button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="true"
          aria-label={title}
          title={title}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            padding: 0,
            borderRadius: "8px",
            border: "none",
            background: open ? colors.primarySurface : "transparent",
            color: open ? colors.primary : colors.textSecondary,
            cursor: "pointer",
            boxSizing: "border-box",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <MapPin size={16} strokeWidth={2} aria-hidden />
        </motion.button>

        <AnimatePresence>
          {open && !useSheet ? (
            <NavLinksPanel
              menuId={menuId}
              onClose={() => setOpen(false)}
              placement="below"
              horizontalMode="footer"
            />
          ) : null}
        </AnimatePresence>
      </div>

      <FloatingNavMobileSheet
        menuId={menuId}
        open={open && useSheet}
        dir={dir}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/** Compact footer row: map icon + short label, opens maps menu below. */
export function FooterStoreNavigation() {
  const { t } = useTranslation("home");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  useDismissOnOpen(open, setOpen, rootRef, false);

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", width: "fit-content", marginTop: "16px" }}
    >
      <motion.button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        aria-label={`${t("footer.locationShort")}. ${t("footer.navigateToStore")}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.12 }}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 10px",
          borderRadius: "8px",
          border: `1px solid ${colors.primaryBorder}`,
          background: colors.surface,
          color: colors.primary,
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          transition: "background 0.15s, border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = colors.primarySurface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = colors.surface;
        }}
      >
        <MapPin size={18} strokeWidth={2} aria-hidden />
        <span>{t("footer.locationShort")}</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <NavLinksPanel
            menuId={menuId}
            onClose={() => setOpen(false)}
            placement="below"
            horizontalMode="footer"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Fixed FAB: map pin, menu opens upward; dismiss X uses sessionStorage for this tab only. */
export function FloatingStoreNavigationFab({ size = 56 }) {
  const { t, i18n } = useTranslation("home");
  const dir = i18n.dir();
  const useSheet = useFloatingNavSheetLayout();
  const [hidden, setHidden] = useState(() =>
    readSessionHidden(FLOATING_NAVIGATION_HIDDEN_SESSION_KEY)
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  useDismissOnOpen(open, setOpen, rootRef, useSheet);

  if (hidden) return null;

  const iconSize = Math.max(20, Math.round((size * 22) / 56));

  const dismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    writeSessionHidden(FLOATING_NAVIGATION_HIDDEN_SESSION_KEY);
    setHidden(true);
  };

  const fabStyle = liquidGlassBrandFabBase(size);

  return (
    <>
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          aria-label={t("footer.dismissFloatingNavAria")}
          title={t("footer.dismissFloatingNavAria")}
          onClick={dismiss}
          style={dismissGlassChipStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.06)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = dismissGlassChipStyle.boxShadow;
          }}
        >
          <X size={10} strokeWidth={2.5} color={colors.textSecondary} aria-hidden />
        </button>

        <div
          ref={rootRef}
          style={{
            position: "relative",
            width: size,
            height: size,
          }}
        >
          <motion.button
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            aria-haspopup="true"
            aria-label={t("footer.navigateToStore")}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen((v) => !v)}
            style={{
              ...fabStyle,
              outline: "none",
            }}
            onMouseEnter={(e) => liquidGlassFabPointerHover(e, true)}
            onMouseLeave={(e) => liquidGlassFabPointerHover(e, false)}
            onFocus={(e) => {
              e.currentTarget.style.outline = "2px solid rgba(30,107,60,0.45)";
              e.currentTarget.style.outlineOffset = "2px";
            }}
            onBlur={(e) => {
              e.currentTarget.style.outline = "none";
            }}
          >
            <MapPin size={iconSize} strokeWidth={2} aria-hidden />
          </motion.button>

          <AnimatePresence>
            {open && !useSheet ? (
              <NavLinksPanel
                menuId={menuId}
                onClose={() => setOpen(false)}
                placement="above"
                horizontalMode="fabEdge"
              />
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <FloatingNavMobileSheet
        menuId={menuId}
        open={open && useSheet}
        dir={dir}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
