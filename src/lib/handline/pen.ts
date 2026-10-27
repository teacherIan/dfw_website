/**
 * The pen: what turns a clean centreline into a line a hand drew.
 *
 * All geometric, no SVG filters. The old pencil/pressure/chalk filters moved
 * pixels (feDisplacementMap) — that wobbles a line but can't change its weight,
 * and it re-rasterises every frame of a draw-on. Here the line is cut into short
 * strokes, each with its own width and its own moment to draw:
 *
 *   - width swells with slow "pressure" noise and pools in tight curves,
 *     tapers where the pen lands and where it lifts;
 *   - the centreline wanders a little (seeded), pinned at both ends so an
 *     arrow still lands exactly where it was aimed;
 *   - the pen accelerates off the start, slows into tight curves and eases
 *     into the end, so a loop draws the way a hand draws one.
 */
import { clamp, curvatures, lerp, measure, resample, smoothstep, toPathD, type Pt } from './geom';
import type { Rng } from './random';

export interface Pen {
  /** Line width at full pressure, px. */
  width: number;
  /** Width where the pen lands, as a fraction of `width`. */
  taperIn: number;
  /** px over which the landing taper grows to full width. */
  taperInLength: number;
  /** Width where the pen lifts, as a fraction of `width`. */
  taperOut: number;
  taperOutLength: number;
  /** 0–1: slow swell and thinning along the line. */
  pressure: number;
  /** px between pressure swells. */
  pressureWave: number;
  /** px the centreline wanders. */
  jitter: number;
  /** px between wanders. */
  jitterWave: number;
  /** 0–1: extra width in tight curves, where a slowing pen leaves more ink. */
  curveInk: number;
  /** Times the pen goes over the line (1–3); the extra passes are faint and thin. */
  passes: number;
  /** 0–1: the paper's tooth showing through (a static speckle mask). */
  grain: number;
  opacity: number;
  /** Drawing speed, px per ms, on a straight run. */
  speed: number;
  /** 0–2: how much tight curves slow the pen. */
  curveSlow: number;
}

export type PenName = 'ink' | 'pencil' | 'chalk' | 'marker' | 'fineliner' | 'graphite';

export const PENS: Record<PenName, Pen> = {
  ink: {
    width: 2,
    taperIn: 0.35,
    taperInLength: 10,
    taperOut: 0.5,
    taperOutLength: 16,
    pressure: 0.16,
    pressureWave: 70,
    jitter: 0.45,
    jitterWave: 46,
    curveInk: 0.35,
    passes: 1,
    grain: 0,
    opacity: 1,
    speed: 0.55,
    curveSlow: 0.7,
  },
  pencil: {
    width: 1.6,
    taperIn: 0.25,
    taperInLength: 14,
    taperOut: 0.35,
    taperOutLength: 18,
    pressure: 0.32,
    pressureWave: 54,
    jitter: 0.7,
    jitterWave: 38,
    curveInk: 0.25,
    passes: 2,
    grain: 0.45,
    opacity: 0.88,
    speed: 0.5,
    curveSlow: 0.8,
  },
  graphite: {
    width: 2.6,
    taperIn: 0.3,
    taperInLength: 18,
    taperOut: 0.3,
    taperOutLength: 22,
    pressure: 0.38,
    pressureWave: 80,
    jitter: 0.8,
    jitterWave: 52,
    curveInk: 0.3,
    passes: 3,
    grain: 0.6,
    opacity: 0.8,
    speed: 0.42,
    curveSlow: 0.9,
  },
  chalk: {
    width: 3.6,
    taperIn: 0.55,
    taperInLength: 10,
    taperOut: 0.6,
    taperOutLength: 12,
    pressure: 0.3,
    pressureWave: 40,
    jitter: 1.0,
    jitterWave: 30,
    curveInk: 0.1,
    passes: 2,
    grain: 0.75,
    opacity: 0.92,
    speed: 0.45,
    curveSlow: 0.5,
  },
  marker: {
    width: 4.5,
    taperIn: 0.85,
    taperInLength: 6,
    taperOut: 0.85,
    taperOutLength: 6,
    pressure: 0.06,
    pressureWave: 90,
    jitter: 0.3,
    jitterWave: 60,
    curveInk: 0.05,
    passes: 1,
    grain: 0,
    opacity: 0.85,
    speed: 0.6,
    curveSlow: 0.4,
  },
  fineliner: {
    width: 1.25,
    taperIn: 0.8,
    taperInLength: 4,
    taperOut: 0.8,
    taperOutLength: 4,
    pressure: 0.05,
    pressureWave: 90,
    jitter: 0.3,
    jitterWave: 50,
    curveInk: 0.05,
    passes: 1,
    grain: 0,
    opacity: 1,
    speed: 0.6,
    curveSlow: 0.6,
  },
};

export type PenInput = PenName | Partial<Pen> | (Partial<Pen> & { base: PenName });

export function resolvePen(p: PenInput | undefined): Pen {
  if (!p) return PENS.ink;
  if (typeof p === 'string') return PENS[p];
  const base = 'base' in p && p.base ? PENS[p.base] : PENS.ink;
  const out = { ...base };
  for (const k of Object.keys(p) as (keyof Pen | 'base')[]) {
    if (k === 'base') continue;
    const v = p[k];
    if (typeof v === 'number') out[k] = v;
  }
  return out;
}

/** One short piece of a line: a constant-width stroke with its own draw window. */
export interface InkStroke {
  d: string;
  w: number;
  /** ms from the drawing's start when this piece starts / finishes drawing. */
  t0: number;
  t1: number;
  layer: number;
}

export interface InkOptions {
  layer: number;
  /** ms at which the pen touches down. */
  t0: number;
  widthScale?: number;
  jitterScale?: number;
  speedScale?: number;
  taper?: Partial<Pick<Pen, 'taperIn' | 'taperInLength' | 'taperOut' | 'taperOutLength'>>;
  /** Clamp the stroke's drawing time, ms. */
  duration?: [number, number];
}

export interface Inked {
  strokes: InkStroke[];
  /** ms at which the pen lifts. */
  t1: number;
  /** The pen's time at arc length s along the stroke, ms. */
  timeAt: (s: number) => number;
  /** The inked (wandered) centreline. */
  pts: Pt[];
  length: number;
}

const SPACING = 1.25;

export function ink(src: Pt[], pen: Pen, r: Rng, o: InkOptions): Inked {
  const m0 = measure(src);
  const L = m0.length;
  const pts = L > 0 ? resample(m0, SPACING) : [src[0], src[0]];
  const n = pts.length;
  const m = measure(pts);
  const s = m.cum;

  // 1. Wander, pinned at both ends.
  const amp = pen.jitter * (o.jitterScale ?? 1) * clamp(Math.sqrt(L / 120), 0.35, 1.6);
  if (amp > 0 && n > 2) {
    const nz = r.noise('jitter');
    const fine = r.noise('jitter-fine');
    const pin = Math.min(10, L / 4);
    const moved = pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const env = smoothstep(0, pin, s[i]) * smoothstep(0, pin, L - s[i]);
      const k =
        amp * env * (nz(s[i] / pen.jitterWave) + 0.35 * fine(s[i] / (pen.jitterWave * 0.3)));
      return { x: p.x - (dy / len) * k, y: p.y + (dx / len) * k };
    });
    for (let i = 0; i < n; i++) pts[i] = moved[i];
  }

  // 2. Width along the line.
  const kap = curvatures(pts);
  const press = r.noise('pressure');
  const tin = o.taper?.taperIn ?? pen.taperIn;
  const tout = o.taper?.taperOut ?? pen.taperOut;
  const tinL = Math.min(o.taper?.taperInLength ?? pen.taperInLength, L * 0.5);
  const toutL = Math.min(o.taper?.taperOutLength ?? pen.taperOutLength, L * 0.5);
  const W = pen.width * (o.widthScale ?? 1);
  const width = pts.map((_, i) => {
    const taper =
      lerp(tin, 1, smoothstep(0, tinL, s[i])) * lerp(tout, 1, smoothstep(0, toutL, L - s[i]));
    const p = 1 + pen.pressure * press(s[i] / pen.pressureWave);
    const pool = 1 + pen.curveInk * clamp(kap[i] * 5, 0, 1);
    return Math.max(0.2, W * taper * p * pool);
  });

  // 3. The pen's speed, and so its clock.
  const v0 = pen.speed * (o.speedScale ?? 1);
  const accel = Math.min(40, L * 0.25);
  const brake = Math.min(30, L * 0.2);
  const time = new Array<number>(n);
  time[0] = 0;
  for (let i = 1; i < n; i++) {
    const v =
      (v0 *
        (0.45 + 0.55 * smoothstep(0, accel, s[i])) *
        (0.65 + 0.35 * (1 - smoothstep(L - brake, L, s[i])))) /
      (1 + pen.curveSlow * clamp(kap[i] * 8, 0, 2.5));
    time[i] = time[i - 1] + (s[i] - s[i - 1]) / Math.max(v, 1e-3);
  }
  const raw = time[n - 1] || 1;
  const want = o.duration ? clamp(raw, o.duration[0], o.duration[1]) : raw;
  const k = want / raw;
  for (let i = 0; i < n; i++) time[i] = o.t0 + time[i] * k;

  // 4. Cut into strokes: short ones where the width is changing, longer on a
  //    steady run. Neighbours share an end point; round caps hide the joins.
  const strokes: InkStroke[] = [];
  // Each stroke is a DOM path the browser repaints while the line draws, so
  // runs are as long as the width allows: short through a taper, long on a
  // steady stretch.
  const maxLen = clamp(L / 30, 3, 16);
  let a = 0;
  while (a < n - 1) {
    let b = a + 1;
    while (
      b < n - 1 &&
      s[b] - s[a] < maxLen &&
      Math.abs(width[b] - width[a]) < Math.max(0.15, width[a] * 0.17)
    )
      b++;
    let wsum = 0;
    for (let i = a; i <= b; i++) wsum += width[i];
    strokes.push({
      d: toPathD(pts.slice(a, b + 1)),
      w: Math.round((wsum / (b - a + 1)) * 100) / 100,
      t0: time[a],
      t1: Math.max(time[b], time[a] + 0.5),
      layer: o.layer,
    });
    a = b;
  }

  const timeAt = (q: number) => {
    if (q <= 0) return time[0];
    if (q >= L) return time[n - 1];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (s[mid] <= q) lo = mid;
      else hi = mid;
    }
    return lerp(time[lo], time[hi], (q - s[lo]) / (s[hi] - s[lo] || 1));
  };

  return { strokes, t1: time[n - 1], timeAt, pts, length: L };
}
