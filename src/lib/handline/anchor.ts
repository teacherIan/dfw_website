/**
 * Anchors: where a line starts or ends, given as an element, a React ref, or a
 * point, resolved to a point (and a shape to trim to) in a layer's coordinates.
 */
import type { Pt, Rect, Shape } from './geom';

export type AnchorTarget = Element | { readonly current: Element | null } | Pt;

export interface AnchorSpec {
  target: AnchorTarget;
  /**
   * A point on the element's box as fractions ([1, 0.5] = middle of the right
   * edge). Omitted, the line aims at the centre and is trimmed at the edge.
   */
  at?: [number, number];
  /** px added after `at`. */
  offset?: [number, number];
  /**
   * What the anchor trims to. 'auto' reads the element's border-radius, so a
   * round button trims as a circle. Default 'auto', except a start with an
   * `at` point, which begins exactly there ('none').
   */
  shape?: 'auto' | 'rect' | 'circle' | 'none';
  /** A point target's coordinates: the layer's (default) or the viewport's. */
  space?: 'layer' | 'viewport';
  /** A point target trims as a circle this size, px — a button known only by its centre. */
  radius?: number;
}

export type AnchorInput = AnchorTarget | AnchorSpec;

export interface Resolved {
  point: Pt;
  shape?: Shape;
  rect?: Rect;
}

const isSpec = (a: AnchorInput): a is AnchorSpec =>
  typeof a === 'object' && a !== null && 'target' in a && !(a instanceof Element);

function elementOf(t: AnchorTarget): Element | null {
  if (typeof Element !== 'undefined' && t instanceof Element) return t;
  if (typeof t === 'object' && t !== null && 'current' in t) return t.current;
  return null;
}

/** A ref whose element isn't attached yet: nothing will say when it is. */
export function anchorMissing(a: AnchorInput): boolean {
  const t = isSpec(a) ? a.target : a;
  return typeof t === 'object' && t !== null && 'current' in t && !t.current;
}

/** The element an anchor follows, if any — for observing its size. */
export function anchorElement(a: AnchorInput): Element | null {
  return elementOf(isSpec(a) ? a.target : a);
}

const radiusCache = new WeakMap<Element, string>();

function radiusOf(el: Element, w: number, h: number): number {
  let raw = radiusCache.get(el);
  if (raw === undefined) {
    raw = typeof getComputedStyle === 'function' ? getComputedStyle(el).borderTopLeftRadius : '0';
    radiusCache.set(el, raw);
  }
  const v = parseFloat(raw) || 0;
  return raw.endsWith('%') ? (v / 100) * Math.min(w, h) : v;
}

/**
 * The layer's box on screen, and its scale: on-screen px per layer px. The
 * scale is 1 unless an ancestor is zoomed or transformed (CSS `zoom`,
 * `transform: scale()`); screen measurements are divided by it, so lines land
 * where they should inside a scaled container.
 */
export interface Origin {
  left: number;
  top: number;
  scale?: number;
}

/**
 * `role` is which end this is. With an `at` point, a start begins exactly
 * there (no trim); an end aims there and still trims to its element.
 */
export function resolveAnchor(
  a: AnchorInput,
  origin: Origin,
  role: 'from' | 'to' = 'from'
): Resolved | null {
  const k = origin.scale || 1;
  const spec: AnchorSpec = isSpec(a) ? a : { target: a };
  const el = elementOf(spec.target);
  const [ox, oy] = spec.offset ?? [0, 0];
  if (!el) {
    const t = spec.target as Pt;
    if (typeof t?.x !== 'number') return null;
    // Viewport points are screen px; layer points are already layer px.
    const point =
      spec.space === 'viewport'
        ? { x: (t.x - origin.left) / k + ox, y: (t.y - origin.top) / k + oy }
        : { x: t.x + ox, y: t.y + oy };
    return spec.radius
      ? { point, shape: { kind: 'circle', cx: point.x, cy: point.y, r: spec.radius } }
      : { point };
  }
  const b = el.getBoundingClientRect();
  if (b.width === 0 && b.height === 0) return null;
  const rect = {
    x: (b.left - origin.left) / k,
    y: (b.top - origin.top) / k,
    w: b.width / k,
    h: b.height / k,
  };
  const point = spec.at
    ? { x: rect.x + rect.w * spec.at[0] + ox, y: rect.y + rect.h * spec.at[1] + oy }
    : { x: rect.x + rect.w / 2 + ox, y: rect.y + rect.h / 2 + oy };
  const kind = spec.shape ?? (spec.at && role === 'from' ? 'none' : 'auto');
  if (kind === 'none') return { point, rect };
  const r = radiusOf(el, rect.w, rect.h);
  // A full radius on a square box is a circle; on anything else (a pill, an
  // oval) it's a rect with its corners fully rounded, which shapeDistance
  // already handles — a circle would cut the line inside a wide button.
  const square = Math.abs(rect.w - rect.h) <= 2;
  const round =
    kind === 'circle' || (kind === 'auto' && square && r >= Math.min(rect.w, rect.h) / 2 - 1);
  return {
    point,
    rect,
    shape: shapeFor(round ? 'circle' : 'rect', rect, Math.min(r, rect.w / 2, rect.h / 2)),
  };
}

function shapeFor(kind: 'rect' | 'circle', r: Rect, radius: number): Shape {
  return kind === 'circle'
    ? { kind: 'circle', cx: r.x + r.w / 2, cy: r.y + r.h / 2, r: Math.min(r.w, r.h) / 2 }
    : { kind: 'rect', x: r.x, y: r.y, w: r.w, h: r.h, r: radius };
}
