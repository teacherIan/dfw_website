/**
 * Path geometry utilities for calculating positions along SVG bezier curves
 * Used for generating hash marks and scribe marks on arrows
 */

export interface Point {
  x: number;
  y: number;
}

export interface BezierPoints {
  start: Point;
  control: Point;
  end: Point;
}

export interface CubicBezierPoints {
  start: Point;
  control1: Point;
  control2: Point;
  end: Point;
}

export interface PointWithAngle extends Point {
  angle: number;
}

/**
 * Parse a quadratic bezier path string (M x y Q cx cy, ex ey)
 */
export const parseQuadraticBezier = (pathD: string): BezierPoints | null => {
  // Match patterns like "M 118 90 Q 60 60, 77 11" or "M118 90 Q60 60,77 11"
  const match = pathD.match(
    /M\s*([-\d.]+)\s+([-\d.]+)\s*Q\s*([-\d.]+)\s+([-\d.]+)[,\s]+([-\d.]+)\s+([-\d.]+)/i
  );

  if (!match) return null;

  return {
    start: { x: parseFloat(match[1]), y: parseFloat(match[2]) },
    control: { x: parseFloat(match[3]), y: parseFloat(match[4]) },
    end: { x: parseFloat(match[5]), y: parseFloat(match[6]) },
  };
};

/**
 * Parse a cubic bezier path string (M x y C c1x c1y, c2x c2y, ex ey)
 */
export const parseCubicBezier = (pathD: string): CubicBezierPoints | null => {
  // Match patterns like "M2 25 C 10 25, 14 15, 20 12"
  const match = pathD.match(
    /M\s*([-\d.]+)\s+([-\d.]+)\s*C\s*([-\d.]+)\s+([-\d.]+)[,\s]+([-\d.]+)\s+([-\d.]+)[,\s]+([-\d.]+)\s+([-\d.]+)/i
  );

  if (!match) return null;

  return {
    start: { x: parseFloat(match[1]), y: parseFloat(match[2]) },
    control1: { x: parseFloat(match[3]), y: parseFloat(match[4]) },
    control2: { x: parseFloat(match[5]), y: parseFloat(match[6]) },
    end: { x: parseFloat(match[7]), y: parseFloat(match[8]) },
  };
};

/**
 * Get a point on a quadratic bezier curve at parameter t (0-1)
 */
export const getPointOnQuadraticBezier = (t: number, points: BezierPoints): Point => {
  const { start, control, end } = points;
  const mt = 1 - t;

  return {
    x: mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
    y: mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
  };
};

/**
 * Get a point on a cubic bezier curve at parameter t (0-1)
 */
export const getPointOnCubicBezier = (t: number, points: CubicBezierPoints): Point => {
  const { start, control1, control2, end } = points;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * start.x + 3 * mt2 * t * control1.x + 3 * mt * t2 * control2.x + t3 * end.x,
    y: mt3 * start.y + 3 * mt2 * t * control1.y + 3 * mt * t2 * control2.y + t3 * end.y,
  };
};

/**
 * Get the tangent angle at a point on a quadratic bezier curve
 */
export const getQuadraticTangentAngle = (t: number, points: BezierPoints): number => {
  const { start, control, end } = points;
  const mt = 1 - t;

  // Derivative of quadratic bezier
  const dx = 2 * mt * (control.x - start.x) + 2 * t * (end.x - control.x);
  const dy = 2 * mt * (control.y - start.y) + 2 * t * (end.y - control.y);

  return Math.atan2(dy, dx);
};

/**
 * Get the tangent angle at a point on a cubic bezier curve
 */
export const getCubicTangentAngle = (t: number, points: CubicBezierPoints): number => {
  const { start, control1, control2, end } = points;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  // Derivative of cubic bezier
  const dx =
    3 * mt2 * (control1.x - start.x) +
    6 * mt * t * (control2.x - control1.x) +
    3 * t2 * (end.x - control2.x);
  const dy =
    3 * mt2 * (control1.y - start.y) +
    6 * mt * t * (control2.y - control1.y) +
    3 * t2 * (end.y - control2.y);

  return Math.atan2(dy, dx);
};

/**
 * Generate a perpendicular line path at a given point and angle
 */
export const generatePerpendicularLine = (
  x: number,
  y: number,
  angle: number,
  length: number
): string => {
  const perpAngle = angle + Math.PI / 2;
  const halfLen = length / 2;

  const x1 = x + Math.cos(perpAngle) * halfLen;
  const y1 = y + Math.sin(perpAngle) * halfLen;
  const x2 = x - Math.cos(perpAngle) * halfLen;
  const y2 = y - Math.sin(perpAngle) * halfLen;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

/**
 * Get evenly spaced points along a quadratic bezier curve
 */
export const getEvenPointsOnQuadraticBezier = (
  points: BezierPoints,
  count: number
): PointWithAngle[] => {
  const result: PointWithAngle[] = [];

  // Start at 0.1 and end at 0.9 to avoid endpoints
  for (let i = 0; i < count; i++) {
    const t = 0.1 + (i / (count - 1)) * 0.8;
    const point = getPointOnQuadraticBezier(t, points);
    const angle = getQuadraticTangentAngle(t, points);
    result.push({ ...point, angle });
  }

  return result;
};

/**
 * Get randomly spaced points along a quadratic bezier curve
 */
export const getRandomPointsOnQuadraticBezier = (
  points: BezierPoints,
  count: number,
  seed: number = 42
): PointWithAngle[] => {
  const result: PointWithAngle[] = [];

  // Simple seeded random number generator
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  // Generate random t values, sort them, then get points
  const tValues: number[] = [];
  for (let i = 0; i < count; i++) {
    // Random t between 0.1 and 0.9
    const t = 0.1 + seededRandom(seed + i) * 0.8;
    tValues.push(t);
  }

  // Sort for consistent ordering along path
  tValues.sort((a, b) => a - b);

  for (const t of tValues) {
    const point = getPointOnQuadraticBezier(t, points);
    const angle = getQuadraticTangentAngle(t, points);
    result.push({ ...point, angle });
  }

  return result;
};

/**
 * Get points along a quadratic bezier based on spacing type
 */
export const getPointsAlongQuadraticBezier = (
  pathD: string,
  count: number,
  spacing: 'even' | 'random',
  seed?: number
): PointWithAngle[] => {
  const points = parseQuadraticBezier(pathD);
  if (!points) return [];

  if (spacing === 'random') {
    return getRandomPointsOnQuadraticBezier(points, count, seed);
  }

  return getEvenPointsOnQuadraticBezier(points, count);
};

/**
 * Generate an offset path (for scribe marks)
 * This is a simplified approximation - samples the curve and offsets each point
 */
export const generateOffsetPath = (
  pathD: string,
  offset: number,
  samples: number = 20
): string => {
  const points = parseQuadraticBezier(pathD);
  if (!points) return '';

  const offsetPoints: Point[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const point = getPointOnQuadraticBezier(t, points);
    const angle = getQuadraticTangentAngle(t, points);
    const perpAngle = angle + Math.PI / 2;

    offsetPoints.push({
      x: point.x + Math.cos(perpAngle) * offset,
      y: point.y + Math.sin(perpAngle) * offset,
    });
  }

  // Build path string
  const pathParts = offsetPoints.map((p, i) => {
    const prefix = i === 0 ? 'M' : 'L';
    return `${prefix} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  });

  return pathParts.join(' ');
};
