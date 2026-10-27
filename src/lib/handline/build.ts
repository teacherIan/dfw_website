/**
 * buildLine / buildArt: a description of a line in, a Drawing out.
 *
 * Pure — no DOM, no clock. The same input gives the same Drawing everywhere,
 * so it can be unit-tested, prerendered, or rendered to a string.
 */
import {
  bounds,
  endAngle,
  flattenPath,
  measure,
  resample,
  startAngle,
  type Pt,
  type Rect,
  type Sample,
  type Shape,
} from './geom';
import { DEFAULT_REACH, fitLine, type Reach, type Side, type SideInput } from './fit';
import type { GestureName, GestureSpec } from './gestures';
import { ink, resolvePen, type InkStroke, type PenInput } from './pen';
import {
  head as drawHead,
  marks as drawMarks,
  headDepth,
  resolveHead,
  ringAround,
  tail as drawTail,
  type HeadKind,
  type HeadSpec,
  type InkFill,
  type MarksSpec,
  type TailKind,
} from './ends';
import { rng } from './random';

export interface Timing {
  /** Shortest and longest the line itself may take to draw, ms. */
  min?: number;
  max?: number;
  /** Pause between the line arriving and the head, ms. */
  pause?: number;
}

/** What a line looks like — everything but where it goes. */
export interface LineStyle {
  pen?: PenInput;
  head?: HeadKind | HeadSpec;
  tail?: TailKind;
  marks?: MarksSpec;
  timing?: Timing;
  /** Same seed, same line. Give each line its own (its name is fine). */
  seed?: string | number;
}

export interface LineInput extends LineStyle {
  from: Pt;
  to: Pt;
  gesture?: GestureSpec | GestureName;
  side?: SideInput;
  bow?: number;
  fromShape?: Shape;
  toShape?: Shape;
  /**
   * How far into the target the tip goes, px from its edge along the line:
   * negative stops short, positive goes past the edge, 'center' reaches the
   * aim point. Default −6. A reach that would leave an arrowhead straddling
   * the border snaps to 2 px short or to fully inside.
   */
  reach?: Reach;
  within?: Rect;
  avoid?: Shape[];
  nudge?: Pt;
  /** After arriving, the pen rings this shape — or `toShape` when true. */
  ring?: boolean | Shape;
}

export interface ArtInput extends LineStyle {
  /** An authored path, drawn in its own coordinates (e.g. a 70 × 50 viewBox). */
  d: string;
}

export interface Layer {
  opacity: number;
}

export interface Drawing {
  strokes: InkStroke[];
  fills: InkFill[];
  layers: Layer[];
  /** Everything the ink covers, padded for the widest stroke. */
  bbox: Rect;
  /** ms from the first touch to the last lift. */
  duration: number;
  grain: number;
  seed: number;
  start: Pt;
  end: Sample;
  /** The fitted centreline before the pen — for overlays and debugging. */
  centerline: Pt[];
  /** Where the line was aimed (before trimming) — for overlays. */
  aim?: Pt;
}

/** Keeps an arrowhead clear of the border: fully short of it or fully inside. */
function snapReach(reach: Reach, head: HeadSpec, pen: ReturnType<typeof resolvePen>): Reach {
  if (reach === 'center') return reach;
  const depth = headDepth(head, pen);
  if (!depth) return reach;
  const lo = -2;
  const hi = depth + 3;
  if (reach <= lo || reach >= hi) return reach;
  return reach - lo < hi - reach ? lo : hi;
}

export function buildLine(input: LineInput): Drawing {
  const r = rng(input.seed ?? 'handline');
  const reach = snapReach(
    input.reach ?? DEFAULT_REACH,
    resolveHead(input.head),
    resolvePen(input.pen)
  );
  const fitted = fitLine({ ...input, reach }, r);
  let ring: Shape | undefined;
  if (input.ring === true) ring = input.toShape;
  else if (input.ring) ring = input.ring;
  return { ...inkDrawing(fitted.pts, input, r, fitted.side, ring), aim: input.to };
}

export function buildArt(input: ArtInput): Drawing {
  const r = rng(input.seed ?? input.d);
  const poly = flattenPath(input.d, 0.5)[0] ?? [];
  const pts = poly.length > 1 ? resample(measure(poly), 1.5) : poly;
  return inkDrawing(pts, input, r, 1);
}

const EMPTY_PEN_OPACITY = 1;

/** A drawing with nothing in it: an empty or M-only path, or a point. */
function emptyDrawing(at: Pt, seed: number): Drawing {
  return {
    strokes: [],
    fills: [],
    layers: [{ opacity: EMPTY_PEN_OPACITY }],
    bbox: { x: at.x, y: at.y, w: 0, h: 0 },
    duration: 0,
    grain: 0,
    seed,
    start: at,
    end: { ...at, angle: 0 },
    centerline: [at],
  };
}

function inkDrawing(
  pts: Pt[],
  style: LineStyle,
  r: ReturnType<typeof rng>,
  side: Side,
  ring?: Shape
): Drawing {
  if (pts.length < 2) return emptyDrawing(pts[0] ?? { x: 0, y: 0 }, r.seed);
  const pen = resolvePen(style.pen);
  const timing = style.timing ?? {};
  const m = measure(pts);
  const start = pts[0];
  const a0 = startAngle(m);
  const a1 = endAngle(m);
  const endPt = pts[pts.length - 1];

  const t = drawTail(start, a0, style.tail ?? 'none', pen, r.fork('tail'), side);
  const line = ink(pts, pen, r.fork('line'), {
    layer: 0,
    t0: t.t1,
    duration: [timing.min ?? 260, timing.max ?? 1500],
  });

  const strokes: InkStroke[] = [...t.strokes, ...line.strokes];
  const fills: InkFill[] = [...t.fills];
  const layers: Layer[] = [{ opacity: pen.opacity }];

  // Extra passes: thinner, fainter, wandering on their own seed, a beat behind.
  let passEnd = 0;
  for (let p = 1; p < Math.round(pen.passes); p++) {
    layers.push({ opacity: pen.opacity * 0.42 });
    const extra = ink(pts, { ...pen, jitter: pen.jitter * 1.7 + 0.25 }, r.fork(`pass${p}`), {
      layer: p,
      t0: t.t1 + 35 * p,
      widthScale: 0.55,
      duration: [line.t1 - t.t1, line.t1 - t.t1],
    });
    strokes.push(...extra.strokes);
    passEnd = Math.max(passEnd, extra.t1);
  }

  let t1 = Math.max(line.t1, passEnd);
  const headSpec = resolveHead(style.head);
  if (headSpec.kind !== 'none') {
    const h = drawHead(endPt, a1, headSpec, pen, r.fork('head'), line.t1 + (timing.pause ?? 30));
    strokes.push(...h.strokes);
    fills.push(...h.fills);
    t1 = Math.max(t1, h.t1);
  }

  if (style.marks) {
    const layer = layers.length;
    layers.push({ opacity: pen.opacity * 0.7 });
    const mk = drawMarks(pts, line.timeAt, style.marks, pen, r.fork('marks'), side, layer);
    strokes.push(...mk.strokes);
    t1 = Math.max(t1, mk.t1);
  }

  if (ring) {
    const rg = ringAround(ring, endPt, pen, r.fork('ring'), t1 + 90);
    strokes.push(...rg.strokes);
    t1 = Math.max(t1, rg.t1);
  }

  const all: Pt[][] = [pts];
  for (const s of strokes) all.push(dPoints(s.d));
  for (const f of fills) all.push(dPoints(f.d));
  const widest = strokes.reduce((w, s) => Math.max(w, s.w), pen.width);

  return {
    strokes,
    fills,
    layers,
    bbox: bounds(all, widest + 3),
    duration: t1,
    grain: pen.grain,
    seed: r.seed,
    start,
    end: { ...endPt, angle: a1 },
    centerline: pts,
  };
}

/** The coordinates in a path we wrote ourselves (M/L/a with plain numbers). */
function dPoints(d: string): Pt[] {
  const nums = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const out: Pt[] = [];
  if (d.includes('a')) {
    // circleD: M(cx−r) cy a r r 0 1 0 2r 0 …
    const [x, y, rad] = nums;
    out.push({ x, y: y - rad }, { x: x + 2 * rad, y: y + rad });
    return out;
  }
  for (let i = 0; i + 1 < nums.length; i += 2) out.push({ x: nums[i], y: nums[i + 1] });
  return out;
}
