interface ArrowProps {
  className?: string;
  isVisible?: boolean;
  delay?: number;
}

// Animated arrowhead that fades in when line finishes drawing
const AnimatedArrowhead = ({
  x,
  y,
  angle,
  isVisible,
  delay,
}: {
  x: number;
  y: number;
  angle: number;
  isVisible: boolean;
  delay: number;
}) => (
  <g
    transform={`translate(${x}, ${y}) rotate(${angle})`}
    style={{
      opacity: isVisible ? 1 : 0,
      transition: `opacity 0.3s ease-out ${delay}ms`,
    }}
  >
    <path
      d="M-7,-3 L0,0 L-7,3"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
    />
  </g>
);

// 1. LOOP ARROW (Top)
export const LoopArrow = ({ className = 'nav-arrow', isVisible = true, delay = 0 }: ArrowProps) => {
  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  // Arrowhead appears when line finishes drawing
  const arrowheadDelay = delay + 500;

  // End point and angle for arrowhead (last segment points right)
  const endX = 76;
  const endY = 25;
  const arrowAngle = 0; // Points right

  return (
    <svg
      className={className}
      viewBox="0 0 70 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <path
        d="M2 25
           C 10 25, 14 15, 20 12
           C 26 9, 30 18, 27 24
           C 24 30, 18 27, 21 21
           C 24 15, 34 12, 44 16
           C 50 18, 55 25, 76 25"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        style={pathStyle}
        fill="none"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <AnimatedArrowhead
        x={endX}
        y={endY}
        angle={arrowAngle}
        isVisible={isVisible}
        delay={arrowheadDelay}
      />
    </svg>
  );
};

// 2. SPIRAL ARROW (Middle)
export const SpiralArrow = ({ className = 'nav-arrow', isVisible = true, delay = 0 }: ArrowProps) => {
  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  const arrowheadDelay = delay + 500;
  const endX = 76;
  const endY = 25;
  const arrowAngle = 0;

  return (
    <svg
      className={className}
      viewBox="0 0 70 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <path
        d="M5 25
           C 12 35, 22 38, 30 32
           C 38 26, 35 18, 28 18
           C 21 18, 20 25, 26 28
           C 32 31, 42 28, 50 25
           C 55 24, 60 25, 76 25"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        style={pathStyle}
        fill="none"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <AnimatedArrowhead
        x={endX}
        y={endY}
        angle={arrowAngle}
        isVisible={isVisible}
        delay={arrowheadDelay}
      />
    </svg>
  );
};

// 3. WAVE ARROW (Bottom)
export const WaveArrow = ({ className = 'nav-arrow', isVisible = true, delay = 0 }: ArrowProps) => {
  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  const arrowheadDelay = delay + 500;
  const endX = 76;
  const endY = 25;
  const arrowAngle = 0;

  return (
    <svg
      className={className}
      viewBox="0 0 70 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <path
        d="M5 25
           C 15 15, 25 35, 35 25
           C 45 15, 55 25, 76 25"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray="1"
        style={pathStyle}
        fill="none"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <AnimatedArrowhead
        x={endX}
        y={endY}
        angle={arrowAngle}
        isVisible={isVisible}
        delay={arrowheadDelay}
      />
    </svg>
  );
};
