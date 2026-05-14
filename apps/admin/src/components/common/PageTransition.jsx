import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AnimatedLogo from "./AnimatedLogo";

// Shows immediately on initial load (no debounce).
// For subsequent loads, only appears after isLoading has been true for 300ms.
const PageTransition = ({ isLoading }) => {
  const [visible, setVisible] = useState(isLoading);
  const isFirstMount = useRef(true);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (isFirstMount.current) {
      // Initial mount: overlay already rendered via useState(isLoading); no debounce needed.
      isFirstMount.current = false;
      return;
    }

    if (isLoading) {
      debounceTimer.current = setTimeout(() => setVisible(true), 300);
    } else {
      clearTimeout(debounceTimer.current);
      setVisible(false);
    }

    return () => clearTimeout(debounceTimer.current);
  }, [isLoading]);

  // Sync: if isLoading goes false while we're still in the debounce window, hide immediately.
  useEffect(() => {
    if (!isLoading) {
      clearTimeout(debounceTimer.current);
      setVisible(false);
    }
  }, [isLoading]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-transition"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          transition={{ duration: 0.15, ease: 'easeIn' }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(250, 248, 245, 0.97)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <AnimatedLogo size={200} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageTransition;
