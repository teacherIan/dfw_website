/**
 * BlueprintButtonSVG - Reusable SVG decorations for blueprint-style circular buttons
 * Includes grid pattern, rings, crosshair, and compass arcs
 */
const BlueprintButtonSVG = () => {
  return (
    <>
      {/* Blueprint grid pattern */}
      <span className="nav-circle__grid" aria-hidden="true" />

      {/* Outer rings */}
      <svg className="nav-circle__ring" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="46"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
          opacity="0.6"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
      </svg>

      {/* Center crosshair */}
      <svg className="nav-circle__crosshair" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="6"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.6"
        />
        <line
          x1="50"
          y1="28"
          x2="50"
          y2="42"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="50"
          y1="58"
          x2="50"
          y2="72"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="28"
          y1="50"
          x2="42"
          y2="50"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="58"
          y1="50"
          x2="72"
          y2="50"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>

      {/* Compass arc marks */}
      <svg className="nav-circle__arcs" viewBox="0 0 100 100">
        <path
          d="M28 68 A28 28 0 0 1 36 36"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          fill="none"
          opacity="0.45"
        />
        <path
          d="M72 32 A28 28 0 0 1 64 64"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 2"
          fill="none"
          opacity="0.45"
        />
      </svg>
    </>
  );
};

export default BlueprintButtonSVG;
