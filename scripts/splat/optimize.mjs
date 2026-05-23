/**
 * Splat optimizer — decode an .spz, apply composable size-reduction passes,
 * re-encode a new .spz. The source file is NEVER modified.
 *
 *   node scripts/splat/optimize.mjs [options]
 *
 * Options (all optional; passes compose):
 *   --in=PATH        source .spz         (default public/assets/v_one_final.spz)
 *   --out=PATH       output .spz         (default derived from the passes)
 *   --sh=N           re-encode at SH degree N (0..3). Lower = smaller, less
 *                    view-dependent shading. Default: keep source degree.
 *   --min-alpha=V    drop splats with opacity below V (0..1). Default 0 (off).
 *   --cull           drop splats never inside the orbit-swept view frustum.
 *   --cull-fov=DEG   vertical FOV for the cull frustum (default 62).
 *   --cull-margin=DEG  extra degrees added to the orbit range (default 12).
 *   --frac-bits=N    position quantization bits (default: keep source).
 *   --dry            report the plan + counts, write nothing.
 *
 * Each pass is independent, so any optimization that "doesn't work" can be
 * dropped by leaving its flag off and regenerating.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SpzReader, SpzWriter } from '@sparkjsdev/spark';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// --- args ----------------------------------------------------------------
const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args[m[1]] = m[2] ?? true;
}
const inPath = resolve(repoRoot, args.in ?? 'public/assets/v_one_final.spz');
const minAlpha = args['min-alpha'] != null ? Number(args['min-alpha']) : 0;
const doCull = !!args.cull;
const cullFov = args['cull-fov'] != null ? Number(args['cull-fov']) : 62;
const cullMargin = args['cull-margin'] != null ? Number(args['cull-margin']) : 12;
// Density-aware decimation: voxelise the splat, find the Pth-percentile
// per-voxel splat count, then randomly drop excess from any voxel that's
// denser. Levels out over-captured regions (e.g. a subject photographed
// from more angles than the rest of the scene).
const densityPct = args['density-cap-percentile'] != null ? Number(args['density-cap-percentile']) : null;
const densityVoxel = args['density-voxel'] != null ? Number(args['density-voxel']) : 0.15;
// White / sky-leak artifact removal: Polycam reconstructions seed bright,
// pale floaters through the middle of the scene — pure white plus a band
// of pale sky-blue. Drop splats that are bright AND not deeply saturated
// AND blue-leaning (B ≥ R) AND inside the scene's bounding sphere. The
// real sky is also outside the sphere and is spared spatially; warm
// surfaces (wood highlights, chair) have R > B and are spared by colour.
const removeWhites = !!args['remove-whites'];
const whiteSat = args['white-sat-max'] != null ? Number(args['white-sat-max']) : 0.35;
const whiteBright = args['white-brightness-min'] != null ? Number(args['white-brightness-min']) : 0.65;
const whiteRadius = args['white-scene-radius'] != null ? Number(args['white-scene-radius']) : 5.5;
// Dark-floater removal: Polycam also leaves near-black point splats from
// matcher errors. They sit hidden between overlapping coloured splats in
// dense regions, but the density-cap thins those neighbours and the dark
// dots get exposed (visible as flecks on the chair slats, etc.). Drop
// splats darker than `--dark-brightness-max` AND smaller than
// `--dark-scale-max` inside the scene radius. The scale gate spares
// legitimate dark surfaces (deep slats-shadow, bark) which are usually
// larger splats covering area — the artifacts are dot-like.
const removeDarks = !!args['remove-darks'];
const darkBright = args['dark-brightness-max'] != null ? Number(args['dark-brightness-max']) : 0.05;
const darkRadius = args['dark-scene-radius'] != null ? Number(args['dark-scene-radius']) : 5.5;
const darkScaleMax = args['dark-scale-max'] != null ? Number(args['dark-scale-max']) : Infinity;
// Subject preservation: the chair sits at the world origin and is the hero
// of the scene. The density-cap and dark-removal passes are aggressive enough
// to visibly damage the chair (the cap thins ultra-dense chair voxels from
// ~5,500 splats down to the global p99 of ~700 — an 87% loss — leaving dark
// blotches where wood-grain texture used to be). Splats within
// `--preserve-radius` world-units of origin are exempted from both passes.
// Cull, opacity decimation, white removal, SH reduction, and frac-bits still
// apply — they don't damage the chair.
const preserveRadius = args['preserve-radius'] != null ? Number(args['preserve-radius']) : 0;
const dry = !!args.dry;

// --- captured scene geometry (feature/splat-optimization) ----------------
// Live values read from the running app (Three.js camera + splat-mesh world
// matrices). Column-major, Three.js convention. Camera orientation is fixed
// (R3F points it at the origin once); only its position drifts slightly.
const CAM_MATRIX_WORLD = [
  1, 0, 0, 0,
  0, 0.8944271909999159, -0.4472135954999579, 0,
  0, 0.4472135954999579, 0.8944271909999159, 0,
  0.0229, 1.6353, 3.1, 1,
];
const REST_MESH_MATRIX = [
  1, 0, 0, 0,
  0, -0.02919952230128886, -0.9995736030415051, 0,
  0, 0.9995736030415051, -0.02919952230128886, 0,
  0, -0.5, 0, 1,
];
// InteractivePresentationControls orbit range (Scene.tsx). Overridable with
// --cull-azimuth / --cull-polar (degrees) so the cull can be measured against
// a tighter, locked-down orbit.
const DEG = Math.PI / 180;
const cullAzimuth = args['cull-azimuth'] != null ? Number(args['cull-azimuth']) * DEG : Math.PI / 1.4;
const cullPolar = args['cull-polar'] != null ? Number(args['cull-polar']) * DEG : Math.PI / 3;

// SH coefficient counts per degree band (RGB interleaved): deg1=9, deg2=15, deg3=21.
const SH_BAND = { 1: 9, 2: 15, 3: 21 };
const fmt = (n) => n.toLocaleString('en-US');
const mb = (b) => (b / 1024 / 1024).toFixed(2);

// --- mat/vec helpers (column-major mat4) ---------------------------------
const applyMat4 = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];
// Camera-space transform: p_cam = Rᵀ(p_world − t), with R = cam rotation cols.
const C = CAM_MATRIX_WORLD;
const camC0 = [C[0], C[1], C[2]];
const camC1 = [C[4], C[5], C[6]];
const camC2 = [C[8], C[9], C[10]];
const camT = [C[12], C[13], C[14]];
const toCameraSpace = (x, y, z) => {
  const dx = x - camT[0];
  const dy = y - camT[1];
  const dz = z - camT[2];
  return [
    camC0[0] * dx + camC0[1] * dy + camC0[2] * dz,
    camC1[0] * dx + camC1[1] * dy + camC1[2] * dz,
    camC2[0] * dx + camC2[1] * dy + camC2[2] * dz,
  ];
};

// --- cull: orbit-swept frustum visibility --------------------------------
// A splat is kept if it lands inside the camera frustum for ANY reachable
// orbit orientation. The orbit rotates the whole scene about the world
// origin (azimuth = Y, polar = X). FOV and orbit range carry a margin so the
// keep-region is generous — we only drop splats that are *definitely* never
// on screen.
const buildCullTest = () => {
  const azMax = cullAzimuth + cullMargin * DEG;
  const polMax = cullPolar + cullMargin * DEG;
  const vHalf = Math.tan(((cullFov + cullMargin) * Math.PI) / 360);
  // widest plausible viewport (ultrawide) → generous horizontal half-angle
  const hHalf = vHalf * 2.6;
  const NEAR = 0.03;
  const FAR = 60;
  // sample the orbit on a grid finer than the FOV so there are no gaps
  const azSteps = [];
  for (let a = -azMax; a <= azMax + 1e-6; a += azMax / 11) azSteps.push(a);
  const polSteps = [];
  for (let p = -polMax; p <= polMax + 1e-6; p += polMax / 7) polSteps.push(p);
  // precompute sin/cos
  const azSC = azSteps.map((a) => [Math.sin(a), Math.cos(a)]);
  const polSC = polSteps.map((p) => [Math.sin(p), Math.cos(p)]);

  return (wx, wy, wz) => {
    // wx,wy,wz = rest-world position (before orbit)
    for (let pi = 0; pi < polSC.length; pi++) {
      const [sp, cp] = polSC[pi];
      // Rx(pol)
      const y1 = wy * cp - wz * sp;
      const z1 = wy * sp + wz * cp;
      for (let ai = 0; ai < azSC.length; ai++) {
        const [sa, ca] = azSC[ai];
        // Ry(az)
        const x2 = wx * ca + z1 * sa;
        const z2 = -wx * sa + z1 * ca;
        const [cx, cy, cz] = toCameraSpace(x2, y1, z2);
        const depth = -cz; // camera looks down -Z
        if (depth > NEAR && depth < FAR && Math.abs(cx) < hHalf * depth && Math.abs(cy) < vHalf * depth) {
          return true;
        }
      }
    }
    return false;
  };
};

async function main() {
  const srcBytes = readFileSync(inPath);
  const reader = new SpzReader({ fileBytes: new Uint8Array(srcBytes) });
  await reader.parseHeader();
  const n = reader.numSplats;
  const srcSh = reader.shDegree;
  const targetSh = args.sh != null ? Math.max(0, Math.min(srcSh, Number(args.sh))) : srcSh;
  const fracBits = args['frac-bits'] != null ? Number(args['frac-bits']) : reader.fractionalBits;

  console.log(`\nsource : ${inPath.replace(repoRoot + '/', '')}  (${mb(srcBytes.length)} MB, ${fmt(n)} splats, SH${srcSh})`);
  console.log(`passes :`);
  if (targetSh !== srcSh) console.log(`  • SH degree ${srcSh} → ${targetSh}`);
  if (minAlpha > 0) console.log(`  • drop opacity < ${minAlpha}`);
  if (doCull) console.log(`  • cull: orbit-swept frustum (orbit ±${(cullAzimuth / DEG).toFixed(0)}°az / ±${(cullPolar / DEG).toFixed(0)}°pol, fov ${cullFov}°, margin ${cullMargin}°)`);
  if (removeWhites) console.log(`  • remove white artifacts inside scene radius ${whiteRadius}`);
  if (removeDarks) console.log(`  • remove dark floaters inside scene radius ${darkRadius}`);
  if (densityPct != null) console.log(`  • density cap: p${densityPct} per ${densityVoxel}-unit voxel`);
  if (preserveRadius > 0) console.log(`  • preserve subject: skip density-cap & dark-removal within ${preserveRadius}u of origin`);
  if (fracBits !== reader.fractionalBits) console.log(`  • fractionalBits ${reader.fractionalBits} → ${fracBits}`);
  if (targetSh === srcSh && minAlpha <= 0 && !doCull && !removeWhites && !removeDarks && densityPct == null && fracBits === reader.fractionalBits) {
    console.log(`  • (none — pure re-encode)`);
  }

  // --- decode ------------------------------------------------------------
  const cx = new Float32Array(n);
  const cy = new Float32Array(n);
  const cz = new Float32Array(n);
  const alpha = new Float32Array(n);
  const rgb = new Float32Array(n * 3);
  const scale = new Float32Array(n * 3);
  const quat = new Float32Array(n * 4);
  // store SH only for the bands the output keeps
  const shFloats = (targetSh >= 1 ? SH_BAND[1] : 0) + (targetSh >= 2 ? SH_BAND[2] : 0) + (targetSh >= 3 ? SH_BAND[3] : 0);
  const sh = shFloats ? new Float32Array(n * shFloats) : null;

  await reader.parseSplats(
    (i, x, y, z) => { cx[i] = x; cy[i] = y; cz[i] = z; },
    (i, a) => { alpha[i] = a; },
    (i, r, g, b) => { rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b; },
    (i, sx, sy, sz) => { scale[i * 3] = sx; scale[i * 3 + 1] = sy; scale[i * 3 + 2] = sz; },
    (i, qx, qy, qz, qw) => { quat[i * 4] = qx; quat[i * 4 + 1] = qy; quat[i * 4 + 2] = qz; quat[i * 4 + 3] = qw; },
    sh
      ? (i, sh1, sh2, sh3) => {
          let o = i * shFloats;
          for (let k = 0; k < SH_BAND[1]; k++) sh[o++] = sh1[k];
          if (targetSh >= 2 && sh2) for (let k = 0; k < SH_BAND[2]; k++) sh[o++] = sh2[k];
          if (targetSh >= 3 && sh3) for (let k = 0; k < SH_BAND[3]; k++) sh[o++] = sh3[k];
        }
      : undefined,
  );

  // --- keep mask ---------------------------------------------------------
  const keep = new Uint8Array(n).fill(1);
  let droppedAlpha = 0;
  let droppedCull = 0;
  let droppedDensity = 0;
  let densityStats = null;
  if (minAlpha > 0) {
    for (let i = 0; i < n; i++) {
      if (keep[i] && alpha[i] < minAlpha) { keep[i] = 0; droppedAlpha++; }
    }
  }
  if (doCull) {
    const cullTest = buildCullTest();
    for (let i = 0; i < n; i++) {
      if (!keep[i]) continue;
      const [wx, wy, wz] = applyMat4(REST_MESH_MATRIX, cx[i], cy[i], cz[i]);
      if (!cullTest(wx, wy, wz)) { keep[i] = 0; droppedCull++; }
    }
  }
  let droppedWhite = 0;
  if (removeWhites) {
    const r2 = whiteRadius * whiteRadius;
    for (let i = 0; i < n; i++) {
      if (!keep[i]) continue;
      const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
      if (r > b) continue; // warm tone — wood, chair highlights; spared by colour
      const maxC = Math.max(r, g, b);
      if (maxC < whiteBright) continue; // fast reject — not bright enough
      const minC = Math.min(r, g, b);
      const brightness = (r + g + b) / 3;
      const saturation = maxC > 1e-6 ? (maxC - minC) / maxC : 0;
      if (brightness <= whiteBright || saturation >= whiteSat) continue;
      // Pale and cool (white→sky-blue band). Check we're inside the scene's
      // core; the actual sky is outside the sphere and is spared.
      const [wx, wy, wz] = applyMat4(REST_MESH_MATRIX, cx[i], cy[i], cz[i]);
      if (wx * wx + wy * wy + wz * wz < r2) {
        keep[i] = 0;
        droppedWhite++;
      }
    }
  }
  // Pre-compute subject-preservation mask. World-space distance from origin;
  // splats inside this sphere are spared from the destructive passes.
  const preserveR2 = preserveRadius > 0 ? preserveRadius * preserveRadius : -1;
  const isPreserved = (i) => {
    if (preserveR2 <= 0) return false;
    const [wx, wy, wz] = applyMat4(REST_MESH_MATRIX, cx[i], cy[i], cz[i]);
    return wx * wx + wy * wy + wz * wz < preserveR2;
  };
  let droppedDark = 0;
  if (removeDarks) {
    const r2 = darkRadius * darkRadius;
    for (let i = 0; i < n; i++) {
      if (!keep[i]) continue;
      if (isPreserved(i)) continue;
      const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
      const brightness = (r + g + b) / 3;
      if (brightness >= darkBright) continue; // not dark enough
      // Scale gate: dark artifacts are point-like; legitimate dark surfaces
      // (deep slat-shadow, bark) are larger splats and survive this filter.
      if (darkScaleMax !== Infinity) {
        const sMax = Math.max(scale[i * 3], scale[i * 3 + 1], scale[i * 3 + 2]);
        if (sMax > darkScaleMax) continue;
      }
      const [wx, wy, wz] = applyMat4(REST_MESH_MATRIX, cx[i], cy[i], cz[i]);
      if (wx * wx + wy * wy + wz * wz < r2) {
        keep[i] = 0;
        droppedDark++;
      }
    }
  }
  if (densityPct != null) {
    // Voxelise the currently-kept splats and cap each voxel's count at the
    // Pth percentile across all occupied voxels. Over-dense voxels get
    // random excess dropped — flattens captures where one region was
    // photographed from many more angles than the rest. Splats inside the
    // preserve sphere (chair / subject) are excluded entirely — the cap is
    // measured on, and applied to, only the non-preserved population.
    const buckets = new Map();
    for (let i = 0; i < n; i++) {
      if (!keep[i]) continue;
      if (isPreserved(i)) continue;
      const vx = Math.floor(cx[i] / densityVoxel);
      const vy = Math.floor(cy[i] / densityVoxel);
      const vz = Math.floor(cz[i] / densityVoxel);
      const key = `${vx},${vy},${vz}`;
      let arr = buckets.get(key);
      if (!arr) { arr = []; buckets.set(key, arr); }
      arr.push(i);
    }
    const counts = [...buckets.values()].map((a) => a.length);
    counts.sort((a, b) => a - b);
    const pIndex = Math.max(0, Math.min(counts.length - 1, Math.floor((counts.length - 1) * (densityPct / 100))));
    const cap = counts[pIndex];
    const median = counts[counts.length >> 1];
    const maxCount = counts[counts.length - 1];
    for (const arr of buckets.values()) {
      if (arr.length <= cap) continue;
      // Importance-based selection: keep the splats that actually carry
      // the surface (high alpha × largest scale = a wide, opaque splat).
      // Random selection drops big/opaque splats as readily as low-
      // contribution filler — which pokes visible holes in detailed
      // regions like the chair's wood grain. Sorting by importance and
      // keeping the top `cap` removes only the redundant filler.
      arr.sort((a, b) => {
        const sa = Math.max(scale[a * 3], scale[a * 3 + 1], scale[a * 3 + 2]);
        const sb = Math.max(scale[b * 3], scale[b * 3 + 1], scale[b * 3 + 2]);
        return alpha[b] * sb - alpha[a] * sa; // descending importance
      });
      for (let i = cap; i < arr.length; i++) {
        keep[arr[i]] = 0;
        droppedDensity++;
      }
    }
    densityStats = { voxels: buckets.size, median, p: densityPct, cap, maxCount, voxelSize: densityVoxel };
  }
  let kept = 0;
  for (let i = 0; i < n; i++) if (keep[i]) kept++;

  console.log(`\nsplats : ${fmt(n)} → ${fmt(kept)}  (kept ${((kept / n) * 100).toFixed(1)}%)`);
  if (minAlpha > 0) console.log(`  dropped by opacity : ${fmt(droppedAlpha)}`);
  if (doCull) console.log(`  dropped by cull    : ${fmt(droppedCull)}`);
  if (removeWhites) console.log(`  dropped by whites  : ${fmt(droppedWhite)}  (bright > ${whiteBright}, sat < ${whiteSat}, world-radius < ${whiteRadius})`);
  if (removeDarks) console.log(`  dropped by darks   : ${fmt(droppedDark)}  (bright < ${darkBright}, world-radius < ${darkRadius})`);
  if (densityStats) {
    console.log(
      `  dropped by density : ${fmt(droppedDensity)}  ` +
        `(${fmt(densityStats.voxels)} voxels @ ${densityStats.voxelSize}u, median ${densityStats.median}, ` +
        `cap=${densityStats.cap} at p${densityStats.p}, max was ${densityStats.maxCount})`,
    );
  }

  if (dry) {
    console.log('\n--dry: nothing written.\n');
    return;
  }

  // --- re-encode ---------------------------------------------------------
  const writer = new SpzWriter({
    numSplats: kept,
    shDegree: targetSh,
    fractionalBits: fracBits,
    flagAntiAlias: reader.flagAntiAlias,
  });
  const sh1 = new Float32Array(SH_BAND[1]);
  const sh2 = new Float32Array(SH_BAND[2]);
  const sh3 = new Float32Array(SH_BAND[3]);
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (!keep[i]) continue;
    writer.setCenter(j, cx[i], cy[i], cz[i]);
    writer.setAlpha(j, alpha[i]);
    writer.setRgb(j, rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
    writer.setScale(j, scale[i * 3], scale[i * 3 + 1], scale[i * 3 + 2]);
    writer.setQuat(j, quat[i * 4], quat[i * 4 + 1], quat[i * 4 + 2], quat[i * 4 + 3]);
    if (sh && targetSh >= 1) {
      let o = i * shFloats;
      for (let k = 0; k < SH_BAND[1]; k++) sh1[k] = sh[o++];
      if (targetSh >= 2) for (let k = 0; k < SH_BAND[2]; k++) sh2[k] = sh[o++];
      if (targetSh >= 3) for (let k = 0; k < SH_BAND[3]; k++) sh3[k] = sh[o++];
      writer.setSh(
        j,
        sh1,
        targetSh >= 2 ? sh2 : undefined,
        targetSh >= 3 ? sh3 : undefined,
      );
    }
    j++;
  }
  const outBytes = await writer.finalize();

  // --- output path -------------------------------------------------------
  let outPath;
  if (args.out) {
    outPath = resolve(repoRoot, args.out);
  } else {
    const tag = [];
    if (targetSh !== srcSh) tag.push(`sh${targetSh}`);
    if (minAlpha > 0) tag.push(`a${minAlpha}`);
    if (doCull) tag.push('cull');
    outPath = inPath.replace(/\.spz$/, `.${tag.join('-') || 'reenc'}.spz`);
  }
  writeFileSync(outPath, outBytes);

  const before = srcBytes.length;
  const after = outBytes.length;
  console.log(`\noutput : ${outPath.replace(repoRoot + '/', '')}`);
  console.log(`size   : ${mb(before)} MB → ${mb(after)} MB  ` +
    `(${(((before - after) / before) * 100).toFixed(1)}% smaller, saved ${mb(before - after)} MB)`);
  console.log('');
}

main().catch((e) => {
  console.error('optimize failed:', e);
  process.exit(1);
});
