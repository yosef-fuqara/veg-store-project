/** Main navbar height in `App.jsx` */
export const STOREFRONT_NAV_HEIGHT = 64;

/** Extra offset below the sticky nav for section scroll targets */
export const STOREFRONT_HEADER_SCROLL_OFFSET = 24;

/** Sticky nav + comfortable offset for section titles */
export const STOREFRONT_STICKY_HEADER_SCROLL_MARGIN =
  STOREFRONT_NAV_HEIGHT + STOREFRONT_HEADER_SCROLL_OFFSET;

/** Approximate height of the mobile sticky product search row (px) */
export const STOREFRONT_MOBILE_STICKY_SEARCH_HEIGHT = 56;

/** Sticky nav + mobile search bar + offset for category section scroll targets */
export const STOREFRONT_MOBILE_PRODUCTS_STICKY_SCROLL_MARGIN =
  STOREFRONT_NAV_HEIGHT +
  STOREFRONT_MOBILE_STICKY_SEARCH_HEIGHT +
  STOREFRONT_HEADER_SCROLL_OFFSET;

/** z-index: mobile sticky search (below main nav, above product cards) */
export const STOREFRONT_MOBILE_STICKY_SEARCH_Z = 90;

/** z-index: mobile header popovers/dropdowns (above nav + sticky search) */
export const STOREFRONT_HEADER_POPOVER_Z = 120;

/** z-index: mobile category drawer backdrop */
export const STOREFRONT_MOBILE_CATEGORY_DRAWER_OVERLAY_Z = 110;

/** z-index: mobile category drawer panel */
export const STOREFRONT_MOBILE_CATEGORY_DRAWER_PANEL_Z = 111;

/** Query param for footer / deep links (`/?cat=fruits`) */
export const STOREFRONT_CATEGORY_QUERY_KEY = "cat";

/** Hash anchor for business hours (`/#business-hours`) */
export const STOREFRONT_BUSINESS_HOURS_ID = "business-hours";

const MAX_BUSINESS_HOURS_SCROLL_ATTEMPTS = 32;

const MAX_CATEGORY_SCROLL_ATTEMPTS = 32;

/**
 * @param {string} navSlotId
 * @param {{ behavior?: ScrollBehavior }} [options]
 */
export function scrollToCategorySection(navSlotId, options = {}) {
  const el = document.getElementById(`category-${navSlotId}`);
  if (!el) return false;
  el.scrollIntoView({ behavior: options.behavior ?? "smooth", block: "start" });
  return true;
}

/**
 * @param {string} elementId
 * @param {{ behavior?: ScrollBehavior }} [options]
 */
export function scrollToElementById(elementId, options = {}) {
  const el = document.getElementById(elementId);
  if (!el) return false;
  el.scrollIntoView({ behavior: options.behavior ?? "smooth", block: "start" });
  return true;
}

/**
 * Scroll after category sections mount (footer links, cross-page `/?cat=`).
 * @param {string} navSlotId
 * @param {{ onDone?: (found: boolean) => void }} [options]
 */
export function scrollToCategorySectionWhenReady(navSlotId, options = {}) {
  let attempts = 0;
  const tick = () => {
    if (scrollToCategorySection(navSlotId)) {
      options.onDone?.(true);
      return;
    }
    if (++attempts < MAX_CATEGORY_SCROLL_ATTEMPTS) {
      requestAnimationFrame(tick);
      return;
    }
    scrollToElementById("products-section");
    options.onDone?.(false);
  };
  requestAnimationFrame(() => requestAnimationFrame(tick));
}

/**
 * Scroll after the business-hours anchor mounts (cross-page `/#business-hours`).
 * @param {{ onDone?: (found: boolean) => void }} [options]
 */
export function scrollToBusinessHoursWhenReady(options = {}) {
  let attempts = 0;
  const tick = () => {
    if (scrollToElementById(STOREFRONT_BUSINESS_HOURS_ID)) {
      options.onDone?.(true);
      return;
    }
    if (++attempts < MAX_BUSINESS_HOURS_SCROLL_ATTEMPTS) {
      requestAnimationFrame(tick);
      return;
    }
    options.onDone?.(false);
  };
  requestAnimationFrame(() => requestAnimationFrame(tick));
}
