/**
 * Generates the glyph-outline path data for the loading-screen wordmark.
 *
 * RoughJS can sketch an SVG path but has no concept of text, so the wordmark
 * is converted to vector outlines here — once, at build time — and baked into
 * src/components/loading/wordmarkPath.ts. This keeps opentype.js a
 * devDependency: it never ships in the runtime bundle.
 *
 * The path string is assembled from font.getPath().commands directly —
 * opentype.js v2's Path.toPathData() emits NaN coordinates.
 *
 * Run:  node scripts/genWordmark.mjs
 */
import opentype from 'opentype.js';

// Fontsource ships a *static* Caveat (per-weight) as WOFF, which opentype.js
// parses cleanly.
const FONT_URL =
  'https://cdn.jsdelivr.net/npm/@fontsource/caveat/files/caveat-latin-400-normal.woff';
const TEXT = "Doug's Found Wood";
const SIZE = 100; // reference em size; the runtime scales this path

const buf = await fetch(FONT_URL).then((r) => {
  if (!r.ok) throw new Error(`font fetch failed: ${r.status}`);
  return r.arrayBuffer();
});

const font = opentype.parse(buf);
const path = font.getPath(TEXT, 0, 0, SIZE);

const r = (n) => Number(n.toFixed(3));
let d = '';
let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
const track = (x, y) => {
  if (x < x1) x1 = x;
  if (x > x2) x2 = x;
  if (y < y1) y1 = y;
  if (y > y2) y2 = y;
};

for (const c of path.commands) {
  if (c.type === 'M') {
    d += `M${r(c.x)} ${r(c.y)}`;
    track(c.x, c.y);
  } else if (c.type === 'L') {
    d += `L${r(c.x)} ${r(c.y)}`;
    track(c.x, c.y);
  } else if (c.type === 'C') {
    d += `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
    track(c.x1, c.y1);
    track(c.x2, c.y2);
    track(c.x, c.y);
  } else if (c.type === 'Q') {
    d += `Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
    track(c.x1, c.y1);
    track(c.x, c.y);
  } else if (c.type === 'Z') {
    d += 'Z';
  }
}

if (d.includes('NaN')) throw new Error('path contains NaN — aborting');

process.stdout.write(
  JSON.stringify({
    text: TEXT,
    size: SIZE,
    bbox: { x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2) },
    d,
  }),
);
