/**
 * InkView: puts a Drawing on the page as SVG and draws it on.
 *
 * Each stroke reveals with its own dash offset over its own window, driven by
 * one shared frame loop (clock.ts) that touches only the strokes whose state
 * changed — no framer-motion, no per-stroke Web Animation. The pen's speed
 * lives in the strokes' timing, not an easing curve. A view can retarget
 * mid-draw: the new geometry picks up at the same moment.
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
  /** Start this many ms into the drawing (a retarget mid-draw). */
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
  private resolve: (() => void) | null = null;
  /** performance.now() at the drawing's t = 0. */
  private origin = 0;
  private readonly id = ++uid;
  private readonly opts: ViewOptions;

  constructor(host: Element, drawing: Drawing, opts: ViewOptions) {
    this.opts = opts;
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

  /** Replace the geometry. A drawn line stays drawn; a line mid-draw carries on. */
  setDrawing(d: Drawing) {
    const elapsed = performance.now() - this.origin;
    const prev = this.state;
    const resolve = this.resolve;
    this.resolve = null; // the running play's promise carries over to the new one
    this.halt();
    this.drawing = d;
    this.render();
    if (prev === 'drawing' && elapsed < d.duration) {
      void this.play({ delay: Math.max(0, -elapsed), from: Math.max(0, elapsed) }).then(() =>
        resolve?.()
      );
      return;
    }
    if (prev === 'drawing' || prev === 'drawn') this.showDrawn();
    else this.hide();
    resolve?.();
  }

  play(o: PlayOptions = {}): Promise<void> {
    const motion = this.opts.motion ?? 'auto';
    if (motion === 'never' || (motion === 'auto' && prefersReducedMotion())) {
      this.showDrawn();
      return Promise.resolve();
    }
    this.halt();
    this.origin = performance.now() + (o.delay ?? 0) - (o.from ?? 0);
    this.state = 'drawing';
    this.svg.style.visibility = 'visible';
    const { strokes, fills, duration } = this.drawing;
    const frame = (now: number) => {
      const e = now - this.origin;
      this.apply(
        (i) => (e - strokes[i].t0) / Math.max(1e-3, strokes[i].t1 - strokes[i].t0),
        (i) => (e - fills[i].t0) / FILL_FADE
      );
    };
    frame(performance.now()); // hide what hasn't started before the first paint
    return this.run(
      () => this.elapsed() >= duration + FILL_FADE,
      () => this.showDrawn(),
      frame
    );
  }

  /** Draws the line out again, last stroke first. */
  undraw(o: PlayOptions = {}): Promise<void> {
    if (this.state === 'hidden') return Promise.resolve();
    const motion = this.opts.motion ?? 'auto';
    if (motion === 'never' || (motion === 'auto' && prefersReducedMotion())) {
      this.hide();
      return Promise.resolve();
    }
    this.halt();
    const k = 1 / (o.speed ?? 1.6);
    const { strokes, fills, duration } = this.drawing;
    this.origin = performance.now() + (o.delay ?? 0);
    this.state = 'undrawing';
    const at = (now: number) => now - this.origin;
    return this.run(
      () => this.elapsed() >= duration * k,
      () => this.hide(),
      (now) =>
        this.apply(
          (i) => {
            const s = strokes[i];
            const len = Math.max(1, (s.t1 - s.t0) * k);
            return 1 - (at(now) - (duration - s.t1) * k) / len;
          },
          (i) => 1 - (at(now) - (duration - fills[i].t0) * k) / 90
        )
    );
  }

  showDrawn() {
    this.halt();
    this.state = 'drawn';
    this.apply(
      () => 1,
      () => 1
    );
    this.svg.style.visibility = 'visible';
    this.settle();
  }

  hide() {
    this.halt();
    this.state = 'hidden';
    this.svg.style.visibility = 'hidden';
    this.shown.fill(-1); // next play rewrites every stroke
    this.settle();
  }

  destroy() {
    this.halt();
    this.settle();
    if (this.opts.mode === 'absolute') this.svg.remove();
    else this.root.remove();
  }

  private elapsed() {
    return performance.now() - this.origin;
  }

  /** Runs `frame` every frame until `done()`; then `finish()` and settles. */
  private run(
    done: () => boolean,
    finish: () => void,
    frame: (now: number) => void
  ): Promise<void> {
    this.settle(); // a superseded play's promise resolves now
    return new Promise<void>((resolve) => {
      this.resolve = resolve;
      this.stop = onFrame((now) => {
        frame(now);
        if (done()) {
          this.stop = null;
          finish();
          return false;
        }
        return true;
      });
    });
  }

  private settle() {
    const r = this.resolve;
    this.resolve = null;
    r?.();
  }

  private halt() {
    this.stop?.();
    this.stop = null;
  }

  /**
   * Writes each stroke's progress (0 hidden … 1 drawn) and each fill's
   * opacity, touching the DOM only where the value changed.
   */
  private apply(stroke: (i: number) => number, fill: (i: number) => number) {
    const n = this.paths.length;
    const shown = this.shown;
    for (let i = 0; i < n; i++) {
      const p = Math.min(1, Math.max(0, stroke(i)));
      const q = p <= 0 ? 0 : p >= 1 ? 1 : Math.round(p * 1000) / 1000;
      if (shown[i] === q) continue;
      const path = this.paths[i];
      const st = path.style;
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
      const p = Math.min(1, Math.max(0, fill(j)));
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
