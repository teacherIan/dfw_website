/**
 * Seeded randomness. A line is drawn from its seed alone, so it looks the same
 * on every render, every visit and in a prerendered page — a hand-drawn line
 * that re-wobbles on each re-render reads as a glitch, not a hand.
 *
 * Each feature forks its own stream (`rng.fork('ticks')`), so adding hash marks
 * to a line doesn't change the wobble of the line itself.
 */

/** FNV-1a over a string; numbers are mixed so 1 and 2 land far apart. */
export function hashSeed(seed: string | number): number {
  if (typeof seed === 'number') return mix(Math.floor(seed) ^ 0x9e3779b9);
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mix(h: number): number {
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Lattice hash in [0, 1). */
function lattice(seed: number, i: number): number {
  return mix(seed ^ Math.imul(i, 0x27d4eb2d)) / 4294967296;
}

export interface Rng {
  /** [0, 1) */
  (): number;
  range(lo: number, hi: number): number;
  /** An independent stream derived from this one's seed and a label. */
  fork(label: string): Rng;
  /** Smooth 1-D value noise in [-1, 1], one lattice cell per unit of x. */
  noise(label: string): (x: number) => number;
  readonly seed: number;
}

export function rng(seed: string | number): Rng {
  const base = hashSeed(seed);
  let a = base;
  const next = (() => {
    // mulberry32
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }) as Rng;
  next.range = (lo, hi) => lo + (hi - lo) * next();
  next.fork = (label) => rng(`${base}:${label}`);
  next.noise = (label) => noise1(hashSeed(`${base}~${label}`));
  Object.defineProperty(next, 'seed', { value: base });
  return next;
}

export function noise1(seed: number): (x: number) => number {
  return (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = lattice(seed, i) * 2 - 1;
    const b = lattice(seed, i + 1) * 2 - 1;
    return a + (b - a) * u;
  };
}
