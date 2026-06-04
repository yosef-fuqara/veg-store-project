import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LEGAL_ROUTES } from "../config/legalVersions";
import {
  ALLOWED_DELIVERY_AREAS as FALLBACK_AREAS,
  LOCAL_DELIVERY_AREA as FALLBACK_LOCAL_AREA,
  LOCAL_FREE_DELIVERY_MIN,
  LOCAL_DELIVERY_FEE,
  OUTSIDE_FREE_DELIVERY_MIN,
  OUTSIDE_DELIVERY_FEE,
  FULFILLMENT_TYPE,
  PAYMENT_METHODS,
  PAYMENT_METHODS_PICKUP,
  estimateDeliveryFee
} from "../config/delivery";
import { useCart } from "../features/cart/CartContext";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import { useAuth } from "../features/auth/AuthContext";
import BusinessHoursNoticeModal from "../components/BusinessHoursNoticeModal";
import StoreClosedSection from "../components/StoreClosedSection";
import { useLocalStorage } from "../hooks/useLocalStorage";
import * as cartService from "../services/cartService";
import * as orderService from "../services/orderService";
import { getAccessToken } from "../services/authStorage";
import { guestLinesFromCartItems } from "../utils/guestCart";
import { formatPrice, formatChargedTotal } from "../utils/formatPrice";
import { formatQtyDisplay, formatApproxWeightQuantity } from "../utils/cartLineQuantity";
import StructuredAddressInput from "../components/StructuredAddressInput";
import { legacyDeliveryToStructured, validateStructuredAddress } from "../utils/structuredAddress";
import { getLocalizedProductName, textDirectionForLang } from "../utils/localizedProduct";
import {
  checkoutDraftHasDeliveryContent,
  clearOrderSuccessStorage,
  clearSavedDeliveryDetails,
  deliveryDetailsForPersistence,
  hasSavedDeliveryDetails,
  loadCheckoutDraft,
  loadPersistedCartLines,
  loadSavedDeliveryDetails,
  mergeSavedDeliveryIntoForm,
  saveSavedDeliveryDetails,
  VEGSTORE_CHECKOUT_DRAFT_KEY
} from "../utils/vegstorePersistence";
import { isOutsideConfiguredBusinessHoursNow } from "../utils/businessHoursNotice";
import { normalizeIsraeliMobile } from "../utils/israeliMobilePhone";
import { Landmark, Store } from "lucide-react";
import bitMarkSvg from "../assets/payment/bit-mark.svg";
import cardsMarkSvg from "../assets/payment/cards-mark.svg";

const colors = {
  primary:        '#1e6b3c',
  primarySurface: '#eef7f1',
  primaryBorder:  '#a3cfb4',
  surface:        '#ffffff',
  surfaceRaised:  '#f5f2ed',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
  textInverse:    '#ffffff',
  success:        '#166534',
  successSurface: '#f0fdf4',
  successBorder:  '#bbf7d0',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
  warning:        '#92400e',
  warningSurface: '#fffbeb',
  warningBorder:  '#fde68a',
};

const pageStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '40px 24px',
};

const useIsNarrowCheckout = () => {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 900
  );
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 900);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return narrow;
};

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1.5px solid #e8e3dc`,
  fontSize: '15px',
  color: '#1c1917',
  background: '#ffffff',
  outline: 'none',
  display: 'block',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '14px',
  fontWeight: 500,
  color: colors.textSecondary,
};

const sectionStyle = {
  border: `1px solid ${colors.border}`,
  borderRadius: '10px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 600,
  color: colors.textPrimary,
};

const shadowSm = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';

const cardSectionStyle = {
  ...sectionStyle,
  borderRadius: '14px',
  boxShadow: shadowSm,
  gap: '16px',
};

/** Product image for checkout line — uses cart snapshot or direct URL from API. */
const checkoutLineImageUrl = (item) => {
  const snap = item?.productSnapshot?.imageUrl;
  if (typeof snap === 'string' && snap.trim()) return snap.trim();
  const direct = item?.imageUrl;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  return '';
};

const paymentLeadingGraphicStyle = {
  flexShrink: 0,
  width: "44px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** Decorative only; label + radio provide the accessible name. */
const CheckoutPaymentMethodGraphic = ({ method }) => {
  if (method === "credit_card") {
    return (
      <span style={paymentLeadingGraphicStyle} aria-hidden>
        <img
          src={cardsMarkSvg}
          alt=""
          width={72}
          height={34}
          draggable={false}
          style={{
            display: "block",
            width: "64px",
            height: "auto",
            maxHeight: "28px",
            objectFit: "contain",
          }}
        />
      </span>
    );
  }
  if (method === "bit") {
    return (
      <span style={paymentLeadingGraphicStyle} aria-hidden>
        <img
          src={bitMarkSvg}
          alt=""
          width={40}
          height={40}
          draggable={false}
          style={{ display: "block", width: "34px", height: "34px", objectFit: "contain" }}
        />
      </span>
    );
  }
  if (method === "bank_transfer") {
    return (
      <span style={paymentLeadingGraphicStyle} aria-hidden>
        <Landmark size={26} strokeWidth={1.85} color={colors.textSecondary} />
      </span>
    );
  }
  if (method === "pay_at_pickup") {
    return (
      <span style={paymentLeadingGraphicStyle} aria-hidden>
        <Store size={26} strokeWidth={1.85} color={colors.textSecondary} />
      </span>
    );
  }
  return <span style={{ ...paymentLeadingGraphicStyle, width: "32px" }} aria-hidden />;
};

const initialForm = {
  customerName: "",
  customerEmail: "",
  deliveryAddress: {
    city: "",
    cityKey: "",
    street: "",
    houseNumber: "",
    building: "",
    apartment: "",
    floor: "",
    entrance: "",
    notes: ""
  },
  deliveryArea: "",
  fulfillmentType: FULFILLMENT_TYPE.DELIVERY,
  customerPhone: "",
  notes: "",
  paymentMethod: PAYMENT_METHODS[0].value,
  preferredDeliveryAt: "",
  customRequest: ""
};

const resolveInitialCheckoutState = () => {
  if (typeof window === "undefined") {
    return {
      form: initialForm,
      saveForNextOrder: false,
      showAutofilledBanner: false,
      hasSavedOnDevice: false
    };
  }
  const draft = loadCheckoutDraft();
  const saved = loadSavedDeliveryDetails();
  const hasSaved = hasSavedDeliveryDetails(saved);

  if (checkoutDraftHasDeliveryContent(draft)) {
    return {
      form: mergeCheckoutDraft(draft),
      saveForNextOrder: hasSaved,
      showAutofilledBanner: false,
      hasSavedOnDevice: hasSaved
    };
  }

  if (hasSaved) {
    return {
      form: mergeSavedDeliveryIntoForm(saved, initialForm),
      saveForNextOrder: true,
      showAutofilledBanner: true,
      hasSavedOnDevice: true
    };
  }

  return {
    form: initialForm,
    saveForNextOrder: false,
    showAutofilledBanner: false,
    hasSavedOnDevice: false
  };
};

const mergeCheckoutDraft = (draft) => {
  if (!draft || typeof draft !== "object") return initialForm;
  const addr =
    draft.deliveryAddress && typeof draft.deliveryAddress === "object"
      ? draft.deliveryAddress
      : {};
  return {
    ...initialForm,
    deliveryAddress: legacyDeliveryToStructured(
      {
        street: typeof addr.street === "string" ? addr.street : "",
        building: typeof addr.building === "string" ? addr.building : "",
        apartment: typeof addr.apartment === "string" ? addr.apartment : "",
        floor: typeof addr.floor === "string" ? addr.floor : "",
        entrance: typeof addr.entrance === "string" ? addr.entrance : "",
        notes: typeof addr.notes === "string" ? addr.notes : "",
        houseNumber: typeof addr.houseNumber === "string" ? addr.houseNumber : "",
        city: typeof addr.city === "string" ? addr.city : ""
      },
      typeof draft.deliveryArea === "string" ? draft.deliveryArea : ""
    ),
    deliveryArea: typeof draft.deliveryArea === "string" ? draft.deliveryArea : initialForm.deliveryArea,
    fulfillmentType:
      draft.fulfillmentType === FULFILLMENT_TYPE.PICKUP
        ? FULFILLMENT_TYPE.PICKUP
        : initialForm.fulfillmentType,
    customerName:
      typeof draft.customerName === "string" ? draft.customerName : initialForm.customerName,
    customerEmail:
      typeof draft.customerEmail === "string" ? draft.customerEmail : initialForm.customerEmail,
    customerPhone:
      typeof draft.customerPhone === "string" ? draft.customerPhone : initialForm.customerPhone,
    notes: typeof draft.notes === "string" ? draft.notes : initialForm.notes,
    paymentMethod: initialForm.paymentMethod,
    preferredDeliveryAt:
      typeof draft.preferredDeliveryAt === "string"
        ? draft.preferredDeliveryAt
        : initialForm.preferredDeliveryAt,
    customRequest:
      typeof draft.customRequest === "string" ? draft.customRequest : initialForm.customRequest
  };
};

const fieldErrorsFromResponse = (err) => {
  const fields = err.response?.data?.details?.fields;
  if (!Array.isArray(fields)) return {};
  return fields.reduce((acc, item) => {
    const key = Array.isArray(item.path) ? item.path.join(".") : item.path;
    if (key && !acc[key]) acc[key] = item.message;
    return acc;
  }, {});
};

/** Visual / logical order of fields for “first error” scroll (matches form layout). */
const CHECKOUT_FIELD_SCROLL_ORDER = [
  "customerName",
  "customerEmail",
  "deliveryAddress.city",
  "deliveryAddress.street",
  "deliveryAddress.houseNumber",
  "deliveryAddress.building",
  "deliveryAddress.entrance",
  "deliveryAddress.floor",
  "deliveryAddress.apartment",
  "deliveryAddress.notes",
  "preferredDeliveryAt",
  "customRequest",
  "customerPhone",
  "notes",
  "paymentMethod",
  "bankTransferProof",
  "acceptTerms",
];

const getFirstFieldErrorKey = (errors) => {
  if (!errors || typeof errors !== "object") return null;
  for (const key of CHECKOUT_FIELD_SCROLL_ORDER) {
    if (errors[key]) return key;
  }
  const keys = Object.keys(errors);
  return keys.length ? keys[0] : null;
};

const minDateTimeLocal = (hoursAhead) => {
  const target = new Date(Date.now() + hoursAhead * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
};

const Skeleton = ({ height = 44, width = '100%' }) => (
  <motion.div
    animate={{ opacity: [0.4, 0.8, 0.4] }}
    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
    style={{ width, height, background: colors.border, borderRadius: '6px' }}
  />
);

/** Order lines + totals; rendered before the checkout form (top on mobile, sidebar on desktop). */
function CheckoutOrderSummary({
  isNarrow,
  t,
  items,
  lang,
  subtotal,
  wrapTotal,
  deliveryFeeEstimate,
  payableTotal,
  isPickup,
}) {
  return (
    <aside
      id="checkout-order-summary"
      aria-labelledby="checkout-order-summary-title"
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: isNarrow ? "12px" : "14px",
        padding: isNarrow ? "16px" : "24px",
        position: isNarrow ? "static" : "sticky",
        top: isNarrow ? "auto" : "80px",
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        boxShadow: shadowSm,
        order: isNarrow ? 1 : 2,
      }}
    >
      <h3
        id="checkout-order-summary-title"
        style={{
          margin: isNarrow ? "0 0 12px" : "0 0 20px",
          fontSize: isNarrow ? "17px" : "18px",
          lineHeight: isNarrow ? "24px" : "28px",
          fontWeight: 600,
          color: colors.textPrimary,
        }}
      >
        {t("orderSummary")}
      </h3>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item) => {
          const thumbUrl = checkoutLineImageUrl(item);
          const displayName = getLocalizedProductName(item, lang);
          const isAmountLine = item.purchaseMode === "amount" && item.requestedAmountIls != null;
          const detailLine = isAmountLine ? (
            item.unit === "kg" || item.unit === "gram" ? (
              t("cart:purchaseByAmountLineDetail", {
                unitPrice: formatPrice(item.unitPrice, lang),
                unitLabel: t(`home:units.${item.unit}`),
                weight: formatApproxWeightQuantity(item.quantity, item.unit),
              })
            ) : (
              t("cart:purchaseByAmountNote", {
                amount: formatPrice(item.requestedAmountIls, lang),
              })
            )
          ) : (
            <>
              {t("cart:quantity")} {formatQtyDisplay(item.quantity)} · {formatPrice(item.unitPrice, lang)}
            </>
          );
          return (
            <div
              key={String(item.product)}
              style={{
                padding: isNarrow ? "10px 0" : "14px 0",
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                gap: isNarrow ? "10px" : "12px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: isNarrow ? 48 : 56,
                  height: isNarrow ? 48 : 56,
                  borderRadius: "10px",
                  background: colors.surfaceRaised,
                  border: `1px solid ${colors.border}`,
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt=""
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div
                    dir={textDirectionForLang(lang)}
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.textPrimary,
                      lineHeight: 1.4,
                      textAlign: "start",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {displayName}
                    {item.isPreorderOnly ? " ⏱" : ""}
                    {item.wrap ? (
                      <span
                        style={{
                          marginInlineStart: "6px",
                          padding: "1px 6px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: colors.successSurface,
                          color: colors.success,
                          border: `1px solid ${colors.successBorder}`,
                          verticalAlign: "middle",
                        }}
                      >
                        {t("wrapBadge")}
                      </span>
                    ) : null}
                  </div>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: colors.textPrimary,
                      flexShrink: 0,
                      textAlign: "end",
                    }}
                  >
                    {formatPrice(item.lineTotal, lang)}
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: colors.textSecondary, lineHeight: 1.45, textAlign: "start" }}>
                  {detailLine}
                </div>
                {item.wrap && Number(item.wrapFee) > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "8px",
                      fontSize: "12px",
                      color: colors.success,
                      marginTop: "2px",
                    }}
                  >
                    <span>↳ {t("wrapFees")}</span>
                    <span>+{formatPrice(item.wrapFee, lang)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: isNarrow ? "12px" : "16px",
          display: "flex",
          flexDirection: "column",
          gap: isNarrow ? "6px" : "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: colors.textSecondary, gap: "12px" }}>
          <span>{t("subtotal")}</span>
          <span style={{ fontWeight: 500, color: colors.textPrimary }}>{formatPrice(subtotal, lang)}</span>
        </div>
        {wrapTotal > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: colors.success, gap: "12px" }}>
            <span>{t("wrapFees")}</span>
            <span style={{ fontWeight: 500 }}>{formatPrice(wrapTotal, lang)}</span>
          </div>
        ) : null}
        {isPickup ? (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: colors.textSecondary, gap: "12px" }}>
            <span>{t("fulfillmentSummary")}</span>
            <span style={{ fontWeight: 600, color: colors.textPrimary }}>{t("selfPickupSummary")}</span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: colors.textSecondary, gap: "12px" }}>
              <span>{t("deliveryFee")}</span>
              <span style={{ fontWeight: 500, color: colors.textPrimary }}>{formatPrice(deliveryFeeEstimate, lang)}</span>
            </div>
            <span style={{ fontSize: "11px", color: colors.textMuted, lineHeight: 1.4 }}>{t("feeEstimateNote")}</span>
          </>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: isNarrow ? "17px" : "16px",
            fontWeight: 700,
            color: colors.textPrimary,
            paddingTop: isNarrow ? "10px" : "12px",
            borderTop: `1px solid ${colors.border}`,
            marginTop: isNarrow ? "6px" : "8px",
            gap: "12px",
          }}
        >
          <span>{t("total")}</span>
          <span>{formatChargedTotal(payableTotal, lang)}</span>
        </div>
      </div>
    </aside>
  );
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshCart } = useCart();
  const { user } = useAuth();
  const isGuestCheckout = !getAccessToken();
  const isLoggedIn = Boolean(user) || !isGuestCheckout;
  const showGuestLegalConsent = !isLoggedIn;
  const { settings, loading: storeSettingsLoading, canOrderNow } = useStoreSettings();
  const [, setCheckoutDraft] = useLocalStorage(VEGSTORE_CHECKOUT_DRAFT_KEY, null);
  const { t, i18n } = useTranslation(["checkout", "cart", "home", "storeClosed", "legal", "address"]);
  const lang = (i18n.language || "he").split("-")[0];
  const isNarrow = useIsNarrowCheckout();

  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);

  const [areas, setAreas] = useState(FALLBACK_AREAS);
  const [localAreaKey, setLocalAreaKey] = useState(FALLBACK_LOCAL_AREA);
  const [rules, setRules] = useState({
    localFreeDeliveryMin: LOCAL_FREE_DELIVERY_MIN,
    outsideFreeDeliveryMin: OUTSIDE_FREE_DELIVERY_MIN,
    localDeliveryFee: LOCAL_DELIVERY_FEE,
    outsideDeliveryFee: OUTSIDE_DELIVERY_FEE
  });

  const [initialCheckout] = useState(resolveInitialCheckoutState);
  const [form, setForm] = useState(() => initialCheckout.form);
  const [saveForNextOrder, setSaveForNextOrder] = useState(() => initialCheckout.saveForNextOrder);
  const [showAutofilledBanner, setShowAutofilledBanner] = useState(
    () => initialCheckout.showAutofilledBanner
  );
  const [hasSavedOnDevice, setHasSavedOnDevice] = useState(() => initialCheckout.hasSavedOnDevice);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [focused, setFocused] = useState(null);
  const [bankTransferProofFile, setBankTransferProofFile] = useState(null);
  const [businessHoursNoticeOpen, setBusinessHoursNoticeOpen] = useState(false);
  const businessHoursNoticeAcknowledgedRef = useRef(false);
  const checkoutSubmitInFlightRef = useRef(false);
  const hasSuggestedRegisteredPhoneRef = useRef(false);

  const fieldElRefs = useRef({});
  const assignFieldRef = (key) => (el) => {
    fieldElRefs.current[key] = el;
  };
  const pendingScrollToFirstErrorRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      setPreviewError("");
      try {
        const deliveryInfoPromise = orderService.getDeliveryAreas().catch(() => null);
        let checkout;
        if (getAccessToken()) {
          checkout = await cartService.prepareCheckout();
        } else {
          const lines = guestLinesFromCartItems(loadPersistedCartLines());
          if (!lines.length) {
            if (!cancelled) {
              setPreview(null);
              setPreviewLoading(false);
            }
            return;
          }
          checkout = await orderService.guestCheckoutPreview(lines);
        }
        const deliveryInfo = await deliveryInfoPromise;
        if (cancelled) return;
        setPreview(checkout);
        if (deliveryInfo?.areas?.length) setAreas(deliveryInfo.areas);
        if (deliveryInfo?.localAreaKey) setLocalAreaKey(deliveryInfo.localAreaKey);
        if (deliveryInfo?.rules) setRules(deliveryInfo.rules);
      } catch (err) {
        if (cancelled) return;
        setPreview(null);
        setPreviewError(err.userMessage || t("previewLoadError"));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    setForm((prev) => {
      const allowed = new Set(areas.map((a) => a.key));
      if (!prev.deliveryArea || allowed.has(prev.deliveryArea)) return prev;
      return { ...prev, deliveryArea: "" };
    });
  }, [areas]);

  useEffect(() => {
    if (form.paymentMethod !== "bank_transfer") {
      setBankTransferProofFile(null);
    }
  }, [form.paymentMethod]);

  const isPickup = form.fulfillmentType === FULFILLMENT_TYPE.PICKUP;

  const availablePaymentMethods = useMemo(
    () => (isPickup ? PAYMENT_METHODS_PICKUP : PAYMENT_METHODS),
    [isPickup]
  );

  useEffect(() => {
    if (availablePaymentMethods.some((m) => m.value === form.paymentMethod)) return;
    setForm((prev) => ({
      ...prev,
      paymentMethod: availablePaymentMethods[0]?.value || PAYMENT_METHODS[0].value
    }));
  }, [availablePaymentMethods, form.paymentMethod]);

  const checkoutDraftSlice = useMemo(
    () => ({
      v: 1,
      fulfillmentType: form.fulfillmentType,
      deliveryAddress: form.deliveryAddress,
      deliveryArea: form.deliveryArea,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      notes: form.notes,
      preferredDeliveryAt: form.preferredDeliveryAt,
      customRequest: form.customRequest
    }),
    [
      form.fulfillmentType,
      form.deliveryAddress,
      form.deliveryArea,
      form.customerName,
      form.customerEmail,
      form.customerPhone,
      form.notes,
      form.preferredDeliveryAt,
      form.customRequest
    ]
  );

  useEffect(() => {
    const id = window.setTimeout(() => setCheckoutDraft(checkoutDraftSlice), 320);
    return () => window.clearTimeout(id);
  }, [checkoutDraftSlice, setCheckoutDraft]);

  const scrollToDelivery = Boolean(location.state?.scrollToDelivery);
  useLayoutEffect(() => {
    if (previewLoading || previewError) return;
    if (!preview?.items?.length) return;
    if (!scrollToDelivery) return;
    if (isNarrow) {
      window.scrollTo(0, 0);
    } else {
      const el = document.getElementById("checkout-delivery");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    navigate({ pathname: location.pathname, search: location.search }, { replace: true, state: {} });
  }, [
    previewLoading,
    previewError,
    preview?.items?.length,
    scrollToDelivery,
    isNarrow,
    location.pathname,
    location.search,
    navigate,
  ]);

  useEffect(() => {
    if (!pendingScrollToFirstErrorRef.current) return;
    const firstKey = getFirstFieldErrorKey(fieldErrors);
    if (!firstKey) {
      pendingScrollToFirstErrorRef.current = false;
      return;
    }
    pendingScrollToFirstErrorRef.current = false;
    const el = fieldElRefs.current[firstKey];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      if (firstKey === "paymentMethod") {
        el.querySelector?.('input[type="radio"]')?.focus?.({ preventScroll: true });
      } else if (typeof el.focus === "function") {
        el.focus({ preventScroll: true });
      }
    }, 480);
  }, [fieldErrors]);

  const subtotal = preview?.subtotal ?? 0;
  const wrapTotal = Number(preview?.wrapTotal) || 0;
  const hasPreorderItems = Boolean(preview?.hasPreorderItems);
  const minAdvanceHours = useMemo(() => {
    if (!preview?.items?.length) return 24;
    const hours = preview.items
      .filter((item) => item.isPreorderOnly)
      .map((item) => Number(item.minAdvanceHours) || 24);
    return hours.length ? Math.max(...hours) : 24;
  }, [preview]);

  const deliveryFeeEstimate = useMemo(
    () => (isPickup ? 0 : estimateDeliveryFee(form.deliveryArea, subtotal, rules)),
    [isPickup, form.deliveryArea, subtotal, rules]
  );
  const rawTotal = subtotal + wrapTotal + deliveryFeeEstimate;
  const payableTotal = Math.floor(rawTotal + Number.EPSILON);

  const handleStructuredAddressChange = (nextAddress, meta = {}) => {
    setForm((prev) => ({
      ...prev,
      deliveryAddress: nextAddress,
      deliveryArea: meta.deliveryArea ?? prev.deliveryArea
    }));
  };
  const updateField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const focus = (field) => () => setFocused(field);
  const blur = () => setFocused(null);

  const inputStyle = (field) => {
    if (fieldErrors[field]) return { ...inputBase, borderColor: colors.error };
    if (focused === field) return { ...inputBase, borderColor: colors.primary, boxShadow: '0 0 0 3px rgba(30,107,60,0.12)' };
    return inputBase;
  };

  const fieldErr = (id) => fieldErrors[id]
    ? <span style={{ fontSize: '12px', color: colors.error, display: 'block', marginTop: '4px' }}>{fieldErrors[id]}</span>
    : null;

  const registeredPhone = typeof user?.phone === "string" ? user.phone.trim() : "";
  const canUseRegisteredPhone = registeredPhone.length > 0;

  useEffect(() => {
    if (!canUseRegisteredPhone) return;
    if (hasSuggestedRegisteredPhoneRef.current) return;
    const currentPhone = (form.customerPhone ?? "").trim();
    if (currentPhone) return;
    hasSuggestedRegisteredPhoneRef.current = true;
    setForm((prev) => ({ ...prev, customerPhone: registeredPhone }));
  }, [canUseRegisteredPhone, form.customerPhone, registeredPhone]);

  const handleUseRegisteredPhone = () => {
    if (!canUseRegisteredPhone) return;
    setForm((prev) => ({ ...prev, customerPhone: registeredPhone }));
    setFieldErrors((prev) => {
      if (!prev.customerPhone) return prev;
      const next = { ...prev };
      delete next.customerPhone;
      return next;
    });
  };

  const validateClientSide = () => {
    const fields = {};
    if (isGuestCheckout) {
      const name = (form.customerName ?? "").trim();
      if (!name) {
        fields.customerName = t("guestNameEmpty");
      }
      const emailRaw = (form.customerEmail ?? "").trim();
      if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
        fields.customerEmail = t("guestEmailInvalid");
      }
    }
    if (!isPickup) {
      const allowedAreas = new Set(areas.map((a) => a.key));
      const addressCheck = validateStructuredAddress(
        form.deliveryAddress,
        form.deliveryArea,
        (key) => t(key, { ns: "address" }),
        { restrictToDeliveryAreas: true, allowedCityKeys: allowedAreas }
      );
      Object.assign(fields, addressCheck.fields);
      if (!form.deliveryArea?.trim()) {
        fields["deliveryAddress.city"] =
          fields["deliveryAddress.city"] || t("cityMustSelectFromList", { ns: "address" });
      }
    }
    if (hasPreorderItems) {
      if (!form.preferredDeliveryAt) {
        fields.preferredDeliveryAt = t("preorderDateRequired");
      } else {
        const target = new Date(form.preferredDeliveryAt);
        const minMs = minAdvanceHours * 60 * 60 * 1000;
        if (Number.isNaN(target.getTime()) || target.getTime() - Date.now() < minMs) {
          fields.preferredDeliveryAt = t("preorderDateTooSoon", { hours: minAdvanceHours });
        }
      }
    }
    const phoneRaw = (form.customerPhone ?? "").trim();
    if (!phoneRaw) {
      fields.customerPhone = t("phoneEmpty");
    } else if (!normalizeIsraeliMobile(phoneRaw)) {
      fields.customerPhone = t("phoneInvalid");
    }
    if (
      !form.paymentMethod ||
      !availablePaymentMethods.some((m) => m.value === form.paymentMethod)
    ) {
      fields.paymentMethod = t("paymentMethodRequired");
    }
    if (showGuestLegalConsent && !acceptTerms) {
      fields.acceptTerms = t("legal:consent.requiredLegalError");
    }
    if (form.paymentMethod === "bank_transfer" && bankTransferProofFile) {
      const maxBytes = 3 * 1024 * 1024;
      if (bankTransferProofFile.size > maxBytes) {
        fields.bankTransferProof = t("bankTransferProofTooLarge");
      }
      const okType = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(
        bankTransferProofFile.type
      );
      if (!okType) {
        fields.bankTransferProof = t("bankTransferProofInvalidType");
      }
    }
    if (Object.keys(fields).length > 0) {
      return { ok: false, fields };
    }
    return { ok: true };
  };

  const executeCheckoutSubmit = async () => {
    setSubmitError("");
    setFieldErrors({});

    const clientCheck = validateClientSide();
    if (!clientCheck.ok) {
      pendingScrollToFirstErrorRef.current = true;
      setFieldErrors(clientCheck.fields);
      businessHoursNoticeAcknowledgedRef.current = false;
      return;
    }

    if (checkoutSubmitInFlightRef.current) return;
    checkoutSubmitInFlightRef.current = true;

    setSubmitting(true);

    const payload = {
      fulfillmentType: form.fulfillmentType,
      customerPhone: normalizeIsraeliMobile((form.customerPhone ?? "").trim()),
      notes: form.notes,
      paymentMethod: form.paymentMethod,
      saveDetailsConsent: saveForNextOrder,
      consentLanguage: lang
    };
    if (showGuestLegalConsent) {
      payload.acceptTerms = acceptTerms;
    }
    if (hasPreorderItems && form.preferredDeliveryAt) {
      payload.preferredDeliveryAt = new Date(form.preferredDeliveryAt).toISOString();
    }
    if (form.customRequest) payload.customRequest = form.customRequest;

    if (!isPickup) {
      payload.deliveryAddress = {
        street: form.deliveryAddress.street,
        houseNumber: form.deliveryAddress.houseNumber,
        building: form.deliveryAddress.building,
        apartment: form.deliveryAddress.apartment,
        floor: form.deliveryAddress.floor,
        entrance: form.deliveryAddress.entrance,
        notes: form.deliveryAddress.notes
      };
      payload.deliveryArea = form.deliveryArea;
    }

    try {
      let order;
      if (isGuestCheckout) {
        const guestPayload = {
          ...payload,
          customerName: (form.customerName ?? "").trim(),
          items: guestLinesFromCartItems(loadPersistedCartLines())
        };
        const emailTrim = (form.customerEmail ?? "").trim();
        if (emailTrim) guestPayload.customerEmail = emailTrim;
        order = await orderService.createGuestOrder(guestPayload, {
          bankTransferProofFile:
            form.paymentMethod === "bank_transfer" && bankTransferProofFile
              ? bankTransferProofFile
              : null
        });
      } else {
        order = await orderService.createOrder(payload, {
          bankTransferProofFile:
            form.paymentMethod === "bank_transfer" && bankTransferProofFile
              ? bankTransferProofFile
              : null
        });
      }
      if (saveForNextOrder && !isPickup) {
        saveSavedDeliveryDetails(deliveryDetailsForPersistence(form));
        setHasSavedOnDevice(true);
      }
      clearOrderSuccessStorage();
      try {
        await refreshCart();
      } catch {
        /* cart refresh is best-effort after order */
      }
      navigate(`/orders/${order._id}`, {
        replace: true,
        state: isGuestCheckout ? { guestOrder: order } : undefined
      });
    } catch (err) {
      const fields = fieldErrorsFromResponse(err);
      if (Object.keys(fields).length > 0) {
        pendingScrollToFirstErrorRef.current = true;
        setFieldErrors(fields);
      } else {
        setSubmitError(err.userMessage || t("placeOrderError"));
      }
    } finally {
      setSubmitting(false);
      checkoutSubmitInFlightRef.current = false;
      businessHoursNoticeAcknowledgedRef.current = false;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting || checkoutSubmitInFlightRef.current) return;
    if (!canOrderNow) return;

    setSubmitError("");
    setFieldErrors({});

    const clientCheck = validateClientSide();
    if (!clientCheck.ok) {
      pendingScrollToFirstErrorRef.current = true;
      setFieldErrors(clientCheck.fields);
      return;
    }

    if (
      settings &&
      isOutsideConfiguredBusinessHoursNow(settings) &&
      !businessHoursNoticeAcknowledgedRef.current
    ) {
      setBusinessHoursNoticeOpen(true);
      return;
    }

    void executeCheckoutSubmit();
  };

  const handleBusinessHoursNoticeConfirm = () => {
    businessHoursNoticeAcknowledgedRef.current = true;
    setBusinessHoursNoticeOpen(false);
    void executeCheckoutSubmit();
  };

  const handleBusinessHoursNoticeDismiss = () => {
    if (submitting) return;
    setBusinessHoursNoticeOpen(false);
  };

  const handleClearSavedDelivery = () => {
    clearSavedDeliveryDetails();
    setHasSavedOnDevice(false);
    setSaveForNextOrder(false);
    setShowAutofilledBanner(false);
  };

  if (!storeSettingsLoading && !canOrderNow && settings) {
    return (
      <div style={{ ...pageStyle, paddingTop: 24 }}>
        <StoreClosedSection settings={settings} variant="page" />
        <p
          style={{
            textAlign: "center",
            maxWidth: 480,
            margin: "20px auto 0",
            color: colors.textSecondary,
            fontSize: 15,
            lineHeight: 1.55,
          }}
        >
          {t("checkoutBlockedHint", { ns: "storeClosed" })}
        </p>
      </div>
    );
  }

  if (previewLoading) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 32px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={44} />
          ))}
        </div>
      </section>
    );
  }

  if (previewError) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 20px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', marginBottom: '16px' }}>
          {previewError}
        </div>
        <Link to="/cart" style={{ color: colors.primary, fontWeight: 600 }}>{t("backToCart")}</Link>
      </section>
    );
  }

  if (!preview || !preview.items?.length) {
    return (
      <section style={pageStyle}>
        <h1 style={{ margin: '0 0 20px', fontSize: '30px', fontWeight: 700, color: colors.textPrimary }}>
          {t("title")}
        </h1>
        <p style={{ color: colors.textMuted, fontSize: '15px', marginBottom: '16px' }}>{t("cartEmpty")}</p>
        <Link to="/" style={{ color: colors.primary, fontWeight: 600 }}>{t("continueShopping")}</Link>
      </section>
    );
  }

  return (
    <section
      style={{
        ...pageStyle,
        padding: isNarrow ? "24px 16px" : pageStyle.padding,
      }}
    >
      <BusinessHoursNoticeModal
        open={businessHoursNoticeOpen}
        onConfirm={handleBusinessHoursNoticeConfirm}
        onDismiss={handleBusinessHoursNoticeDismiss}
        confirmDisabled={submitting}
      />
      <h1
        style={{
          margin: isNarrow ? "0 0 20px" : "0 0 32px",
          fontSize: isNarrow ? "26px" : "30px",
          fontWeight: 700,
          color: colors.textPrimary,
        }}
      >
        {t("title")}
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(280px, 400px)',
        gap: isNarrow ? '16px' : '40px',
        alignItems: 'start',
      }}>

        <CheckoutOrderSummary
          isNarrow={isNarrow}
          t={t}
          items={preview.items}
          lang={lang}
          subtotal={subtotal}
          wrapTotal={wrapTotal}
          deliveryFeeEstimate={deliveryFeeEstimate}
          payableTotal={payableTotal}
          isPickup={isPickup}
        />

        <form
          noValidate
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            minWidth: 0,
            width: '100%',
            order: isNarrow ? 2 : 1,
          }}
        >

          {isGuestCheckout ? (
            <div style={cardSectionStyle}>
              <h3 style={{ margin: 0, fontSize: '18px', lineHeight: '28px', fontWeight: 600, color: colors.textPrimary }}>
                {t("guestContactDetails")}
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isNarrow ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
                  gap: '16px',
                }}
              >
                <label style={{ ...labelStyle, minWidth: 0 }}>
                  {t("guestNameRequired")}
                  <input
                    ref={assignFieldRef("customerName")}
                    value={form.customerName}
                    onChange={updateField("customerName")}
                    maxLength={120}
                    required
                    onFocus={focus("customerName")}
                    onBlur={blur}
                    style={inputStyle("customerName")}
                  />
                  {fieldErr("customerName")}
                </label>
                <label style={{ ...labelStyle, minWidth: 0 }}>
                  {t("guestEmailOptional")}
                  <input
                    ref={assignFieldRef("customerEmail")}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.customerEmail}
                    onChange={updateField("customerEmail")}
                    maxLength={254}
                    onFocus={focus("customerEmail")}
                    onBlur={blur}
                    style={inputStyle("customerEmail")}
                  />
                  <span style={{ fontSize: '12px', color: colors.textMuted, lineHeight: 1.45 }}>
                    {t("guestEmailHelper")}
                  </span>
                  {fieldErr("customerEmail")}
                </label>
              </div>
            </div>
          ) : null}

          <div
            id="checkout-delivery"
            style={{ ...cardSectionStyle, scrollMarginTop: "80px" }}
          >
            <h3 style={{ margin: 0, fontSize: '18px', lineHeight: '28px', fontWeight: 600, color: colors.textPrimary }}>
              {t("deliveryDetails")}
            </h3>

            <fieldset style={{ border: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              <legend style={{ fontSize: "14px", fontWeight: 600, color: colors.textSecondary, marginBottom: "2px", padding: 0 }}>
                {t("fulfillmentTypeLabel")}
              </legend>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >
                {[
                  { value: FULFILLMENT_TYPE.DELIVERY, label: t("fulfillmentDelivery") },
                  { value: FULFILLMENT_TYPE.PICKUP, label: t("fulfillmentPickup") },
                ].map((option) => {
                  const selected = form.fulfillmentType === option.value;
                  return (
                    <label
                      key={option.value}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        minHeight: "48px",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                        background: selected ? colors.primarySurface : colors.surface,
                        fontSize: "14px",
                        fontWeight: 600,
                        color: colors.textPrimary,
                      }}
                    >
                      <input
                        type="radio"
                        name="fulfillmentType"
                        value={option.value}
                        checked={selected}
                        onChange={updateField("fulfillmentType")}
                        style={{ flexShrink: 0, width: "18px", height: "18px", accentColor: colors.primary }}
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {!isPickup ? (
            <StructuredAddressInput
              value={form.deliveryAddress}
              deliveryArea={form.deliveryArea}
              deliveryAreas={areas}
              localAreaKey={localAreaKey}
              errors={fieldErrors}
              onChange={handleStructuredAddressChange}
              inputStyle={inputStyle}
              assignFieldRef={assignFieldRef}
              onFieldFocus={focus}
              onFieldBlur={blur}
              showDeliveryHelper
              deliveryRules={rules}
            />
            ) : (
              <p style={{ margin: 0, fontSize: "14px", color: colors.textSecondary, lineHeight: 1.5 }}>
                {t("pickupAddressHint")}
              </p>
            )}

            {showAutofilledBanner && !isPickup && (
              <p
                role="status"
                style={{
                  margin: 0,
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  lineHeight: 1.45,
                  color: colors.success,
                  background: colors.successSurface,
                  border: `1px solid ${colors.successBorder}`,
                }}
              >
                {t("savedDetailsAutofilled")}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingTop: "4px",
              }}
            >
              {!isPickup ? (
              <label
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: "10px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: colors.textSecondary,
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={saveForNextOrder}
                  onChange={(e) => setSaveForNextOrder(e.target.checked)}
                  style={{
                    flexShrink: 0,
                    width: "18px",
                    height: "18px",
                    marginTop: "2px",
                    accentColor: colors.primary,
                    cursor: "pointer",
                  }}
                />
                <span style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
                  <span style={{ color: colors.textPrimary, lineHeight: 1.4 }}>
                    {t("saveDetailsForNextOrder")}
                  </span>
                  <span style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.4 }}>
                    {t("saveDetailsDeviceHint")}
                  </span>
                </span>
              </label>
              ) : null}
              {hasSavedOnDevice && !isPickup && (
                <button
                  type="button"
                  onClick={handleClearSavedDelivery}
                  style={{
                    alignSelf: "flex-start",
                    padding: 0,
                    border: "none",
                    background: "none",
                    color: colors.primary,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  {t("clearSavedDetails")}
                </button>
              )}
            </div>
          </div>

          {hasPreorderItems && (
            <div style={{ ...cardSectionStyle, border: `1px solid ${colors.warningBorder}`, background: colors.warningSurface }}>
              <h3 style={{ ...sectionTitleStyle, fontSize: '17px', lineHeight: '28px', color: colors.warning }}>{t("preorderNotice")}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: colors.warning, lineHeight: 1.5 }}>{t("preorderHelper", { hours: minAdvanceHours })}</p>
              <label style={labelStyle}>
                {t("preorderDateRequired")}
                <input ref={assignFieldRef("preferredDeliveryAt")} type="datetime-local" value={form.preferredDeliveryAt} onChange={updateField("preferredDeliveryAt")} min={minDateTimeLocal(minAdvanceHours)} required onFocus={focus("preferredDeliveryAt")} onBlur={blur} style={inputStyle("preferredDeliveryAt")} />
                {fieldErr("preferredDeliveryAt")}
              </label>
              <label style={labelStyle}>
                {t("customRequest")}
                <textarea ref={assignFieldRef("customRequest")} value={form.customRequest} onChange={updateField("customRequest")} placeholder={t("customRequestPlaceholder")} maxLength={1000} rows={3} onFocus={focus("customRequest")} onBlur={blur} style={{ ...inputStyle("customRequest"), resize: 'vertical' }} />
                {fieldErr("customRequest")}
              </label>
            </div>
          )}

          <div
            style={{
              ...cardSectionStyle,
              display: 'grid',
              gridTemplateColumns: isNarrow ? 'minmax(0, 1fr)' : 'repeat(2, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            <label style={{ ...labelStyle, minWidth: 0 }}>
              {t("phoneForOrderUpdatesLabel")}
              <input ref={assignFieldRef("customerPhone")} type="tel" inputMode="tel" autoComplete="tel-national" value={form.customerPhone} onChange={updateField("customerPhone")} maxLength={22} onFocus={focus("customerPhone")} onBlur={blur} style={inputStyle("customerPhone")} />
              <span style={{ fontSize: "12px", color: colors.textMuted, lineHeight: 1.45 }}>
                {t("phoneOrderUpdatesHelper")}
              </span>
              {canUseRegisteredPhone && (
                <button
                  type="button"
                  onClick={handleUseRegisteredPhone}
                  style={{
                    alignSelf: "flex-start",
                    padding: 0,
                    border: "none",
                    background: "none",
                    color: colors.primary,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  {t("useRegisteredPhoneNumber")}
                </button>
              )}
              {fieldErr("customerPhone")}
            </label>
            <label style={{ ...labelStyle, minWidth: 0 }}>
              {t("orderNotes")}
              <textarea ref={assignFieldRef("notes")} value={form.notes} onChange={updateField("notes")} maxLength={1000} rows={isNarrow ? 3 : 4} onFocus={focus("notes")} onBlur={blur} style={{ ...inputStyle("notes"), resize: 'vertical', minHeight: isNarrow ? undefined : '120px' }} />
              {fieldErr("notes")}
            </label>
          </div>

          <div ref={assignFieldRef("paymentMethod")} style={cardSectionStyle}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <legend style={{ fontSize: '16px', lineHeight: '24px', fontWeight: 600, color: colors.textPrimary, marginBottom: '4px', padding: 0 }}>
                {t("paymentMethodRequired")}
              </legend>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isNarrow
                    ? 'minmax(0, 1fr)'
                    : 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                }}
              >
                {availablePaymentMethods.map((method) => {
                  const selected = form.paymentMethod === method.value;
                  return (
                    <label
                      key={method.value}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '12px',
                        minHeight: '64px',
                        boxSizing: 'border-box',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        border: `1.5px solid ${selected ? colors.primary : colors.border}`,
                        background: selected ? colors.primarySurface : colors.surface,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: colors.textPrimary,
                        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                        boxShadow: selected ? '0 0 0 1px rgba(30,107,60,0.08)' : 'none',
                        minWidth: 0,
                      }}
                    >
                      <CheckoutPaymentMethodGraphic method={method.value} />
                      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.35, textAlign: 'start' }}>
                        {t(`paymentMethods.${method.value}`)}
                      </span>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={selected}
                        onChange={updateField("paymentMethod")}
                        style={{ flexShrink: 0, width: '18px', height: '18px', accentColor: colors.primary }}
                      />
                    </label>
                  );
                })}
              </div>
              {fieldErr("paymentMethod")}
            </fieldset>
          </div>

          {form.paymentMethod === "bank_transfer" && (
            <div ref={assignFieldRef("bankTransferProof")} style={cardSectionStyle}>
              <label style={labelStyle}>
                {t("bankTransferProofLabel")}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setBankTransferProofFile(f || null);
                  }}
                  style={{
                    ...inputBase,
                    padding: "8px 12px",
                    cursor: "pointer",
                    ...(fieldErrors.bankTransferProof ? { borderColor: colors.error } : {})
                  }}
                />
                <span style={{ fontSize: "12px", color: colors.textMuted, display: "block", marginTop: "6px" }}>
                  {t("bankTransferProofHint")}
                </span>
                {fieldErr("bankTransferProof")}
              </label>
            </div>
          )}

          {showGuestLegalConsent ? (
            <div ref={assignFieldRef("acceptTerms")} style={cardSectionStyle}>
              <h3 style={{ margin: 0, fontSize: '16px', lineHeight: '24px', fontWeight: 600, color: colors.textPrimary }}>
                {t("legal:consent.sectionTitle")}
              </h3>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: colors.textSecondary,
                  margin: 0,
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (e.target.checked) {
                      setFieldErrors((prev) => {
                        if (!prev.acceptTerms) return prev;
                        const next = { ...prev };
                        delete next.acceptTerms;
                        return next;
                      });
                    }
                  }}
                  style={{
                    flexShrink: 0,
                    width: '20px',
                    height: '20px',
                    marginTop: '1px',
                    accentColor: colors.primary,
                    cursor: 'pointer',
                  }}
                />
                <span style={{ lineHeight: 1.5, color: colors.textPrimary }}>
                  <Trans
                    t={t}
                    i18nKey="consent.requiredLegalCheckbox"
                    ns="legal"
                    components={{
                      terms: <Link to={LEGAL_ROUTES.terms} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 600 }} />,
                      privacy: <Link to={LEGAL_ROUTES.privacy} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 600 }} />,
                      shipping: <Link to={LEGAL_ROUTES.shipping} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 600 }} />,
                      cancellation: <Link to={LEGAL_ROUTES.cancellation} target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, fontWeight: 600 }} />,
                    }}
                  />
                  <span aria-hidden style={{ color: colors.error, marginInlineStart: '4px' }}>*</span>
                </span>
              </label>
              {fieldErr("acceptTerms")}
            </div>
          ) : null}

          {/* Submit error */}
          <AnimatePresence>
            {submitError && (
              <motion.div key="submit-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px', lineHeight: 1.5 }}>
                  {submitError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={!submitting ? { scale: 1.02 } : {}}
            whileTap={!submitting ? { scale: 0.96 } : {}}
            transition={{ duration: 0.12 }}
            style={{
              padding: '12px 20px', borderRadius: '10px', border: 'none',
              background: submitting ? colors.border : colors.primary,
              color: submitting ? colors.textMuted : colors.textInverse,
              fontSize: '15px', fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 14px rgba(30,107,60,0.30)',
              width: '100%',
            }}
          >
            {submitting ? t("placingOrder") : t("placeOrder")}
          </motion.button>
        </form>
      </div>
    </section>
  );
};

export default CheckoutPage;
