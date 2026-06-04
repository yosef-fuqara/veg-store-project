import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGuestAccountPrompt } from "./GuestAccountPromptContext";
import { isGuestShopper } from "../../utils/guestAccountPromptSession";

/**
 * Navigate to checkout, showing the guest account prompt once per session when applicable.
 * @param {{ onBeforeNavigate?: () => void }} [options]
 */
export function useGuestCheckoutNavigation() {
  const navigate = useNavigate();
  const { maybeShowGuestAccountPromptForCheckout } = useGuestAccountPrompt();

  const goToCheckout = useCallback(
    (options = {}) => {
      const proceed = () => {
        navigate("/checkout", { state: { scrollToDelivery: true } });
      };
      if (!isGuestShopper()) {
        options.onBeforeNavigate?.();
        proceed();
        return;
      }
      maybeShowGuestAccountPromptForCheckout(proceed, {
        onPromptOpen: options.onBeforeNavigate
      });
    },
    [navigate, maybeShowGuestAccountPromptForCheckout]
  );

  return { goToCheckout };
}
