/**
 * Shared arrow components for navigation arrows
 * Used by both DesktopArrows and MobileArrows
 */

export interface AnimatedArrowheadProps {
  x: number;
  y: number;
  angle: number;
  isVisible: boolean;
  delay: number;
  className?: string;
  size?: 'desktop' | 'mobile';
}

/**
 * Animated arrowhead that fades in with delay
 * @param size - 'desktop' for smaller arrows, 'mobile' for larger touch-friendly arrows
 */
export const AnimatedArrowhead = ({
  x,
  y,
  angle,
  isVisible,
  delay,
  className,
  size = 'desktop',
}: AnimatedArrowheadProps) => {
  const isMobile = size === 'mobile';
  const pathD = isMobile ? 'M-8,-4 L0,0 L-8,4' : 'M-7,-3 L0,0 L-7,3';
  const strokeWidth = isMobile ? 2 : 1.5;
  const shadowOpacity = isMobile ? 0.7 : 0.6;

  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${angle})`}
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity 0.3s ease-out ${delay}ms`,
      }}
      className={className}
    >
      <path
        d={pathD}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`drop-shadow(0 2px 4px rgba(0, 0, 0, ${shadowOpacity}))`}
      />
    </g>
  );
};

export interface AnimatedDotProps {
  x: number;
  y: number;
  isVisible: boolean;
  delay: number;
  className?: string;
}

/**
 * Animated dot that marks the start of an arrow path
 */
export const AnimatedDot = ({
  x,
  y,
  isVisible,
  delay,
  className,
}: AnimatedDotProps) => (
  <circle
    cx={x}
    cy={y}
    r="3"
    fill="white"
    filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
    style={{
      opacity: isVisible ? 1 : 0,
      transition: `opacity 0.3s ease-out ${delay}ms`,
    }}
    className={className}
  />
);

/**
 * Calculate arrowhead rotation angle for quadratic bezier curves
 * At t=1, tangent direction is from control point to end point
 */
export const getArrowAngle = (
  controlX: number,
  controlY: number,
  endX: number,
  endY: number
): number => {
  const dx = endX - controlX;
  const dy = endY - controlY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};
