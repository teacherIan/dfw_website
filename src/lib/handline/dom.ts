/**
 * InkView: puts a Drawing on the page as SVG and draws it on.
 *
 * Each stroke reveals with its own dash offset over its own window, driven by
 * one shared frame loop (clock.ts) that touches only the strokes whose state
 * changed — no framer-motion, no per-stroke Web Animation. The pen's speed
 * lives in the strokes' timing, not an easing curve.
 *
 * The view keeps one position on the drawing's timeline and moves it forward
 * (play) or back (undraw) from wherever it is, so reversing mid-draw, or new
 * geometry arriving mid-draw or mid-undraw, carries on from the same moment.
 *
 * Under prefers-reduced-motion a line is simply there, drawn.
 */
import type { Drawing } from './build';
import { onFrame } from './clock';
import { rng } from './random';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

export type Motion = 'auto' | 'always' | 'never';
export type ViewState = 'hidden' | 'drawing' | 'drawn' | 'undrawing';

export interface ViewOptions {
  /**
   * 'absolute': the view makes its own <svg>, sized and placed at the
   * drawing's box inside `host` (which is the coordinate origin).
   * 'inline': `host` is an <svg> with its own viewBox; the view draws into it.
   */
  mode: 'absolute' | 'inline';
  color?: string;
  className?: string;
  motion?: Motion;
}

export interface PlayOptions {
  delay?: number;
  /**
   * Where on the drawing's timeline to start, ms. Default: from the start —
   * or, while undrawing, from wherever the undraw has got to.
   */
  from?: number;
  /** Undraw only: speed relative to drawing (default 1.6× faster). */
  speed?: number;
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const el = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {}
) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
};

const FILL_FADE = 120;

/** The view's motion: a position on the timeline, moving at `rate` after `startAt`. */
interface Travel {
  pos: number;
  rate: number;
  startAt: number;
}

export class InkView {
  readonly svg: SVGSVGElement;
  state: ViewState = 'hidden';
  private root: SVGGElement;
  private drawing: Drawing;
  private paths: SVGPathElement[] = [];
  private fills: SVGPathElement[] = [];
  /** Last progress written per stroke, then per fill: −1 unknown, 0 hidden, 1 drawn. */
  private shown = new Float32Array(0);
  private stop: (() => void) | null = null;
  /** The pending play/undraw promise: resolves true when it reached its end. */
  private resolve: ((finished: boolean) => void) | null = null;
  private travel: Travel = { pos: 0, rate: 0, startAt: 0 };
  private readonly id = ++uid;
  private opts: ViewOptions;

  constructor(host: Element, drawing: Drawing, opts: ViewOptions) {
    this.opts = { ...opts };
    this.drawing = drawing;
    if (opts.mode === 'inline') {
      this.svg = host as SVGSVGElement;
    } else {
      this.svg = el('svg');
      const s = this.svg.style;
      s.position = 'absolute';
      s.overflow = 'visible';
      s.pointerEvents = 'none';
      this.svg.setAttribute('aria-hidden', 'true');
      if (opts.className) this.svg.setAttribute('class', opts.className);
      host.appendChild(this.svg);
    }
    this.root = el('g');
    this.svg.appendChild(this.root);
    this.svg.style.visibility = 'hidden';
    this.render();
  }

  get duration() {
    return this.drawing.duration;
  }

  private get end() {
    return this.drawing.duration + (this.drawing.fills.length ? FILL_FADE : 0);
  }

  /** Where the pen is on the drawing's timeline, ms. */
  position(now = performance.now()): number {
    if (this.state === 'drawn') return this.end;
    if (this.state === 'hidden') return 0;
    const m = this.travel;
    return Math.min(this.end, Math.max(0, m.pos + m.rate * Math.max(0, now - m.startAt)));
  }

  /** Colour, class or motion changed: a colour or class re-renders in place. */
  configure(next: Partial<Omit<ViewOptions, 'mode'>>, rerender = true) {
    const recolor = next.color !== this.opts.color || next.className !== this.opts.className;
    this.opts = { ...this.opts, ...next, mode: this.opts.mode };
    if (!recolor) return;
    if (this.opts.mode === 'absolute') {
      if (this.opts.className) this.svg.setAttribute('class', this.opts.className);
      else this.svg.removeAttribute('class');
    }
    if (rerender) this.setDrawing(this.drawing);
  }

  /** Replace the geometry. The line carries on from the same moment, in the same direction. */
  setDrawing(d: Drawing) {
    const now = performance.now();
    const prev = this.state;
    const pos = this.position(now);
    const delayLeft = Math.max(0, this.travel.startAt - now);
    const resolve = this.resolve;
    this.resolve = null; // the pending promise carries over to the resumed motion
    this.halt();
    this.drawing = d;
    this.render();
    if (prev === 'drawing') {
      this.move(Math.min(pos, this.end), 1, delayLeft, resolve);
    } else if (prev === 'undrawing') {
      this.move(Math.min(pos, this.end), -this.undrawRate, delayLeft, resolve);
    } else {
      this.state = prev;
      this.paint(prev === 'drawn' ? this.end : 0);
      this.svg.style.visibility = prev === 'drawn' ? 'visible' : 'hidden';
      resolve?.(true);
    }
  }

  play(o: PlayOptions = {}): Promise<boolean> {
    if (this.still()) {
      this.showDrawn();
      return Promise.resolve(true);
    }
    const from = o.from ?? (this.state === 'undrawing' ? this.position() : 0);
    this.halt();
    this.settle(false); // a superseded play or undraw didn't reach its end
    return new Promise<boolean>((resolve) => this.move(from, 1, o.delay ?? 0, resolve));
  }

  /** Draws the line out again from wherever it has got to, last stroke first. */
  undraw(o: PlayOptions = {}): Promise<boolean> {
    if (this.state === 'hidden') return Promise.resolve(true);
    if (this.still()) {
      this.hide();
      return Promise.resolve(true);
    }
    const from = this.position();
    this.undrawRate = o.speed ?? 1.6;
    this.halt();
    this.settle(false);
    return new Promise<boolean>((resolve) =>
      this.move(from, -this.undrawRate, o.delay ?? 0, resolve)
    );
  }

  showDrawn() {
    this.halt();
    this.state = 'drawn';
    this.paint(this.end);
    this.svg.style.visibility = 'visible';
    this.settle(true);
  }

  hide() {
    this.halt();
    const wasUndrawing = this.state === 'undrawing';
    this.state = 'hidden';
    this.svg.style.visibility = 'hidden';
    this.shown.fill(-1); // next play rewrites every stroke
    this.settle(wasUndrawing);
  }

  destroy() {
    this.halt();
    this.settle(false);
    if (this.opts.mode === 'absolute') this.svg.remove();
    else this.root.remove();
  }

  private undrawRate = 1.6;

  private still() {
    const m = this.opts.motion ?? 'auto';
    return m === 'never' || (m === 'auto' && prefersReducedMotion());
  }

  /** Starts moving along the timeline from `pos` at `rate` after `delay` ms. */
  private move(pos: number, rate: number, delay: number, resolve: ((f: boolean) => void) | null) {
    this.resolve = resolve;
    this.travel = { pos, rate, startAt: performance.now() + delay };
    this.state = rate > 0 ? 'drawing' : 'undrawing';
    this.svg.style.visibility = 'visible';
    this.paint(pos); // hide what hasn't started before the first paint
    this.stop = onFrame((now) => {
      const p = this.position(now);
      this.paint(p);
      if (rate > 0 && p >= this.end) {
        this.stop = null;
        this.showDrawn();
        return false;
      }
      if (rate < 0 && p <= 0) {
        this.stop = null;
        this.hide();
        return false;
      }
      return true;
    });
  }

  private settle(finished: boolean) {
    const r = this.resolve;
    this.resolve = null;
    r?.(finished);
  }

  private halt() {
    this.stop?.();
    this.stop = null;
  }

  /**
   * Shows the line as it is at `pos` ms into its timeline: each stroke's
   * progress (0 hidden … 1 drawn) and each fill's opacity, touching the DOM
   * only where the value changed.
   */
  private paint(pos: number) {
    const { strokes, fills } = this.drawing;
    const n = this.paths.length;
    const shown = this.shown;
    for (let i = 0; i < n; i++) {
      const s = strokes[i];
      const p = Math.min(1, Math.max(0, (pos - s.t0) / Math.max(1e-3, s.t1 - s.t0)));
      const q = p <= 0 ? 0 : p >= 1 ? 1 : Math.round(p * 1000) / 1000;
      if (shown[i] === q) continue;
      const st = this.paths[i].style;
      if (q === 0) {
        st.visibility = 'hidden';
      } else if (q === 1) {
        st.visibility = '';
        st.strokeDasharray = '';
        st.strokeDashoffset = '';
      } else {
        st.visibility = '';
        st.strokeDasharray = '1 2';
        st.strokeDashoffset = String(1.001 * (1 - q));
      }
      shown[i] = q;
    }
    for (let j = 0; j < this.fills.length; j++) {
      const p = Math.min(1, Math.max(0, (pos - fills[j].t0) / FILL_FADE));
      const q = Math.round(p * 100) / 100;
      if (shown[n + j] === q) continue;
      this.fills[j].style.opacity = q === 1 ? '' : String(q);
      shown[n + j] = q;
    }
  }

  private render() {
    const d = this.drawing;
    const { bbox } = d;
    if (this.opts.mode === 'absolute') {
      const s = this.svg.style;
      s.left = `${bbox.x}px`;
      s.top = `${bbox.y}px`;
      s.width = `${Math.max(1, bbox.w)}px`;
      s.height = `${Math.max(1, bbox.h)}px`;
      this.svg.setAttribute(
        'viewBox',
        `${bbox.x} ${bbox.y} ${Math.max(1, bbox.w)} ${Math.max(1, bbox.h)}`
      );
    }
    this.root.replaceChildren();
    const color = this.opts.color ?? 'currentColor';
    // One mask over all the passes: a mask composites every frame the line
    // changes, so one per pass doubles or triples the cost of a grainy pen.
    let inkRoot: SVGGElement = this.root;
    if (d.grain > 0) {
      const id = `hl-grain-${this.id}`;
      this.root.appendChild(grainDefs(id, d));
      inkRoot = el('g', { mask: `url(#${id})` });
      this.root.appendChild(inkRoot);
    }
    const groups = d.layers.map((l) => {
      const g = el('g', { opacity: l.opacity });
      inkRoot.appendChild(g);
      return g;
    });
    this.paths = d.strokes.map((s) => {
      const p = el('path', {
        d: s.d,
        fill: 'none',
        stroke: color,
        'stroke-width': s.w,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        pathLength: 1,
      });
      groups[s.layer].appendChild(p);
      return p;
    });
    this.fills = d.fills.map((f) => {
      const p = el('path', { d: f.d, fill: color });
      groups[f.layer].appendChild(p);
      return p;
    });
    this.shown = new Float32Array(this.paths.length + this.fills.length).fill(-1);
  }
}

/**
 * The paper's tooth: a mask of tiny seeded specks that let the paper show
 * through the ink. Plain SVG rects in a pattern — no filter, no canvas — so it
 * costs a mask composite, not a turbulence render, and it prerenders.
 */
function grainDefs(id: string, d: Drawing): SVGDefsElement {
  const defs = el('defs');
  const r = rng(d.seed ^ 0x5eed);
  const tile = 9;
  const pat = el('pattern', {
    id: `${id}-p`,
    patternUnits: 'userSpaceOnUse',
    width: tile,
    height: tile,
  });
  const specks = Math.round(10 + 26 * d.grain);
  for (let i = 0; i < specks; i++) {
    const s = r.range(0.6, 1.4);
    pat.appendChild(
      el('rect', {
        x: r.range(0, tile).toFixed(2),
        y: r.range(0, tile).toFixed(2),
        width: s.toFixed(2),
        height: (s * r.range(0.6, 1.2)).toFixed(2),
        fill: 'black',
        opacity: (r.range(0.35, 1) * (0.45 + 0.55 * d.grain)).toFixed(2),
      })
    );
  }
  const b = d.bbox;
  const box = { x: b.x - 4, y: b.y - 4, width: b.w + 8, height: b.h + 8 };
  const mask = el('mask', { id, maskUnits: 'userSpaceOnUse', ...box });
  mask.appendChild(el('rect', { ...box, fill: 'white' }));
  mask.appendChild(el('rect', { ...box, fill: `url(#${id}-p)` }));
  defs.appendChild(pat);
  defs.appendChild(mask);
  return defs;
}

/** A drawn line as an SVG string — for prerendering, docs and tests. */
export function toSVGString(d: Drawing, o: { color?: string } = {}): string {
  const color = o.color ?? 'currentColor';
  const b = d.bbox;
  const layers = d.layers.map((l, i) => {
    const strokes = d.strokes
      .filter((s) => s.layer === i)
      .map((s) => `<path d="${s.d}" stroke-width="${s.w}"/>`)
      .join('');
    const fills = d.fills
      .filter((f) => f.layer === i)
      .map((f) => `<path d="${f.d}" fill="${color}" stroke="none"/>`)
      .join('');
    return `<g opacity="${l.opacity}">${strokes}${fills}</g>`;
  });
  return (
    `<svg xmlns="${NS}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${b.w}" height="${b.h}" ` +
    `fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    layers.join('') +
    `</svg>`
  );
}
