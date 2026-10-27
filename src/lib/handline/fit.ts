/**
 * Fitting: turns a gesture's chord frame to run from one point to another,
 * picks which side it bulges to, and trims its ends to the shapes it joins.
 */
import {
  measure,
  sampleAt,
  shapeDistance,
  trimEnd,
  trimStart,
  dist,
  type Pt,
  type Rect,
  type Shape,
} from './geom';
import { gesturePoints, type GestureName, type GestureSpec } from './gestures';
import type { Rng } from './random';

/** +1 bulges to the left of travel, −1 to the right. */
export type Side = 1 | -1;

export interface FitInput {
  from: Pt;
  to: Pt;
  gesture?: GestureSpec | GestureName;
  /** 'auto' tries both and keeps the one that stays in bounds and off obstacles. */
  side?: Side | 'auto';
  bow?: number;
  /** Where the line may go (for side: 'auto'), e.g. the layer's own box. */
  within?: Rect;
  /** Things the line should not cross (for side: 'auto'): labels, buttons. */
  avoid?: Shape[];
  /** Trims the start to where the line leaves this shape. */
  fromShape?: Shape;
  /** Trims the end to where the line enters this shape. */
  toShape?: Shape;
  /** Space between a trimmed end and its shape, px. */
  gap?: number;
  /**
   * A live push on the line's middle, px (0 at the ends, full at the middle) —
   * for a line that sways with a drag without moving its ends.
   */
  nudge?: Pt;
}

export interface Fitted {
  pts: Pt[];
  side: Side;
}

function place(chord: Pt[], from: Pt, to: Pt, side: Side, nudge?: Pt): Pt[] {
  const L = dist(from, to) || 1;
  const ux = (to.x - from.x) / L;
  const uy = (to.y - from.y) / L;
  // Left of travel in screen space (y down) is (uy, −ux).
  const nx = side * uy;
  const ny = side * -ux;
  return chord.map((p) => {
    const t = p.x / L;
    const w = nudge ? 4 * t * (1 - t) : 0;
    return {
      x: from.x + ux * p.x + nx * p.y + (nudge ? nudge.x * w : 0),
      y: from.y + uy * p.x + ny * p.y + (nudge ? nudge.y * w : 0),
    };
  });
}

/** How badly a candidate line behaves: px outside `within` + px over obstacles. */
function cost(pts: Pt[], within?: Rect, avoid: Shape[] = []): number {
  let c = 0;
  for (let i = 0; i < pts.length; i += 2) {
    const p = pts[i];
    if (within) {
      const ox = Math.max(within.x - p.x, 0, p.x - (within.x + within.w));
      const oy = Math.max(within.y - p.y, 0, p.y - (within.y + within.h));
      c += (ox + oy) * 3;
    }
    for (const s of avoid) if (shapeDistance(p, s, 2) < 0) c += 4;
  }
  return c;
}

function trim(pts: Pt[], input: FitInput): Pt[] {
  const gap = input.gap ?? 6;
  let out = pts;
  if (input.fromShape) out = trimStart(out, input.fromShape, gap);
  if (input.toShape) out = trimEnd(out, input.toShape, gap);
  return out.length >= 2 ? out : pts;
}

export function fitLine(input: FitInput, r: Rng): Fitted {
  const L = dist(input.from, input.to);
  const chord = gesturePoints(input.gesture, L, r.fork('gesture'), { bow: input.bow });
  const build = (side: Side) => trim(place(chord, input.from, input.to, side, input.nudge), input);

  if (input.side !== 'auto') {
    const side = input.side ?? 1;
    return { pts: build(side), side };
  }
  const left = build(1);
  const right = build(-1);
  // The start and end shapes themselves don't count as obstacles: the line
  // has to touch them.
  const avoid = input.avoid ?? [];
  const cl = cost(left, input.within, avoid);
  const cr = cost(right, input.within, avoid);
  if (Math.abs(cl - cr) > 1) return cl < cr ? { pts: left, side: 1 } : { pts: right, side: -1 };
  // A tie: bulge upward on screen, the way most hand-drawn arrows arc.
  const ml = sampleAt(measure(left), measure(left).length / 2);
  const mr = sampleAt(measure(right), measure(right).length / 2);
  return ml.y <= mr.y ? { pts: left, side: 1 } : { pts: right, side: -1 };
}
