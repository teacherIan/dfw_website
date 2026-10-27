/**
 * One layout tracker for every live line on the page.
 *
 * Lines re-measure their anchors when anything could have moved them — a
 * resize, a scroll, an anchor changing size — at most once a frame, and all
 * lines read before any line writes, so twenty arrows cost one layout, not
 * twenty. `follow(ms)` keeps measuring every frame for a while, for anchors
 * that move by CSS transition (which fires no event).
 */

export interface TrackJob {
  read(): void;
  write(): void;
}

const jobs = new Set<TrackJob>();
const watched = new Map<Element, number>();
let raf = 0;
let followUntil = 0;
let listening = false;
let ro: ResizeObserver | null = null;

export function schedule() {
  if (!raf && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(flush);
}

function flush(now: number) {
  raf = 0;
  for (const j of jobs) j.read();
  for (const j of jobs) j.write();
  if (now < followUntil) schedule();
}

function listen(on: boolean) {
  if (typeof window === 'undefined' || on === listening) return;
  listening = on;
  const m = on ? 'addEventListener' : 'removeEventListener';
  window[m]('resize', schedule);
  window[m]('orientationchange', schedule);
  window[m]('scroll', schedule, { capture: true, passive: true } as AddEventListenerOptions);
  window.visualViewport?.[m]('resize', schedule);
  window.visualViewport?.[m]('scroll', schedule);
  if (on && typeof ResizeObserver !== 'undefined') ro = new ResizeObserver(schedule);
  if (!on) {
    ro?.disconnect();
    ro = null;
    watched.clear();
  }
}

export function watch(el: Element) {
  const n = watched.get(el) ?? 0;
  watched.set(el, n + 1);
  if (n === 0) ro?.observe(el);
}

export function unwatch(el: Element) {
  const n = watched.get(el) ?? 0;
  if (n <= 1) {
    watched.delete(el);
    ro?.unobserve(el);
  } else watched.set(el, n - 1);
}

export function track(job: TrackJob): () => void {
  jobs.add(job);
  listen(true);
  schedule();
  return () => {
    jobs.delete(job);
    if (!jobs.size) listen(false);
  };
}

/** Measure every frame for the next `ms`. */
export function follow(ms: number) {
  if (typeof performance === 'undefined') return;
  followUntil = Math.max(followUntil, performance.now() + ms);
  schedule();
}
