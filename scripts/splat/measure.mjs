/**
 * Splat measurement — decode an .spz and report what's inside.
 *
 * Read-only: never writes the splat. Tells us splat count, SH degree, the
 * spatial layout (local + world space), opacity distribution, and a rough
 * sense of how much sits "behind" the camera — so we know which
 * optimizations are worth doing before building the tooling.
 *
 *   node scripts/splat/measure.mjs [path-to-spz]
 *
 * Default: public/assets/v_one_final.spz
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { SpzReader } from '@sparkjsdev/spark';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');
const spzPath = resolve(repoRoot, process.argv[2] ?? 'public/assets/v_one_final.spz');

// --- Splat-mesh world transform (from Scene.tsx) -------------------------
// <splatMesh position={[0,-0.5,0]} rotation={[-1.6,0,0]} />  → world = R·local + offset
const ROT_X = -1.6;
const OFFSET = [0, -0.5, 0];
const cosT = Math.cos(ROT_X);
const sinT = Math.sin(ROT_X);
const toWorld = (x, y, z) => [
  x + OFFSET[0],
  y * cosT - z * sinT + OFFSET[1],
  y * sinT + z * cosT + OFFSET[2],
];

// --- Stats helpers -------------------------------------------------------
const makeAxis = () => ({ min: Infinity, max: -Infinity, sum: 0 });
const feed = (a, v) => {
  if (v < a.min) a.min = v;
  if (v > a.max) a.max = v;
  a.sum += v;
};
const histogram = (values, lo, hi, bins = 24) => {
  const counts = new Array(bins).fill(0);
  const span = hi - lo || 1;
  for (const v of values) {
    let b = Math.floor(((v - lo) / span) * bins);
    if (b < 0) b = 0;
    if (b >= bins) b = bins - 1;
    counts[b]++;
  }
  return counts;
};
const bar = (n, max, width = 40) => '█'.repeat(Math.round((n / (max || 1)) * width));
const fmt = (n) => n.toLocaleString('en-US');

// --- SH cost model -------------------------------------------------------
// SPZ stores, per splat (pre-gzip): position 9B, scale 3B, color 3B,
// alpha 1B, rotation 3B = 19B base, plus SH coefficients at 1B each.
// SH coefficient counts per degree: deg1 = 9, deg2 = +15 (24), deg3 = +21 (45).
const SH_COEFFS = { 0: 0, 1: 9, 2: 24, 3: 45 };
const BASE_BYTES = 19;

async function main() {
  const bytes = readFileSync(spzPath);
  console.log(`\n=== ${spzPath.replace(repoRoot + '/', '')} ===`);
  console.log(`file on disk (gzipped) : ${(bytes.length / 1024 / 1024).toFixed(2)} MB`);

  const reader = new SpzReader({ fileBytes: new Uint8Array(bytes) });
  await reader.parseHeader();
  const { numSplats, shDegree, fractionalBits, version, flagAntiAlias, flagLod } = reader;
  console.log(`version                : ${version}`);
  console.log(`splats                 : ${fmt(numSplats)}`);
  console.log(`SH degree              : ${shDegree}`);
  console.log(`fractional bits        : ${fractionalBits}`);
  console.log(`antialiased / LOD      : ${flagAntiAlias} / ${flagLod}`);

  const shBytes = SH_COEFFS[shDegree] ?? 0;
  const perSplat = BASE_BYTES + shBytes;
  console.log(
    `\nraw bytes/splat (pre-gzip): ~${perSplat}  (base ${BASE_BYTES} + SH ${shBytes})`,
  );
  console.log(
    `SH share of raw payload   : ~${((shBytes / perSplat) * 100).toFixed(0)}%  ` +
      `→ raw total ~${((perSplat * numSplats) / 1024 / 1024).toFixed(1)} MB`,
  );
  for (const d of [0, 1, 2]) {
    if (d < shDegree) {
      const alt = BASE_BYTES + SH_COEFFS[d];
      console.log(
        `  if re-encoded at SH degree ${d}: raw payload ~${((alt / perSplat) * 100).toFixed(0)}% of current`,
      );
    }
  }

  // --- Decode centers + alpha -------------------------------------------
  const cx = new Float32Array(numSplats);
  const cy = new Float32Array(numSplats);
  const cz = new Float32Array(numSplats);
  const alpha = new Float32Array(numSplats);
  await reader.parseSplats(
    (i, x, y, z) => {
      cx[i] = x;
      cy[i] = y;
      cz[i] = z;
    },
    (i, a) => {
      alpha[i] = a;
    },
  );

  // --- Local + world bounding boxes -------------------------------------
  const local = { x: makeAxis(), y: makeAxis(), z: makeAxis() };
  const world = { x: makeAxis(), y: makeAxis(), z: makeAxis() };
  const worldZ = new Float32Array(numSplats);
  for (let i = 0; i < numSplats; i++) {
    feed(local.x, cx[i]);
    feed(local.y, cy[i]);
    feed(local.z, cz[i]);
    const [wx, wy, wz] = toWorld(cx[i], cy[i], cz[i]);
    feed(world.x, wx);
    feed(world.y, wy);
    feed(world.z, wz);
    worldZ[i] = wz;
  }
  const axisLine = (name, a) =>
    `  ${name}: [${a.min.toFixed(2)}, ${a.max.toFixed(2)}]  ` +
    `size ${(a.max - a.min).toFixed(2)}  mean ${(a.sum / numSplats).toFixed(2)}`;
  console.log('\nlocal-space bounds:');
  console.log(axisLine('x', local.x));
  console.log(axisLine('y', local.y));
  console.log(axisLine('z', local.z));
  console.log('world-space bounds (after mesh rotation+offset):');
  console.log(axisLine('x', world.x));
  console.log(axisLine('y', world.y));
  console.log(axisLine('z', world.z) + '   ← depth; camera ~Z 3.1 looking toward -Z');

  // --- World-Z (depth) histogram ----------------------------------------
  console.log('\nworld-Z depth distribution (camera near +Z, scene toward -Z):');
  const zCounts = histogram(worldZ, world.z.min, world.z.max, 24);
  const zMax = Math.max(...zCounts);
  const zSpan = (world.z.max - world.z.min) / 24;
  for (let b = 0; b < 24; b++) {
    const lo = world.z.min + b * zSpan;
    console.log(
      `  ${lo.toFixed(2).padStart(7)} ${bar(zCounts[b], zMax)} ${fmt(zCounts[b])}`,
    );
  }

  // --- "Behind the camera" rough counts ---------------------------------
  const CAM_Z = 3.1;
  let behindCam = 0;
  let farBehind = 0;
  for (let i = 0; i < numSplats; i++) {
    if (worldZ[i] > CAM_Z) behindCam++;
    if (worldZ[i] > CAM_Z + 2) farBehind++;
  }
  console.log(
    `\nsplats with worldZ > camera (3.1)      : ${fmt(behindCam)}  (${((behindCam / numSplats) * 100).toFixed(1)}%)`,
  );
  console.log(
    `splats well behind camera (Z > 5.1)    : ${fmt(farBehind)}  (${((farBehind / numSplats) * 100).toFixed(1)}%)`,
  );
  console.log('  (rough — true cull uses the orbit-swept frustum, computed later)');

  // --- Opacity distribution ---------------------------------------------
  const aAxis = makeAxis();
  for (let i = 0; i < numSplats; i++) feed(aAxis, alpha[i]);
  const aCounts = histogram(alpha, 0, 1, 20);
  const aMax = Math.max(...aCounts);
  console.log(
    `\nopacity: [${aAxis.min.toFixed(3)}, ${aAxis.max.toFixed(3)}]  mean ${(aAxis.sum / numSplats).toFixed(3)}`,
  );
  for (let b = 0; b < 20; b++) {
    console.log(
      `  ${(b / 20).toFixed(2)} ${bar(aCounts[b], aMax, 30)} ${fmt(aCounts[b])}`,
    );
  }
  let nearZero = 0;
  for (let i = 0; i < numSplats; i++) if (alpha[i] < 0.04) nearZero++;
  console.log(
    `near-transparent splats (alpha < 0.04) : ${fmt(nearZero)}  (${((nearZero / numSplats) * 100).toFixed(1)}%)  ← decimation candidates`,
  );

  // --- JSON report for downstream tooling -------------------------------
  const report = {
    path: spzPath.replace(repoRoot + '/', ''),
    diskBytes: bytes.length,
    numSplats,
    shDegree,
    fractionalBits,
    version,
    flagAntiAlias,
    flagLod,
    rawBytesPerSplat: perSplat,
    shShare: shBytes / perSplat,
    localBounds: {
      x: [local.x.min, local.x.max],
      y: [local.y.min, local.y.max],
      z: [local.z.min, local.z.max],
    },
    worldBounds: {
      x: [world.x.min, world.x.max],
      y: [world.y.min, world.y.max],
      z: [world.z.min, world.z.max],
    },
    behindCamera: behindCam,
    nearTransparent: nearZero,
  };
  const outPath = resolve(here, 'measure-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nreport written: ${outPath.replace(repoRoot + '/', '')}\n`);
}

main().catch((e) => {
  console.error('measure failed:', e);
  process.exit(1);
});
