# handline

Lines drawn by hand: arrows that loop, land on real elements, and draw on the
way a pen does. Built for dfw's nav arrows; written to be lifted into the 4YP
(advisory's `shared/ui/`).

Design doc, with live figures: https://claude.ai/artifact/9P4krKBDewiEcH64Fi5XUM

## Run

- `npm run dev`, then `/lab/handline.html` — playground (drag the ends; every
  option in the Leva panel), gestures, pens, ends, marks, the dfw menu, a 4YP
  mock and a 60-line stress test. Dev server only; not in the build.
- `npm test` — `node:test`, bundled by Vite's esbuild (`scripts/test-handline.mjs`).

## Shape

| File          | Does                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| `geom.ts`     | SVG path → dense polylines, arc length, curvature, trim to a shape     |
| `random.ts`   | seeded streams and 1-D noise; each feature forks its own               |
| `gestures.ts` | the shape between two points, built at the real length; `DFW_PATHS`    |
| `fit.ts`      | turn a gesture to face the target, pick a side, trim the ends          |
| `pen.ts`      | wander, width, timing; cut into constant-width strokes; `PENS`         |
| `ends.ts`     | heads, tails, ticks/scribe/dimension marks, the ring                   |
| `build.ts`    | `buildLine` / `buildArt`: description in, `Drawing` out — pure         |
| `dom.ts`      | `InkView`: a `Drawing` as SVG, drawn on/out from one timeline position |
| `clock.ts`    | one frame loop for every drawing line                                  |
| `track.ts`    | one layout tracker: reads before writes, once a frame                  |
| `anchor.ts`   | element / ref / point (layer or viewport) → point + trim shape         |
| `line.ts`     | `createLine`: a live line between anchors, no framework                |
| `react.tsx`   | `<Handline>`, `<HandlineArt>`, `<HandlineLayer>`                       |

## Rules it keeps

- **No SVG filters.** Weight, wander and grain are geometry; the grain is a
  mask of seeded specks. A filter can't change weight and re-renders every
  frame of a draw-on.
- **Same seed, same line**, on every render and in a prerender. Adding marks
  never changes the line under them (tested).
- **One clock, changed strokes only.** Per-stroke Web Animations fell to
  ~6 fps at sixty lines.
- **Reduced motion shows the line drawn.** Nothing loops.
- `play()` / `undraw()` resolve `true` when they reach their end and `false`
  when something took over (another play, a hide, destroy). Act on `true` only.

## Into advisory

Copy the folder to `shared/ui/handline/`; colours as tokens
(`hsl(var(--primary) / 0.8)`), never literals; swap `node:test` for `vitest`
in the test imports; read `src/components/ui/PRIMITIVES.md` first.
