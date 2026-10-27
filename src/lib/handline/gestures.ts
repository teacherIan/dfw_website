/**
 * Gestures: the shape of a line between two points, before the pen touches it.
 *
 * Every gesture is built in a "chord frame" — the start at (0, 0), the end at
 * (L, 0), +y toward the side the line bulges — at the chord's real length, so
 * a loop keeps its size in pixels whether the arrow is 80 px or 800 px long.
 * fit.ts turns the frame to face the target.
 */
import { clamp, cubicAt, flattenPath, measure, resample, type Pt } from './geom';
import type { Rng } from './random';

export type GestureSpec =
  | { kind: 'straight' }
  /** A plain bowed line. `bow` is the bulge as a fraction of the length. */
  | { kind: 'arc'; bow?: number }
  | { kind: 'wave'; waves?: number; amp?: number; bow?: number }
  /** One loop-de-loop, its centre at `at` (0–1) along the line. */
  | { kind: 'loop'; size?: number; at?: number; bow?: number }
  | { kind: 'loops'; count?: number; size?: number; at?: number; bow?: number }
  /** Small tight coils along most of the line, like a phone cord. */
  | { kind: 'spring'; size?: number; bow?: number }
  /** Overshoots the target and comes back into it from the side. */
  | { kind: 'hook'; bow?: number }
  /** An S. */
  | { kind: 'swoop'; bow?: number }
  /**
   * An authored path, start-to-end onto the line: its first point lands on the
   * start, its last on the end. By default the shape scales with the distance
   * (the old mobile arrows' templates worked this way). With `size` (px, the
   * authored start-to-end length) it keeps its drawn size and the rest of the
   * distance is a straight run into the target; it only shrinks when it must.
   */
  | { kind: 'path'; d: string; bow?: number; size?: number };

export type GestureName =
  | 'straight'
  | 'arc'
  | 'wave'
  | 'loop'
  | 'loops'
  | 'spring'
  | 'hook'
  | 'swoop'
  | 'dfw-loop'
  | 'dfw-spiral'
  | 'dfw-wave';

/** The three desktop menu arrows, as drawn by hand for dfw (70 × 50 box). */
export const DFW_PATHS = {
  loop: 'M2 25 C 10 25, 14 15, 20 12 C 26 9, 30 18, 27 24 C 24 30, 18 27, 21 21 C 24 15, 34 12, 44 16 C 50 18, 55 25, 76 25',
  spiral:
    'M5 25 C 12 35, 22 38, 30 32 C 38 26, 35 18, 28 18 C 21 18, 20 25, 26 28 C 32 31, 42 28, 50 25 C 55 24, 60 25, 76 25',
  wave: 'M5 25 C 15 15, 25 35, 35 25 C 45 15, 55 25, 76 25',
} as const;

export const GESTURES: Record<GestureName, GestureSpec> = {
  straight: { kind: 'straight' },
  arc: { kind: 'arc', bow: 0.16 },
  wave: { kind: 'wave', waves: 2 },
  loop: { kind: 'loop', at: 0.42, bow: 0.06 },
  loops: { kind: 'loops', count: 2, at: 0.45, bow: 0.05 },
  spring: { kind: 'spring', bow: 0.04 },
  hook: { kind: 'hook' },
  swoop: { kind: 'swoop' },
  'dfw-loop': { kind: 'path', d: DFW_PATHS.loop },
  'dfw-spiral': { kind: 'path', d: DFW_PATHS.spiral },
  'dfw-wave': { kind: 'path', d: DFW_PATHS.wave },
};

export const resolveGesture = (g: GestureSpec | GestureName | undefined): GestureSpec =>
  typeof g === 'string' ? GESTURES[g] : (g ?? GESTURES.arc);

const STEP = 1.5;

/** The gesture's centreline in the chord frame, before any bow. */
function shape(g: GestureSpec, L: number, r: Rng): Pt[] {
  switch (g.kind) {
    case 'straight':
    case 'arc':
      return [
        { x: 0, y: 0 },
        { x: L, y: 0 },
      ];
    case 'wave': {
      const waves = g.waves ?? 2;
      const amp = g.amp ?? clamp(L * 0.08, 4, 18);
      const n = Math.ceil(L / STEP);
      const out: Pt[] = [];
      for (let k = 0; k <= n; k++) {
        const x = (L * k) / n;
        const u = x / L;
        // sin(πu) lets the wave die out at both ends, so the line leaves and
        // arrives along its own direction rather than mid-swing.
        out.push({ x, y: amp * Math.sin(2 * Math.PI * waves * u) * Math.sin(Math.PI * u) });
      }
      return out;
    }
    case 'loop':
      return loops(L, 1, g.size, g.at ?? 0.45, r);
    case 'loops':
      return loops(L, g.count ?? 2, g.size, g.at ?? 0.45, r);
    case 'spring': {
      const size = g.size ?? clamp(L * 0.035, 3, 7);
      const per = (2 * Math.PI * size) / 1.7;
      return loops(L, Math.max(3, Math.floor((L * 0.7) / per)), size, 0.5, r, 1.7);
    }
    case 'hook':
      return bezier(L, { x: 0.35, y: 0.5 }, { x: 1.22, y: 0.58 });
    case 'swoop':
      return bezier(L, { x: 0.45, y: 0.42 }, { x: 0.55, y: -0.42 });
    case 'path':
      return authored(g.d, L, g.size);
  }
}

function bezier(L: number, c1: Pt, c2: Pt): Pt[] {
  const p0 = { x: 0, y: 0 };
  const p3 = { x: L, y: 0 };
  const a = { x: c1.x * L, y: c1.y * L };
  const b = { x: c2.x * L, y: c2.y * L };
  const n = Math.ceil((L * 1.6) / STEP);
  const out: Pt[] = [];
  for (let k = 0; k <= n; k++) out.push(cubicAt(p0, a, b, p3, k / n));
  return out;
}

/**
 * Loop-de-loops along the chord: a prolate trochoid — the path a point on a
 * spoke traces when the spoke is longer than the wheel's radius. `ratio` is
 * spoke ÷ radius: above 1 the path crosses itself; ~1.9 gives round, open
 * loops. Small loops get a higher ratio, or their eye closes under the pen's
 * width and they read as a cusp. The loop size wanders a little per turn
 * (seeded), the way a hand does.
 */
function loops(
  L: number,
  count: number,
  size: number | undefined,
  at: number,
  r: Rng,
  fixedRatio?: number
): Pt[] {
  let d = size ?? clamp(L * 0.11, 5, 22);
  const ratio = fixedRatio ?? clamp(1.45 + 8 / d, 1.85, 2.9);
  let rr = d / ratio;
  let W = 2 * Math.PI * count * rr; // the stretch of chord the loops use
  if (W > L * 0.78) {
    W = L * 0.78;
    rr = W / (2 * Math.PI * count);
    d = ratio * rr;
  }
  const xa = clamp(at * L - W / 2, L * 0.08, L * 0.92 - W);
  const wobble = r.noise('loop-size');
  const out: Pt[] = [{ x: 0, y: 0 }];
  for (let x = STEP; x < xa; x += STEP) out.push({ x, y: 0 });
  const turns = 2 * Math.PI * count;
  const n = Math.ceil((W + turns * d) / STEP);
  for (let k = 0; k <= n; k++) {
    const th = (turns * k) / n;
    const dk = d * (1 + 0.14 * wobble(th / (2 * Math.PI) + 0.5));
    out.push({ x: xa + rr * th + dk * Math.sin(th), y: dk * (1 - Math.cos(th)) });
  }
  for (let x = xa + W + STEP; x < L; x += STEP) out.push({ x, y: 0 });
  out.push({ x: L, y: 0 });
  return out;
}

/**
 * An authored path, start-to-end mapped onto (0, 0)–(L, 0). The path is drawn
 * in screen space (y down) and read so that, on a left-to-right line bulging to
 * its left (up), it comes out exactly as drawn.
 */
function authored(d: string, L: number, size?: number): Pt[] {
  const poly = flattenPath(d, 0.5)[0] ?? [];
  if (poly.length < 2)
    return [
      { x: 0, y: 0 },
      { x: L, y: 0 },
    ];
  const a = poly[0];
  const b = poly[poly.length - 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const cos = Math.cos(-ang);
  const sin = Math.sin(-ang);
  const span = size ? Math.min(size, L) : L;
  const s = span / len;
  const mapped = poly.map((p) => {
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    return { x: (dx * cos - dy * sin) * s, y: -(dx * sin + dy * cos) * s };
  });
  if (span < L) mapped.push({ x: L, y: 0 });
  return resample(measure(mapped), STEP);
}

/**
 * Lays the frame along a bowed baseline: a point (x, y) lands at the baseline's
 * point x/L along, pushed y along its normal. Loops then ride a gentle arc
 * instead of a ruler line.
 */
function bend(pts: Pt[], L: number, bow: number): Pt[] {
  if (!bow) return pts;
  const h = bow * L;
  return pts.map((p) => {
    const t = p.x / L;
    const by = 4 * h * t * (1 - t);
    const tx = L;
    const ty = 4 * h * (1 - 2 * t);
    const tl = Math.hypot(tx, ty) || 1;
    return { x: p.x - (ty / tl) * p.y, y: by + (tx / tl) * p.y };
  });
}

export interface GestureOptions {
  /** Extra bulge on top of the gesture's own, as a fraction of the length. */
  bow?: number;
}

/** The gesture's centreline in the chord frame, bow applied. */
export function gesturePoints(
  g: GestureSpec | GestureName | undefined,
  L: number,
  r: Rng,
  opts: GestureOptions = {}
): Pt[] {
  const spec = resolveGesture(g);
  const own = spec.kind === 'arc' ? (spec.bow ?? 0.16) : 'bow' in spec ? (spec.bow ?? 0) : 0;
  return bend(shape(spec, Math.max(L, 1), r), Math.max(L, 1), own + (opts.bow ?? 0));
}
