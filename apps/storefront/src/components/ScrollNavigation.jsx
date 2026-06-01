import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDir } from "../i18n/useDir";

/** Below cart/WhatsApp FAB stack (120), above page chrome. */
const SCROLL_NAV_Z = 118;

const SCROLL_TOP_THRESHOLD_PX = 300;
const NEAR_BOTTOM_THRESHOLD_PX = 120;

const colors = {
  primary: "#1e6b3c",
  primaryHover: "#165430",
};

const fabShadowRest =
  "0 4px 16px rgba(30, 107, 60, 0.1), 0 1px 6px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.55)";

const fabShadowHover =
  "0 6px 20px rgba(30, 107, 60, 0.16), 0 2px 8px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.65)";

function scrollButtonBase(size) {
  return {
    width: size,
    height: size,
    borderRadius: 9999,
    boxSizing: "border-box",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "1px solid rgba(255, 255, 255, 0.5)",
    background:
      "linear-gradient(158deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 48%, rgba(30,107,60,0.1) 100%)",
    backdropFilter: "blur(16px) saturate(165%)",
    WebkitBackdropFilter: "blur(16px) saturate(165%)",
    boxShadow: fabShadowRest,
    color: colors.primary,
    cursor: "pointer",
    transition:
      "transform 0.22s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.22s ease, border-color 0.2s ease, color 0.2s ease",
  };
}

function pointerHover(e, entering) {
  const el = e.currentTarget;
  if (entering) {
    el.style.transform = "scale(1.06)";
    el.style.boxShadow = fabShadowHover;
    el.style.borderColor = "rgba(255, 255, 255, 0.68)";
    el.style.color = colors.primaryHover;
  } else {
    el.style.transform = "scale(1)";
    el.style.boxShadow = fabShadowRest;
    el.style.borderColor = "rgba(255, 255, 255, 0.5)";
    el.style.color = colors.primary;
  }
}

/** FAB cluster (cart, WhatsApp, map) uses inline-end; scroll nav uses inline-start. */
const BOTTOM_INSET = "max(16px, env(safe-area-inset-bottom, 0px))";

function useScrollNavLayout() {
  const { dir } = useDir();
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 480px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const insetInlineStart =
    dir === "rtl"
      ? "max(16px, env(safe-area-inset-right, 0px))"
      : "max(16px, env(safe-area-inset-left, 0px))";

  return {
    btnSize: compact ? 34 : 38,
    btnGap: compact ? 8 : 6,
    bottom: BOTTOM_INSET,
    insetInlineStart,
  };
}

function useScrollVisibility() {
  const [state, setState] = useState({ showTop: false, showBottom: true });
  const rafRef = useRef(null);

  const measure = useCallback(() => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    setState({
      showTop: scrollY >= SCROLL_TOP_THRESHOLD_PX,
      showBottom: scrollY < maxScroll - NEAR_BOTTOM_THRESHOLD_PX,
    });
  }, []);

  useEffect(() => {
    const schedule = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [measure]);

  return state;
}

function scrollToY(y) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: y,
    left: 0,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

function ScrollNavButton({ size, label, onClick, children }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      style={scrollButtonBase(size)}
      onMouseEnter={(e) => pointerHover(e, true)}
      onMouseLeave={(e) => pointerHover(e, false)}
      onFocus={(e) => {
        e.currentTarget.style.outline = "2px solid rgba(30,107,60,0.4)";
        e.currentTarget.style.outlineOffset = "2px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = "none";
      }}
    >
      {children}
    </motion.button>
  );
}

/**
 * Compact scroll-to-top / scroll-to-bottom controls.
 * Opposite bottom corner from the cart · WhatsApp · navigation FAB cluster.
 */
export default function ScrollNavigation() {
  const { t } = useTranslation("nav");
  const { showTop, showBottom } = useScrollVisibility();
  const { btnSize, btnGap, bottom, insetInlineStart } = useScrollNavLayout();

  const iconSize = Math.max(16, Math.round(btnSize * 0.44));

  const scrollTop = () => scrollToY(0);
  const scrollBottom = () => {
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    scrollToY(maxScroll);
  };

  if (!showTop && !showBottom) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label={t("scrollNavGroup")}
      style={{
        position: "fixed",
        insetInlineStart,
        bottom,
        zIndex: SCROLL_NAV_Z,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: btnGap,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence initial={false}>
        {showTop ? (
          <motion.div
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ pointerEvents: "auto" }}
          >
            <ScrollNavButton
              size={btnSize}
              label={t("scrollToTop")}
              onClick={scrollTop}
            >
              <ChevronUp size={iconSize} strokeWidth={2.25} aria-hidden />
            </ScrollNavButton>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showBottom ? (
          <motion.div
            key="scroll-bottom"
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 6 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ pointerEvents: "auto" }}
          >
            <ScrollNavButton
              size={btnSize}
              label={t("scrollToBottom")}
              onClick={scrollBottom}
            >
              <ChevronDown size={iconSize} strokeWidth={2.25} aria-hidden />
            </ScrollNavButton>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
