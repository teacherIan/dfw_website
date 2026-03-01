/**
 * Shared arrow components for navigation arrows
 * Used by both DesktopArrows and MobileArrows
 */

import { motion } from 'framer-motion';

export type ArrowheadStyle = 'standard' | 'layout' | 'simple';

/**
 * Arrowhead path definitions for different styles
 * - standard: Classic angled arrowhead (current design)
 * - layout: Simpler, more utilitarian carpenter-style
 * - simple: Minimal, just a short perpendicular line
 */
const ARROWHEAD_PATHS: Record<ArrowheadStyle, { mobile: string; desktop: string }> = {
  standard: {
    mobile: 'M-8,-4 L0,0 L-8,4',
    desktop: 'M-7,-3 L0,0 L-7,3',
  },
  layout: {
    // Shallower angle, more utilitarian
    mobile: 'M-6,-3 L0,0 L-6,3',
    desktop: 'M-5,-2.5 L0,0 L-5,2.5',
  },
  simple: {
    // Just a short perpendicular tick mark
    mobile: 'M0,-4 L0,4',
    desktop: 'M0,-3 L0,3',
  },
};

export interface AnimatedArrowheadProps {
  x: number;
  y: number;
  angle: number;
  isVisible: boolean;
  delay: number;
  className?: string;
  size?: 'desktop' | 'mobile';
  /** Arrowhead style variant */
  style?: ArrowheadStyle;
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
  style = 'standard',
}: AnimatedArrowheadProps) => {
  const isMobile = size === 'mobile';
  // Get path for the selected style and size
  const paths = ARROWHEAD_PATHS[style];
  const pathD = isMobile ? paths.mobile : paths.desktop;
  const strokeWidth = isMobile ? 2 : 1.5;
  const shadowOpacity = isMobile ? 0.7 : 0.6;
  const delaySeconds = delay / 1000;

  return (
    <motion.g
      transform={`translate(${x}, ${y}) rotate(${angle})`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: delaySeconds }}
      style={{ willChange: 'transform' }} // Stabilize Safari's GPU layer compositing for sub-pixel precision
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
    </motion.g>
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
}: AnimatedDotProps) => {
  const delaySeconds = delay / 1000;

  return (
    <motion.circle
      cx={x}
      cy={y}
      r="3"
      fill="white"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: delaySeconds }}
      className={className}
    />
  );
};

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
