import { STOREFRONT_HEADER_POPOVER_Z } from "./storefrontNavScroll";

/** Horizontal inset from viewport edges (px). */
export const MOBILE_HEADER_POPOVER_MARGIN = 12;

/** Gap between anchor bottom and popover top (px). */
export const MOBILE_HEADER_POPOVER_GAP = 8;

/**
 * Fixed position under an anchor, centered on the anchor and clamped to the viewport.
 * Uses physical `left`/`top` from getBoundingClientRect (works in LTR and RTL).
 *
 * @param {DOMRect} anchorRect
 * @param {number} popoverWidth — measured or desired width in px
 * @returns {import('react').CSSProperties}
 */
export function computeMobileHeaderPopoverPosition(anchorRect, popoverWidth) {
  const margin = MOBILE_HEADER_POPOVER_MARGIN;
  const gap = MOBILE_HEADER_POPOVER_GAP;
  const viewportWidth = window.innerWidth;
  const maxWidth = viewportWidth - margin * 2;
  const width = Math.min(Math.max(popoverWidth, 0), maxWidth);
  const centerX = anchorRect.left + anchorRect.width / 2;
  let left = centerX - width / 2;
  left = Math.max(margin, Math.min(left, viewportWidth - width - margin));
  const top = anchorRect.bottom + gap;

  return {
    position: "fixed",
    top: `${top}px`,
    left: `${left}px`,
    width: width > 0 ? `${width}px` : undefined,
    minWidth: 0,
    maxWidth: `calc(100vw - ${margin * 2}px)`,
    zIndex: STOREFRONT_HEADER_POPOVER_Z,
    boxSizing: "border-box",
  };
}
