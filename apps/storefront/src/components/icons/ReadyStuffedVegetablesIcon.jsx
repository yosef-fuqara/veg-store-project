/**
 * Minimal line icon: rolled grape leaf + hollowed zucchini (ready mahashi / stuffed veg).
 * Matches Lucide nav icons (stroke, size) in CategoryNav.
 */
export function ReadyStuffedVegetablesIcon({
  size = 22,
  strokeWidth = 1.65,
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* Rolled grape leaf */}
      <path d="M3.5 11.5c2.2-3.8 6.8-4.2 9.2-1.6 1.4 1.5 1.1 4.8-1.2 6.6-2.4 1.8-5.6.6-6.5-2.2-.5-1.6-.2-3.4 1.5-2.8" />
      <path d="M6 13.5c2.5-1 5-0.5 6.5 1.2" />
      {/* Hollowed zucchini */}
      <path d="M15.5 8.5c3.5-.8 5.5 2.2 5 6.2-.4 3.2-3.2 5.2-5.8 4.2" />
      <ellipse cx="17.2" cy="9.8" rx="1.1" ry="1.4" />
    </svg>
  );
}
