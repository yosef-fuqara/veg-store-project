/** Matches main app header (`App.jsx` NAV_HEIGHT) + comfortable offset for section titles */
export const STOREFRONT_STICKY_HEADER_SCROLL_MARGIN = 88;

/**
 * @param {string} navSlotId
 */
export function scrollToCategorySection(navSlotId) {
  const el = document.getElementById(`category-${navSlotId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * @param {string} elementId
 */
export function scrollToElementById(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
