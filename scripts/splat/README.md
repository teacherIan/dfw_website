# Splat optimization

Tooling for shrinking and cleaning up the Gaussian-splat hero asset
(`public/assets/v_one_final.spz`).

## TL;DR

- The app loads **`v_one_final.opt.spz`** by default — **~46% smaller** than the
  source (27.02 MB → 14.48 MB), even with ~51k splats of new foliage added.
- **Scene edits** (`--edits`, `edits.json`) fill the back-right capture gap with
  real foliage cloned from a never-visible part of the capture, and replace the
  sun-washed / white artifacts (washed-out background blobs on the left, white
  house walls glimpsed at the orbit edges, sun-glare "white leaves", sky
  reflected in a near-camera plant). See [Scene edits](#scene-edits).
- Splats within **1.5 world-units of the origin** (the chair) are exempt from
  the destructive passes — without that, the density cap shaved the chair from
  ~5,500 splats/voxel down to ~700, leaving rotten-wood blotches where the
  wood grain used to be.
- The original **`v_one_final.spz`** is kept untouched. Load it with `?splat=v_one_final.spz`.
- Re-generate any variant with `optimize.mjs` (below). The original is never
  modified, and the build is deterministic (same flags → same bytes), so every
  optimization is reversible.

## Scripts

Run from the repo root. No extra dependencies: `spz.mjs` is a small, dependency-
free SPZ codec (Spark 2.2 moved its SPZ parsing into WASM and no longer exports
the `SpzReader` / `SpzWriter` classes these scripts used to rely on).

| file | role |
| --- | --- |
| `spz.mjs` | SPZ v2/v3 decode/encode (columnar typed arrays; matches Spark 2.1's quantization) |
| `measure.mjs` | read-only report on a splat |
| `optimize.mjs` | the build: scene edits + size-reduction passes → a new `.spz` |
| `edits.mjs` / `edits.json` | scene-edit engine and the edits applied to the hero splat |
| `raster.mjs` | CPU splat rasteriser matching Spark's shaders (~42 dB PSNR vs Spark), used to measure per-splat screen coverage |
| `render.mjs` / `render-page.js` | screenshots a splat the way the site shows it (site camera poses + colour grade) in headless Chrome, for before/after checks |

### `measure.mjs` — inspect a splat (read-only)

```
node scripts/splat/measure.mjs [path-to-spz]
```

Reports splat count, SH degree, local/world bounds, depth distribution,
opacity histogram, and a rough behind-camera count.

### `optimize.mjs` — produce a smaller splat

```
node --max-old-space-size=6000 scripts/splat/optimize.mjs [options]
```

| option | effect |
| --- | --- |
| `--edits[=PATH]` | apply scene edits (default `scripts/splat/edits.json`) before every other pass. |
| `--sh=N` | re-encode at SH degree N (0–3). Lower = smaller, less view-dependent shading. |
| `--min-alpha=V` | drop splats with opacity below V (0–1). |
| `--cull` | drop splats never inside the orbit-swept view frustum. |
| `--cull-azimuth=DEG` / `--cull-polar=DEG` | orbit range the cull sweeps (default ±128.6° / ±60°). |
| `--cull-fov=DEG` / `--cull-margin=DEG` | cull frustum FOV and safety margin. |
| `--density-cap-percentile=P` | voxelise the splats and cap each voxel at the Pth-percentile count. Levels out over-captured regions. Scene-edit clones are neither counted nor capped. |
| `--density-voxel=V` | voxel size for the density cap (default 0.15 scene-units). |
| `--prune-hidden[=PX]` | last pass: drop splats buried behind others — never covering more than PX pixels (default 0.003) in any of 65 reachable views. ~4 min. |
| `--frac-bits=N` | position quantization bits (source is 12). |
| `--scene-radius=R` | radius of the captured scene's bounding sphere (default 5.5). The white/dark removal passes act only inside it; the sky and far background outside are spared spatially. Override per-pass with `--white-scene-radius` / `--dark-scene-radius`. |
| `--preserve-radius=R` | subject preservation. Splats within R world-units of origin are exempt from the density cap, dark removal and hidden-pruning — protects the chair from being thinned to "rotten wood". |
| `--dry` | report counts only, write nothing. |
| `--out=PATH` | output path (default derived from the passes). |

Passes compose. `v_one_final.opt.spz` is built with:

```
node --max-old-space-size=6000 scripts/splat/optimize.mjs \
  --edits \
  --sh=0 --min-alpha=0.1 --frac-bits=11 \
  --cull --cull-azimuth=20 --cull-polar=13 --cull-margin=12 --cull-fov=52 \
  --remove-whites --remove-darks --dark-brightness-max=0.10 \
  --density-cap-percentile=99 --density-voxel=0.15 \
  --prune-hidden \
  --preserve-radius=1.5 \
  --out=public/assets/v_one_final.opt.spz
```

`--remove-whites` drops Polycam's bright, pale, blue-leaning floaters
inside the scene radius (the actual sky is outside the radius and is
spared spatially; warm wood highlights have `R > B` and are spared by
colour). Tunable with `--white-sat-max`, `--white-brightness-min`, and
`--scene-radius` (or `--white-scene-radius` to size just this pass).

Output is always written in **Morton (Z-order)**: neighbours in space become
neighbours in the file, so gzip finds far more repetition in positions and
colours — **~7% smaller, lossless** (Spark depth-sorts every frame, so file
order never affects rendering). Without `--edits` / `--prune-hidden` the build
reproduces the previous `v_one_final.opt.spz` splat-for-splat, just reordered:
15.95 MB → 14.85 MB.

### `render.mjs` — see a splat the way the site shows it

```
node scripts/splat/render.mjs [--spz=A.spz[,B.spz]] [--views=LIST|all] [--out=DIR]
```

Screenshots each splat in headless Chrome (puppeteer, with three + Spark from
`node_modules`), from the site's own camera poses and with the settled-state
colour grade from `Scene.tsx`. The views cover the desktop and mobile rest
positions, the orbit dragged fully left / right / up / down, a 21:9 window and
the gallery zoom (`--views=all`). Pass two splats for a before/after pair; each
view is written as `<view>--<splat>.png` to `splat-renders/` (git-ignored).
`--shots=FILE` takes custom poses and `--no-grade` shows raw colours. On a
machine without a usable GPU, add `--swiftshader` (~25 s a frame at 1280×720).

## Scene edits

`edits.json` is a list of **clears** (drop artifact splats in a region) and
**patches** (clone real foliage into a region). Regions are given in the site's
rest pose about the vertical axis through the origin — `theta` in degrees
(0 = straight back, + = right), `h` = horizontal distance, `y` = height — see
the header of `edits.mjs`. Every entry has a `note`.

Every patch clones the capture's **back-right hedge** (θ 84–122°), which is
off-screen in every standard view: only an ultrawide (21:9) window dragged
fully right shows a sliver of it, at the far right edge — well away from the
back-right fill, so no clone appears next to its source. Each patch is placed with a rigid
move (optionally mirrored and uniformly scaled about a pivot), feathered at
its edges with per-splat jitter, colour-matched per height band to the
neighbours on its left and right, and stripped of stray outliers.

| entry | what it fixes |
| --- | --- |
| `front-hedge` + `back-row` (+ clear `gap-white-dots`) | **back-right gap**: no photos covered it, so the page background showed through as a white wall behind the trees. Now two rows of bushy trees under the pines. |
| `left-bushes` (+ clear `left-washed-blobs`) | **sun-washed tree** on the left: a few dozen huge, pale sage background splats read as a flat white-green smear behind the left tree. |
| `left-canopy-flecks` | sun-glare "white leaves" scattered through the left tree's canopy (splats much paler than their 32 nearest neighbours). |
| `house-cover` (+ clear `edge-house`) | white house wall glimpsed through the trees at full right drag (ultrawide, mobile). |
| `far-left-cover` (+ clear `far-left-structure`) | the same on the left at full left drag. |
| `left-edge-bush` (+ clear `left-edge-blobs`) | lower-left corner of the default view: the ground was never captured, so the background showed through. |
| `near-camera-blue-*` | sky reflected in a plant beside the camera — a blue-white smear at the bottom-right when the orbit tilts down. |

Background leaking through (share of pixels at ≥25% transmittance, CPU
raster) drops from **2–4% to 0.1–0.8%** across the reachable views — e.g.
2.59% → 0.39% in the default desktop view, 4.34% → 0.11% on mobile at full
right drag.

To try a change to `edits.json`, build to a scratch path with the command above
(`--out=/tmp/new.spz`) and render it next to the shipped splat:
`node scripts/splat/render.mjs --spz=public/assets/v_one_final.opt.spz,/tmp/new.spz`.

## Hidden-splat pruning

`--prune-hidden` renders the final population from **65 views** — desktop,
mobile/tablet and gallery-zoom rest positions across the whole ±20°/±13° orbit
grid, plus points along the entrance fly-in — and drops splats that never
cover more than 0.003 px. Coverage is measured through a deliberately
oversized frustum (62° vertical, 2.6:1, the cull's margin), so only splats
buried *behind* others go; anything near a screen edge is left to the cull.
That removes ~57k splats (5%). Against the unpruned build it renders at
**87–97 dB PSNR** (max per-pixel difference 6/255) on 13 held-out views,
including ultrawide + tilt, 32:9, tablets in both orientations and fly-in
points that were not part of the 65.

## What was measured (source: `v_one_final.spz`)

1,393,816 splats, SH degree 3, 27.0 MB on disk (gzipped), 12-bit positions.

Voxelising at 0.15-unit cells: 23,156 occupied voxels, **median 9 splats/voxel
but max 5,574** — i.e. one region is ~600× denser than typical (the over-
captured chair / logo). That extreme imbalance is the biggest single
compression opportunity, and is the dominant cause of the chaotic-looking
chair assembly during the entrance.

| lever | result | risk |
| --- | --- | --- |
| SH degree 3 → 1 | −11% | low — drops fine view-dependent specular |
| SH degree 3 → 0 | −20% | medium — no view-dependent shading at all |
| drop opacity < 0.1 (−7.7% splats) | −8% | low — those splats are near-invisible |
| 12 → 11-bit positions | −2% | low — marginally coarser splat centres |
| orbit-frustum cull (±20°/±13° orbit) | −5% | low — see below |
| white/pale-blue floater removal inside scene | −1% | low — colour + spatial; sky preserved |
| **density cap p99 (clip voxels >846 splats)** | **−33%** | **low — clips only the worst over-density; chair stays detailed** |
| Morton file order | −7% | none — lossless |
| hidden-splat pruning | −5% splats | low — occluded in every reachable view |

### Frustum culling and the orbit lock

Culling only pays off because the orbit was deliberately tightened.
`InteractivePresentationControls` originally allowed **±128.6° azimuth** —
swept that wide, the frustum covered essentially the whole capture and culling
removed nothing. The orbit is now locked to a **±20° / ±13° peek** (`Scene.tsx`),
so the cull can drop the swept-frustum exterior — ~6% of splats, with a 12°
safety margin so nothing visible at the orbit extremes is removed.

Even fully locked the cull tops out at ~15%: the capture is mostly frontal and
has little geometry hidden behind it. The bulk of the saving is still SH0 +
opacity decimation. SH data, though ~70% of the *uncompressed* payload, gzips
cheaply, so SH reduction alone only buys ~11–20%.

## Switching / reverting

- **Per-load A/B:** `?splat=<file>` query param — e.g. `?splat=v_one_final.spz`
  for the untouched original. Handled by `resolveSplatUrl()` in `Scene.tsx`.
- **Change the default:** `DEFAULT_SPLAT` in `src/components/scene/Scene.tsx`.
- **Drop an edit:** delete its entry from `edits.json` (or run without
  `--edits`) and rebuild.
- **Want a safer variant?** Re-run `optimize.mjs` with `--sh=1` (keeps the
  dominant view-dependent term) and point `DEFAULT_SPLAT` at it.
- **Restore the wide orbit:** the cull and hidden-pruning are matched to the
  ±20°/±13° lock in `Scene.tsx`. Widening the orbit means regenerating the
  splat with matching `--cull-azimuth` / `--cull-polar` (and the orbit grid in
  `buildVisibilityViews`), or dropping `--cull` / `--prune-hidden`.

## Known caveats (verify on a real device)

- **SH degree 0** removes view-dependent shading. At rest and across the small
  orbit it is imperceptible (the scene is matte wood / foliage); regenerate
  with `--sh=1` if any flatness shows.
- **Opacity decimation** drops faint splats; the soft haze at foliage edges is
  marginally thinner on close inspection.
- **The cull and hidden-pruning are tied to the ±20°/±13° orbit lock and the
  camera positions in `useSceneControls`.** Changing either later requires
  regenerating the splat (see above) or removed geometry can show as holes.
- **Exit animations** explode/shatter the splats — a culled, decimated or
  pruned splat cannot reappear mid-explosion. Only near-invisible, off-frustum
  or buried splats were removed, so this should be unnoticeable, but it is
  worth a glance.
