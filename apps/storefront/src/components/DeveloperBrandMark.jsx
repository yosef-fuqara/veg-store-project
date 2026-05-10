/**
 * Vector mark from project outline (my-logo) — strokes use storefront greens.
 */
export default function DeveloperBrandMark({
  size = 32,
  hovered,
  ring = "#1e6b3c",
  orbit = "#a3cfb4",
  detail = "#1e6b3c",
}) {
  const wrapStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "transform 0.2s ease, opacity 0.2s ease",
    transform: hovered ? "scale(1.04)" : "scale(1)",
    opacity: hovered ? 1 : 0.9,
  };

  return (
    <div style={wrapStyle} aria-hidden="true">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="100" r="75" stroke={ring} strokeWidth="12" strokeLinecap="round" />
        <ellipse
          cx="100"
          cy="100"
          rx="92"
          ry="70"
          stroke={orbit}
          strokeWidth="7"
          transform="rotate(-25 100 100)"
        />
        <path
          d="M100,65 C125,65 135,90 115,100 C130,95 135,75 100,75 Z"
          stroke={detail}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeOpacity="0.88"
          transform="rotate(-10 100 100)"
        />
        <path
          d="M100,135 C75,135 65,110 85,100 C70,105 65,125 100,125 Z"
          stroke={detail}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeOpacity="0.88"
          transform="rotate(-10 100 100)"
        />
        <circle cx="100" cy="100" r="8" stroke={ring} strokeWidth="3" />
      </svg>
    </div>
  );
}
