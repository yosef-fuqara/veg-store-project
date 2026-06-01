import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, X } from 'lucide-react';
import { CATEGORY_NAV_IDS } from '../utils/categoryFilter';
import { getCategoryNavIcon, categoryNavTheme as colors } from './CategoryNav';
import {
  STOREFRONT_MOBILE_CATEGORY_DRAWER_OVERLAY_Z,
  STOREFRONT_MOBILE_CATEGORY_DRAWER_PANEL_Z,
} from '../utils/storefrontNavScroll';

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  panel: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
};

const navIconProps = {
  size: 22,
  strokeWidth: 1.65,
  'aria-hidden': true,
};

function CategoryDrawerItem({ id, Icon, label, active, onSelect }) {
  const isActive = active === id;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={isActive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        padding: '12px 14px',
        borderRadius: '12px',
        border: `1px solid ${isActive ? colors.primaryBorder : 'transparent'}`,
        background: isActive ? colors.primarySurface : 'transparent',
        color: isActive ? colors.primary : colors.textPrimary,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'start',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: '44px',
          height: '44px',
          borderRadius: '9999px',
          border: `2px solid ${isActive ? colors.primary : colors.border}`,
          background: isActive
            ? `linear-gradient(145deg, ${colors.primarySurface}, #e3f4ea)`
            : colors.surface,
          color: isActive ? colors.primary : colors.textSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon />
      </span>
      <span style={{ fontSize: '15px', fontWeight: isActive ? 700 : 600, lineHeight: 1.35 }}>
        {label}
      </span>
    </button>
  );
}

/**
 * Mobile-only category drawer (slides from inline-end; RTL-aware like cart drawer).
 */
export function MobileCategoryDrawer({
  open,
  onClose,
  activeId,
  onSelect,
  onShowAll,
}) {
  const { t, i18n } = useTranslation('home');
  const lang = String(i18n.language || 'he').split('-')[0].toLowerCase();
  const dir = lang === 'he' || lang === 'ar' ? 'rtl' : 'ltr';
  const drawerSlideFrom = dir === 'rtl' ? '-100%' : '100%';

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="category-drawer-backdrop"
            type="button"
            aria-label={t('categories.closeDrawerAria')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              zIndex: STOREFRONT_MOBILE_CATEGORY_DRAWER_OVERLAY_Z,
            }}
          />
          <motion.aside
            key="category-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-category-drawer-title"
            initial={{ x: drawerSlideFrom }}
            animate={{ x: 0 }}
            exit={{ x: drawerSlideFrom }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            dir={dir}
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              insetInlineEnd: 0,
              width: 'min(100vw - 40px, 320px)',
              maxWidth: '100%',
              background: colors.surface,
              boxShadow: shadow.panel,
              zIndex: STOREFRONT_MOBILE_CATEGORY_DRAWER_PANEL_Z,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
            }}
          >
            <header
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 16px 12px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <h2
                id="mobile-category-drawer-title"
                style={{
                  margin: 0,
                  fontSize: '17px',
                  fontWeight: 700,
                  color: colors.textPrimary,
                }}
              >
                {t('categories.drawerTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('categories.closeDrawerAria')}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: 'none',
                  background: colors.surfaceRaised,
                  color: colors.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={20} strokeWidth={2} aria-hidden />
              </button>
            </header>

            <nav
              aria-label={t('categories.navAria')}
              style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                padding: '12px 10px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {onShowAll ? (
                <button
                  type="button"
                  onClick={onShowAll}
                  aria-pressed={activeId == null}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: `1px solid ${activeId == null ? colors.primaryBorder : 'transparent'}`,
                    background: activeId == null ? colors.primarySurface : 'transparent',
                    color: activeId == null ? colors.primary : colors.textPrimary,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'start',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: '44px',
                      height: '44px',
                      borderRadius: '9999px',
                      border: `2px solid ${activeId == null ? colors.primary : colors.border}`,
                      background: activeId == null
                        ? `linear-gradient(145deg, ${colors.primarySurface}, #e3f4ea)`
                        : colors.surface,
                      color: activeId == null ? colors.primary : colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LayoutGrid {...navIconProps} />
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: activeId == null ? 700 : 600 }}>
                    {t('categories.showAll')}
                  </span>
                </button>
              ) : null}
              {CATEGORY_NAV_IDS.map((id) => {
                const Icon = getCategoryNavIcon(id);
                return (
                  <CategoryDrawerItem
                    key={id}
                    id={id}
                    Icon={Icon}
                    label={t(`categories.${id}`)}
                    active={activeId}
                    onSelect={onSelect}
                  />
                );
              })}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
