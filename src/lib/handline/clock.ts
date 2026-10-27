/**
 * One animation frame loop for every drawing line on the page.
 *
 * A line is many short strokes; animating each with its own Web Animation
 * means the browser restyles every stroke every frame (7,000 for sixty lines).
 * Here each frame computes every stroke's progress — cheap arithmetic — and
 * writes to the DOM only for strokes whose state changed: the two or three
 * the pen is on, plus any that just started or finished.
 */

type Tick = (now: number) => boolean; // false = done

const ticks = new Set<Tick>();
let raf = 0;

function loop(now: number) {
  raf = 0;
  for (const t of [...ticks]) if (!t(now)) ticks.delete(t);
  if (ticks.size) raf = requestAnimationFrame(loop);
}

/** Calls `fn` every frame until it returns false or the returned stop is called. */
export function onFrame(fn: Tick): () => void {
  ticks.add(fn);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    ticks.delete(fn);
  };
}
