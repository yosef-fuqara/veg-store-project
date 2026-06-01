import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { computeMobileHeaderPopoverPosition } from "../utils/mobileHeaderPopover";

/**
 * Tracks fixed position for a mobile header popover anchored to a trigger button.
 *
 * @param {React.RefObject<HTMLElement | null>} anchorRef
 * @param {React.RefObject<HTMLElement | null>} popoverRef
 * @param {boolean} open
 * @param {{ desiredWidth?: number }} [options]
 */
export function useMobileHeaderPopoverPosition(anchorRef, popoverRef, open, options = {}) {
  const { desiredWidth = 260 } = options;
  const [style, setStyle] = useState({});

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor || !open || typeof window === "undefined") return;
    const rect = anchor.getBoundingClientRect();
    const popover = popoverRef.current;
    const measured =
      popover?.offsetWidth || popover?.scrollWidth || desiredWidth;
    setStyle(computeMobileHeaderPopoverPosition(rect, measured));
  }, [anchorRef, popoverRef, open, desiredWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle({});
      return undefined;
    }
    updatePosition();
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onReflow = () => updatePosition();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [open, updatePosition]);

  return style;
}

/**
 * Closes on outside pointer down or Escape (listener deferred one frame).
 *
 * @param {{
 *   anchorRef: React.RefObject<HTMLElement | null>;
 *   popoverRef: React.RefObject<HTMLElement | null>;
 *   open: boolean;
 *   onClose: () => void;
 * }} params
 */
export function useMobileHeaderPopoverDismiss({ anchorRef, popoverRef, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    let attached = false;
    let frameId = 0;

    const onPointerDown = (e) => {
      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      const target = e.target;
      if (
        target instanceof Node &&
        anchor &&
        !anchor.contains(target) &&
        !(popover && popover.contains(target))
      ) {
        onClose();
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const attach = () => {
      attached = true;
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("touchstart", onPointerDown, { passive: true });
      document.addEventListener("keydown", onKeyDown);
    };

    const detach = () => {
      if (!attached) return;
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      attached = false;
    };

    frameId = requestAnimationFrame(attach);
    return () => {
      cancelAnimationFrame(frameId);
      detach();
    };
  }, [open, onClose, anchorRef, popoverRef]);
}

/**
 * @returns {React.RefObject<HTMLElement | null>}
 */
export function useMobileHeaderPopoverRefs() {
  const anchorRef = useRef(null);
  const popoverRef = useRef(null);
  return { anchorRef, popoverRef };
}
