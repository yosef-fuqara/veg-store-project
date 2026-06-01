import { LogoMarkSvg, LogoTypography } from './logoMark';

/**
 * Static Abu Al Anas logo for header, footer, and inline brand marks.
 * Compact mark-only by default; pass showText for stacked lockup.
 */
const AbuAlAnasLogo = ({
  className = '',
  size = 64,
  style,
  showText = false,
  compactText = false,
  title,
  'aria-hidden': ariaHidden,
  ...rest
}) => {
  if (showText) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          maxWidth: '100%',
          ...style,
        }}
        {...rest}
      >
        <LogoMarkSvg width={size} height={size} title={title} aria-hidden={ariaHidden} />
        <LogoTypography compact={compactText} />
      </div>
    );
  }

  return (
    <LogoMarkSvg
      className={className}
      width={size}
      height={size}
      style={style}
      title={title}
      aria-hidden={ariaHidden}
      {...rest}
    />
  );
};

export default AbuAlAnasLogo;
