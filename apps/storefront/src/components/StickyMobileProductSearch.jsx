import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid } from 'lucide-react';
import { ClearableSearchInput } from './common/ClearableSearchInput';
import {
  STOREFRONT_NAV_HEIGHT,
  STOREFRONT_MOBILE_STICKY_SEARCH_Z,
} from '../utils/storefrontNavScroll';

const colors = {
  primary: '#1e6b3c',
  primarySurface: '#eef7f1',
  primaryBorder: '#a3cfb4',
  surface: '#ffffff',
  bg: '#faf8f5',
  border: '#e8e3dc',
  textPrimary: '#1c1917',
  textMuted: '#a8a29e',
};

const shadow = {
  sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  stuck: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
};

/**
 * Mobile-only sticky row: category opener + product search (sticks below main nav).
 */
export function StickyMobileProductSearch({
  value,
  onChange,
  onOpenCategories,
  categoriesButtonLabel,
}) {
  const { t } = useTranslation('home');
  const sentinelRef = useRef(null);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      {
        root: null,
        threshold: 0,
        rootMargin: `-${STOREFRONT_NAV_HEIGHT}px 0px 0px 0px`,
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const categoryLabel = categoriesButtonLabel ?? t('categories.drawerTitle');

  const searchInputBaseStyle = {
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.textPrimary,
    fontSize: '15px',
    lineHeight: 1.4,
    boxShadow: shadow.sm,
    fontFamily: 'inherit',
  };

  return (
    <>
      <div ref={sentinelRef} style={{ height: 1, marginTop: -1 }} aria-hidden />
      <div
        style={{
          position: 'sticky',
          top: `${STOREFRONT_NAV_HEIGHT}px`,
          zIndex: STOREFRONT_MOBILE_STICKY_SEARCH_Z,
          marginInline: '-12px',
          paddingInline: '12px',
          paddingBlock: '10px 12px',
          marginBottom: '12px',
          background: colors.bg,
          borderBottom: isStuck ? `1px solid ${colors.border}` : '1px solid transparent',
          boxShadow: isStuck ? shadow.stuck : 'none',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onOpenCategories}
            aria-label={t('categories.openDrawerAria')}
            title={categoryLabel}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              width: '52px',
              minHeight: '44px',
              padding: '6px 4px',
              borderRadius: '12px',
              border: `1px solid ${colors.primaryBorder}`,
              background: colors.primarySurface,
              color: colors.primary,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <LayoutGrid size={20} strokeWidth={2} aria-hidden />
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                lineHeight: 1.1,
                maxWidth: '48px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {categoryLabel}
            </span>
          </button>

          <ClearableSearchInput
            value={value}
            onChange={onChange}
            placeholder={t('products.searchPlaceholder')}
            ariaLabel={t('products.searchPlaceholder')}
            centerPlaceholderWhenEmpty
            wrapperStyle={{ flex: 1, minWidth: 0 }}
            searchIconColor={colors.textMuted}
            clearButtonColor={colors.textMuted}
            inputStyle={searchInputBaseStyle}
            onInputFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primaryBorder;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primarySurface}`;
            }}
            onInputBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.boxShadow = shadow.sm;
            }}
          />
        </div>
      </div>
    </>
  );
}
