import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProductCard from "../components/ProductCard";
import { CategoryBarMobile, CategorySidebar } from "../components/CategoryNav";
import { useCart } from "../features/cart/CartContext";
import { useStoreSettings } from "../features/store/StoreSettingsContext";
import * as productService from "../services/productService";
import { getCategories } from "../services/categoryService";
import { formatApiError } from "../utils/formatApiError";
import { CATEGORY_NAV_IDS } from "../utils/categoryFilter";
import { useActiveSection } from "../hooks/useActiveSection";
import {
  buildNavCategoryResolution,
  resolveProductStorefrontNavSlot,
} from "../utils/storefrontCategoryMapping";
import {
  STOREFRONT_STICKY_HEADER_SCROLL_MARGIN,
  scrollToCategorySection,
  scrollToElementById,
} from "../utils/storefrontNavScroll";
import { getProductNameSearchHaystack } from "../utils/localizedProduct";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/** @param {unknown} product @param {string} categoryId */
function productInDbCategory(product, categoryId) {
  if (!product || typeof product !== "object" || !categoryId) return false;
  const cat = /** @type {{ category?: unknown }} */ (product).category;
  if (cat == null) return false;
  if (typeof cat === "string") return String(cat) === String(categoryId);
  if (typeof cat === "object" && /** @type {{ _id?: unknown }} */ (cat)._id != null) {
    return String(/** @type {{ _id?: unknown }} */ (cat)._id) === String(categoryId);
  }
  return false;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const colors = {
  primary:        '#1e6b3c',
  primaryHover:   '#165430',
  primarySurface: '#eef7f1',
  primaryBorder:  '#a3cfb4',
  bg:             '#faf8f5',
  surface:        '#ffffff',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
  textInverse:    '#ffffff',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
};

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  primary: '0 4px 14px rgba(30,107,60,0.30)',
};

// ─── Breakpoint ───────────────────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
};

// ─── Marquee monoline icons (white, stroke-only) ──────────────────────────────
const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true,
};

const LeafIcon = () => (
  <svg {...iconProps}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
);

const TagIcon = () => (
  <svg {...iconProps}>
    <path d="M12 2H2v10l9.29 9.29c.78.78 2.05.78 2.83 0l7.18-7.18c.78-.78.78-2.05 0-2.83L12 2Z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const TruckIcon = () => (
  <svg {...iconProps}>
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const HouseIcon = () => (
  <svg {...iconProps}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2Z" />
  </svg>
);

const AppleIcon = () => (
  <svg {...iconProps}>
    <path d="M12 6c-1.5-2-3.5-3-5-3a4 4 0 0 0-4 4c0 6 4 13 9 13s9-7 9-13a4 4 0 0 0-4-4c-1.5 0-3.5 1-5 3Z" />
    <path d="M12 6c0-2 1-4 3-4" />
  </svg>
);

// ─── Marquee data ─────────────────────────────────────────────────────────────
const MARQUEE = {
  he: [
    { Icon: LeafIcon,   text: 'מהשדה ישר לשולחן שלכם' },
    { Icon: TagIcon,    text: 'מחירים נמוכים מהסופרמרקט' },
    { Icon: TruckIcon,  text: 'משלוח מהיר' },
    { Icon: HouseIcon,  text: 'מביאים את השוק עד אליכם' },
    { Icon: AppleIcon,  text: 'תוצרת טרייה מדי יום' },
  ],
  en: [
    { Icon: LeafIcon,   text: 'From the farm straight to your table' },
    { Icon: TagIcon,    text: 'Lower prices than supermarkets' },
    { Icon: TruckIcon,  text: 'Fast delivery' },
    { Icon: HouseIcon,  text: 'We bring the market to your door' },
    { Icon: AppleIcon,  text: 'Fresh daily produce' },
  ],
  ar: [
    { Icon: LeafIcon,   text: 'من المزرعة مباشرة إلى مائدتك' },
    { Icon: TagIcon,    text: 'أسعار أقل من المتاجر الأخرى' },
    { Icon: TruckIcon,  text: 'توصيل سريع' },
    { Icon: HouseIcon,  text: 'نجلب السوق إلى بابك' },
    { Icon: AppleIcon,  text: 'منتجات طازجة يومياً' },
  ],
};

/** Full-width hero background — swap URL or use `/hero.jpg` in public when ready */
const HERO_BACKGROUND_IMAGE_URL =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1920&q=85';

const HERO_TRUST_KEYS = /** @type {const} */ (['home:hero.trust1', 'home:hero.trust2', 'home:hero.trust3']);

// ── Decorative fruit illustrations (pure CSS — no images, no emoji) ───────────

const Lemon = ({ size }) => (
  <div
    style={{
      width: size,
      height: size * 0.72,
      borderRadius: '50%',
      transform: 'rotate(-18deg)',
      background: `
        radial-gradient(ellipse at 30% 26%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%),
        radial-gradient(ellipse at 60% 70%, #b07700 0%, #e1a91a 28%, #f6d24a 60%, #fff1a8 100%)
      `,
      boxShadow: `
        0 30px 50px -22px rgba(80,55,0,0.55),
        0 14px 28px -16px rgba(180,120,0,0.55),
        inset 0 -8px 20px rgba(120,80,0,0.32),
        inset 0 8px 18px rgba(255,255,255,0.32)
      `,
      position: 'relative',
    }}
  >
    {/* darker pointed tip hint */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: -size * 0.02,
        top: '42%',
        width: size * 0.1,
        height: size * 0.1,
        borderRadius: '50%',
        background: 'rgba(120,75,0,0.45)',
        filter: 'blur(6px)',
      }}
    />
  </div>
);

const Tomato = ({ size }) => (
  <div style={{ width: size, height: size, position: 'relative' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50% 50% 48% 48% / 52% 52% 50% 50%',
        background: `
          radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 36%),
          radial-gradient(circle at 70% 72%, #5a100b 0%, #b9241a 38%, #e8463a 72%, #ffb3a4 100%)
        `,
        boxShadow: `
          0 30px 50px -20px rgba(60,10,5,0.55),
          0 14px 28px -16px rgba(180,30,20,0.55),
          inset 0 -10px 22px rgba(80,10,5,0.34),
          inset 0 8px 18px rgba(255,255,255,0.22)
        `,
      }}
    />
    {/* calyx (stem leaves) */}
    {[-45, -15, 15, 45].map((deg, i) => (
      <div
        key={i}
        aria-hidden
        style={{
          position: 'absolute',
          top: -size * 0.04,
          left: '50%',
          width: size * 0.07,
          height: size * 0.22,
          borderRadius: '50% 50% 30% 30%',
          background: 'linear-gradient(180deg, #4ea84c 0%, #1e6b3c 75%, #0c3a1d 100%)',
          transform: `translate(-50%, 0) rotate(${deg}deg)`,
          transformOrigin: 'center 90%',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.18), inset 0 -2px 4px rgba(0,0,0,0.18)',
        }}
      />
    ))}
  </div>
);

const Watermelon = ({ size }) => {
  const rind = Math.max(6, size * 0.07);
  return (
    <div
      style={{
        width: size,
        height: size * 0.55,
        position: 'relative',
        overflow: 'hidden',
        transform: 'rotate(-6deg)',
      }}
    >
      {/* full circle anchored at bottom — only lower half shows */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: '50%',
          background: `
            radial-gradient(circle at 50% 35%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 28%),
            radial-gradient(circle at 50% 55%, #ff7080 0%, #e8384a 42%, #a8182a 78%)
          `,
          border: `${rind}px solid #2c8a3d`,
          boxSizing: 'border-box',
          boxShadow: `
            inset 0 -6px 16px rgba(80,10,15,0.34),
            inset 0 6px 14px rgba(255,255,255,0.18),
            0 28px 50px -22px rgba(60,5,10,0.55)
          `,
        }}
      />
      {/* light-green inner ring between rind and flesh */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: rind - 2,
          left: rind - 2,
          width: size - (rind - 2) * 2,
          height: size - (rind - 2) * 2,
          borderRadius: '50%',
          border: `${Math.max(2, size * 0.022)}px solid #c9ec8b`,
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />
      {/* seeds */}
      {[
        { left: '28%', top: '38%', r: -16 },
        { left: '48%', top: '30%', r: 8 },
        { left: '66%', top: '40%', r: -6 },
        { left: '38%', top: '58%', r: 22 },
        { left: '60%', top: '62%', r: -22 },
      ].map((s, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            width: Math.max(4, size * 0.05),
            height: Math.max(7, size * 0.085),
            borderRadius: '50%',
            background: 'linear-gradient(180deg, #1a1209 0%, #2c1f10 100%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
            transform: `rotate(${s.r}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const Avocado = ({ size }) => (
  <div style={{ width: size * 0.7, height: size, position: 'relative', transform: 'rotate(8deg)' }}>
    {/* skin */}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50% 50% 50% 50% / 38% 38% 62% 62%',
        background: 'linear-gradient(160deg, #1b3a1f 0%, #2a5a32 55%, #152a18 100%)',
        boxShadow:
          '0 28px 50px -22px rgba(15,30,15,0.55), 0 14px 28px -16px rgba(40,75,40,0.45), inset 0 -6px 16px rgba(0,0,0,0.28), inset 0 4px 10px rgba(255,255,255,0.10)',
      }}
    />
    {/* flesh */}
    <div
      style={{
        position: 'absolute',
        top: '6%',
        left: '12%',
        right: '12%',
        bottom: '6%',
        borderRadius: '50% 50% 50% 50% / 38% 38% 62% 62%',
        background: `
          radial-gradient(ellipse at 38% 28%, #f9f0a8 0%, #d8e07a 24%, #9ec84d 58%, #5e9a3a 100%)
        `,
        boxShadow: 'inset 0 -8px 18px rgba(60,90,30,0.32), inset 0 6px 16px rgba(255,255,255,0.24)',
      }}
    />
    {/* pit */}
    <div
      style={{
        position: 'absolute',
        width: '34%',
        height: '24%',
        left: '50%',
        top: '64%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 35% 30%, #b07a44 0%, #6e3a18 55%, #3a1c08 100%)',
        boxShadow:
          'inset 0 -4px 10px rgba(0,0,0,0.4), inset 0 3px 8px rgba(255,200,120,0.20), 0 6px 10px rgba(40,20,10,0.4)',
      }}
    />
  </div>
);

const FRUIT_COMPONENTS = { lemon: Lemon, tomato: Tomato, watermelon: Watermelon, avocado: Avocado };

// Floating wrapper — same motion API as the old PremiumOrb so layout/perf stays predictable.
const FruitFloater = ({
  type,
  size,
  top,
  bottom,
  insetInlineStart,
  insetInlineEnd,
  floatRange = 14,
  floatDuration = 7,
  rotateRange = 3,
  delay = 0,
  opacity = 1,
  reduced,
}) => {
  const Fruit = FRUIT_COMPONENTS[type];
  if (!Fruit) return null;
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 0.92 }}
      animate={
        reduced
          ? { opacity, scale: 1 }
          : { opacity, scale: 1, y: [0, -floatRange, 0], rotate: [0, rotateRange, 0] }
      }
      transition={
        reduced
          ? { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
          : {
              opacity: { duration: 0.9, delay: 0.2 + delay * 0.08 },
              scale: { duration: 0.9, delay: 0.2 + delay * 0.08, ease: [0.25, 0.1, 0.25, 1] },
              y: { duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay },
              rotate: { duration: floatDuration * 1.6, repeat: Infinity, ease: 'easeInOut', delay },
            }
      }
      style={{
        position: 'absolute',
        top,
        bottom,
        insetInlineStart,
        insetInlineEnd,
        pointerEvents: 'none',
        zIndex: 2,
        // light drop-shadow filter ties the fruit to its background
        filter: 'drop-shadow(0 18px 24px rgba(0,0,0,0.35))',
      }}
    >
      <Fruit size={size} />
    </motion.div>
  );
};

// Large soft ambient blob (atmospheric depth)
const AmbientBlob = ({ size, color, top, bottom, insetInlineStart, insetInlineEnd, reduced, drift = 24, duration = 16, delay = 0 }) => (
  <motion.div
    aria-hidden
    initial={{ opacity: 0 }}
    animate={
      reduced
        ? { opacity: 0.6 }
        : { opacity: 0.65, x: [0, drift, 0], y: [0, -drift * 0.6, 0] }
    }
    transition={
      reduced
        ? { duration: 1.2 }
        : {
            opacity: { duration: 1.2 },
            x: { duration, repeat: Infinity, ease: 'easeInOut', delay },
            y: { duration: duration * 1.2, repeat: Infinity, ease: 'easeInOut', delay },
          }
    }
    style={{
      position: 'absolute',
      top,
      bottom,
      insetInlineStart,
      insetInlineEnd,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at 50% 50%, ${color} 0%, rgba(0,0,0,0) 65%)`,
      filter: 'blur(40px)',
      pointerEvents: 'none',
      zIndex: 1,
    }}
  />
);

// ─── Hero trust bar (localized) — premium glass chips ─────────────────────────
const HeroTrustBar = ({ t, isMobile }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '8px' : '10px',
      width: '100%',
      maxWidth: '560px',
      boxSizing: 'border-box',
    }}
  >
    {HERO_TRUST_KEYS.map((key, i) => (
      <motion.span
        key={key}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
        whileHover={{ y: -2 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '8px 14px' : '9px 18px',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.22)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          color: 'rgba(255,255,255,0.96)',
          fontSize: isMobile ? '12.5px' : '13.5px',
          fontWeight: 500,
          letterSpacing: '0.02em',
          lineHeight: 1.3,
          textAlign: 'center',
          textShadow: '0 1px 10px rgba(0,0,0,0.22)',
          boxShadow:
            '0 8px 24px -10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        {t(key)}
      </motion.span>
    ))}
  </motion.div>
);

// ─── Hero section — premium 3D-inspired layered composition ───────────────────
const HeroSection = ({ t, isMobile }) => {
  const reduced = useReducedMotion();

  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroOverlay =
    'linear-gradient(180deg, rgba(12, 44, 28, 0.62) 0%, rgba(8, 30, 20, 0.92) 100%)';

  // Decorative floating fruit — premium CSS illustrations, not plain spheres.
  // Order is chosen so mobile (first 2) keeps the most iconic pair (watermelon + lemon).
  const fruits = [
    { type: 'watermelon', size: isMobile ? 130 : 200, bottom: isMobile ? 40 : 64, insetInlineStart: isMobile ? -28 : 40, floatRange: 12, floatDuration: 6.8, delay: 0.0 },
    { type: 'lemon',      size: isMobile ? 78  : 120, top:    isMobile ? 36 : 80, insetInlineEnd:   isMobile ? -10 : 90, floatRange: 16, floatDuration: 8.0, delay: 0.6 },
    { type: 'tomato',     size: isMobile ? 70  : 110, top:    isMobile ? 150: 200, insetInlineStart: isMobile ? 12 : 130, floatRange: 14, floatDuration: 7.2, delay: 1.1 },
    { type: 'avocado',    size: isMobile ? 80  : 130, bottom: isMobile ? 90 : 110, insetInlineEnd:   isMobile ? 10 : 64, floatRange: 10, floatDuration: 6.4, delay: 1.6 },
  ];
  const visibleFruits = isMobile ? fruits.slice(0, 2) : fruits;

  return (
    <section
      style={{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: '#0a1f14',
      }}
    >
      {/* Background photo (kept, slightly darker overlay for premium feel) */}
      <img
        src={HERO_BACKGROUND_IMAGE_URL}
        alt=""
        loading="eager"
        decoding="async"
        fetchPriority="high"
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 0,
          pointerEvents: 'none',
          transform: 'scale(1.05)',
          filter: 'saturate(1.05) contrast(1.02)',
        }}
      />

      {/* Tonal overlay */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: heroOverlay,
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.28)',
        }}
      />

      {/* Ambient drifting color blobs (atmosphere) */}
      <AmbientBlob
        size={isMobile ? 360 : 540}
        color="rgba(74, 199, 122, 0.45)"
        top={isMobile ? -120 : -160}
        insetInlineStart={isMobile ? -120 : -120}
        reduced={reduced}
      />
      <AmbientBlob
        size={isMobile ? 320 : 480}
        color="rgba(241, 168, 58, 0.30)"
        bottom={isMobile ? -140 : -180}
        insetInlineEnd={isMobile ? -120 : -100}
        duration={20}
        delay={1.2}
        reduced={reduced}
      />

      {/* Subtle grain / dotted texture for depth (CSS only) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '3px 3px',
          mixBlendMode: 'overlay',
          opacity: 0.35,
        }}
      />

      {/* Decorative floating fruit — premium CSS illustrations, no emoji, no images */}
      {visibleFruits.map((f, i) => (
        <FruitFloater key={i} {...f} reduced={reduced} />
      ))}

      {/* Soft top vignette for headline contrast */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '64px 20px 72px' : '104px 24px 112px',
          boxSizing: 'border-box',
          width: '100%',
          minWidth: 0,
        }}
      >
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '20px' : '26px',
            maxWidth: 'min(100%, 760px)',
            marginInline: 'auto',
            width: '100%',
            padding: isMobile ? '28px 22px 30px' : '40px 44px 44px',
            boxSizing: 'border-box',
            borderRadius: isMobile ? '22px' : '28px',
            border: '1px solid rgba(255,255,255,0.16)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            boxShadow:
              '0 50px 100px -30px rgba(0,0,0,0.55), 0 20px 50px -20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          {/* inner highlight stroke */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />

          <motion.span
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
            }}
            style={{
              padding: '7px 18px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.30)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: colors.textInverse,
              fontSize: '12.5px',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              textAlign: 'center',
              boxShadow:
                '0 8px 24px -10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            {t('home:hero.badge')}
          </motion.span>

          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
            }}
            style={{
              margin: 0,
              fontFamily: "'Rubik', 'Segoe UI', system-ui, sans-serif",
              fontSize: isMobile
                ? 'clamp(30px, 8vw, 44px)'
                : 'clamp(40px, 4.2vw, 64px)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: colors.textInverse,
              letterSpacing: isMobile ? '-0.015em' : '-0.025em',
              textShadow: '0 4px 32px rgba(0,0,0,0.45)',
              textAlign: 'center',
              width: '100%',
              maxWidth: 'min(100%, 680px)',
              boxSizing: 'border-box',
              background:
                'linear-gradient(180deg, #ffffff 0%, #e8f1ea 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('home:hero.subtitle')}
          </motion.h1>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
            }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <HeroTrustBar t={t} isMobile={isMobile} />
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 14 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] } },
            }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 'min(100%, 420px)',
              marginTop: isMobile ? '4px' : '8px',
            }}
          >
            {/* CTA soft glow */}
            <motion.span
              aria-hidden
              animate={reduced ? { opacity: 0.5 } : { opacity: [0.45, 0.75, 0.45] }}
              transition={reduced ? { duration: 0.6 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: '-14px',
                borderRadius: '20px',
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(74,199,122,0.55) 0%, rgba(74,199,122,0) 70%)',
                filter: 'blur(14px)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />

            <motion.button
              type="button"
              onClick={scrollToProducts}
              whileHover={reduced ? undefined : { y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              style={{
                position: 'relative',
                zIndex: 1,
                width: '100%',
                boxSizing: 'border-box',
                padding: isMobile ? '14px 26px' : '16px 32px',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.55)',
                background:
                  'linear-gradient(180deg, #ffffff 0%, #f1efe9 100%)',
                color: colors.primary,
                fontSize: isMobile ? '15px' : '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow:
                  '0 22px 50px -16px rgba(0,0,0,0.55), 0 10px 24px -12px rgba(30,107,60,0.55), inset 0 1px 0 rgba(255,255,255,0.9)',
                letterSpacing: '0.3px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <span>{t('home:hero.cta')}</span>
              <motion.span
                aria-hidden
                animate={reduced ? { y: 0 } : { y: [0, 3, 0] }}
                transition={reduced ? { duration: 0.4 } : { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowDown size={18} strokeWidth={2.4} />
              </motion.span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Soft fade-out to next section */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '64px',
          zIndex: 2,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(26, 92, 46, 0) 0%, rgba(26, 92, 46, 0.55) 60%, #1a5c2e 100%)',
        }}
      />
    </section>
  );
};

// ─── Marquee bar ──────────────────────────────────────────────────────────────
const marqueeCellStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '10px',
  padding: '0 28px',
  whiteSpace: 'nowrap',
  direction: 'ltr',
};

const MarqueeBar = ({ lang }) => {
  const items = MARQUEE[lang] || MARQUEE.en;
  const hostRef = useRef(null);
  const measureRef = useRef(null);
  const halfRef = useRef(null);
  const [repeats, setRepeats] = useState(3);
  const [halfWidthPx, setHalfWidthPx] = useState(null);
  const [hoverPaused, setHoverPaused] = useState(false);

  const renderCells = (keyPrefix) =>
    Array.from({ length: repeats }, (_, copy) =>
      items.map(({ Icon, text }, j) => (
        <div key={`${keyPrefix}-${copy}-${j}`} style={marqueeCellStyle}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '9999px',
            background: 'rgba(255,255,255,0.10)',
            color: '#ffffff',
            flexShrink: 0,
          }}>
            <Icon />
          </span>
          <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.1px' }}>
            {text}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '16px', marginInlineStart: '16px' }}>
            ·
          </span>
        </div>
      ))
    ).flat();

  const layoutMarquee = useCallback(() => {
    const host = hostRef.current;
    const measure = measureRef.current;
    const half = halfRef.current;
    if (!host || !measure) return;
    const oneCycleW = measure.scrollWidth;
    if (oneCycleW < 1) return;
    const nextRepeats = Math.max(2, Math.ceil(host.clientWidth / oneCycleW) + 2);
    setRepeats((prev) => (prev === nextRepeats ? prev : nextRepeats));
    if (half) {
      const w = half.getBoundingClientRect().width;
      setHalfWidthPx((prev) => (prev != null && Math.abs(prev - w) < 0.5 ? prev : w));
    }
  }, []);

  useLayoutEffect(() => {
    layoutMarquee();
    const host = hostRef.current;
    const measure = measureRef.current;
    if (!host) return undefined;
    const ro = new ResizeObserver(() => layoutMarquee());
    ro.observe(host);
    if (measure) ro.observe(measure);
    window.addEventListener('resize', layoutMarquee);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', layoutMarquee);
    };
  }, [lang, layoutMarquee]);

  useLayoutEffect(() => {
    layoutMarquee();
  }, [repeats, layoutMarquee]);

  return (
    <>
      <style>{`
        @keyframes homeMarqueeDrift {
          from { transform: translateX(0); }
          to { transform: translateX(var(--marquee-x, 0px)); }
        }
      `}</style>
    <div
      ref={hostRef}
      dir="ltr"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      style={{
        position: 'relative',
        direction: 'ltr',
        unicodeBidi: 'isolate',
        background: '#1a5c2e',
        overflow: 'hidden',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {/* Hidden row: one full phrase cycle — width drives how many repeats fill the viewport */}
      <div
        ref={measureRef}
        dir="ltr"
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          visibility: 'hidden',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          direction: 'ltr',
          flexDirection: 'row',
        }}
      >
        {items.map(({ Icon, text }, j) => (
          <div key={`m-${j}`} style={marqueeCellStyle}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.10)',
              color: '#ffffff',
              flexShrink: 0,
            }}>
              <Icon />
            </span>
            <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.1px' }}>
              {text}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '16px', marginInlineStart: '16px' }}>
              ·
            </span>
          </div>
        ))}
      </div>

      {/* dir="ltr" keeps marquee motion consistent in RTL layouts; CSS animation so hover can pause without jumping */}
      <div
        dir="ltr"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 0,
          width: 'max-content',
          minWidth: 'max-content',
          willChange: 'transform',
          direction: 'ltr',
          '--marquee-x': halfWidthPx != null && halfWidthPx > 0 ? `${-halfWidthPx}px` : '0px',
          animation:
            halfWidthPx != null && halfWidthPx > 0
              ? 'homeMarqueeDrift 120s linear infinite'
              : 'none',
          animationPlayState: hoverPaused ? 'paused' : 'running',
        }}
      >
        <div ref={halfRef} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexShrink: 0, direction: 'ltr' }}>
          {renderCells('a')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexShrink: 0, direction: 'ltr' }} aria-hidden>
          {renderCells('b')}
        </div>
      </div>
    </div>
    </>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div style={{
    background: colors.surface,
    borderRadius: '14px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    boxShadow: shadow.sm,
  }}>
    <motion.div
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
      style={{ aspectRatio: '4/3', background: colors.border }}
    />
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[['40%', '12px', 0], ['68%', '18px', 0.08], ['48%', '22px', 0.14], ['100%', '36px', 0.2]].map(([w, h, delay], i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut', delay }}
          style={{ height: h, width: w, background: colors.border, borderRadius: '6px' }}
        />
      ))}
    </div>
  </div>
);

// ─── List stagger variants ────────────────────────────────────────────────────
const listVariants = { animate: { transition: { staggerChildren: 0.05 } } };
const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
};

// ─── HomePage ─────────────────────────────────────────────────────────────────
const HomePage = () => {
  const { t, i18n } = useTranslation(['home', 'common']);
  const { error: cartError } = useCart();
  const { canOrderNow } = useStoreSettings();
  const lang = (i18n.language || 'he').split('-')[0];
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('cat');
  const categoryIdParamRaw = searchParams.get('categoryId');
  const productIdParamRaw = searchParams.get('product');
  const categoryIdParam =
    categoryIdParamRaw && OBJECT_ID_RE.test(categoryIdParamRaw) ? categoryIdParamRaw : null;
  const productIdParam =
    productIdParamRaw && OBJECT_ID_RE.test(productIdParamRaw) ? productIdParamRaw : null;

  const activeCategoryId =
    !categoryIdParam &&
    catParam &&
    CATEGORY_NAV_IDS.includes(/** @type {typeof CATEGORY_NAV_IDS[number]} */ (catParam))
      ? catParam
      : null;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(/** @type {unknown[]} */ ([]));
  const [categoriesRequestOk, setCategoriesRequestOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const prevCategoryIdParamRef = useRef(/** @type {string | null} */ (null));
  const prevUrlCategoryRef = useRef(/** @type {string | null} */ (null));

  const categoryResolution = useMemo(
    () => buildNavCategoryResolution(categories, categoriesRequestOk),
    [categories, categoriesRequestOk]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await productService.getProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      setProducts([]);
      setError(err.userMessage || formatApiError(err));
    }
    let catOk = false;
    let cats = [];
    try {
      const c = await getCategories();
      cats = Array.isArray(c) ? c : [];
      catOk = true;
    } catch {
      catOk = false;
      cats = [];
    }
    setCategories(cats);
    setCategoriesRequestOk(catOk);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (catParam && !CATEGORY_NAV_IDS.includes(/** @type {typeof CATEGORY_NAV_IDS[number]} */ (catParam))) {
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        next.delete('cat');
        return next;
      }, { replace: true });
    }
  }, [catParam, setSearchParams]);

  useEffect(() => {
    if (categoryIdParamRaw && !categoryIdParam) {
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        next.delete('categoryId');
        return next;
      }, { replace: true });
    }
  }, [categoryIdParamRaw, categoryIdParam, setSearchParams]);

  useEffect(() => {
    if (productIdParamRaw && !productIdParam) {
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        next.delete('product');
        return next;
      }, { replace: true });
    }
  }, [productIdParamRaw, productIdParam, setSearchParams]);

  useEffect(() => {
    if (categoryIdParam && prevCategoryIdParamRef.current !== categoryIdParam) {
      requestAnimationFrame(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    prevCategoryIdParamRef.current = categoryIdParam;
  }, [categoryIdParam]);

  const catalogProducts = useMemo(() => {
    let list = products;
    if (categoryIdParam) {
      list = list.filter((p) => productInDbCategory(p, categoryIdParam));
    }
    const q = productSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => getProductNameSearchHaystack(p).includes(q));
    }
    return list;
  }, [products, categoryIdParam, productSearchQuery]);

  const productsByNavSection = useMemo(() => {
    /** @type {Record<string, typeof products>} */
    const buckets = {};
    for (const id of CATEGORY_NAV_IDS) {
      buckets[id] = [];
    }
    for (const p of catalogProducts) {
      const slot = resolveProductStorefrontNavSlot(p, categoryResolution);
      buckets[slot].push(p);
    }
    return buckets;
  }, [catalogProducts, categoryResolution]);

  const renderedSectionNavIds = useMemo(
    () => CATEGORY_NAV_IDS.filter((id) => (productsByNavSection[id] ?? []).length > 0),
    [productsByNavSection]
  );

  const sectionDomIds = useMemo(
    () => renderedSectionNavIds.map((id) => `category-${id}`),
    [renderedSectionNavIds]
  );

  const spySectionDomId = useActiveSection(sectionDomIds, {
    enabled: !loading && sectionDomIds.length > 0,
    rootMargin: '-35% 0px -55% 0px',
  });

  const navVisualActiveId = useMemo(() => {
    if (!spySectionDomId || !spySectionDomId.startsWith('category-')) return null;
    return spySectionDomId.slice('category-'.length);
  }, [spySectionDomId]);

  useEffect(() => {
    if (loading) return;
    const prev = prevUrlCategoryRef.current;
    if (activeCategoryId) {
      const run = () => {
        const el = document.getElementById(`category-${activeCategoryId}`);
        if (el) scrollToCategorySection(activeCategoryId);
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
      prevUrlCategoryRef.current = activeCategoryId;
      return;
    }
    if (prev != null) {
      requestAnimationFrame(() => scrollToElementById('products-catalog-top'));
    }
    prevUrlCategoryRef.current = activeCategoryId;
  }, [loading, activeCategoryId]);

  const handleCategorySelect = useCallback((id) => {
    setProductSearchQuery('');
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.delete('categoryId');
      next.delete('product');
      const current = next.get('cat');
      if (current === id) {
        next.delete('cat');
      } else {
        next.set('cat', id);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleShowAllCategories = useCallback(() => {
    setProductSearchQuery('');
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.delete('cat');
      next.delete('categoryId');
      next.delete('product');
      return next;
    }, { replace: true });
    requestAnimationFrame(() => scrollToElementById('products-catalog-top'));
  }, [setSearchParams]);

  useEffect(() => {
    if (loading || !productIdParam) return undefined;
    const el = document.getElementById(`product-${productIdParam}`);
    if (el) {
      const id = requestAnimationFrame(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return () => cancelAnimationFrame(id);
    }
    const missing = !products.some((p) => String(p._id) === productIdParam);
    if (missing) {
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        next.delete('product');
        return next;
      }, { replace: true });
    }
    return undefined;
  }, [loading, productIdParam, products, setSearchParams]);

  return (
    <div>
      <HeroSection t={t} isMobile={isMobile} />
      <MarqueeBar lang={lang} />

      {/* Products section */}
      <section
        id="products-section"
        style={{
          background: colors.bg,
          padding: isMobile ? '48px 0 64px' : '64px 0 80px',
          scrollMarginTop: STOREFRONT_STICKY_HEADER_SCROLL_MARGIN,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: isMobile ? '28px' : '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <span style={{
              alignSelf: 'flex-start',
              padding: '4px 12px',
              borderRadius: '9999px',
              border: `1px solid ${colors.primaryBorder}`,
              background: colors.primarySurface,
              color: colors.primary,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}>
              {t('home:products.badge')}
            </span>
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{
                margin: 0,
                flex: isMobile ? 'none' : '0 1 auto',
                fontSize: isMobile ? '26px' : '32px',
                fontWeight: 700,
                color: colors.textPrimary,
                letterSpacing: '-0.3px',
              }}>
                {t('home:products.heading')}
              </h2>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  flex: isMobile ? 'none' : '1 1 240px',
                  maxWidth: isMobile ? '100%' : '320px',
                  minWidth: 0,
                }}
              >
                <Search
                  aria-hidden
                  size={18}
                  strokeWidth={2}
                  style={{
                    position: 'absolute',
                    insetInlineStart: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: colors.textMuted,
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="search"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder={t('home:products.searchPlaceholder')}
                  aria-label={t('home:products.searchPlaceholder')}
                  autoComplete="off"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primaryBorder;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primarySurface}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.boxShadow = shadow.sm;
                  }}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingBlock: '10px',
                    paddingInlineStart: '40px',
                    paddingInlineEnd: '14px',
                    borderRadius: '10px',
                    border: `1px solid ${colors.border}`,
                    background: colors.surface,
                    color: colors.textPrimary,
                    fontSize: '15px',
                    lineHeight: 1.4,
                    boxShadow: shadow.sm,
                    outline: 'none',
                    textAlign: productSearchQuery ? 'start' : 'center',
                  }}
                />
              </div>
            </div>
          </motion.div>

          {isMobile && (
            <CategoryBarMobile
              activeId={navVisualActiveId}
              onSelect={handleCategorySelect}
              onShowAll={handleShowAllCategories}
            />
          )}

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginBottom: '24px' }}
              >
                <div
                  role="alert"
                  style={{
                    padding: '12px 16px', borderRadius: '10px',
                    background: colors.errorSurface,
                    border: `1px solid ${colors.errorBorder}`,
                    color: colors.error, fontSize: '14px',
                  }}
                >
                  <strong>{t('home:errorTitle')}</strong>
                  <p style={{ margin: '6px 0 0' }}>{error}</p>
                  <button
                    type="button"
                    onClick={load}
                    style={{
                      marginTop: '10px', padding: '6px 14px', borderRadius: '10px',
                      border: `1px solid ${colors.errorBorder}`,
                      background: colors.errorSurface, color: colors.error,
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {t('common:retry')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar + product grid (desktop: sticky rail at inline-start) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '24px',
            }}
          >
            {!isMobile && (
              <CategorySidebar
                activeId={navVisualActiveId}
                onSelect={handleCategorySelect}
                onShowAll={handleShowAllCategories}
              />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                id="products-catalog-top"
                style={{ scrollMarginTop: STOREFRONT_STICKY_HEADER_SCROLL_MARGIN }}
              >
                {loading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                    {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                  </div>
                ) : products.length === 0 && !error ? (
                  <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t('home:empty')}</p>
                ) : catalogProducts.length === 0 && productSearchQuery.trim() ? (
                  <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t('home:products.searchNoResults')}</p>
                ) : catalogProducts.length === 0 && categoryIdParam ? (
                  <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t('home:categories.filterEmpty')}</p>
                ) : renderedSectionNavIds.length === 0 ? (
                  <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t('home:empty')}</p>
                ) : (
                  renderedSectionNavIds.map((navId, idx) => (
                    <section
                      key={navId}
                      id={`category-${navId}`}
                      aria-labelledby={`category-heading-${navId}`}
                      style={{
                        scrollMarginTop: STOREFRONT_STICKY_HEADER_SCROLL_MARGIN,
                        marginTop: idx === 0 ? 0 : 40,
                      }}
                    >
                      <h3
                        id={`category-heading-${navId}`}
                        style={{
                          margin: '0 0 18px',
                          fontSize: isMobile ? '20px' : '22px',
                          fontWeight: 700,
                          color: colors.textPrimary,
                          letterSpacing: '-0.2px',
                        }}
                      >
                        {t(`home:categories.${navId}`)}
                      </h3>
                      <motion.div
                        variants={listVariants}
                        initial="initial"
                        animate="animate"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                          gap: '20px',
                        }}
                      >
                        {(productsByNavSection[navId] ?? []).map((product) => (
                          <motion.div
                            key={product._id}
                            id={product._id ? `product-${product._id}` : undefined}
                            variants={itemVariants}
                          >
                            <ProductCard product={product} lang={lang} orderingDisabled={!canOrderNow} />
                          </motion.div>
                        ))}
                      </motion.div>
                    </section>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cart error */}
          <AnimatePresence>
            {cartError && (
              <motion.p
                key="cart-error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                style={{ marginTop: '16px', color: colors.error, fontSize: '14px' }}
              >
                {cartError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
