import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Apple, Carrot, Flame, LayoutGrid, ShoppingBasket, Sprout, Store } from 'lucide-react';
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
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.14 }}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '9999px',
          border: `1.5px solid ${isActive ? colors.primary : colors.border}`,
          background: isActive ? colors.primarySurface : colors.surface,
          color: isActive ? colors.primary : colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive ? shadow.sm : 'none',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s',
        }}
      >
        <Icon />
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
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.14 }}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '9999px',
          border: `1.5px solid ${isActive ? colors.primary : colors.border}`,
          background: isActive ? colors.primarySurface : colors.surface,
          color: isActive ? colors.primary : colors.textSecondary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isActive ? shadow.sm : 'none',
          transition: 'background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s',
        }}
      >
        <LayoutGrid {...navIconProps} />
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

  return (
    <nav
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
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '9999px',
              border: `1.5px solid ${activeId == null ? colors.primary : colors.border}`,
              background: activeId == null ? colors.primarySurface : colors.surfaceRaised,
              color: activeId == null ? colors.primary : colors.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <span
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '9999px',
                border: `1.5px solid ${isActive ? colors.primary : colors.border}`,
                background: isActive ? colors.primarySurface : colors.surfaceRaised,
                color: isActive ? colors.primary : colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
