/**
 * Shared “liquid glass” styles for the storefront floating action cluster
 * (navigation, WhatsApp, cart). Used only by floating FAB components.
 */

/** Backdrop + sheet for mobile navigation picker — below cart drawer (200), above sticky nav (100). */
export const FLOATING_NAV_OVERLAY_Z = 125;

const fabTransition =
  "transform 0.26s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.26s cubic-bezier(0.25, 0.1, 0.25, 1), border-color 0.22s ease, background 0.22s ease, color 0.22s ease";

const fabShadowRest =
  "0 8px 32px rgba(30, 107, 60, 0.12), 0 2px 12px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.58)";

const fabShadowHover =
  "0 12px 40px rgba(30, 107, 60, 0.2), 0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.72)";

export function liquidGlassBrandFabBase(size) {
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
    border: "1px solid rgba(255, 255, 255, 0.52)",
    background:
      "linear-gradient(158deg, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.14) 45%, rgba(30,107,60,0.14) 100%)",
    backdropFilter: "blur(20px) saturate(170%)",
    WebkitBackdropFilter: "blur(20px) saturate(170%)",
    boxShadow: fabShadowRest,
    color: "#1a5c33",
    cursor: "pointer",
    textDecoration: "none",
    transition: fabTransition,
  };
}

export function liquidGlassWhatsAppFabBase(size) {
  return {
    ...liquidGlassBrandFabBase(size),
    background:
      "linear-gradient(158deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.16) 48%, rgba(37,211,102,0.12) 100%)",
    color: "#1fa855",
  };
}

export function liquidGlassFabPointerHover(e, entering) {
  const el = e.currentTarget;
  if (entering) {
    el.style.transform = "scale(1.06)";
    el.style.boxShadow = fabShadowHover;
    el.style.borderColor = "rgba(255, 255, 255, 0.68)";
  } else {
    el.style.transform = "scale(1)";
    el.style.boxShadow = fabShadowRest;
    el.style.borderColor = "rgba(255, 255, 255, 0.52)";
  }
}

export const dismissGlassChipStyle = {
  position: "absolute",
  top: "-2px",
  insetInlineEnd: "-2px",
  width: "18px",
  height: "18px",
  borderRadius: 9999,
  border: "1px solid rgba(255, 255, 255, 0.5)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.18) 100%)",
  backdropFilter: "blur(12px) saturate(150%)",
  WebkitBackdropFilter: "blur(12px) saturate(150%)",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  cursor: "pointer",
  zIndex: 8,
  transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
};
