/**
 * Scene edits for the hero splat — config-driven (see edits.json):
 *
 *   clear   — drop artifact splats in a region, by kind:
 *               pale  — bright, washed-out dots (a "white wall" of sparse shell
 *                       splats where the capture has no data)
 *               grey  — low-saturation grey/white structure (a house wall seen
 *                       through the trees at the edge of the orbit)
 *               fleck — pale outliers: brighter than their k nearest
 *                       neighbours by > delta and unsaturated (sun-glare
 *                       "white leaves" scattered through a canopy)
 *               blue  — blue-dominant splats (sky reflected in leaves right
 *                       next to the camera — a blue-white smear when tilted)
 *               big   — oversized, low-detail blobs (sun-washed background
 *                       foliage); sky-blue splats are spared unless
 *                       spareSky: false (regions below the horizon)
 *   patches — clone real captured foliage from an off-screen donor region
 *             into a region the capture missed. Each clone keeps its own
 *             shape and texture; the patch is placed with a rigid move
 *             (optional mirror + uniform scale about a pivot), feathered at
 *             its edges, colour-matched per height band to its left/right
 *             neighbours, and stripped of stray outliers.
 *
 * Coordinates are the site's rest pose ("world": mesh rotated -1.6 rad about X
 * and offset y -0.5, as in Scene.tsx), described about the vertical axis
 * through the origin — the centre of the capture's background dome:
 *   theta — degrees, atan2(x, -z): 0 = straight back (-Z), + = right (+X)
 *   h     — horizontal distance from that axis
 *   y     — height
 *
 * Deterministic for a given config (seeded PRNG), so the asset rebuilds
 * byte-for-byte.
 */

const MESH_ROT_X = -1.6;
const MESH_OFFSET_Y = -0.5;
const DEG = Math.PI / 180;

// --- small linear-algebra helpers (row-major 3×3) --------------------------
const rotX = (t) => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const mul3 = (a, b) => {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  }
  return o;
};
const transpose3 = (a) => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]];
const RM = rotX(MESH_ROT_X); // local → world rotation
const RMT = transpose3(RM);

const quatToMat = (x, y, z, w) => [
  1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y),
  2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
  2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y),
];
const matToQuat = (m) => {
  const t = m[0] + m[4] + m[8];
  let x, y, z, w;
  if (t > 0) {
    const s = Math.sqrt(t + 1) * 2;
    w = 0.25 * s; x = (m[7] - m[5]) / s; y = (m[2] - m[6]) / s; z = (m[3] - m[1]) / s;
  } else if (m[0] > m[4] && m[0] > m[8]) {
    const s = Math.sqrt(1 + m[0] - m[4] - m[8]) * 2;
    w = (m[7] - m[5]) / s; x = 0.25 * s; y = (m[1] + m[3]) / s; z = (m[2] + m[6]) / s;
  } else if (m[4] > m[8]) {
    const s = Math.sqrt(1 + m[4] - m[0] - m[8]) * 2;
    w = (m[2] - m[6]) / s; x = (m[1] + m[3]) / s; y = 0.25 * s; z = (m[5] + m[7]) / s;
  } else {
    const s = Math.sqrt(1 + m[8] - m[0] - m[4]) * 2;
    w = (m[3] - m[1]) / s; x = (m[2] + m[6]) / s; y = (m[5] + m[7]) / s; z = 0.25 * s;
  }
  const l = Math.hypot(x, y, z, w);
  return [x / l, y / l, z / l, w / l];
};

const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

// mulberry32 + Box–Muller: small, seedable, deterministic
const makeRng = (seed) => {
  let a = seed >>> 0;
  const uniform = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => {
    const u = Math.max(uniform(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * uniform());
  };
  return { uniform, normal };
};

/** Per-splat world position + polar description + colour stats. */
function describe(s) {
  const n = s.numSplats;
  const wx = new Float64Array(n), wy = new Float64Array(n), wz = new Float64Array(n);
  const theta = new Float64Array(n), h = new Float64Array(n);
  const br = new Float64Array(n), sat = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const lx = s.centers[i * 3], ly = s.centers[i * 3 + 1], lz = s.centers[i * 3 + 2];
    wx[i] = RM[0] * lx + RM[1] * ly + RM[2] * lz;
    wy[i] = RM[3] * lx + RM[4] * ly + RM[5] * lz + MESH_OFFSET_Y;
    wz[i] = RM[6] * lx + RM[7] * ly + RM[8] * lz;
    theta[i] = Math.atan2(wx[i], -wz[i]) / DEG;
    h[i] = Math.hypot(wx[i], wz[i]);
    const r = clamp01(s.rgb[i * 3]), g = clamp01(s.rgb[i * 3 + 1]), b = clamp01(s.rgb[i * 3 + 2]);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    br[i] = (r + g + b) / 3;
    sat[i] = mx > 1e-6 ? (mx - mn) / mx : 0;
  }
  return { wx, wy, wz, theta, h, br, sat };
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const inRange = (v, [lo, hi]) => v > lo && v < hi;
const maxScale = (s, i) => Math.max(s.scales[i * 3], s.scales[i * 3 + 1], s.scales[i * 3 + 2]);

// Alpha-weighted mean / std of colours over an index list.
function colourStats(rgbAt, alphaAt, list) {
  let wsum = 0;
  const mu = [0, 0, 0], v = [0, 0, 0];
  for (const i of list) {
    const w = alphaAt(i);
    wsum += w;
    for (let c = 0; c < 3; c++) mu[c] += w * rgbAt(i, c);
  }
  if (!(wsum > 0)) return null;
  for (let c = 0; c < 3; c++) mu[c] /= wsum;
  for (const i of list) {
    const w = alphaAt(i);
    for (let c = 0; c < 3; c++) v[c] += w * (rgbAt(i, c) - mu[c]) ** 2;
  }
  return { mu, sd: v.map((x) => Math.sqrt(x / wsum)) };
}

// Uniform grid over a point subset (CSR layout: cells sorted by counting
// sort), with exact k-nearest-neighbour search that grows one Chebyshev shell
// of cells at a time and stops once no unscanned cell can hold a closer point.
class PointGrid {
  constructor(px, py, pz, ids, targetPerCell) {
    this.px = px; this.py = py; this.pz = pz;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const i of ids) {
      lo[0] = Math.min(lo[0], px[i]); hi[0] = Math.max(hi[0], px[i]);
      lo[1] = Math.min(lo[1], py[i]); hi[1] = Math.max(hi[1], py[i]);
      lo[2] = Math.min(lo[2], pz[i]); hi[2] = Math.max(hi[2], pz[i]);
    }
    const span = hi.map((v, c) => Math.max(v - lo[c], 1e-6));
    let cell = Math.cbrt((span[0] * span[1] * span[2] * targetPerCell) / Math.max(ids.length, 1));
    // keep the cell array bounded
    while ((span[0] / cell + 1) * (span[1] / cell + 1) * (span[2] / cell + 1) > 4e6) cell *= 1.25;
    this.lo = lo; this.cell = cell;
    this.n = span.map((v) => Math.floor(v / cell) + 1);
    const cells = this.n[0] * this.n[1] * this.n[2];
    const cellIdx = new Int32Array(ids.length);
    const count = new Int32Array(cells + 1);
    ids.forEach((i, k) => { cellIdx[k] = this.cellOf(i); count[cellIdx[k] + 1]++; });
    for (let c = 0; c < cells; c++) count[c + 1] += count[c];
    this.start = count.slice();
    this.items = new Int32Array(ids.length);
    const fill = count.slice(0, cells);
    ids.forEach((i, k) => { this.items[fill[cellIdx[k]]++] = i; });
  }
  coord(v, c) { return Math.min(this.n[c] - 1, Math.max(0, Math.floor((v - this.lo[c]) / this.cell))); }
  cellOf(i) {
    return this.coord(this.px[i], 0) + this.n[0] * (this.coord(this.py[i], 1) + this.n[1] * this.coord(this.pz[i], 2));
  }
  /** Fills bestD (squared distances, ascending) / bestI with i's k nearest. */
  knn(i, k, bestD, bestI) {
    bestD.fill(Infinity);
    const x = this.px[i], y = this.py[i], z = this.pz[i];
    const gx = this.coord(x, 0), gy = this.coord(y, 1), gz = this.coord(z, 2);
    const [nx, ny, nz] = this.n;
    const maxR = Math.max(nx, ny, nz);
    for (let r = 0; r <= maxR; r++) {
      for (let dz = -r; dz <= r; dz++) {
        const cz = gz + dz; if (cz < 0 || cz >= nz) continue;
        for (let dy = -r; dy <= r; dy++) {
          const cy = gy + dy; if (cy < 0 || cy >= ny) continue;
          const onShellYZ = Math.abs(dz) === r || Math.abs(dy) === r;
          for (let dx = -r; dx <= r; dx += onShellYZ ? 1 : 2 * r || 1) {
            const cx = gx + dx; if (cx < 0 || cx >= nx) continue;
            const c = cx + nx * (cy + ny * cz);
            for (let p = this.start[c]; p < this.start[c + 1]; p++) {
              const j = this.items[p];
              if (j === i) continue;
              const ex = this.px[j] - x, ey = this.py[j] - y, ez = this.pz[j] - z;
              const dd = ex * ex + ey * ey + ez * ez;
              if (dd < bestD[k - 1]) {
                let q = k - 1;
                while (q > 0 && bestD[q - 1] > dd) { bestD[q] = bestD[q - 1]; bestI[q] = bestI[q - 1]; q--; }
                bestD[q] = dd; bestI[q] = j;
              }
            }
          }
        }
      }
      // every point outside the scanned cube is at least r cells away
      if (bestD[k - 1] <= (r * this.cell) ** 2) break;
    }
  }
}

// Mean distance from each point to its k nearest neighbours (within the set).
function knnMeanDist(px, py, pz, k) {
  const n = px.length;
  const out = new Float64Array(n);
  if (n <= k) return out;
  const ids = Array.from({ length: n }, (_, i) => i);
  const grid = new PointGrid(px, py, pz, ids, k / 2);
  const bestD = new Float64Array(k), bestI = new Int32Array(k);
  for (let i = 0; i < n; i++) {
    grid.knn(i, k, bestD, bestI);
    let sum = 0;
    for (let q = 0; q < k; q++) sum += Math.sqrt(bestD[q]);
    out[i] = sum / k;
  }
  return out;
}

// Mean alpha-weighted brightness of each query splat's k nearest neighbours
// among all surviving splats near the query region.
function neighbourBrightness(d, s, query, k, skip) {
  const out = new Float64Array(query.length);
  if (!query.length) return out;
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const i of query) {
    lo[0] = Math.min(lo[0], d.wx[i]); hi[0] = Math.max(hi[0], d.wx[i]);
    lo[1] = Math.min(lo[1], d.wy[i]); hi[1] = Math.max(hi[1], d.wy[i]);
    lo[2] = Math.min(lo[2], d.wz[i]); hi[2] = Math.max(hi[2], d.wz[i]);
  }
  const pad = 0.5;
  const cand = [];
  for (let i = 0; i < s.numSplats; i++) {
    if (skip[i]) continue;
    if (d.wx[i] > lo[0] - pad && d.wx[i] < hi[0] + pad && d.wy[i] > lo[1] - pad && d.wy[i] < hi[1] + pad
      && d.wz[i] > lo[2] - pad && d.wz[i] < hi[2] + pad) cand.push(i);
  }
  const grid = new PointGrid(d.wx, d.wy, d.wz, cand, k / 2);
  const bestD = new Float64Array(k), bestI = new Int32Array(k);
  query.forEach((i, qi) => {
    grid.knn(i, k, bestD, bestI);
    let wsum = 0, bsum = 0;
    for (let q = 0; q < k; q++) {
      if (!Number.isFinite(bestD[q])) continue;
      const j = bestI[q];
      wsum += s.alphas[j];
      bsum += s.alphas[j] * d.br[j];
    }
    out[qi] = wsum > 0 ? bsum / wsum : d.br[i];
  });
  return out;
}

/**
 * Apply edits to a decoded splat set. Returns a new set (removed splats
 * dropped, clones appended) plus a report. Clones get zeroed higher-order SH
 * (view-independent): the donor's SH was fitted to its own orientation.
 */
export function applyEdits(s, cfg, log = console.log) {
  const d = describe(s);
  const n = s.numSplats;
  const rgbAt = (i, c) => clamp01(s.rgb[i * 3 + c]);
  const alphaAt = (i) => s.alphas[i];

  // ---- clear -------------------------------------------------------------
  const remove = new Uint8Array(n);
  const clearCounts = {};
  for (const c of cfg.clear ?? []) {
    let count = 0;
    if (c.kind === 'fleck') {
      // pale outliers: much brighter than their neighbourhood and unsaturated
      const query = [];
      for (let i = 0; i < n; i++) {
        if (remove[i]) continue;
        if (inRange(d.theta[i], c.theta) && inRange(d.wy[i], c.y) && inRange(d.h[i], c.h)) query.push(i);
      }
      const nb = neighbourBrightness(d, s, query, c.k ?? 32, remove);
      query.forEach((i, qi) => {
        if (d.br[i] - nb[qi] > c.delta && d.sat[i] < c.maxSat && d.br[i] > c.minBright) { remove[i] = 1; count++; }
      });
      clearCounts[c.name] = count;
      log(`  clear ${c.name.padEnd(18)} ${String(count).padStart(6)} splats (${c.kind})`);
      continue;
    }
    for (let i = 0; i < n; i++) {
      if (remove[i]) continue;
      if (!inRange(d.theta[i], c.theta) || !inRange(d.wy[i], c.y) || !inRange(d.h[i], c.h)) continue;
      let hit = false;
      if (c.kind === 'pale') hit = d.br[i] > 0.55 && d.sat[i] < 0.35;
      else if (c.kind === 'grey') hit = d.sat[i] < 0.22 && d.br[i] > 0.3;
      else if (c.kind === 'blue') hit = rgbAt(i, 2) > rgbAt(i, 1) + 0.05 && rgbAt(i, 2) > rgbAt(i, 0) + 0.15;
      else if (c.kind === 'big') {
        // sky-blue blobs are spared unless the region is below the horizon
        const sky = c.spareSky !== false && rgbAt(i, 2) > rgbAt(i, 1) + 0.02;
        hit = maxScale(s, i) > c.minScale && !sky;
      }
      else throw new Error(`unknown clear kind "${c.kind}"`);
      if (hit) { remove[i] = 1; count++; }
    }
    clearCounts[c.name] = count;
    log(`  clear ${c.name.padEnd(18)} ${String(count).padStart(6)} splats (${c.kind})`);
  }

  // ---- patches -----------------------------------------------------------
  const clones = [];
  cfg.patches?.forEach((p, pi) => {
    const rng = makeRng((cfg.seed ?? 1) * 1000 + pi);
    // donor selection (never clone grey structure or sky specks)
    const donor = [];
    for (let i = 0; i < n; i++) {
      const inBox = p.donor.some((b) => inRange(d.theta[i], b.theta) && inRange(d.h[i], b.h) && inRange(d.wy[i], b.y));
      if (!inBox) continue;
      if (d.sat[i] < 0.2 && d.br[i] > 0.3) continue;
      if (rgbAt(i, 2) > rgbAt(i, 1) + 0.02) continue;
      donor.push(i);
    }
    // placement: mirror about the pivot meridian, scale about the pivot, push
    // outward, rotate about the vertical axis so the pivot lands at placeAt,
    // then lift so it lands at placeY.
    const tp = p.pivot.theta * DEG;
    const dir = [Math.sin(tp), 0, -Math.cos(tp)];
    const P = [dir[0] * p.pivot.h, p.pivot.y, dir[2] * p.pivot.h];
    const nrm = [Math.cos(tp), 0, Math.sin(tp)];
    const M = p.mirror
      ? [1 - 2 * nrm[0] * nrm[0], -2 * nrm[0] * nrm[1], -2 * nrm[0] * nrm[2],
         -2 * nrm[1] * nrm[0], 1 - 2 * nrm[1] * nrm[1], -2 * nrm[1] * nrm[2],
         -2 * nrm[2] * nrm[0], -2 * nrm[2] * nrm[1], 1 - 2 * nrm[2] * nrm[2]]
      : [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const scale = p.scale ?? 1;
    const push = p.push ?? 0;
    const Ry = rotY((p.pivot.theta - p.placeAt) * DEG);
    const L = mul3(Ry, M);
    const dy = p.placeY - p.pivot.y;
    const [t0, t1] = p.target.theta;
    const fe = p.target.feather ?? 3;
    const yTop = p.target.yTop ?? Infinity;

    const kept = [];
    for (const i of donor) {
      let x = d.wx[i] - P[0], y = d.wy[i] - P[1], z = d.wz[i] - P[2];
      [x, y, z] = [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z];
      x = P[0] + scale * x + dir[0] * push; y = P[1] + scale * y; z = P[2] + scale * z + dir[2] * push;
      const X = Ry[0] * x + Ry[1] * y + Ry[2] * z;
      const Y = Ry[3] * x + Ry[4] * y + Ry[5] * z + dy;
      const Z = Ry[6] * x + Ry[7] * y + Ry[8] * z;
      const th = Math.atan2(X, -Z) / DEG;
      // feathered, irregular edges: jitter the boundary per splat
      const nt = rng.normal() * fe * 0.35;
      let m = smoothstep(t0 - fe, t0 + fe * 0.3, th + nt) * (1 - smoothstep(t1 - fe * 0.3, t1 + fe, th + nt));
      m *= 1 - smoothstep(yTop - 0.25, yTop + 0.1, Y + rng.normal() * 0.08);
      if (rng.uniform() >= m * (p.density ?? 1)) continue;
      kept.push({ i, X, Y, Z, th });
    }

    // strays: isolated clones (mean kNN distance far above typical) — these
    // read as floating leaves at the feathered edges. Large splats are
    // legitimately sparse, so a gap within a few of their own sizes is kept.
    let clonesP = kept;
    if (p.sor) {
      const md = knnMeanDist(kept.map((c) => c.X), kept.map((c) => c.Y), kept.map((c) => c.Z), p.sor.k);
      let mean = 0; for (const v of md) mean += v; mean /= md.length;
      let varc = 0; for (const v of md) varc += (v - mean) ** 2;
      const lim = mean + p.sor.std * Math.sqrt(varc / md.length);
      clonesP = kept.filter((c, k) => md[k] < lim || md[k] < 3 * maxScale(s, c.i) * scale * scale);
    }

    // palette: per height band, map donor colour stats onto a left→right blend
    // of the neighbours' stats at the same height (h 4.4–6.6)
    const refIdx = (range) => {
      const out = [];
      for (let i = 0; i < n; i++) if (!remove[i] && inRange(d.theta[i], range) && d.h[i] > 4.4 && d.h[i] < 6.6) out.push(i);
      return out;
    };
    const leftRef = refIdx(p.palette.left), rightRef = refIdx(p.palette.right);
    const bandStats = (list, yc) => {
      const b = list.filter((i) => Math.abs(d.wy[i] - yc) < 0.3);
      return b.length >= 50 ? colourStats(rgbAt, alphaAt, b) : null;
    };
    const colours = clonesP.map((c) => [rgbAt(c.i, 0), rgbAt(c.i, 1), rgbAt(c.i, 2)]);
    const graded = colours.map((c) => c.slice());
    if (clonesP.length) {
      let yMin = Infinity, yMax = -Infinity;
      for (const c of clonesP) { yMin = Math.min(yMin, c.Y); yMax = Math.max(yMax, c.Y); }
      for (let yb = yMin - 0.15; yb < yMax + 0.3; yb += 0.15) {
        const inBin = [], near = [];
        clonesP.forEach((c, k) => {
          if (c.Y >= yb && c.Y < yb + 0.15) inBin.push(k);
          if (Math.abs(c.Y - (yb + 0.075)) < 0.3) near.push(k);
        });
        if (!inBin.length || near.length < 30) continue;
        const dS = colourStats((k, ch) => colours[k][ch], (k) => s.alphas[clonesP[k].i], near);
        if (!dS) continue;
        let Ls = bandStats(leftRef, yb + 0.075), Rs = bandStats(rightRef, yb + 0.075);
        if (!Ls && !Rs) continue;
        Ls ??= Rs; Rs ??= Ls;
        for (const k of inBin) {
          const wl = 1 - smoothstep(t0, t1, clonesP[k].th);
          for (let ch = 0; ch < 3; ch++) {
            let mu = Ls.mu[ch] * wl + Rs.mu[ch] * (1 - wl);
            const sd = Ls.sd[ch] * wl + Rs.sd[ch] * (1 - wl);
            if (p.palette.mu) mu = mu * (1 - p.palette.muBlend) + p.palette.mu[ch] * p.palette.muBlend;
            const sc = Math.min(Math.max(sd / Math.max(dS.sd[ch], 1e-4), 0.75), 1.3);
            graded[k][ch] = mu + (colours[k][ch] - dS.mu[ch]) * sc;
          }
        }
      }
    }
    const strength = p.palette.strength ?? 0.8;
    const gain = p.palette.gain ?? 1;
    const jitter = p.palette.jitter ?? 0.02;
    clonesP.forEach((c, k) => {
      const j = gain * (1 + rng.normal() * jitter);
      for (let ch = 0; ch < 3; ch++) graded[k][ch] = clamp01((colours[k][ch] * (1 - strength) + graded[k][ch] * strength) * j);
    });

    // orientation: world-frame rotation, then back to the local frame
    const splatScale = scale * (p.splatScale ?? 1);
    for (let k = 0; k < clonesP.length; k++) {
      const { i, X, Y, Z } = clonesP[k];
      const R = quatToMat(s.quats[i * 4], s.quats[i * 4 + 1], s.quats[i * 4 + 2], s.quats[i * 4 + 3]);
      const Rw = mul3(L, mul3(RM, R));
      if (p.mirror) { Rw[0] = -Rw[0]; Rw[3] = -Rw[3]; Rw[6] = -Rw[6]; } // keep det +1 (ellipsoid is symmetric)
      const q = matToQuat(mul3(RMT, Rw));
      const wy = Y - MESH_OFFSET_Y;
      clones.push({
        center: [RMT[0] * X + RMT[1] * wy + RMT[2] * Z, RMT[3] * X + RMT[4] * wy + RMT[5] * Z, RMT[6] * X + RMT[7] * wy + RMT[8] * Z],
        quat: q,
        rgb: graded[k],
        alpha: s.alphas[i],
        scale: [s.scales[i * 3] * splatScale, s.scales[i * 3 + 1] * splatScale, s.scales[i * 3 + 2] * splatScale],
      });
    }
    log(`  patch ${p.name.padEnd(18)} ${String(clonesP.length).padStart(6)} clones (donor ${donor.length}, feathered ${kept.length}, strays -${kept.length - clonesP.length})`);
  });

  // ---- assemble ----------------------------------------------------------
  let keep = 0;
  for (let i = 0; i < n; i++) if (!remove[i]) keep++;
  const m = keep + clones.length;
  const out = {
    ...s,
    numSplats: m,
    centers: new Float32Array(m * 3),
    alphas: new Float32Array(m),
    rgb: new Float32Array(m * 3),
    scales: new Float32Array(m * 3),
    quats: new Float32Array(m * 4),
    sh: null,
  };
  const shCount = s.sh ? s.sh.length / n : 0;
  if (s.sh) out.sh = new Float32Array(m * shCount); // clones' rows stay zero
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (remove[i]) continue;
    out.centers.set(s.centers.subarray(i * 3, i * 3 + 3), j * 3);
    out.alphas[j] = s.alphas[i];
    out.rgb.set(s.rgb.subarray(i * 3, i * 3 + 3), j * 3);
    out.scales.set(s.scales.subarray(i * 3, i * 3 + 3), j * 3);
    out.quats.set(s.quats.subarray(i * 4, i * 4 + 4), j * 4);
    if (out.sh) out.sh.set(s.sh.subarray(i * shCount, (i + 1) * shCount), j * shCount);
    j++;
  }
  for (const c of clones) {
    out.centers.set(c.center, j * 3);
    out.alphas[j] = c.alpha;
    out.rgb.set(c.rgb, j * 3);
    out.scales.set(c.scale, j * 3);
    out.quats.set(c.quat, j * 4);
    j++;
  }
  return { splats: out, removed: n - keep, added: clones.length, clearCounts };
}
