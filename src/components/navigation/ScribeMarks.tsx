import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateOffsetPath } from '../../utils/pathGeometry';

interface ScribeMarksProps {
  /** SVG path data string (M x y Q cx cy, ex ey) */
  pathData: string;
  /** Distance from main path in pixels */
  offset: number;
  /** Stroke width (thin for authentic scribe look) */
  strokeWidth: number;
  /** Dash pattern string (e.g., "8 4" or "12 6 4 6") */
  dashPattern: string;
  /** Opacity of scribe marks (0-1) */
  opacity: number;
  /** Whether marks are visible (triggers animation) */
  isVisible: boolean;
  /** Animation delay in milliseconds */
  delay: number;
  /** Stroke color (defaults to white) */
  stroke?: string;
  /** Whether to show the scribe marks */
  enabled?: boolean;
  /** Whether to show marks on both sides of the path */
  bothSides?: boolean;
}

/**
 * Renders thin dashed lines parallel to an arrow path
 * These mimic woodworker scribe marks - precise layout lines
 */
const ScribeMarks = ({
  pathData,
  offset,
  strokeWidth,
  dashPattern,
  opacity,
  isVisible,
  delay,
  stroke = 'white',
  enabled = true,
  bothSides = false,
}: ScribeMarksProps) => {
  // Generate offset path(s)
  const paths = useMemo(() => {
    if (!enabled) return [];

    const result: Array<{ d: string; key: string }> = [];

    // Path on one side
    const path1 = generateOffsetPath(pathData, offset);
    if (path1) {
      result.push({ d: path1, key: 'scribe-1' });
    }

    // Optional path on other side
    if (bothSides) {
      const path2 = generateOffsetPath(pathData, -offset);
      if (path2) {
        result.push({ d: path2, key: 'scribe-2' });
      }
    }

    return result;
  }, [pathData, offset, enabled, bothSides]);

  if (!enabled || paths.length === 0) {
    return null;
  }

  // Convert delay from ms to seconds for Framer Motion
  const delaySeconds = delay / 1000;

  return (
    <g opacity={opacity} style={{ willChange: 'opacity' }}>
      {paths.map((path, index) => (
        <motion.path
          key={path.key}
          d={path.d}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashPattern}
          strokeLinecap="round"
          fill="none"
          filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4))"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: isVisible ? 1 : 0,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            pathLength: {
              duration: 0.5,
              ease: 'easeOut',
              delay: delaySeconds + index * 0.1,
            },
            opacity: {
              duration: 0.3,
              ease: 'easeOut',
              delay: delaySeconds + index * 0.1,
            },
          }}
        />
      ))}
    </g>
  );
};

export default ScribeMarks;
