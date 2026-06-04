import { useGuestCheckoutNavigation } from "../features/cart/useGuestCheckoutNavigation";
import { formatChargedTotal } from "../utils/formatPrice";

const shadowPrimary = "0 4px 14px rgba(30,107,60,0.30)";

/**
 * @param {{
 *   label: string;
 *   lang: string;
 *   payableTotal?: number;
 *   onBeforeNavigate?: () => void;
 *   style?: import('react').CSSProperties;
 * }} props
 */
const GuestCheckoutProceedButton = ({ label, lang, payableTotal = 0, onBeforeNavigate, style }) => {
  const { goToCheckout } = useGuestCheckoutNavigation();

  return (
    <button
      type="button"
      onClick={() => goToCheckout({ onBeforeNavigate })}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 24px",
        borderRadius: "10px",
        border: "none",
        background: "#1e6b3c",
        color: "#ffffff",
        fontSize: "15px",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: shadowPrimary,
        ...style
      }}
    >
      {label}
      {payableTotal > 0 ? <> ({formatChargedTotal(payableTotal, lang)})</> : null}
    </button>
  );
};

export default GuestCheckoutProceedButton;
