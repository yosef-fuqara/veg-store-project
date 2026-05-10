import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const CartVisualFeedbackContext = createContext(null);

const FLY_SIZE = 46;
const PRIMARY = "#1e6b3c";
const PRIMARY_SURFACE = "#eef7f1";

function resolveVisibleAnchor(desktopEl, mobileEl) {
  for (const el of [mobileEl, desktopEl]) {
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return mobileEl || desktopEl;
}

function CartFlyParticle({ spec, onDone }) {
  if (!spec) return null;
  const { x0, y0, dx, dy, imageUrl } = spec;

  return createPortal(
    <motion.div
      layout={false}
      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      animate={{ x: dx, y: dy, scale: 0.35, opacity: 0.15 }}
      transition={{ duration: 0.62, ease: [0.25, 0.1, 0.25, 1] }}
      onAnimationComplete={onDone}
      style={{
        position: "fixed",
        left: x0,
        top: y0,
        width: FLY_SIZE,
        height: FLY_SIZE,
        borderRadius: "14px",
        zIndex: 10001,
        pointerEvents: "none",
        boxShadow: "0 6px 20px rgba(30,107,60,0.35), 0 0 0 1px rgba(30,107,60,0.2)",
        overflow: "hidden",
        background: imageUrl ? "#fff" : `linear-gradient(145deg, ${PRIMARY_SURFACE} 0%, ${PRIMARY} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <span
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)"
          }}
        >
          +1
        </span>
      )}
    </motion.div>,
    document.body
  );
}

function AddedToCartToast({ visible }) {
  const { t, i18n } = useTranslation("cart");
  const lang = String(i18n.language || "he").split("-")[0].toLowerCase();
  const dir = lang === "he" || lang === "ar" ? "rtl" : "ltr";

  return createPortal(
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "max(24px, env(safe-area-inset-bottom, 0px))",
        zIndex: 10002,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        paddingInline: "16px"
      }}
    >
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key="added-to-cart-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            dir={dir}
            style={{
              maxWidth: "min(92vw, 380px)",
              padding: "12px 18px",
              borderRadius: "14px",
              background: PRIMARY,
              color: "#fff",
              fontSize: "15px",
              fontWeight: 600,
              lineHeight: 1.4,
              boxShadow: "0 10px 32px rgba(0,0,0,0.18), 0 4px 12px rgba(30,107,60,0.35)",
              textAlign: "center"
            }}
          >
            {t("addedToCartToast")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export function CartVisualFeedbackProvider({ children }) {
  const desktopCartAnchorRef = useRef(null);
  const mobileCartAnchorRef = useRef(null);
  const [flySpec, setFlySpec] = useState(null);
  const [cartBumpKey, setCartBumpKey] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const toastHideTimerRef = useRef(null);

  useEffect(
    () => () => {
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    },
    []
  );

  const notifyProductAddedToCart = useCallback((detail) => {
    const fromRect = detail?.fromRect;
    const anchor = resolveVisibleAnchor(
      desktopCartAnchorRef.current,
      mobileCartAnchorRef.current
    );

    if (fromRect && anchor) {
      const ar = anchor.getBoundingClientRect();
      const x0 = fromRect.left + fromRect.width / 2 - FLY_SIZE / 2;
      const y0 = fromRect.top + fromRect.height / 2 - FLY_SIZE / 2;
      const x1 = ar.left + ar.width / 2 - FLY_SIZE / 2;
      const y1 = ar.top + ar.height / 2 - FLY_SIZE / 2;
      setFlySpec({
        id: Date.now(),
        x0,
        y0,
        dx: x1 - x0,
        dy: y1 - y0,
        imageUrl: typeof detail.imageUrl === "string" && detail.imageUrl.trim() ? detail.imageUrl : null
      });
    }

    setCartBumpKey((k) => k + 1);
    setToastVisible(true);
    if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    toastHideTimerRef.current = setTimeout(() => setToastVisible(false), 2600);
  }, []);

  const value = useMemo(
    () => ({
      desktopCartAnchorRef,
      mobileCartAnchorRef,
      cartBumpKey,
      notifyProductAddedToCart
    }),
    [cartBumpKey, notifyProductAddedToCart]
  );

  return (
    <CartVisualFeedbackContext.Provider value={value}>
      {children}
      {flySpec ? (
        <CartFlyParticle
          key={flySpec.id}
          spec={flySpec}
          onDone={() => setFlySpec(null)}
        />
      ) : null}
      <AddedToCartToast visible={toastVisible} />
    </CartVisualFeedbackContext.Provider>
  );
}

export function useCartVisualFeedback() {
  const ctx = useContext(CartVisualFeedbackContext);
  if (!ctx) {
    throw new Error("useCartVisualFeedback must be used within CartVisualFeedbackProvider");
  }
  return ctx;
}
