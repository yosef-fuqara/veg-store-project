import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Apple, Beaker, Carrot, Droplets, Flame, LayoutGrid, ShoppingBasket, Sprout, Store } from 'lucide-react';
import { CATEGORY_NAV_IDS } from '../utils/categoryFilter';

const colors = {
  primary: '#1e6b3c',
  primarySurface: '#eef7f1',
  primaryBorder: '#a3cfb4',
  surface: '#ffffff',
  surfaceRaised: '#f5f2ed',
  border: '#e8e3dc',
  textPrimary: '#1c1917',
  textSecondary: '#57534e',
};

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  active: '0 6px 18px rgba(30,107,60,0.22), 0 2px 8px rgba(30,107,60,0.12)',
};

const navIconProps = {
  size: 22,
  strokeWidth: 1.65,
  'aria-hidden': true,
};

const ICONS = {
  fruits: () => <Apple {...navIconProps} />,
  vegetables: () => <Carrot {...navIconProps} />,
  herbs: () => <Sprout {...navIconProps} />,
  spices: () => <Flame {...navIconProps} />,
  platters: () => <ShoppingBasket {...navIconProps} />,
  pickles: () => <Beaker {...navIconProps} />,
  'natural-juices': () => <Droplets {...navIconProps} />,
  other: () => <Store {...navIconProps} />,
};

const NAV_TOP_DESKTOP = '80px';

function CategoryButton({
  id,
  Icon,
  label,
  active,
  onSelect,
  showFlyoutLabel,
}) {
  const isActive = active === id;

  return (
    <div
      className={showFlyoutLabel ? 'category-nav-item-wrap' : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.button
        type="button"
        className="category-nav-btn"
        aria-pressed={isActive}
        aria-label={label}
        title={label}
        onClick={() => onSelect(id)}
        animate={{
          scale: isActive ? 1.05 : 1,
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        style={{
          position: 'relative',
          overflow: 'visible',
          width: '48px',
          height: '48px',
          borderRadius: '9999px',
          border: `2px solid ${isActive ? colors.primary : colors.border}`,
          background: isActive
            ? `linear-gradient(145deg, ${colors.primarySurface}, #e3f4ea)`
            : colors.surface,
          color: isActive ? colors.primary : colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive
            ? `${shadow.active}, 0 0 0 1px rgba(30,107,60,0.08)`
            : 'none',
          transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {isActive && (
          <motion.span
            aria-hidden
            style={{
              position: 'absolute',
              width: '54px',
              height: '54px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(30,107,60,0.14) 0%, rgba(30,107,60,0) 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          />
        )}
        <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
          <Icon />
        </span>
      </motion.button>

      {showFlyoutLabel && (
        <span
          aria-hidden
          className="category-nav-flyout"
          style={{
            position: 'absolute',
            insetInlineEnd: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginInlineEnd: '12px',
            padding: '6px 12px',
            borderRadius: '10px',
            background: colors.textPrimary,
            color: colors.surface,
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.15s',
            boxShadow: shadow.sm,
            zIndex: 5,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function ShowAllButtonDesktop({ activeId, onShowAll, label }) {
  const isActive = activeId == null;

  return (
    <div
      className="category-nav-item-wrap"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.button
        type="button"
        className="category-nav-btn"
        aria-pressed={isActive}
        aria-label={label}
        title={label}
        onClick={onShowAll}
        animate={{ scale: isActive ? 1.05 : 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        style={{
          position: 'relative',
          overflow: 'visible',
          width: '48px',
          height: '48px',
          borderRadius: '9999px',
          border: `2px solid ${isActive ? colors.primary : colors.border}`,
          background: isActive
            ? `linear-gradient(145deg, ${colors.primarySurface}, #e3f4ea)`
            : colors.surface,
          color: isActive ? colors.primary : colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive
            ? `${shadow.active}, 0 0 0 1px rgba(30,107,60,0.08)`
            : 'none',
          transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {isActive && (
          <motion.span
            aria-hidden
            style={{
              position: 'absolute',
              width: '54px',
              height: '54px',
              borderRadius: '9999px',
              background: 'radial-gradient(circle, rgba(30,107,60,0.14) 0%, rgba(30,107,60,0) 70%)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          />
        )}
        <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
          <LayoutGrid {...navIconProps} />
        </span>
      </motion.button>
      <span
        aria-hidden
        className="category-nav-flyout"
        style={{
          position: 'absolute',
          insetInlineEnd: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginInlineEnd: '12px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: colors.textPrimary,
          color: colors.surface,
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 0.15s',
          boxShadow: shadow.sm,
          zIndex: 5,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Desktop: vertical sticky rail at inline-start */
export function CategorySidebar({ activeId, onSelect, onShowAll }) {
  const { t } = useTranslation('home');

  return (
    <>
      <style>{`
        .category-nav-sidebar .category-nav-item-wrap:hover .category-nav-flyout {
          opacity: 1;
        }
        .category-nav-sidebar .category-nav-btn:not([aria-pressed="true"]):hover {
          background: ${colors.primarySurface} !important;
          border-color: ${colors.primaryBorder} !important;
          color: ${colors.primary} !important;
        }
      `}</style>
      <nav
        className="category-nav-sidebar"
        aria-label={t('categories.navAria')}
        style={{
          flexShrink: 0,
          width: '72px',
          position: 'sticky',
          top: NAV_TOP_DESKTOP,
          alignSelf: 'flex-start',
          padding: '12px 8px',
          borderRadius: '14px',
          background: colors.surfaceRaised,
          border: `1px solid ${colors.border}`,
          boxShadow: shadow.sm,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          zIndex: 10,
        }}
      >
        {onShowAll && (
          <ShowAllButtonDesktop
            activeId={activeId}
            onShowAll={onShowAll}
            label={t('categories.showAll')}
          />
        )}
        {CATEGORY_NAV_IDS.map((id) => {
          const Icon = ICONS[id];
          return (
            <CategoryButton
              key={id}
              id={id}
              Icon={Icon}
              label={t(`categories.${id}`)}
              active={activeId}
              onSelect={onSelect}
              showFlyoutLabel
            />
          );
        })}
      </nav>
    </>
  );
}

/** Mobile: horizontal scroll strip */
export function CategoryBarMobile({ activeId, onSelect, onShowAll }) {
  const { t } = useTranslation('home');
  const navRef = useRef(null);

  useEffect(() => {
    const root = navRef.current;
    if (!root || activeId == null) return;
    const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(activeId) : activeId;
    const item = root.querySelector(`[data-category-nav-item="${escaped}"]`);
    item?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  return (
    <nav
      ref={navRef}
      aria-label={t('categories.navAria')}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: '12px',
        marginBottom: '8px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin',
      }}
    >
      {onShowAll ? (
        <motion.button
          key="show-all"
          type="button"
          data-category-nav-item="__all__"
          aria-pressed={activeId == null}
          aria-label={t('categories.showAll')}
          onClick={onShowAll}
          whileTap={{ scale: 0.96 }}
          style={{
            flex: '0 0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            minWidth: '72px',
            padding: '8px 4px',
            borderRadius: '14px',
            border: `1px solid ${activeId == null ? colors.primaryBorder : colors.border}`,
            background: activeId == null ? colors.primarySurface : colors.surface,
            boxShadow: activeId == null ? shadow.active : 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <span
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '9999px',
              border: `2px solid ${activeId == null ? colors.primary : colors.border}`,
              background: activeId == null
                ? `linear-gradient(145deg, ${colors.primarySurface}, #e3f4ea)`
                : colors.surfaceRaised,
              color: activeId == null ? colors.primary : colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: activeId == null ? shadow.sm : 'none',
            }}
          >
            <LayoutGrid {...navIconProps} />
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: activeId == null ? colors.primary : colors.textSecondary,
              textAlign: 'center',
              lineHeight: 1.25,
              paddingInline: '4px',
            }}
          >
            {t('categories.showAll')}
          </span>
        </motion.button>
      ) : null}
      {CATEGORY_NAV_IDS.map((id) => {
        const Icon = ICONS[id];
        const isActive = activeId === id;
        return (
          <motion.button
            key={id}
            type="button"
            data-category-nav-item={id}
            aria-pressed={isActive}
            onClick={() => onSelect(id)}
            whileTap={{ scale: 0.96 }}
            style={{
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              minWidth: '72px',
              padding: '8px 4px',
              borderRadius: '14px',
              border: `1px solid ${isActive ? colors.primaryBorder : colors.border}`,
              background: isActive ? colors.primarySurface : colors.surface,
              boxShadow: isActive ? shadow.active : 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '9999px',
                border: `2px solid ${isActive ? colors.primary : colors.border}`,
                background: isActive
                  ? `linear-gradient(145deg, ${colors.primarySurface}, #e3f4ea)`
                  : colors.surfaceRaised,
                color: isActive ? colors.primary : colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? shadow.sm : 'none',
              }}
            >
              <Icon />
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: isActive ? colors.primary : colors.textSecondary,
                textAlign: 'center',
                lineHeight: 1.25,
                paddingInline: '4px',
              }}
            >
              {t(`categories.${id}`)}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
