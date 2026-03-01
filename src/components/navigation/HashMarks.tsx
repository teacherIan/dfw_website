import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  getPointsAlongQuadraticBezier,
  generatePerpendicularLine,
  type PointWithAngle,
} from '../../utils/pathGeometry';

interface HashMarksProps {
  /** SVG path data string (M x y Q cx cy, ex ey) */
  pathData: string;
  /** Number of hash marks to render */
  density: number;
  /** Length of each hash mark in pixels */
  length: number;
  /** Spacing pattern: evenly distributed or randomly placed */
  spacing: 'even' | 'random';
  /** Opacity of hash marks (0-1) */
  opacity: number;
  /** Whether marks are visible (triggers animation) */
  isVisible: boolean;
  /** Animation delay in milliseconds */
  delay: number;
  /** Optional seed for random spacing */
  seed?: number;
  /** Stroke color (defaults to white) */
  stroke?: string;
  /** Whether to show the hash marks */
  enabled?: boolean;
}

/**
 * Renders small perpendicular lines (hash/witness marks) crossing an arrow path
 * These mimic woodworker layout marks for measuring and alignment
 */
const HashMarks = ({
  pathData,
  density,
  length,
  spacing,
  opacity,
  isVisible,
  delay,
  seed = 42,
  stroke = 'white',
  enabled = true,
}: HashMarksProps) => {
  // Calculate hash mark positions and paths
  const hashPaths = useMemo(() => {
    if (!enabled || density < 1) return [];

    const points: PointWithAngle[] = getPointsAlongQuadraticBezier(
      pathData,
      density,
      spacing,
      seed
    );

    return points.map((point) => ({
      d: generatePerpendicularLine(point.x, point.y, point.angle, length),
      key: `${point.x.toFixed(1)}-${point.y.toFixed(1)}`,
    }));
  }, [pathData, density, length, spacing, seed, enabled]);

  if (!enabled || hashPaths.length === 0) {
    return null;
  }

  // Convert delay from ms to seconds for Framer Motion
  const baseDelaySeconds = delay / 1000;
  const staggerDelay = 0.03; // 30ms between each mark

  return (
    <g opacity={opacity} style={{ willChange: 'opacity' }}>
      {hashPaths.map((hash, index) => (
        <motion.path
          key={hash.key}
          d={hash.d}
          stroke={stroke}
          strokeWidth={0.8}
          strokeLinecap="round"
          fill="none"
          filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={{
            opacity: isVisible ? 1 : 0,
            pathLength: isVisible ? 1 : 0,
          }}
          transition={{
            duration: 0.15,
            ease: 'easeOut',
            delay: baseDelaySeconds + index * staggerDelay,
          }}
        />
      ))}
    </g>
  );
};

export default HashMarks;
