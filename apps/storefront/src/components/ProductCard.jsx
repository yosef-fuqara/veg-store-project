import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useCart } from "../features/cart/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { getLocalizedProductName } from "../utils/localizedProduct";

const colors = {
  primary:        '#1e6b3c',
  surface:        '#ffffff',
  surfaceRaised:  '#f5f2ed',
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

const ProductCard = ({ product, lang }) => {
  const { t } = useTranslation('home');
  const { addItem, loading } = useCart();

  const id       = product._id;
  const name     = getLocalizedProductName(product, lang);
  const imageUrl = typeof product.imageUrl === 'string' ? product.imageUrl : '';
  const unit     = typeof product.unit === 'string' ? product.unit : '';
  const unitLabel = UNIT_KEYS[unit] ? t(UNIT_KEYS[unit]) : unit;

  const price = Number(product.price);
  const salePrice =
    product.salePrice != null && product.salePrice !== ''
      ? Number(product.salePrice)
      : null;
  const hasSale =
    salePrice != null &&
    !Number.isNaN(salePrice) &&
    !Number.isNaN(price) &&
    salePrice < price;
  const displayPrice = hasSale ? salePrice : price;

  const inStock      = product.stockStatus === 'in_stock';
  const isPreorder   = Boolean(product.isPreorderOnly);
  const minAdvHours  = Number(product.minAdvanceHours) || 24;
  const categoryName =
    product.category?.name ??
    (typeof product.category === 'string' ? product.category : '');
  const isFeatured   = Boolean(product.featured);

  const canAdd = inStock && !loading && !!id;

  const handleAdd = () => {
    if (!canAdd) return;
    addItem(String(id), 1);
  };

  return (
    <motion.article
      whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)' }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        background: colors.surface,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        willChange: 'transform',
        height: '100%',
      }}
    >
      {/* ── Image area ───────────────────────────────────────────── */}
      <div style={{ position: 'relative', aspectRatio: '4/3', flexShrink: 0, overflow: 'hidden' }}>
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

        {/* Featured badge */}
        {isFeatured && (
          <span style={{
            position: 'absolute', top: '12px', insetInlineStart: '12px',
            padding: '3px 10px', borderRadius: '9999px',
            background: colors.primary, color: colors.textInverse,
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}>
            Featured
          </span>
        )}

        {/* Sale badge on image */}
        {hasSale && (
          <span style={{
            position: 'absolute', top: '12px', insetInlineEnd: '12px',
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

      {/* ── Card body ────────────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>

        {/* Category */}
        {categoryName && (
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '1.2px',
            textTransform: 'uppercase', color: colors.textMuted,
          }}>
            {categoryName}
          </span>
        )}

        {/* Product name */}
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.3 }}>
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
        <div style={{ marginTop: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: colors.primary, lineHeight: 1 }}>
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom row: stock indicator + add to cart */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
          {/* Stock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
              background: inStock ? colors.success : colors.error,
            }} />
            <span style={{ fontSize: '12px', fontWeight: 500, color: inStock ? colors.success : colors.error }}>
              {inStock ? t('inStock') : t('outOfStock')}
            </span>
          </div>

          {/* Add to cart */}
          <motion.button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            whileHover={canAdd ? { scale: 1.04 } : {}}
            whileTap={canAdd ? { scale: 0.94 } : {}}
            transition={{ duration: 0.12 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '8px 16px', borderRadius: '9999px', border: 'none',
              background: canAdd ? colors.primary : colors.border,
              color: canAdd ? colors.textInverse : colors.textMuted,
              fontSize: '13px', fontWeight: 600,
              cursor: canAdd ? 'pointer' : 'not-allowed',
              boxShadow: canAdd ? '0 2px 10px rgba(30,107,60,0.25)' : 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span>
            {t('addToCart')}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

export default ProductCard;
