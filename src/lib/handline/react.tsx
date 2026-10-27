/**
 * React bindings.
 *
 *   <div style={{ position: 'relative' }}>
 *     <span ref={label}>Gallery</span>
 *     <button ref={button} />
 *     <HandlineLayer>
 *       <Handline from={label} to={button} gesture="loop" pen="pencil" play={shown} />
 *     </HandlineLayer>
 *   </div>
 *
 * A layer covers its positioned parent and is the lines' coordinate origin; it
 * holds only lines (they render nothing of their own into React's tree).
 *
 * <HandlineArt d=… viewBox=…> draws an authored path in its own box instead —
 * a fixed piece of artwork with the same pen.
 */
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { buildArt, type ArtInput } from './build';
import { InkView, type Motion } from './dom';
import { createLine, type LineController, type LiveLine } from './line';

const LayerContext = createContext<HTMLElement | null>(null);

export function HandlineLayer({
  children,
  className,
  style,
}: {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  return (
    <div
      ref={setEl}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}
    >
      {el && <LayerContext.Provider value={el}>{children}</LayerContext.Provider>}
    </div>
  );
}

/** "Has this once-key played this tab session?" — storage can throw; then no. */
function seen(key: string): boolean {
  try {
    return sessionStorage.getItem(`handline:${key}`) === '1';
  } catch {
    return false;
  }
}
function markSeen(key: string) {
  try {
    sessionStorage.setItem(`handline:${key}`, '1');
  } catch {
    /* private mode */
  }
}

/**
 * True once `el` has been at least half in view (and stays true). Without
 * IntersectionObserver it is true at once.
 */
function useInView(el: Element | null, enabled: boolean): boolean {
  const [seenIt, setSeen] = useState(false);
  useEffect(() => {
    if (!enabled || !el || seenIt) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el, enabled, seenIt]);
  return seenIt;
}

export interface HandlineProps extends LiveLine {
  /**
   * true draws the line on (after `delay`), false draws it out, 'in-view'
   * draws it the first time its layer is half on screen. Default true.
   */
  play?: boolean | 'in-view';
  delay?: number;
  /** Re-measure every frame for this many ms after `play` turns true. */
  follow?: number;
  /** Draw once per tab session under this key; later mounts show it drawn. */
  once?: string;
  /** The layer, if not inside a <HandlineLayer>. */
  within?: HTMLElement | null;
  onDrawn?: () => void;
}

export function Handline(props: HandlineProps) {
  const ctx = useContext(LayerContext);
  const layer = props.within ?? ctx;
  const ctl = useRef<LineController | null>(null);
  const latest = useRef(props);
  useLayoutEffect(() => {
    latest.current = props;
  });
  const {
    play: playProp = true,
    delay = 0,
    follow,
    once,
    within: _w,
    onDrawn: _o,
    ...spec
  } = props;
  const inView = useInView(layer, playProp === 'in-view');
  const play = playProp === 'in-view' ? inView : playProp;

  useLayoutEffect(() => {
    if (!layer) return;
    const {
      play: _p,
      delay: _d,
      follow: _f,
      once: _n,
      within: _x,
      onDrawn: _c,
      ...s
    } = latest.current;
    const c = createLine(layer, s);
    ctl.current = c;
    return () => {
      c.destroy();
      ctl.current = null;
    };
  }, [layer]);

  // Every render hands the line its latest spec; it rebuilds only on change.
  useLayoutEffect(() => {
    ctl.current?.update(spec);
  });

  useEffect(() => {
    const c = ctl.current;
    if (!c) return;
    if (!play) {
      void c.undraw();
      return;
    }
    if (follow) c.follow(follow + delay);
    if (once && seen(once)) {
      c.show();
      return;
    }
    let live = true;
    void c.play(delay).then(() => {
      if (!live) return;
      if (once) markSeen(once);
      latest.current.onDrawn?.();
    });
    return () => {
      live = false;
    };
  }, [play, layer, delay, follow, once]);

  return null;
}

export interface HandlineArtProps extends ArtInput {
  viewBox: string;
  play?: boolean | 'in-view';
  delay?: number;
  color?: string;
  motion?: Motion;
  className?: string;
  style?: CSSProperties;
  onDrawn?: () => void;
}

export function HandlineArt({
  viewBox,
  play: playProp = true,
  delay = 0,
  color,
  motion,
  className,
  style,
  onDrawn,
  ...art
}: HandlineArtProps) {
  const [svgEl, setSvgEl] = useState<SVGSVGElement | null>(null);
  const inView = useInView(svgEl, playProp === 'in-view');
  const play = playProp === 'in-view' ? inView : playProp;
  const view = useRef<InkView | null>(null);
  const done = useRef(onDrawn);
  useLayoutEffect(() => {
    done.current = onDrawn;
  });
  const key = JSON.stringify(art);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const drawing = useMemo(() => buildArt(art), [key]);

  useLayoutEffect(() => {
    if (!svgEl) return;
    const v = new InkView(svgEl, drawing, { mode: 'inline', color, motion });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
  }, [svgEl, drawing, color, motion]);

  useEffect(() => {
    const v = view.current;
    if (!v) return;
    if (!play) {
      void v.undraw();
      return;
    }
    let live = true;
    void v.play({ delay }).then(() => live && done.current?.());
    return () => {
      live = false;
    };
  }, [svgEl, play, delay, drawing, color, motion]);

  return (
    <svg
      ref={setSvgEl}
      viewBox={viewBox}
      className={className}
      style={{ overflow: 'visible', ...style }}
      fill="none"
      aria-hidden="true"
    />
  );
}
