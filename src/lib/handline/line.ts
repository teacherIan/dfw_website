/**
 * createLine: a live line between two anchors inside a layer element.
 *
 * Framework-free; the React component is a thin wrapper. The line follows its
 * anchors (resize, scroll, size changes, and every frame during `follow`) and
 * rebuilds only when what it measured changed — a moved anchor reshapes the
 * line in place, without replaying the draw.
 */
import { anchorElement, resolveAnchor, type AnchorInput } from './anchor';
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
  /** Draws the line on, after `delay` ms (waits for the first layout if needed). */
  play(delay?: number): Promise<void>;
  undraw(): Promise<void>;
  /** Shows the line already drawn. */
  show(): void;
  hide(): void;
  update(next: Partial<LiveLine>): void;
  /** Re-measure every frame for `ms` (anchors moving by CSS transition). */
  follow(ms: number): void;
  destroy(): void;
  readonly drawing: Drawing | null;
}

type Pending = { kind: 'play'; delay: number; at: number; resolve: () => void } | { kind: 'show' };

const round = (n: number) => Math.round(n * 4) / 4;

/** Everything about a line's look, as a string — anchors left out. */
function keyOf(s: LiveLine): string {
  const { from: _f, to: _t, avoid: _a, ...rest } = s;
  return JSON.stringify(rest);
}

export function createLine(layer: HTMLElement, initial: LiveLine): LineController {
  let spec = initial;
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
      const o = layer.getBoundingClientRect();
      const a = resolveAnchor(spec.from, o);
      const b = resolveAnchor(spec.to, o);
      if (!a || !b) {
        measured = null;
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
        within: spec.contain === false ? undefined : { x: 0, y: 0, w: o.width, h: o.height },
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
      drawing = buildLine({ ...style, ...measured });
      onBuild?.(drawing);
      if (!view) {
        view = new InkView(layer, drawing, { mode: 'absolute', color, className, motion });
        runPending();
      } else view.setDrawing(drawing);
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
  rewatch();

  return {
    get drawing() {
      return drawing;
    },
    play(delay = 0) {
      if (view) return view.play({ delay });
      return new Promise<void>((resolve) => {
        pending = { kind: 'play', delay, at: performance.now(), resolve };
      });
    },
    undraw() {
      pending = null;
      return view ? view.undraw() : Promise.resolve();
    },
    show() {
      if (view) view.showDrawn();
      else pending = { kind: 'show' };
    },
    hide() {
      pending = null;
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
      stop();
      for (const e of observed) unwatch(e);
      observed.clear();
      view?.destroy();
      view = null;
    },
  };
}
