import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  STOREFRONT_BUSINESS_HOURS_ID,
  STOREFRONT_CATEGORY_QUERY_KEY,
} from "../../utils/storefrontNavScroll";

/**
 * Smooth scroll to top when the route pathname changes.
 * Skip when landing on the homepage with `?cat=` — HomePage scrolls to that category section.
 */
const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (pathname === "/" && new URLSearchParams(search).get(STOREFRONT_CATEGORY_QUERY_KEY)) {
      return;
    }
    const hashId = hash.replace(/^#/, "");
    if (hashId === STOREFRONT_BUSINESS_HOURS_ID) {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
