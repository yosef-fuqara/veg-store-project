import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProductCard from "../components/ProductCard";
import { CategoryBarMobile, CategorySidebar } from "../components/CategoryNav";
import { useCart } from "../features/cart/CartContext";
import * as productService from "../services/productService";
import { getCategories } from "../services/categoryService";
import { formatApiError } from "../utils/formatApiError";
import { CATEGORY_NAV_IDS } from "../utils/categoryFilter";
import {
  buildNavCategoryResolution,
  productMatchesStorefrontCategoryNav,
} from "../utils/storefrontCategoryMapping";

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

// ─── Hero trust bar (localized) ───────────────────────────────────────────────
const HeroTrustBar = ({ t, isMobile }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flexWrap: isMobile ? 'nowrap' : 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      rowGap: isMobile ? '12px' : '16px',
      width: '100%',
      maxWidth: '480px',
      padding: isMobile ? '12px 16px' : '14px 20px',
      boxSizing: 'border-box',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.18)',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(10px)',
    }}
  >
    {HERO_TRUST_KEYS.map((key, i) => (
      <Fragment key={key}>
        {i > 0 && (
          <span
            aria-hidden
            style={{
              display: isMobile ? 'none' : 'block',
              width: '1px',
              height: '16px',
              flexShrink: 0,
              alignSelf: 'center',
              background: 'rgba(255,255,255,0.22)',
              marginInline: '4px',
            }}
          />
        )}
        <motion.span
          whileHover={{ opacity: 0.88 }}
          transition={{ duration: 0.2 }}
          style={{
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 500,
            letterSpacing: '0.02em',
            lineHeight: 1.45,
            color: 'rgba(255,255,255,0.94)',
            textAlign: 'center',
            textShadow: '0 1px 12px rgba(0,0,0,0.18)',
          }}
        >
          {t(key)}
        </motion.span>
      </Fragment>
    ))}
  </motion.div>
);

// ─── Hero section ─────────────────────────────────────────────────────────────
const HeroSection = ({ t, isMobile }) => {
  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroOverlay =
    'linear-gradient(180deg, rgba(18, 56, 36, 0.55) 0%, rgba(10, 38, 26, 0.84) 100%)';

  return (
    <section
      style={{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
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
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: heroOverlay,
          boxShadow: 'inset 0 0 64px rgba(0,0,0,0.18)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '48px 24px 56px' : '72px 24px 80px',
          boxSizing: 'border-box',
          width: '100%',
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            maxWidth: 'min(100%, 720px)',
            marginInline: 'auto',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <span style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.32)',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              color: colors.textInverse,
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.3px',
              textAlign: 'center',
            }}>
              {t('home:hero.badge')}
            </span>

            <h1
              style={{
                margin: 0,
                fontSize: isMobile
                  ? 'clamp(28px, 7.5vw, 42px)'
                  : 'clamp(36px, 3.6vw, 56px)',
                fontWeight: 800,
                lineHeight: 1.18,
                color: colors.textInverse,
                letterSpacing: isMobile ? '-0.02em' : '-0.025em',
                textShadow: '0 2px 28px rgba(0,0,0,0.32)',
                textAlign: 'center',
                width: '100%',
                maxWidth: 'min(100%, 680px)',
                boxSizing: 'border-box',
              }}
            >
              {t('home:hero.subtitle')}
            </h1>

            <HeroTrustBar t={t} isMobile={isMobile} />

            <motion.button
              type="button"
              onClick={scrollToProducts}
              animate={{ y: [0, -8, 0] }}
              transition={{
                y: { repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.5 },
                scale: { duration: 0.15 },
                background: { duration: 0.15 },
              }}
              whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.94)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%',
                maxWidth: 'min(100%, 400px)',
                boxSizing: 'border-box',
                padding: isMobile ? '12px 28px' : '14px 32px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.55)',
                background: colors.surface,
                color: colors.primary,
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                letterSpacing: '0.2px',
              }}
            >
              {t('home:hero.cta')}
            </motion.button>
          </motion.div>
        </div>
      </div>
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
  const prevActiveCategoryRef = useRef(/** @type {string | null} */ (null));
  const prevCategoryIdParamRef = useRef(/** @type {string | null} */ (null));

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
    if (activeCategoryId && prevActiveCategoryRef.current !== activeCategoryId) {
      requestAnimationFrame(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    prevActiveCategoryRef.current = activeCategoryId;
  }, [activeCategoryId]);

  useEffect(() => {
    if (categoryIdParam && prevCategoryIdParamRef.current !== categoryIdParam) {
      requestAnimationFrame(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    prevCategoryIdParamRef.current = categoryIdParam;
  }, [categoryIdParam]);

  const displayedProducts = useMemo(() => {
    let list = products;
    if (categoryIdParam) {
      list = list.filter((p) => productInDbCategory(p, categoryIdParam));
    } else if (activeCategoryId) {
      list = list.filter((p) =>
        productMatchesStorefrontCategoryNav(p, activeCategoryId, categoryResolution)
      );
    }
    if (productIdParam) {
      const inList = list.some((p) => String(p._id) === productIdParam);
      const exists = products.some((p) => String(p._id) === productIdParam);
      if (!inList && exists) {
        list = products;
      }
    }
    return list;
  }, [products, categoryIdParam, activeCategoryId, productIdParam, categoryResolution]);

  const handleCategorySelect = useCallback((id) => {
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
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.delete('cat');
      next.delete('categoryId');
      next.delete('product');
      return next;
    }, { replace: true });
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
  }, [loading, productIdParam, products, displayedProducts.length, setSearchParams]);

  return (
    <div>
      <HeroSection t={t} isMobile={isMobile} />
      <MarqueeBar lang={lang} />

      {/* Products section */}
      <section id="products-section" style={{ background: colors.bg, padding: isMobile ? '48px 0 64px' : '64px 0 80px' }}>
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
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '26px' : '32px',
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: '-0.3px',
            }}>
              {t('home:products.heading')}
            </h2>
          </motion.div>

          {isMobile && (
            <CategoryBarMobile
              activeId={activeCategoryId}
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
                activeId={activeCategoryId}
                onSelect={handleCategorySelect}
                onShowAll={handleShowAllCategories}
              />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Grid */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                  {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : products.length === 0 && !error ? (
                <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t('home:empty')}</p>
              ) : displayedProducts.length === 0 && (activeCategoryId || categoryIdParam) ? (
                <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t('home:categories.filterEmpty')}</p>
              ) : (
                <motion.div
                  variants={listVariants}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, amount: 0.05 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}
                >
                  {displayedProducts.map((product) => (
                    <motion.div
                      key={product._id}
                      id={product._id ? `product-${product._id}` : undefined}
                      variants={itemVariants}
                    >
                      <ProductCard product={product} lang={lang} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
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
