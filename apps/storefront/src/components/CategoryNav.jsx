import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
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

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

/** Citrus: round fruit + segment lines (reads as orange / fresh fruit) */
const FruitIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="13" r="5.5" />
    <path d="M12 7.5v11M6.5 13h11M8.5 9.5l7 7M15.5 9.5l-7 7" />
  </svg>
);

/** Carrot: tapered triangle + three leaf stems */
const VegIcon = () => (
  <svg {...iconProps}>
    <path d="M12 5L10 2.5M12 5L12 1.2M12 5L14 2.5" />
    <path d="M12 5.5L8.5 20.5L15.5 20.5Z" />
  </svg>
);

/** Plate (oval) + lines from center = sliced fruit on a platter */
const PlatterIcon = () => (
  <svg {...iconProps}>
    <ellipse cx="12" cy="15" rx="8.5" ry="3" />
    <path d="M12 10v11M5 15.5h14M7 11.5l10 8M17 11.5l-10 8" />
  </svg>
);

/** Cup with lid line, straw, and drink level */
const JuiceIcon = () => (
  <svg {...iconProps}>
    <path d="M17 3.5v10.5" />
    <path d="M7 6.5h10l-.9 11a1.8 1.8 0 0 1-1.8 1.65h-4.6A1.8 1.8 0 0 1 7.9 17.5L7 6.5Z" />
    <path d="M6.5 6.5h11" />
    <path d="M8.5 11.5h7" />
  </svg>
);

const ICONS = {
  fruits: FruitIcon,
  vegetables: VegIcon,
  platters: PlatterIcon,
  juices: JuiceIcon,
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

/** Desktop: vertical sticky rail at inline-start */
export function CategorySidebar({ activeId, onSelect }) {
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
export function CategoryBarMobile({ activeId, onSelect }) {
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
