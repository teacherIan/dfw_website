/**
 * createLine: a live line between two anchors inside a layer element.
 *
 * Framework-free; the React component is a thin wrapper. The line follows its
 * anchors (resize, scroll, size changes, and every frame during `follow`) and
 * rebuilds only when what it measured changed — a moved anchor reshapes the
 * line in place, without replaying the draw.
 */
import { anchorElement, anchorMissing, resolveAnchor, type AnchorInput } from './anchor';
import { buildLine, type Drawing, type LineInput } from './build';
import { InkView, type Motion } from './dom';
import type { Shape } from './geom';
import { follow as followFrames, schedule, track, unwatch, watch } from './track';

export interface LiveLine extends Omit<
  LineInput,
  'from' | 'to' | 'fromShape' | 'toShape' | 'within' | 'avoid'
> {
  from: AnchorInput;
  to: AnchorInput;
  /** Other elements the line should keep off when choosing a side. */
  avoid?: AnchorInput[];
  /** Keep the line inside the layer's box when choosing a side (default true). */
  contain?: boolean;
  color?: string;
  className?: string;
  motion?: Motion;
  /** Called with each new Drawing (debug overlays, stats). */
  onBuild?: (d: Drawing) => void;
}

export interface LineController {
  /**
   * Draws the line on, after `delay` ms (waits for the first layout if
   * needed). Resolves true when the line finished drawing, false when
   * something else (another play, a hide, destroy) took over first.
   */
  play(delay?: number): Promise<boolean>;
  /**
   * Draws the line on the first time its target (or, without an element
   * target, its layer) is half in view — or fills half the viewport.
   */
  playInView(delay?: number): Promise<boolean>;
  /** Resolves true once the line is gone, false if something took over first. */
  undraw(): Promise<boolean>;
  /** Shows the line already drawn. */
  show(): void;
  hide(): void;
  update(next: Partial<LiveLine>): void;
  /** Re-measure every frame for `ms` (anchors moving by CSS transition). */
  follow(ms: number): void;
  destroy(): void;
  readonly drawing: Drawing | null;
}

type Pending =
  | { kind: 'play'; delay: number; at: number; resolve: (finished: boolean) => void }
  | { kind: 'show' };

/** How often to look again for an anchor that isn't on the page yet, ms. */
const RETRY_MS = 250;

const round = (n: number) => Math.round(n * 4) / 4;

/** Everything about a line's look, as a string — anchors left out. */
function keyOf(s: LiveLine): string {
  const { from: _f, to: _t, avoid: _a, ...rest } = s;
  return JSON.stringify(rest);
}

let lines = 0;
const warned = new WeakSet<Element>();

/** A point given in the layer's own coordinates (not an element, not the viewport's). */
function isLayerPoint(a: AnchorInput): boolean {
  const spec = typeof a === 'object' && a !== null && 'target' in a ? a : { target: a };
  const t = spec.target as unknown;
  if (typeof t !== 'object' || t === null || 'current' in t) return false;
  if (typeof Element !== 'undefined' && t instanceof Element) return false;
  return (spec as { space?: string }).space !== 'viewport';
}

/**
 * A layer absolutely positioned over a parent that isn't positioned covers
 * some other ancestor instead. Element and viewport anchors still land right
 * (they're measured against the layer's real box), but points given in layer
 * coordinates land somewhere else without a word. Say so, once.
 */
function checkLayer(layer: HTMLElement, spec: LiveLine) {
  if (!isLayerPoint(spec.from) && !isLayerPoint(spec.to)) return;
  if (typeof getComputedStyle !== 'function' || warned.has(layer)) return;
  const pos = getComputedStyle(layer).position;
  const parent = layer.parentElement;
  if (
    (pos === 'absolute' || pos === 'fixed') &&
    parent &&
    layer.offsetParent &&
    layer.offsetParent !== parent
  ) {
    warned.add(layer);
    console.warn(
      "handline: the layer's parent isn't positioned, so the layer covers another element and points given in layer coordinates land in the wrong place. Give the parent `position: relative`.",
      parent
    );
  }
}

export function createLine(layer: HTMLElement, initial: LiveLine): LineController {
  let spec = initial;
  // Unseeded lines each get their own seed (stable for the line's life), so
  // two lines on one page don't wander identically.
  const ownSeed = `line-${++lines}`;
  let seen: { io: IntersectionObserver; resolve: (f: boolean) => void } | null = null;
  const stopWatching = () => {
    if (!seen) return;
    seen.io.disconnect();
    seen.resolve(false);
    seen = null;
  };
  let styleKey = keyOf(spec);
  let builtKey = '';
  let measuredKey = '';
  let measured: Pick<
    LineInput,
    'from' | 'to' | 'fromShape' | 'toShape' | 'within' | 'avoid'
  > | null = null;
  let view: InkView | null = null;
  let drawing: Drawing | null = null;
  let pending: Pending | null = null;
  let observed = new Set<Element>();
  let retry: ReturnType<typeof setTimeout> | null = null;

  /** A play queued before the first layout is superseded: it resolves false. */
  const dropPending = () => {
    if (pending?.kind === 'play') pending.resolve(false);
    pending = null;
  };

  const elements = () => {
    const set = new Set<Element>([layer]);
    for (const a of [spec.from, spec.to, ...(spec.avoid ?? [])]) {
      const e = anchorElement(a);
      if (e) set.add(e);
    }
    return set;
  };

  const rewatch = () => {
    const next = elements();
    for (const e of next) if (!observed.has(e)) watch(e);
    for (const e of observed) if (!next.has(e)) unwatch(e);
    observed = next;
  };

  const job = {
    read() {
      const box = layer.getBoundingClientRect();
      const scale = layer.offsetWidth > 0 ? box.width / layer.offsetWidth : 1;
      const o = { left: box.left, top: box.top, scale };
      const a = resolveAnchor(spec.from, o);
      const b = resolveAnchor(spec.to, o, 'to');
      if (!a || !b) {
        // A hidden element (no size) is observed and reports when it shows.
        // A ref not attached yet fires nothing when it is: look again shortly.
        measured = null;
        rewatch();
        if (!retry && (anchorMissing(spec.from) || anchorMissing(spec.to))) {
          retry = setTimeout(() => {
            retry = null;
            schedule();
          }, RETRY_MS);
        }
        return;
      }
      const avoid: Shape[] = [];
      for (const x of spec.avoid ?? []) {
        const r = resolveAnchor(x, o);
        if (r?.shape) avoid.push(r.shape);
        else if (r?.rect) avoid.push({ kind: 'rect', ...r.rect });
      }
      measured = {
        from: a.point,
        to: b.point,
        fromShape: a.shape,
        toShape: b.shape,
        within:
          spec.contain === false
            ? undefined
            : {
                x: 0,
                y: 0,
                w: layer.offsetWidth || box.width,
                h: layer.offsetHeight || box.height,
              },
        avoid,
      };
      measuredKey = JSON.stringify([measured, styleKey], (_, v) =>
        typeof v === 'number' ? round(v) : v
      );
    },
    write() {
      if (!measured || measuredKey === builtKey) return;
      builtKey = measuredKey;
      rewatch();
      const {
        from: _f,
        to: _t,
        avoid: _a,
        contain: _c,
        color,
        className,
        motion,
        onBuild,
        ...style
      } = spec;
      drawing = buildLine({ ...style, seed: style.seed ?? ownSeed, ...measured });
      onBuild?.(drawing);
      if (!view) {
        view = new InkView(layer, drawing, { mode: 'absolute', color, className, motion });
        runPending();
      } else {
        view.configure({ color, className, motion }, false);
        view.setDrawing(drawing);
      }
    },
  };

  const runPending = () => {
    if (!view || !pending) return;
    const p = pending;
    pending = null;
    if (p.kind === 'show') view.showDrawn();
    else {
      const waited = performance.now() - p.at;
      void view.play({ delay: Math.max(0, p.delay - waited) }).then(p.resolve);
    }
  };

  const stop = track(job);
  checkLayer(layer, spec);
  rewatch();

  return {
    get drawing() {
      return drawing;
    },
    playInView(delay = 0) {
      stopWatching();
      const el = anchorElement(spec.to) ?? layer;
      if (typeof IntersectionObserver === 'undefined') return this.play(delay);
      return new Promise<boolean>((resolve) => {
        const io = new IntersectionObserver(
          (entries) => {
            const enough = entries.some((e) => {
              const view = e.rootBounds?.height ?? window.innerHeight;
              return (
                e.isIntersecting &&
                (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= view * 0.5)
              );
            });
            if (!enough) return;
            io.disconnect();
            seen = null;
            void this.play(delay).then(resolve);
          },
          { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
        );
        seen = { io, resolve };
        io.observe(el);
      });
    },
    play(delay = 0) {
      stopWatching();
      if (view) return view.play({ delay });
      dropPending();
      return new Promise<boolean>((resolve) => {
        pending = { kind: 'play', delay, at: performance.now(), resolve };
      });
    },
    undraw() {
      stopWatching();
      dropPending();
      return view ? view.undraw() : Promise.resolve(true);
    },
    show() {
      stopWatching();
      if (view) view.showDrawn();
      else {
        dropPending();
        pending = { kind: 'show' };
      }
    },
    hide() {
      stopWatching();
      dropPending();
      view?.hide();
    },
    update(next) {
      spec = { ...spec, ...next };
      const k = keyOf(spec);
      // Anchors are re-measured every frame anyway; only a style change, or
      // a new anchor target, needs a fresh read.
      if (k !== styleKey || next.from || next.to || next.avoid) {
        styleKey = k;
        schedule();
      }
    },
    follow(ms) {
      followFrames(ms);
    },
    destroy() {
      stopWatching();
      dropPending();
      if (retry) clearTimeout(retry);
      retry = null;
      stop();
      for (const e of observed) unwatch(e);
      observed.clear();
      view?.destroy();
      view = null;
    },
  };
}
