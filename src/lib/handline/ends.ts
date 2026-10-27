/**
 * What the pen does at either end of a line, and the marks it leaves along
 * it: arrowheads drawn as flicks of the same pen (not a pasted chevron), start
 * marks, the woodworker's hash and scribe marks, and the ring a hand draws
 * around the thing it's pointing at.
 */
import {
  clamp,
  measure,
  sampleAt,
  shapeCenter,
  toPolygonD,
  curvatures,
  type Pt,
  type Shape,
} from './geom';
import { ink, type InkStroke, type Pen } from './pen';
import type { Rng } from './random';

export type HeadKind = 'chevron' | 'open' | 'harpoon' | 'triangle' | 'tick' | 'dot' | 'none';
export interface HeadSpec {
  kind: HeadKind;
  /** Barb length, px. Defaults from the pen's width. */
  size?: number;
  /** Half the angle between the barbs, degrees. */
  angle?: number;
}

export type TailKind = 'none' | 'dot' | 'ring' | 'tick' | 'hook';

export interface MarksSpec {
  /** Short marks across the line — a woodworker's witness marks. */
  ticks?: { count?: number; length?: number; spacing?: 'even' | 'random' };
  /** A thin dashed line running alongside, like a scribed layout line. */
  scribe?: { offset?: number; dash?: [number, number]; width?: number };
  /** Bars across both ends, the way a dimension line is drawn. */
  dimension?: { length?: number };
}

/** A filled piece (a dot, a solid head) that fades in at t0. */
export interface InkFill {
  d: string;
  t0: number;
  layer: number;
}

export interface EndsOut {
  strokes: InkStroke[];
  fills: InkFill[];
  t1: number;
}

const dir = (a: number) => ({ x: Math.cos(a), y: Math.sin(a) });
const at = (p: Pt, a: number, d: number) => ({
  x: p.x + Math.cos(a) * d,
  y: p.y + Math.sin(a) * d,
});

/** A slightly bowed segment a → b, the way a quick flick curves. */
function flick(a: Pt, b: Pt, bow: number): Pt[] {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c = { x: mx - dy * bow, y: my + dx * bow };
  const out: Pt[] = [];
  for (let k = 0; k <= 12; k++) {
    const t = k / 12;
    const m = 1 - t;
    out.push({
      x: m * m * a.x + 2 * m * t * c.x + t * t * b.x,
      y: m * m * a.y + 2 * m * t * c.y + t * t * b.y,
    });
  }
  return out;
}

function circleD(c: Pt, r: number): string {
  const f = (n: number) => Math.round(n * 100) / 100;
  return `M${f(c.x - r)} ${f(c.y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
}

export function resolveHead(h: HeadKind | HeadSpec | undefined): HeadSpec {
  return typeof h === 'string' ? { kind: h } : (h ?? { kind: 'chevron' });
}

export function head(
  tip: Pt,
  angle: number,
  spec: HeadSpec,
  pen: Pen,
  r: Rng,
  t0: number
): EndsOut {
  const size = spec.size ?? clamp(pen.width * 3.2 + 4, 6, 18);
  const half = ((spec.angle ?? (spec.kind === 'open' ? 40 : 27)) * Math.PI) / 180;
  const back = angle + Math.PI;
  const b1 = at(tip, back - half, size * r.range(0.92, 1.06));
  const b2 = at(tip, back + half, size * r.range(0.92, 1.06));
  const shared = { layer: 0, jitterScale: 0.25, speedScale: 1.5 };
  switch (spec.kind) {
    case 'none':
      return { strokes: [], fills: [], t1: t0 };
    case 'chevron':
    case 'open': {
      // One motion: in along one barb to the tip and out along the other.
      const pts = [...flick(b1, tip, 0.06), ...flick(tip, b2, 0.06).slice(1)];
      const s = ink(pts, pen, r.fork('head'), {
        ...shared,
        t0,
        widthScale: 0.95,
        taper: {
          taperIn: 0.3,
          taperInLength: size * 0.5,
          taperOut: 0.25,
          taperOutLength: size * 0.5,
        },
      });
      return { strokes: s.strokes, fills: [], t1: s.t1 };
    }
    case 'harpoon': {
      // The pen doesn't lift: it flicks back from the tip along one side.
      const s = ink(flick(tip, b1, -0.08), pen, r.fork('head'), {
        ...shared,
        t0,
        taper: { taperIn: 0.9, taperInLength: 2, taperOut: 0.15, taperOutLength: size * 0.8 },
      });
      return { strokes: s.strokes, fills: [], t1: s.t1 };
    }
    case 'tick': {
      const p = angle + Math.PI / 2;
      const s = ink([at(tip, p, size * 0.55), at(tip, p, -size * 0.55)], pen, r.fork('head'), {
        ...shared,
        t0,
      });
      return { strokes: s.strokes, fills: [], t1: s.t1 };
    }
    case 'triangle': {
      const inner = at(tip, back, size * 0.7);
      return {
        strokes: [],
        fills: [{ d: toPolygonD([tip, b1, inner, b2]), t0, layer: 0 }],
        t1: t0 + 90,
      };
    }
    case 'dot':
      return {
        strokes: [],
        fills: [{ d: circleD(tip, Math.max(pen.width * 1.5, 2.4)), t0, layer: 0 }],
        t1: t0 + 90,
      };
  }
}

/**
 * The start mark. A ring or a hook is drawn before the line (returns its end
 * time as `t1`); a dot or tick lands with the pen.
 */
export function tail(
  start: Pt,
  angle: number,
  kind: TailKind,
  pen: Pen,
  r: Rng,
  side: 1 | -1
): EndsOut {
  switch (kind) {
    case 'none':
      return { strokes: [], fills: [], t1: 0 };
    case 'dot':
      return {
        strokes: [],
        fills: [{ d: circleD(start, pen.width * 1.3 + 0.7), t0: 0, layer: 0 }],
        t1: 0,
      };
    case 'tick': {
      const p = angle + Math.PI / 2;
      const len = pen.width * 2.5 + 4;
      const s = ink([at(start, p, len), at(start, p, -len)], pen, r.fork('tail'), {
        layer: 0,
        t0: 0,
        jitterScale: 0.2,
        speedScale: 1.4,
      });
      return { strokes: s.strokes, fills: [], t1: s.t1 * 0.6 };
    }
    case 'ring': {
      const rad = pen.width * 1.8 + 3.5;
      const c = at(start, angle + Math.PI, rad);
      const pts: Pt[] = [];
      const a0 = angle;
      for (let k = 0; k <= 48; k++) {
        const a = a0 + side * ((2 * Math.PI * 1.08 * k) / 48);
        const rr = rad * (1 + 0.06 * Math.sin(a * 2.3 + r.range(0, 6)));
        pts.push(at(c, a, rr));
      }
      const s = ink(pts, pen, r.fork('tail'), {
        layer: 0,
        t0: 0,
        jitterScale: 0.3,
        speedScale: 1.2,
      });
      return { strokes: s.strokes, fills: [], t1: s.t1 };
    }
    case 'hook': {
      // A small curl that arrives at the start already heading along the line.
      const rad = pen.width * 1.4 + 2.6;
      const u = dir(angle);
      const theta = Math.atan2(-u.x * side, u.y * side);
      const c = { x: start.x - rad * Math.cos(theta), y: start.y - rad * Math.sin(theta) };
      const pts: Pt[] = [];
      for (let k = 0; k <= 36; k++) {
        const a = theta - side * (1.6 * Math.PI) * (1 - k / 36);
        pts.push(at(c, a, rad));
      }
      const s = ink(pts, pen, r.fork('tail'), {
        layer: 0,
        t0: 0,
        jitterScale: 0.2,
        speedScale: 1.1,
        taper: { taperIn: 0.3, taperOut: 1 },
      });
      return { strokes: s.strokes, fills: [], t1: s.t1 };
    }
  }
}

/** Marks that follow the pen: each lands just after the pen passes its spot. */
export function marks(
  line: Pt[],
  timeAt: (s: number) => number,
  spec: MarksSpec,
  pen: Pen,
  r: Rng,
  side: 1 | -1,
  layer: number
): EndsOut {
  const m = measure(line);
  const L = m.length;
  const strokes: InkStroke[] = [];
  let t1 = 0;
  const markPen: Pen = { ...pen, passes: 1, pressure: pen.pressure * 0.5 };

  if (spec.ticks) {
    const count = spec.ticks.count ?? 5;
    const len = spec.ticks.length ?? 8;
    const rt = r.fork('ticks');
    const ss: number[] = [];
    for (let i = 0; i < count; i++) {
      const u =
        spec.ticks.spacing === 'even' ? (count === 1 ? 0.5 : i / (count - 1)) : rt.range(0, 1);
      ss.push(L * (0.15 + 0.7 * u));
    }
    ss.sort((a, b) => a - b);
    for (const q of ss) {
      const p = sampleAt(m, q);
      const a = p.angle + Math.PI / 2 + rt.range(-0.14, 0.14);
      const l = len * rt.range(0.85, 1.15);
      const s = ink([at(p, a, l / 2), at(p, a, -l / 2)], markPen, rt.fork(String(q)), {
        layer,
        t0: timeAt(q) + 20,
        widthScale: 0.55,
        jitterScale: 0.2,
        speedScale: 1.6,
      });
      strokes.push(...s.strokes);
      t1 = Math.max(t1, s.t1);
    }
  }

  if (spec.scribe) {
    const off = (spec.scribe.offset ?? 4) * side;
    const [on, gapLen] = spec.scribe.dash ?? [6, 4];
    const kap = curvatures(m.pts);
    for (let q = 0; q < L - 1; q += on + gapLen) {
      const dash: Pt[] = [];
      let cusp = false;
      for (let u = q; u <= Math.min(q + on, L); u += 1) {
        const p = sampleAt(m, u);
        const idx = Math.min(m.pts.length - 1, Math.round((u / L) * (m.pts.length - 1)));
        // An offset curve folds over itself where the line turns tighter than
        // the offset; leave those dashes out.
        if (kap[idx] * Math.abs(off) > 0.6) cusp = true;
        const nx = Math.sin(p.angle);
        const ny = -Math.cos(p.angle);
        dash.push({ x: p.x + nx * off, y: p.y + ny * off });
      }
      if (cusp || dash.length < 2) continue;
      const s = ink(dash, markPen, r.fork(`scribe${q}`), {
        layer,
        t0: timeAt(q) + 40,
        widthScale: (spec.scribe.width ?? 0.5) / pen.width,
        jitterScale: 0.1,
        speedScale: 1.2,
        taper: { taperIn: 0.8, taperOut: 0.8 },
      });
      strokes.push(...s.strokes);
      t1 = Math.max(t1, s.t1);
    }
  }

  if (spec.dimension) {
    const len = spec.dimension.length ?? 12;
    for (const [q, p] of [
      [0, sampleAt(m, 0)],
      [L, sampleAt(m, L)],
    ] as const) {
      const a = p.angle + Math.PI / 2;
      const s = ink([at(p, a, len / 2), at(p, a, -len / 2)], markPen, r.fork(`dim${q}`), {
        layer,
        t0: timeAt(q) + 30,
        widthScale: 0.6,
        jitterScale: 0.15,
        speedScale: 1.5,
      });
      strokes.push(...s.strokes);
      t1 = Math.max(t1, s.t1);
    }
  }
  return { strokes, fills: [], t1 };
}

/**
 * The ring a hand draws around the thing it's pointing at: starts where the
 * arrow arrived, goes round once and a little more, and doesn't quite close.
 */
export function ringAround(shape: Shape, from: Pt, pen: Pen, r: Rng, t0: number, pad = 6): EndsOut {
  const c = shapeCenter(shape);
  const rx = shape.kind === 'circle' ? shape.r + pad : shape.w / 2 + pad * 1.6;
  const ry = shape.kind === 'circle' ? shape.r + pad : shape.h / 2 + pad;
  const tilt = r.range(-0.08, 0.08);
  const a0 = Math.atan2(from.y - c.y, from.x - c.x);
  const wob = r.noise('ring');
  const pts: Pt[] = [];
  const turns = 1.14;
  const N = 96;
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    const a = a0 + 2 * Math.PI * turns * u;
    const grow = 1 + 0.07 * u + 0.04 * wob(u * 5);
    const x = Math.cos(a) * rx * grow;
    const y = Math.sin(a) * ry * grow;
    pts.push({
      x: c.x + x * Math.cos(tilt) - y * Math.sin(tilt),
      y: c.y + x * Math.sin(tilt) + y * Math.cos(tilt),
    });
  }
  const s = ink(pts, pen, r.fork('ring'), { layer: 0, t0, jitterScale: 0.5, speedScale: 1.35 });
  return { strokes: s.strokes, fills: [], t1: s.t1 };
}
