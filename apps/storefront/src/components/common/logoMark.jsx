/** Shared Abu Al Anas logo mark — matches AnimatedLogo final frame */

export const LOGO_COLORS = {
  cream: '#FAF9F5',
  glow: '#A3B899',
  dark: '#2C3E2C',
  leafStroke: '#435B43',
  tomato: '#D34E36',
  orange: '#E68A4B',
  cucumber: '#3B593B',
  cucumberDetail: '#2A402A',
  topLeaf: '#618264',
  tagline: '#618264',
};

const LEAF_PATH =
  'M 22,50 C 22,72 38,78 50,78 C 65,78 78,65 78,44 C 78,25 60,18 50,22';

/** Static SVG mark for navbar, footer, login, etc. */
export function LogoMarkSvg({
  className = '',
  style,
  width,
  height,
  title,
  'aria-hidden': ariaHidden,
  ...rest
}) {
  const hasAccessibleName = typeof title === 'string' && title.length > 0;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible', ...style }}
      width={width}
      height={height}
      role={hasAccessibleName ? 'img' : undefined}
      aria-label={hasAccessibleName ? title : undefined}
      aria-hidden={ariaHidden ?? (hasAccessibleName ? undefined : true)}
      focusable="false"
      {...rest}
    >
      <g transform="translate(0, 5)">
        <path
          d={LEAF_PATH}
          fill="none"
          stroke={LOGO_COLORS.leafStroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 30,52 L 34,70 C 34,72 37,74 40,74 L 60,74 C 63,74 66,72 66,70 L 70,52 Z"
          fill="none"
          stroke={LOGO_COLORS.dark}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 26,52 L 74,52"
          stroke={LOGO_COLORS.dark}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <g transform="translate(39, 44)">
          <circle cx="0" cy="0" r="7" fill={LOGO_COLORS.tomato} />
          <path
            d="M -2,-7 Q 0,-10 2,-7 M -1,-7 L -1,-9 M 1,-7 L 2,-9"
            stroke={LOGO_COLORS.leafStroke}
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
        <g transform="translate(52, 45)">
          <circle cx="0" cy="0" r="8" fill={LOGO_COLORS.orange} />
          <circle cx="2" cy="-2" r="1" fill={LOGO_COLORS.cream} opacity="0.4" />
        </g>
        <g transform="translate(63, 42) rotate(25)">
          <rect x="-4" y="-9" width="8" height="18" rx="4" fill={LOGO_COLORS.cucumber} />
          <path
            d="M -2,-4 L -2,4 M 2,-6 L 2,2"
            stroke={LOGO_COLORS.cucumberDetail}
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        </g>
        <g transform="translate(46, 32) rotate(-15)">
          <path
            d="M 0,8 C -6,4 -6,-4 0,-8 C 6,-4 6,4 0,8 Z"
            fill={LOGO_COLORS.topLeaf}
          />
          <path
            d="M 0,8 L 0,-6"
            stroke={LOGO_COLORS.cream}
            strokeWidth="0.8"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}

export function LogoTypography({ compact = false, style }) {
  return (
    <div
      style={{
        textAlign: 'center',
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          fontSize: compact ? '14px' : 'clamp(1.25rem, 4vw, 1.75rem)',
          fontWeight: 700,
          color: LOGO_COLORS.dark,
          lineHeight: 1.2,
        }}
      >
        Abu Al Anas
      </div>
      <div
        style={{
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          fontSize: compact ? '9px' : 'clamp(0.65rem, 2vw, 0.8rem)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          color: LOGO_COLORS.tagline,
          marginTop: compact ? 4 : 6,
        }}
      >
        Fruits &amp; Vegetables
      </div>
    </div>
  );
}

export { LEAF_PATH };
