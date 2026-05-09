import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ProductCard from "../components/ProductCard";
import { useCart } from "../features/cart/CartContext";
import * as productService from "../services/productService";
import { formatApiError } from "../utils/formatApiError";

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

// ─── Marquee data (per language) ─────────────────────────────────────────────
const MARQUEE = {
  he: [
    { icon: '🌿', text: 'מהשדה ישר לשולחן שלכם' },
    { icon: '🏷️', text: 'מחירים נמוכים מהסופרמרקט' },
    { icon: '🚚', text: 'משלוח מהיר' },
    { icon: '🏠', text: 'מביאים את השוק עד אליכם' },
    { icon: '🍎', text: 'תוצרת טרייה מדי יום' },
  ],
  en: [
    { icon: '🌿', text: 'From the farm straight to your table' },
    { icon: '🏷️', text: 'Lower prices than supermarkets' },
    { icon: '🚚', text: 'Fast delivery' },
    { icon: '🏠', text: 'We bring the market to your door' },
    { icon: '🍎', text: 'Fresh daily produce' },
  ],
  ar: [
    { icon: '🌿', text: 'من المزرعة مباشرة إلى مائدتك' },
    { icon: '🏷️', text: 'أسعار أقل من المتاجر الأخرى' },
    { icon: '🚚', text: 'توصيل سريع' },
    { icon: '🏠', text: 'نجلب السوق إلى بابك' },
    { icon: '🍎', text: 'منتجات طازجة يومياً' },
  ],
};

const AVATAR_COLORS = ['#a8d5b5', '#80cbc4', '#ffcc80', '#ef9a9a'];

// ─── Blob hero image placeholder ─────────────────────────────────────────────
const HeroBlob = () => (
  <div style={{ position: 'relative', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
    {/* Main organic blob */}
    <div
      style={{
        width: '100%',
        aspectRatio: '1',
        borderRadius: '62% 38% 55% 45% / 60% 44% 56% 40%',
        background: 'linear-gradient(145deg, #1a4d2e 0%, #2e7d4f 25%, #52a875 55%, #a8d5b5 78%, #e8f5e9 100%)',
        overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 40px 80px rgba(30,107,60,0.22), 0 16px 40px rgba(30,107,60,0.12)',
      }}
    >
      {/* Inner depth circles */}
      <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', inset: '34%', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      {/* Placeholder label */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>
          hero image
        </span>
      </div>
    </div>

    {/* Floating 100% Organic card */}
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { duration: 0.4, delay: 0.6 },
        y: { repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 0.6 },
      }}
      style={{
        position: 'absolute',
        bottom: '6%',
        insetInlineEnd: '-4%',
        background: colors.surface,
        borderRadius: '16px',
        padding: '12px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '176px',
      }}
    >
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: colors.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
        🍏
      </div>
      <div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.1 }}>100%</div>
        <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: colors.textMuted, textTransform: 'uppercase', marginTop: '2px' }}>
          Organic Freshness
        </div>
      </div>
    </motion.div>
  </div>
);

// ─── Hero section ─────────────────────────────────────────────────────────────
const HeroSection = ({ t }) => {
  const scrollToProducts = () => {
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section style={{ background: colors.bg, padding: '72px 0 64px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Text column — first in DOM → right in RTL (start), left in LTR */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* Badge */}
            <span style={{
              alignSelf: 'flex-start',
              padding: '5px 14px',
              borderRadius: '9999px',
              border: `1px solid ${colors.primaryBorder}`,
              background: colors.primarySurface,
              color: colors.primary,
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}>
              {t("home:hero.badge")}
            </span>

            {/* Heading */}
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: colors.textPrimary,
              letterSpacing: '-0.5px',
            }}>
              {t("home:hero.heading")}
            </h1>

            {/* Subtitle */}
            <p style={{
              margin: 0,
              fontSize: '17px',
              lineHeight: 1.65,
              color: colors.textSecondary,
              maxWidth: '400px',
            }}>
              {t("home:hero.subtitle")}
            </p>

            {/* Customers row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {AVATAR_COLORS.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: color,
                      border: `2.5px solid ${colors.bg}`,
                      marginInlineStart: i === 0 ? 0 : '-10px',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                <strong style={{ color: colors.textPrimary }}>{t("home:hero.customersCount")}</strong>
                {' '}{t("home:hero.customersLabel")}
              </div>
            </div>

            {/* CTA */}
            <motion.button
              onClick={scrollToProducts}
              whileHover={{ scale: 1.03, background: colors.primaryHover }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                alignSelf: 'flex-start',
                padding: '14px 32px',
                borderRadius: '12px',
                border: 'none',
                background: colors.primary,
                color: colors.textInverse,
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(30,107,60,0.30)',
                letterSpacing: '0.2px',
              }}
            >
              {t("home:hero.cta")}
            </motion.button>
          </motion.div>

          {/* Image column — second in DOM → left in RTL (end), right in LTR */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <HeroBlob />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── Marquee bar ──────────────────────────────────────────────────────────────
const MarqueeBar = ({ lang }) => {
  const items = MARQUEE[lang] || MARQUEE.en;
  const doubled = [...items, ...items];

  return (
    <div style={{
      background: '#1e5c32',
      overflow: 'hidden',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <motion.div
        style={{ display: 'flex', alignItems: 'center', width: 'max-content' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 38, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 32px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: '14px', fontWeight: 500 }}>
              {item.text}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '18px', marginInlineStart: '20px' }}>
              •
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div style={{ background: colors.surface, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
    <motion.div
      animate={{ opacity: [0.4, 0.75, 0.4] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
      style={{ aspectRatio: '4/3', background: colors.border }}
    />
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <motion.div animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.1 }} style={{ height: '12px', width: '40%', background: colors.border, borderRadius: '6px' }} />
      <motion.div animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.15 }} style={{ height: '18px', width: '70%', background: colors.border, borderRadius: '6px' }} />
      <motion.div animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.2 }} style={{ height: '22px', width: '50%', background: colors.border, borderRadius: '6px' }} />
      <motion.div animate={{ opacity: [0.4, 0.75, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut', delay: 0.25 }} style={{ height: '36px', background: colors.border, borderRadius: '10px' }} />
    </div>
  </div>
);

// ─── List stagger variants ────────────────────────────────────────────────────
const listVariants = {
  animate: { transition: { staggerChildren: 0.055 } },
};
const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

// ─── HomePage ─────────────────────────────────────────────────────────────────
const HomePage = () => {
  const { t, i18n } = useTranslation(["home", "common"]);
  const { error: cartError } = useCart();
  const lang = (i18n.language || "he").split("-")[0];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await productService.getProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      setProducts([]);
      setError(err.userMessage || formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <HeroSection t={t} />
      <MarqueeBar lang={lang} />

      {/* Products section */}
      <section
        id="products-section"
        style={{ background: colors.bg, padding: '64px 0 80px' }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}
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
              {t("home:products.badge")}
            </span>
            <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: colors.textPrimary, letterSpacing: '-0.3px' }}>
              {t("home:products.heading")}
            </h2>
          </motion.div>

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
                <div role="alert" style={{ padding: '12px 16px', borderRadius: '10px', background: colors.errorSurface, border: `1px solid ${colors.errorBorder}`, color: colors.error, fontSize: '14px' }}>
                  <strong>{t("home:errorTitle")}</strong>
                  <p style={{ margin: '6px 0 0' }}>{error}</p>
                  <button
                    type="button"
                    onClick={load}
                    style={{ marginTop: '10px', padding: '5px 14px', borderRadius: '7px', border: `1px solid ${colors.errorBorder}`, background: colors.errorSurface, color: colors.error, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t("common:retry")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 && !error ? (
            <p style={{ color: colors.textMuted, fontSize: '15px' }}>{t("home:empty")}</p>
          ) : (
            <motion.div
              variants={listVariants}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, amount: 0.1 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}
            >
              {products.map((product) => (
                <motion.div key={product._id} variants={itemVariants}>
                  <ProductCard product={product} lang={lang} />
                </motion.div>
              ))}
            </motion.div>
          )}

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
