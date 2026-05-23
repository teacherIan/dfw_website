# Splat optimization

Tooling for shrinking the Gaussian-splat hero asset (`public/assets/v_one_final.spz`).

## TL;DR

- The app loads **`v_one_final.opt.spz`** by default — **~41% smaller** (27.0 MB → 15.95 MB).
- Splats within **1.5 world-units of the origin** (the chair) are exempt from
  the destructive passes — without that, the density cap shaved the chair from
  ~5,500 splats/voxel down to ~700, leaving rotten-wood blotches where the
  wood grain used to be.
- The original **`v_one_final.spz`** is kept untouched. Load it with `?splat=v_one_final.spz`.
- Re-generate any variant with `optimize.mjs` (below). The original is never modified,
  so every optimization is reversible.

## Scripts

Run from the repo root. They use `@sparkjsdev/spark`'s `SpzReader` / `SpzWriter`
(already a dependency — no extra tooling).

### `measure.mjs` — inspect a splat (read-only)

```
node scripts/splat/measure.mjs [path-to-spz]
```

Reports splat count, SH degree, local/world bounds, depth distribution,
opacity histogram, and a rough behind-camera count.

### `optimize.mjs` — produce a smaller splat

```
node --max-old-space-size=4096 scripts/splat/optimize.mjs [options]
```

| option | effect |
| --- | --- |
| `--sh=N` | re-encode at SH degree N (0–3). Lower = smaller, less view-dependent shading. |
| `--min-alpha=V` | drop splats with opacity below V (0–1). |
| `--cull` | drop splats never inside the orbit-swept view frustum. |
| `--cull-azimuth=DEG` / `--cull-polar=DEG` | orbit range the cull sweeps (default ±128.6° / ±60°). |
| `--cull-fov=DEG` / `--cull-margin=DEG` | cull frustum FOV and safety margin. |
| `--density-cap-percentile=P` | voxelise the splats and cap each voxel at the Pth-percentile count. Levels out over-captured regions. |
| `--density-voxel=V` | voxel size for the density cap (default 0.15 scene-units). |
| `--frac-bits=N` | position quantization bits (source is 12). |
| `--preserve-radius=R` | subject preservation. Splats within R world-units of origin are exempt from the density cap and dark removal — protects the chair from being thinned to "rotten wood". |
| `--dry` | report counts only, write nothing. |
| `--out=PATH` | output path (default derived from the passes). |

Passes compose. `v_one_final.opt.spz` is built with:

```
node --max-old-space-size=4096 scripts/splat/optimize.mjs \
  --sh=0 --min-alpha=0.1 --frac-bits=11 \
  --cull --cull-azimuth=20 --cull-polar=13 --cull-margin=12 --cull-fov=52 \
  --remove-whites --remove-darks --dark-brightness-max=0.10 \
  --density-cap-percentile=99 --density-voxel=0.15 \
  --preserve-radius=1.5 \
  --out=public/assets/v_one_final.opt.spz
```

`--remove-whites` drops Polycam's bright, pale, blue-leaning floaters
inside the scene radius (the actual sky is outside the radius and is
spared spatially; warm wood highlights have `R > B` and are spared by
colour). Tunable with `--white-sat-max`, `--white-brightness-min`, and
`--white-scene-radius`.

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

`v_one_final.opt.spz` stacks SH0 + opacity<0.1 + 11-bit + cull ⇒ **−32.6%**
(1.39M → 1.21M splats). Verified against the original at rest (desktop +
mobile) and at all four orbit extremes — no holes, no console errors.

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
- **Want a safer variant?** Re-run `optimize.mjs` with `--sh=1` (keeps the
  dominant view-dependent term) and point `DEFAULT_SPLAT` at it.
- **Restore the wide orbit:** the cull is matched to the ±20°/±13° lock in
  `Scene.tsx`. Widening the orbit means regenerating the splat with matching
  `--cull-azimuth` / `--cull-polar`, or dropping `--cull`.

## Known caveats (verify on a real device)

- **SH degree 0** removes view-dependent shading. At rest and across the small
  orbit it is imperceptible (the scene is matte wood / foliage); regenerate
  with `--sh=1` if any flatness shows.
- **Opacity decimation** drops faint splats; the soft haze at foliage edges is
  marginally thinner on close inspection.
- **The cull is tied to the ±20°/±13° orbit lock.** Widening the orbit later
  requires regenerating the splat (see above) or culled geometry will show as
  holes at the new extremes.
- **Exit animations** explode/shatter the splats — a culled or decimated splat
  cannot reappear mid-explosion. Only near-invisible / off-frustum splats were
  removed, so this should be unnoticeable, but it is worth a glance.
