import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { useCartVisualFeedback } from "../features/cart/CartVisualFeedbackContext";
import { formatPrice } from "../utils/formatPrice";
import { getLocalizedProductName, getLocalizedText } from "../utils/localizedProduct";

const colors = {
  primary:        '#1e6b3c',
  primaryHover:   '#165430',
  surface:        '#ffffff',
  border:         '#e8e3dc',
  textPrimary:    '#1c1917',
  textSecondary:  '#57534e',
  textMuted:      '#a8a29e',
  textInverse:    '#ffffff',
  success:        '#166534',
  error:          '#991b1b',
  errorSurface:   '#fef2f2',
  errorBorder:    '#fecaca',
  warning:        '#92400e',
  warningSurface: '#fffbeb',
  warningBorder:  '#fde68a',
};

const UNIT_KEYS = {
  kg:   'units.kg',
  gram: 'units.gram',
  unit: 'units.unit',
  box:  'units.box',
};

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  primary: '0 4px 14px rgba(30,107,60,0.30)',
};

// ─── Motion variants ──────────────────────────────────────────────────────────
const cardVariants = {
  rest: {
    y: 0,
    boxShadow: shadow.sm,
  },
  hover: {
    y: -4,
    boxShadow: shadow.md,
  },
};

const imgVariants = {
  rest:  { scale: 1 },
  hover: { scale: 1.06 },
};

const imgVariantsNoHover = {
  rest:  { scale: 1 },
  hover: { scale: 1 },
};

/** Uses storefront product payload only (no API changes). */
function isProductUnavailable(product) {
  if (!product) return true;
  if (product.isOutOfStock === true) return true;
  if (product.stockStatus === 'out_of_stock') return true;
  const rawInv = product.stock ?? product.quantity;
  if (rawInv != null && rawInv !== '') {
    const n = Number(rawInv);
    if (!Number.isNaN(n) && n <= 0) return true;
  }
  return product.stockStatus !== 'in_stock';
}

const ProductCard = ({ product, lang }) => {
  const { t } = useTranslation('home');
  const { addItem } = useCart();
  const { notifyProductAddedToCart } = useCartVisualFeedback();
  const addButtonRef = useRef(null);
  const [adding, setAdding] = useState(false);

  const id        = product._id;
  const name      = getLocalizedProductName(product, lang);
  const imageUrl  = typeof product.imageUrl === 'string' ? product.imageUrl : '';
  const unit      = typeof product.unit === 'string' ? product.unit : '';
  const unitLabel = UNIT_KEYS[unit] ? t(UNIT_KEYS[unit]) : unit;

  const price     = Number(product.price);
  const salePrice = product.salePrice != null && product.salePrice !== '' ? Number(product.salePrice) : null;
  const hasSale   = salePrice != null && !Number.isNaN(salePrice) && !Number.isNaN(price) && salePrice < price;
  const displayPrice = hasSale ? salePrice : price;

  const inStock     = !isProductUnavailable(product);
  const isPreorder  = Boolean(product.isPreorderOnly);
  const minAdvHours = Number(product.minAdvanceHours) || 24;
  const rawCategoryLabel =
    product.category?.name ??
    (typeof product.category === 'string' ? product.category : '');
  const categoryName = getLocalizedText(rawCategoryLabel, lang);
  const isFeatured  = Boolean(product.featured);

  const canAdd = inStock && !!id && !adding;
  const handleAdd = async () => {
    if (!canAdd || adding) return;
    setAdding(true);
    try {
      const ok = await addItem(String(id), 1);
      if (ok && addButtonRef.current) {
        notifyProductAddedToCart({
          fromRect: addButtonRef.current.getBoundingClientRect(),
          imageUrl
        });
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial="rest"
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      variants={cardVariants}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      style={{
        background: colors.surface,
        borderRadius: '14px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        willChange: 'transform',
        height: '100%',
      }}
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', aspectRatio: '4/3', flexShrink: 0, overflow: 'hidden' }}>
        <motion.div
          variants={inStock ? imgVariants : imgVariantsNoHover}
          transition={{ duration: 0.38, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            width: '100%',
            height: '100%',
            opacity: inStock ? 1 : 0.72,
            filter: inStock ? 'none' : 'grayscale(0.35)',
            transition: 'opacity 0.35s ease, filter 0.35s ease',
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 50%, #eef7f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '40px',
            }}>
              🥬
            </div>
          )}
        </motion.div>

        {!inStock && (
          <>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1,
                background: 'linear-gradient(180deg, rgba(28,25,23,0.5) 0%, rgba(28,25,23,0.62) 100%)',
                pointerEvents: 'none',
                transition: 'opacity 0.35s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                padding: '12px',
              }}
            >
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.94)',
                  color: colors.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  lineHeight: 1.25,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px rgba(30,107,60,0.12)',
                  maxWidth: '92%',
                }}
              >
                {t('outOfStock')}
              </span>
            </div>
          </>
        )}

        {/* Featured badge */}
        {isFeatured && (
          <span style={{
            position: 'absolute', top: '10px', insetInlineStart: '10px',
            zIndex: 2,
            padding: '3px 10px', borderRadius: '9999px',
            background: colors.primary, color: colors.textInverse,
            fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(30,107,60,0.35)',
          }}>
            {t('featuredBadge', { defaultValue: 'Featured' })}
          </span>
        )}

        {/* Sale badge */}
        {hasSale && (
          <span style={{
            position: 'absolute', top: '10px', insetInlineEnd: '10px',
            zIndex: 2,
            padding: '3px 10px', borderRadius: '9999px',
            background: colors.errorSurface,
            border: `1px solid ${colors.errorBorder}`,
            color: colors.error,
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            {t('saleBadge')}
          </span>
        )}
      </div>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>

        {/* Category */}
        {categoryName && (
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px',
            textTransform: 'uppercase', color: colors.textMuted,
          }}>
            {categoryName}
          </span>
        )}

        {/* Name */}
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.3 }}>
          {name || '—'}
        </h3>

        {/* Preorder badge */}
        {isPreorder && (
          <span
            title={t('preorderHint', { hours: minAdvHours })}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center',
              padding: '2px 8px', borderRadius: '9999px',
              fontSize: '11px', fontWeight: 600,
              background: colors.warningSurface, color: colors.warning,
              border: `1px solid ${colors.warningBorder}`,
            }}
          >
            {t('preorderBadge')}
          </span>
        )}

        {/* Price */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '21px', fontWeight: 700, color: colors.primary, lineHeight: 1 }}>
              {formatPrice(displayPrice, lang)}
            </span>
            {hasSale && (
              <span style={{ fontSize: '13px', color: colors.textMuted, textDecoration: 'line-through' }}>
                {formatPrice(price, lang)}
              </span>
            )}
          </div>
          {unitLabel && (
            <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
              / {unitLabel}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Stock + Add to cart */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
              background: inStock ? colors.success : colors.error,
              boxShadow: inStock
                ? '0 0 0 3px rgba(22,101,52,0.12)'
                : '0 0 0 3px rgba(153,27,27,0.12)',
            }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: inStock ? colors.success : colors.error }}>
              {inStock ? t('inStock') : t('outOfStock')}
            </span>
          </div>

          <motion.button
            ref={addButtonRef}
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            aria-disabled={!canAdd}
            aria-busy={adding}
            whileHover={canAdd ? { scale: 1.05, background: colors.primaryHover } : {}}
            whileTap={canAdd ? { scale: 0.93 } : {}}
            transition={{ duration: 0.12 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '8px 15px', borderRadius: '9999px', border: 'none',
              background: canAdd ? colors.primary : colors.border,
              color: canAdd ? colors.textInverse : colors.textMuted,
              fontSize: '13px', fontWeight: 600,
              cursor: canAdd ? 'pointer' : 'not-allowed',
              boxShadow: canAdd ? shadow.primary : 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              opacity: (inStock && !!id) ? 1 : 0.92,
              transition: 'background 0.2s ease, color 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {adding ? (
              <motion.span
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.65, ease: 'linear' }}
                style={{ display: 'inline-flex', lineHeight: 0 }}
              >
                <Loader2 size={15} strokeWidth={2.5} />
              </motion.span>
            ) : (
              inStock && !!id && <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span>
            )}
            {inStock ? t('addToCart') : t('outOfStock')}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
