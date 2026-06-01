import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LEAF_PATH, LOGO_COLORS } from './logoMark';

/**
 * Layered basket/produce loader (~2.5s). Rendered inside PageTransition overlay only.
 * Optional onLoadingComplete — not used by PageTransition (timing stays external).
 */
export default function AnimatedLogo({ onLoadingComplete }) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!onLoadingComplete) return undefined;
    const timer = setTimeout(onLoadingComplete, 2600);
    return () => clearTimeout(timer);
  }, [onLoadingComplete]);

  const basketDrop = shouldReduceMotion
    ? { opacity: [0, 1], transition: { duration: 0.5 } }
    : {
        y: [-60, 0],
        opacity: [0, 1],
        transition: { type: 'spring', damping: 15, stiffness: 90 },
      };

  const glowEffect = {
    opacity: [0, 0.4, 0.25],
    scale: [0.8, 1.1, 1],
    transition: { delay: 0.3, duration: 0.8, ease: 'easeOut' },
  };

  const producePop = shouldReduceMotion
    ? { opacity: [0, 1], transition: { duration: 0.3 } }
    : {
        scale: [0, 1.15, 1],
        y: [-15, 0],
        opacity: [0, 1],
        transition: { type: 'spring', damping: 12 },
      };

  const leafWrap = shouldReduceMotion
    ? { opacity: [0, 1], transition: { delay: 1, duration: 0.4 } }
    : {
        strokeDashoffset: [120, 0],
        opacity: [0, 1],
        transition: { delay: 1, duration: 0.7, ease: 'easeInOut' },
      };

  const textFadeIn = {
    opacity: [0, 1],
    y: shouldReduceMotion ? [0, 0] : [10, 0],
    transition: { delay: 1.4, duration: 0.5, ease: 'easeOut' },
  };

  const produceDelay = (extra) =>
    shouldReduceMotion
      ? producePop
      : {
          ...producePop,
          transition: { ...producePop.transition, delay: extra },
        };

  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        padding: 16,
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 160,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          flexShrink: 0,
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            width: 128,
            height: 128,
            borderRadius: '50%',
            background: LOGO_COLORS.glow,
            filter: 'blur(32px)',
            pointerEvents: 'none',
          }}
          animate={glowEffect}
        />

        <svg
          viewBox="0 0 100 100"
          style={{ width: '100%', height: '100%', overflow: 'visible', position: 'relative', zIndex: 1 }}
        >
          <g transform="translate(0, 5)">
            <motion.path
              d={LEAF_PATH}
              fill="none"
              stroke={LOGO_COLORS.leafStroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="120"
              animate={leafWrap}
            />

            <motion.path
              d="M 30,52 L 34,70 C 34,72 37,74 40,74 L 60,74 C 63,74 66,72 66,70 L 70,52 Z"
              fill="none"
              stroke={LOGO_COLORS.dark}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={basketDrop}
            />
            <motion.path
              d="M 26,52 L 74,52"
              stroke={LOGO_COLORS.dark}
              strokeWidth="3.5"
              strokeLinecap="round"
              animate={basketDrop}
            />

            <g transform="translate(39, 44)">
              <motion.circle cx="0" cy="0" r="7" fill={LOGO_COLORS.tomato} animate={producePop} />
              <motion.path
                d="M -2,-7 Q 0,-10 2,-7 M -1,-7 L -1,-9 M 1,-7 L 2,-9"
                stroke={LOGO_COLORS.leafStroke}
                strokeWidth="1"
                strokeLinecap="round"
                animate={producePop}
              />
            </g>

            <g transform="translate(52, 45)">
              <motion.circle cx="0" cy="0" r="8" fill={LOGO_COLORS.orange} animate={produceDelay(0.15)} />
              <motion.circle
                cx="2"
                cy="-2"
                r="1"
                fill={LOGO_COLORS.cream}
                opacity="0.4"
                animate={produceDelay(0.15)}
              />
            </g>

            <g transform="translate(63, 42) rotate(25)">
              <motion.rect
                x="-4"
                y="-9"
                width="8"
                height="18"
                rx="4"
                fill={LOGO_COLORS.cucumber}
                animate={produceDelay(0.3)}
              />
              <motion.path
                d="M -2,-4 L -2,4 M 2,-6 L 2,2"
                stroke={LOGO_COLORS.cucumberDetail}
                strokeWidth="0.7"
                strokeLinecap="round"
                animate={produceDelay(0.3)}
              />
            </g>

            <g transform="translate(46, 32) rotate(-15)">
              <motion.path
                d="M 0,8 C -6,4 -6,-4 0,-8 C 6,-4 6,4 0,8 Z"
                fill={LOGO_COLORS.topLeaf}
                animate={produceDelay(0.45)}
              />
              <motion.path
                d="M 0,8 L 0,-6"
                stroke={LOGO_COLORS.cream}
                strokeWidth="0.8"
                opacity="0.5"
                animate={produceDelay(0.45)}
              />
            </g>
          </g>
        </svg>
      </div>

      <motion.div animate={textFadeIn}>
        <div
          style={{
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
            fontWeight: 700,
            color: LOGO_COLORS.dark,
          }}
        >
          Abu Al Anas
        </div>
        <div
          style={{
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            fontSize: 'clamp(0.7rem, 2.5vw, 0.875rem)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            color: LOGO_COLORS.tagline,
            marginTop: 6,
          }}
        >
          Fruits &amp; Vegetables
        </div>
      </motion.div>
    </div>
  );
}
