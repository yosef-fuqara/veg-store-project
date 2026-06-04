import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import GuestAccountPromptModal from "../../components/GuestAccountPromptModal";
import {
  isGuestAccountPromptDismissed,
  isGuestCheckoutPromptDismissed,
  isGuestShopper,
  markGuestAccountPromptDismissed,
  markGuestCheckoutPromptDismissed
} from "../../utils/guestAccountPromptSession";

const GuestAccountPromptContext = createContext(null);

export function GuestAccountPromptProvider({ children }) {
  const [open, setOpen] = useState(false);
  const pendingContinueRef = useRef(null);

  const runPendingContinue = useCallback(() => {
    const cont = pendingContinueRef.current;
    pendingContinueRef.current = null;
    cont?.();
  }, []);

  /**
   * After the guest's first successful add-to-cart. Caller checks empty cart;
   * this enforces guest + once per session.
   */
  const openPrompt = useCallback(() => {
    pendingContinueRef.current = null;
    setOpen(true);
  }, []);

  const maybeShowGuestAccountPrompt = useCallback(() => {
    if (!isGuestShopper() || isGuestAccountPromptDismissed()) return;
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => openPrompt());
      return;
    }
    openPrompt();
  }, [openPrompt]);

  /**
   * Before navigating to checkout as a guest. Uses a separate session flag from
   * the first add-to-cart prompt so mobile shoppers still see this at checkout.
   *
   * @param {() => void} onContinue
   * @param {{ onPromptOpen?: () => void }} [options] — e.g. close cart drawer so the modal is visible
   */
  const maybeShowGuestAccountPromptForCheckout = useCallback((onContinue, options = {}) => {
    const { onPromptOpen } = options;
    if (!isGuestShopper()) {
      onContinue?.();
      return;
    }
    if (isGuestCheckoutPromptDismissed()) {
      onPromptOpen?.();
      onContinue?.();
      return;
    }
    pendingContinueRef.current = typeof onContinue === "function" ? onContinue : null;
    const show = () => {
      onPromptOpen?.();
      setOpen(true);
    };
    if (typeof window !== "undefined") {
      requestAnimationFrame(show);
      return;
    }
    show();
  }, []);

  const continueWithoutAccount = useCallback(() => {
    if (pendingContinueRef.current) {
      markGuestCheckoutPromptDismissed();
    } else {
      markGuestAccountPromptDismissed();
    }
    setOpen(false);
    runPendingContinue();
  }, [runPendingContinue]);

  const closeGuestAccountPrompt = useCallback(() => {
    if (pendingContinueRef.current) {
      pendingContinueRef.current = null;
      setOpen(false);
      return;
    }
    markGuestAccountPromptDismissed();
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      maybeShowGuestAccountPrompt,
      maybeShowGuestAccountPromptForCheckout
    }),
    [maybeShowGuestAccountPrompt, maybeShowGuestAccountPromptForCheckout]
  );

  return (
    <GuestAccountPromptContext.Provider value={value}>
      {children}
      <GuestAccountPromptModal
        open={open}
        onClose={closeGuestAccountPrompt}
        onContinueWithoutAccount={continueWithoutAccount}
      />
    </GuestAccountPromptContext.Provider>
  );
}

export function useGuestAccountPrompt() {
  const ctx = useContext(GuestAccountPromptContext);
  if (!ctx) {
    throw new Error("useGuestAccountPrompt must be used within GuestAccountPromptProvider");
  }
  return ctx;
}
