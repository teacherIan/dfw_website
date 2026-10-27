/**
 * Geometry for hand-drawn lines: points, SVG path flattening, arc length,
 * trimming to a shape.
 *
 * Everything downstream works on dense polylines (a point every ~1.5 px), so an
 * authored path, a generated loop and a straight line all measure, sample and
 * trim the same way — the reason hash marks used to work only on one-bend arrows.
 */

export interface Pt {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A region a line starts or ends at, in the same space as the line. */
export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { kind: 'circle'; cx: number; cy: number; r: number };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
};

// --- SVG path → polylines --------------------------------------------------

const TOKEN = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/**
 * Flattens an SVG path's `d` into polylines, one per subpath, sampled about
 * every `step` units. Supports every path command, relative and absolute.
 */
export function flattenPath(d: string, step = 1.5): Pt[][] {
  const tok = d.match(TOKEN) ?? [];
  const out: Pt[][] = [];
  let cur: Pt[] = [];
  let i = 0;
  let cmd = '';
  let prev = '';
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cx = 0; // last control point, for S and T
  let cy = 0;
  const isCmd = (t: string) => /^[a-z]$/i.test(t);
  const num = () => parseFloat(tok[i++]);
  const close = () => {
    if (cur.length > 1) out.push(cur);
    cur = [];
  };

  while (i < tok.length) {
    if (isCmd(tok[i])) cmd = tok[i++];
    else if (!cmd) {
      i++;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (C) {
      case 'M': {
        close();
        x = sx = num() + ox;
        y = sy = num() + oy;
        cur = [{ x, y }];
        cmd = rel ? 'l' : 'L'; // implicit pairs after M are lines
        cx = x;
        cy = y;
        prev = 'M';
        continue;
      }
      case 'L':
      case 'H':
      case 'V': {
        const nx = C === 'V' ? x : num() + ox;
        const ny = C === 'H' ? y : num() + oy;
        line(cur, { x, y }, { x: nx, y: ny }, step);
        x = cx = nx;
        y = cy = ny;
        break;
      }
      case 'C':
      case 'S': {
        let x1: number;
        let y1: number;
        if (C === 'C') {
          x1 = num() + ox;
          y1 = num() + oy;
        } else {
          const refl = prev === 'C' || prev === 'S';
          x1 = refl ? 2 * x - cx : x;
          y1 = refl ? 2 * y - cy : y;
        }
        const x2 = num() + ox;
        const y2 = num() + oy;
        const nx = num() + ox;
        const ny = num() + oy;
        cubic(cur, { x, y }, { x: x1, y: y1 }, { x: x2, y: y2 }, { x: nx, y: ny }, step);
        cx = x2;
        cy = y2;
        x = nx;
        y = ny;
        break;
      }
      case 'Q':
      case 'T': {
        let x1: number;
        let y1: number;
        if (C === 'Q') {
          x1 = num() + ox;
          y1 = num() + oy;
        } else {
          const refl = prev === 'Q' || prev === 'T';
          x1 = refl ? 2 * x - cx : x;
          y1 = refl ? 2 * y - cy : y;
        }
        const nx = num() + ox;
        const ny = num() + oy;
        // A quadratic is a cubic with its controls 2/3 of the way to the one control.
        cubic(
          cur,
          { x, y },
          { x: x + (2 / 3) * (x1 - x), y: y + (2 / 3) * (y1 - y) },
          { x: nx + (2 / 3) * (x1 - nx), y: ny + (2 / 3) * (y1 - ny) },
          { x: nx, y: ny },
          step
        );
        cx = x1;
        cy = y1;
        x = nx;
        y = ny;
        break;
      }
      case 'A': {
        const rx = num();
        const ry = num();
        const rot = num();
        const large = num();
        const sweep = num();
        const nx = num() + ox;
        const ny = num() + oy;
        arc(cur, { x, y }, rx, ry, rot, !!large, !!sweep, { x: nx, y: ny }, step);
        x = cx = nx;
        y = cy = ny;
        break;
      }
      case 'Z': {
        line(cur, { x, y }, { x: sx, y: sy }, step);
        x = cx = sx;
        y = cy = sy;
        close();
        cur = [{ x, y }];
        break;
      }
      default:
        i++;
    }
    prev = C;
  }
  close();
  return out;
}

function line(out: Pt[], a: Pt, b: Pt, step: number) {
  const n = Math.max(1, Math.ceil(dist(a, b) / step));
  for (let k = 1; k <= n; k++) out.push({ x: lerp(a.x, b.x, k / n), y: lerp(a.y, b.y, k / n) });
}

export function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const m = 1 - t;
  const a = m * m * m;
  const b = 3 * m * m * t;
  const c = 3 * m * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

function cubic(out: Pt[], p0: Pt, p1: Pt, p2: Pt, p3: Pt, step: number) {
  const hull = dist(p0, p1) + dist(p1, p2) + dist(p2, p3);
  const n = clamp(Math.ceil(hull / step), 2, 600);
  for (let k = 1; k <= n; k++) out.push(cubicAt(p0, p1, p2, p3, k / n));
}

/** SVG elliptical arc, endpoint form → sampled points (SVG 1.1 F.6.5). */
function arc(
  out: Pt[],
  p0: Pt,
  rx: number,
  ry: number,
  rotDeg: number,
  large: boolean,
  sweep: boolean,
  p1: Pt,
  step: number
) {
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (!rx || !ry) return line(out, p0, p1, step);
  const phi = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0.x - p1.x) / 2;
  const dy = (p0.y - p1.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1) / ry;
  const cyp = (-co * ry * x1) / rx;
  const ccx = cos * cxp - sin * cyp + (p0.x + p1.x) / 2;
  const ccy = sin * cxp + cos * cyp + (p0.y + p1.y) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const t1 = ang(1, 0, (x1 - cxp) / rx, (y1 - cyp) / ry);
  let dt = ang((x1 - cxp) / rx, (y1 - cyp) / ry, (-x1 - cxp) / rx, (-y1 - cyp) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = clamp(Math.ceil((Math.abs(dt) * Math.max(rx, ry)) / step), 2, 600);
  for (let k = 1; k <= n; k++) {
    const t = t1 + (dt * k) / n;
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    out.push({ x: cos * ex - sin * ey + ccx, y: sin * ex + cos * ey + ccy });
  }
}

// --- Arc length ---------------------------------------------------------------

export interface Measured {
  pts: Pt[];
  /** cum[i] = length along the polyline to pts[i]. */
  cum: number[];
  length: number;
}

export function measure(pts: Pt[]): Measured {
  const cum = new Array<number>(pts.length);
  let s = 0;
  cum[0] = 0;
  for (let i = 1; i < pts.length; i++) {
    s += dist(pts[i - 1], pts[i]);
    cum[i] = s;
  }
  return { pts, cum, length: s };
}

/** Index of the segment containing arc length `s` (pts[i] → pts[i+1]). */
function segAt(m: Measured, s: number): number {
  let lo = 0;
  let hi = m.pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (m.cum[mid] <= s) lo = mid;
    else hi = mid;
  }
  return lo;
}

export interface Sample extends Pt {
  /** Direction of travel, radians. */
  angle: number;
}

export function sampleAt(m: Measured, s: number): Sample {
  const n = m.pts.length;
  if (n === 1) return { ...m.pts[0], angle: 0 };
  s = clamp(s, 0, m.length);
  const i = Math.min(segAt(m, s), n - 2);
  const a = m.pts[i];
  const b = m.pts[i + 1];
  const seg = m.cum[i + 1] - m.cum[i] || 1;
  const t = (s - m.cum[i]) / seg;
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

/** Points every `spacing` along the line, always including both ends exactly. */
export function resample(m: Measured, spacing: number): Pt[] {
  if (m.length === 0) return [m.pts[0]];
  const n = Math.max(1, Math.round(m.length / spacing));
  const out: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const p = sampleAt(m, (m.length * k) / n);
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

/** Average direction over the last `span` units — steadier than one segment. */
export function endAngle(m: Measured, span = 6): number {
  const a = sampleAt(m, Math.max(0, m.length - span));
  const b = m.pts[m.pts.length - 1];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function startAngle(m: Measured, span = 6): number {
  const a = m.pts[0];
  const b = sampleAt(m, Math.min(m.length, span));
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Curvature (1/radius) at each point of an evenly sampled polyline, smoothed
 * over `window` points either side so one jittered vertex doesn't spike it.
 */
export function curvatures(pts: Pt[], window = 3): number[] {
  const n = pts.length;
  const raw = new Array<number>(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const a1 = Math.atan2(b.y - a.y, b.x - a.x);
    const a2 = Math.atan2(c.y - b.y, c.x - b.x);
    let da = a2 - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const ds = (dist(a, b) + dist(b, c)) / 2 || 1;
    raw[i] = Math.abs(da) / ds;
  }
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = 0;
    let c = 0;
    for (let j = Math.max(0, i - window); j <= Math.min(n - 1, i + window); j++) {
      s += raw[j];
      c++;
    }
    out[i] = s / c;
  }
  return out;
}

// --- Shapes and trimming ----------------------------------------------------------

/** Signed distance from p to the shape grown by `gap` (negative = inside). */
export function shapeDistance(p: Pt, shape: Shape, gap = 0): number {
  if (shape.kind === 'circle') return Math.hypot(p.x - shape.cx, p.y - shape.cy) - (shape.r + gap);
  const hx = shape.w / 2 + gap;
  const hy = shape.h / 2 + gap;
  const r = Math.min((shape.r ?? 0) + gap, hx, hy);
  const qx = Math.abs(p.x - (shape.x + shape.w / 2)) - (hx - r);
  const qy = Math.abs(p.y - (shape.y + shape.h / 2)) - (hy - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

export const shapeCenter = (s: Shape): Pt =>
  s.kind === 'circle' ? { x: s.cx, y: s.cy } : { x: s.x + s.w / 2, y: s.y + s.h / 2 };

function boundary(out: Pt, inn: Pt, shape: Shape, gap: number): Pt {
  let a = out;
  let b = inn;
  for (let k = 0; k < 24; k++) {
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (shapeDistance(m, shape, gap) < 0) b = m;
    else a = m;
  }
  return a;
}

/**
 * Cuts the end of a line where it last enters `shape` (grown by `gap`), so an
 * arrow aimed at a target's centre stops at its edge. A line that never leaves
 * the shape, or never enters it, comes back unchanged.
 */
export function trimEnd(pts: Pt[], shape: Shape, gap = 0): Pt[] {
  const n = pts.length;
  if (n < 2 || shapeDistance(pts[n - 1], shape, gap) >= 0) return pts;
  let j = n - 1;
  while (j >= 0 && shapeDistance(pts[j], shape, gap) < 0) j--;
  if (j < 0) return pts;
  return [...pts.slice(0, j + 1), boundary(pts[j], pts[j + 1], shape, gap)];
}

/** trimEnd's mirror: starts the line where it first leaves `shape`. */
export function trimStart(pts: Pt[], shape: Shape, gap = 0): Pt[] {
  return trimEnd([...pts].reverse(), shape, gap).reverse();
}

export function bounds(polys: Pt[][], pad = 0): Rect {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const poly of polys)
    for (const p of poly) {
      if (p.x < x0) x0 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.x > x1) x1 = p.x;
      if (p.y > y1) y1 = p.y;
    }
  if (x0 === Infinity) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
}

const f = (n: number) => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};

/** Polyline → `d`. */
export function toPathD(pts: Pt[]): string {
  if (!pts.length) return '';
  let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) d += `L${f(pts[i].x)} ${f(pts[i].y)}`;
  return d;
}

/** Closed polygon → `d`. */
export const toPolygonD = (pts: Pt[]) => (pts.length ? toPathD(pts) + 'Z' : '');
