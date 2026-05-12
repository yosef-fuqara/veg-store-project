import { useEffect, useState } from "react";

/**
 * Tracks which section id is most visible inside a narrowed viewport band (scroll spy).
 * @param {string[]} sectionDomIds Full element ids, e.g. `category-fruits`
 * @param {{ enabled?: boolean, rootMargin?: string }} [options]
 * @returns {string | null}
 */
export function useActiveSection(sectionDomIds, options = {}) {
  const { enabled = true, rootMargin = "-35% 0px -55% 0px" } = options;
  const [activeDomId, setActiveDomId] = useState(/** @type {string | null} */ (null));

  const key = sectionDomIds.join("\0");

  useEffect(() => {
    if (!enabled || sectionDomIds.length === 0) {
      setActiveDomId(null);
      return undefined;
    }
    if (typeof IntersectionObserver === "undefined") return undefined;

    /** @type {Map<string, number>} */
    const scores = new Map();
    let rafId = 0;

    const flush = () => {
      rafId = 0;
      let bestId = /** @type {string | null} */ (null);
      let best = 0;
      for (const [id, ratio] of scores) {
        if (ratio > best) {
          best = ratio;
          bestId = id;
        }
      }
      setActiveDomId(best > 0 ? bestId : null);
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(flush);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const domId = e.target.id;
          if (!domId) continue;
          if (e.isIntersecting) scores.set(domId, e.intersectionRatio);
          else scores.delete(domId);
        }
        schedule();
      },
      {
        root: null,
        rootMargin,
        threshold: [0, 0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.35, 0.5, 0.65, 0.8, 1],
      }
    );

    for (const id of sectionDomIds) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }

    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
    };
  }, [enabled, key, rootMargin]);

  return activeDomId;
}
