// Animation compressed to ~2.0s total so it fits the 2.2s display window.
// Sequence: fruits + extra produce (0s) → circles (0.6s) → branches (0.85s) → leaves (1.2s) → text (1.55s → done ~2.0s)
const AnimatedLogo = ({ size = 200 }) => {
  return (
    <div className="aal-container">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circles */}
        <circle cx="100" cy="100" r="93" stroke="#9E623B" strokeWidth="2" fill="none" opacity="0.8" className="aal-circle-1" />
        <circle cx="100" cy="100" r="85" stroke="#5C7A2A" strokeWidth="1.5" fill="none" opacity="0.5" className="aal-circle-2" />

        {/* Left branch */}
        <g className="aal-branch-left">
          <path d="M 20 100 Q 30 80, 45 70 Q 55 62, 65 58"
            stroke="#5C7A2A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <ellipse cx="25" cy="92" rx="4" ry="7" fill="#5C7A2A" opacity="0.8" transform="rotate(-30 25 92)" />
          <ellipse cx="32" cy="82" rx="4" ry="7" fill="#5C7A2A" opacity="0.75" transform="rotate(-35 32 82)" />
          <ellipse cx="40" cy="74" rx="4" ry="7" fill="#5C7A2A" opacity="0.8" transform="rotate(-38 40 74)" />
          <ellipse cx="48" cy="67" rx="4" ry="7" fill="#5C7A2A" opacity="0.75" transform="rotate(-40 48 67)" />
          <ellipse cx="56" cy="62" rx="4" ry="7" fill="#5C7A2A" opacity="0.8" transform="rotate(-42 56 62)" />
        </g>

        {/* Right branch */}
        <g className="aal-branch-right">
          <path d="M 180 100 Q 170 80, 155 70 Q 145 62, 135 58"
            stroke="#5C7A2A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
          <ellipse cx="175" cy="92" rx="4" ry="7" fill="#5C7A2A" opacity="0.8" transform="rotate(30 175 92)" />
          <ellipse cx="168" cy="82" rx="4" ry="7" fill="#5C7A2A" opacity="0.75" transform="rotate(35 168 82)" />
          <ellipse cx="160" cy="74" rx="4" ry="7" fill="#5C7A2A" opacity="0.8" transform="rotate(38 160 74)" />
          <ellipse cx="152" cy="67" rx="4" ry="7" fill="#5C7A2A" opacity="0.75" transform="rotate(40 152 67)" />
          <ellipse cx="144" cy="62" rx="4" ry="7" fill="#5C7A2A" opacity="0.8" transform="rotate(42 144 62)" />
        </g>

        {/* Leaves */}
        <g className="aal-leaves">
          <path d="M 100 70 Q 95 75, 100 80 Q 105 75, 100 70 Z" fill="#5C7A2A" opacity="0.7" />
          <path d="M 90 75 Q 85 80, 90 85 Q 95 80, 90 75 Z" fill="#16A34A" opacity="0.6" />
          <path d="M 110 75 Q 105 80, 110 85 Q 115 80, 110 75 Z" fill="#16A34A" opacity="0.6" />
        </g>

        {/* Fruits — fall from above, staggered */}
        <g className="aal-fruit-red">
          <circle cx="85" cy="100" r="10" fill="#DC2626" opacity="0.8" />
          <circle cx="87" cy="98" r="3" fill="#FCA5A5" opacity="0.5" />
        </g>
        <g className="aal-fruit-orange">
          <circle cx="115" cy="100" r="10" fill="#F97316" opacity="0.8" />
          <circle cx="117" cy="98" r="3" fill="#FED7AA" opacity="0.5" />
        </g>
        <g className="aal-fruit-yellow">
          <circle cx="100" cy="105" r="9" fill="#EAB308" opacity="0.8" />
          <circle cx="102" cy="103" r="2.5" fill="#FEF08A" opacity="0.5" />
        </g>

        {/* Extra produce accents */}
        <g className="aal-produce-green">
          <ellipse cx="73" cy="108" rx="7" ry="4.5" fill="#16A34A" opacity="0.8" transform="rotate(-20 73 108)" />
          <ellipse cx="75" cy="107" rx="2" ry="1.4" fill="#86EFAC" opacity="0.55" transform="rotate(-20 75 107)" />
        </g>
        <g className="aal-produce-purple">
          <ellipse cx="127" cy="109" rx="6.5" ry="4.2" fill="#7C3AED" opacity="0.78" transform="rotate(22 127 109)" />
          <path d="M 123 104 Q 126 101, 130 103" stroke="#5C7A2A" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
        </g>
        <g className="aal-produce-red">
          <circle cx="100" cy="118" r="4.5" fill="#EF4444" opacity="0.82" />
          <path d="M 98 114.5 Q 100 112.5, 102 114.5" stroke="#5C7A2A" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" />
        </g>

        {/* Decorative dots */}
        <g className="aal-details">
          <circle cx="100" cy="90" r="2" fill="#5C7A2A" opacity="0.4" />
          <circle cx="95" cy="92" r="1.5" fill="#5C7A2A" opacity="0.4" />
          <circle cx="105" cy="92" r="1.5" fill="#5C7A2A" opacity="0.4" />
          <path d="M 35 135 L 38 125" stroke="#9E623B" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <circle cx="38" cy="125" r="1.5" fill="#9E623B" opacity="0.6" />
          <circle cx="36" cy="128" r="1.5" fill="#9E623B" opacity="0.6" />
          <circle cx="40" cy="128" r="1.5" fill="#9E623B" opacity="0.6" />
          <path d="M 165 135 L 162 125" stroke="#9E623B" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          <circle cx="162" cy="125" r="1.5" fill="#9E623B" opacity="0.6" />
          <circle cx="160" cy="128" r="1.5" fill="#9E623B" opacity="0.6" />
          <circle cx="164" cy="128" r="1.5" fill="#9E623B" opacity="0.6" />
        </g>

        {/* Brand text — last to appear */}
        <g className="aal-text">
          <text x="100" y="149" fontFamily="Georgia, serif" fontSize="16" fontWeight="bold"
            fill="#5C7A2A" textAnchor="middle" letterSpacing="0.8">
            ABU AL-ANAS
          </text>
          <line x1="57" y1="157" x2="143" y2="157" stroke="#9E623B" strokeWidth="0.8" opacity="0.5" />
          <text x="100" y="166" fontFamily="Georgia, serif" fontSize="7.5" fontWeight="normal"
            fill="#9E623B" textAnchor="middle" letterSpacing="1.1">
            FRUIT &amp; VEGETABLES
          </text>
          <circle cx="55" cy="157" r="1" fill="#9E623B" opacity="0.5" />
          <circle cx="145" cy="157" r="1" fill="#9E623B" opacity="0.5" />
        </g>
      </svg>

      <style>{`
        .aal-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Circles */
        .aal-circle-1 { animation: aal-fade 0.5s ease-out 0.6s both; }
        .aal-circle-2 { animation: aal-fade 0.5s ease-out 0.75s both; }

        /* Branches slide in from sides */
        .aal-branch-left  { animation: aal-slide-left  0.6s ease-out 0.85s both; }
        .aal-branch-right { animation: aal-slide-right 0.6s ease-out 0.85s both; }

        /* Leaves grow from centre */
        .aal-leaves { animation: aal-grow 0.4s ease-out 1.2s both; transform-origin: 100px 77px; }

        /* Fruits fall with spring, staggered */
        .aal-fruit-red    { animation: aal-fall 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0s    both; }
        .aal-fruit-orange { animation: aal-fall 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s  both; }
        .aal-fruit-yellow { animation: aal-fall 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s  both; }
        .aal-produce-green  { animation: aal-fall 0.72s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both; }
        .aal-produce-purple { animation: aal-fall 0.72s cubic-bezier(0.34, 1.56, 0.64, 1) 0.32s both; }
        .aal-produce-red    { animation: aal-fall 0.68s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s  both; }

        /* Details and text */
        .aal-details { animation: aal-fade 0.4s ease-out 1.35s both; }
        .aal-text    { animation: aal-fade 0.4s ease-out 1.55s both; }

        @keyframes aal-fall {
          from { transform: translateY(-140px); opacity: 0; }
          60%  { opacity: 1; }
          to   { transform: translateY(0);      opacity: 1; }
        }

        @keyframes aal-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes aal-slide-left {
          from { transform: translateX(-40px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }

        @keyframes aal-slide-right {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }

        @keyframes aal-grow {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AnimatedLogo;
