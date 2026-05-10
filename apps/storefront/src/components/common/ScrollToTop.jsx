import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smooth scroll to top when the route pathname changes.
 * Search/hash-only updates (e.g. `?cat=` filters on the home page) get a new history `key`
 * on replace; depending on `key` would scroll to the top and leave the products area.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
