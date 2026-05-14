import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { STORE_CONTACT_PHONES } from "../config/storeContactPhones";
import {
  dismissGlassChipStyle,
  liquidGlassFabPointerHover,
  liquidGlassWhatsAppFabBase,
} from "./floatingFabGlass";

/** sessionStorage: hidden until tab/window is closed (refresh keeps hidden). */
export const FLOATING_WHATSAPP_HIDDEN_SESSION_KEY =
  "floating_whatsapp_hidden_session";

/** Digits only for wa.me (no +). */
const defaultWaDigits = "972543486348";
const WHATSAPP_DIGITS =
  STORE_CONTACT_PHONES[0]?.tel?.replace(/\D/g, "") || defaultWaDigits;

const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_DIGITS}`;

const textSecondary = "#57534e";

const WhatsAppIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

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

const fabBase = (size) => ({
  width: size,
  height: size,
  borderRadius: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

/** Round WhatsApp link for use inside a fixed bottom bar (e.g. stacked above cart FAB). */
export function WhatsAppFabCircle({ size = 56 }) {
  const { t } = useTranslation("home");
  const ariaLabel = t("footer.whatsappAria");
  const iconSize = Math.max(22, Math.round((size * 28) / 56));
  const style = { ...fabBase(size), ...liquidGlassWhatsAppFabBase(size) };

  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      title={ariaLabel}
      style={style}
      onMouseEnter={(e) => liquidGlassFabPointerHover(e, true)}
      onMouseLeave={(e) => liquidGlassFabPointerHover(e, false)}
      onFocus={(e) => {
        e.currentTarget.style.outline = "2px solid rgba(30,107,60,0.4)";
        e.currentTarget.style.outlineOffset = "2px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = "none";
      }}
    >
      <WhatsAppIcon size={iconSize} />
    </a>
  );
}

/** Same as {@link WhatsAppFabCircle} with a subtle dismiss control; hidden for this session only. */
export function WhatsAppFabDismissible({ size = 56 }) {
  const { t } = useTranslation("home");
  const [hidden, setHidden] = useState(() =>
    readSessionHidden(FLOATING_WHATSAPP_HIDDEN_SESSION_KEY)
  );

  if (hidden) return null;

  const dismiss = (e) => {
    e.preventDefault();
    e.stopPropagation();
    writeSessionHidden(FLOATING_WHATSAPP_HIDDEN_SESSION_KEY);
    setHidden(true);
  };

  return (
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
        aria-label={t("footer.dismissFloatingWhatsappAria")}
        title={t("footer.dismissFloatingWhatsappAria")}
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
        <X size={10} strokeWidth={2.5} color={textSecondary} aria-hidden />
      </button>
      <WhatsAppFabCircle size={size} />
    </div>
  );
}
