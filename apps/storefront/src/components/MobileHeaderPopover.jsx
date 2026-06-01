import { useRef } from "react";
import { createPortal } from "react-dom";
import {
  useMobileHeaderPopoverDismiss,
  useMobileHeaderPopoverPosition,
} from "../hooks/useMobileHeaderPopover";

/**
 * Mobile-only portaled popover anchored under a header icon trigger.
 *
 * @param {{
 *   anchorRef: import('react').RefObject<HTMLElement | null>;
 *   open: boolean;
 *   onClose: () => void;
 *   children: import('react').ReactNode;
 *   dir?: string;
 *   id?: string;
 *   role?: string;
 *   ariaLabel?: string;
 *   desiredWidth?: number;
 *   panelStyle?: import('react').CSSProperties;
 *   popoverRef?: import('react').RefObject<HTMLElement | null>;
 * }} props
 */
export default function MobileHeaderPopover({
  anchorRef,
  open,
  onClose,
  children,
  dir,
  id,
  role = "dialog",
  ariaLabel,
  desiredWidth = 260,
  panelStyle = {},
  popoverRef: popoverRefProp,
}) {
  const internalPopoverRef = useRef(null);
  const popoverRef = popoverRefProp ?? internalPopoverRef;
  const positionStyle = useMobileHeaderPopoverPosition(anchorRef, popoverRef, open, {
    desiredWidth,
  });

  useMobileHeaderPopoverDismiss({ anchorRef, popoverRef, open, onClose });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      id={id}
      role={role}
      aria-label={ariaLabel}
      dir={dir}
      style={{
        ...positionStyle,
        opacity: 1,
        visibility: "visible",
        pointerEvents: "auto",
        ...panelStyle,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
