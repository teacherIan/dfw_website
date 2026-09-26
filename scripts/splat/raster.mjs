/**
 * CPU Gaussian-splat rasteriser — a faithful stand-in for Spark's renderer,
 * used offline to measure how much each splat actually shows up on screen.
 *
 * Mirrors Spark 2.x's splat shaders: EWA projection with the 0.3 px²
 * anti-alias blur (and its opacity compensation), centres clipped at 1.4×
 * the frustum, quads capped at 512 px radius, maxStdDev √8, minAlpha 0.5/255,
 * radial front-to-back sort. Against Spark in headless Chromium the rendered
 * image matches at ~42 dB PSNR.
 *
 * The site's rest pose is applied (mesh rotated -1.6 rad about X, offset y
 * -0.5, then the PresentationControls orbit), plus the near-field splat-scale
 * boost from Scene.tsx (bottom-left/right ×1.55) since it changes occlusion.
 */

const rotX = (t) => { const c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const rotY = (t) => { const c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const mul3 = (a, b) => {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  }
  return o;
};
const smoothstep = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

// Scene.tsx: scales *= (1 + bottomLeft * 0.55) * (1 + bottomRight * 0.55)
const siteScaleBoost = (lx, lz) => {
  const bl = (1 - smoothstep(-2, 3, lz)) * (1 - smoothstep(-1.5, 1.5, lx));
  const br = (1 - smoothstep(-2, 3, lz)) * smoothstep(-1.5, 1.5, lx);
  return (1 + bl * 0.55) * (1 + br * 0.55);
};

/**
 * Render `s` (decodeSpz-shaped) and accumulate each splat's on-screen weight
 * (Σ transmittance × alpha over pixels, i.e. its effective pixel coverage).
 *
 * @param {object} view { w, h, fov (vertical, deg), pos [x,y,z], az, pol (deg) }
 * @returns {Float32Array} per-splat coverage in pixels
 */
export function splatCoverage(s, view) {
  const { w, h, fov = 50, pos = [0, 1.6, 3.1], az = 0, pol = 0 } = view;
  const maxStdDev = Math.sqrt(8), blur = 0.3, maxPixelRadius = 512, clipXY = 1.4, minAlpha = 0.5 / 255;
  const NEAR = 0.1, FAR = 1000;
  const n = s.numSplats;
  // camera orientation is fixed: R3F's lookAt(0,0,0) from the initial [0,2,4]
  const f = [0, -2 / Math.hypot(2, 4), -4 / Math.hypot(2, 4)];
  const up = [0, -f[2], f[1]]; // right = +X, up = f × right... (right × f)
  const V = [1, 0, 0, ...up, -f[0], -f[1], -f[2]];
  const Rg = mul3(rotX((pol * Math.PI) / 180), rotY((az * Math.PI) / 180));
  const VR = mul3(V, mul3(Rg, rotX(-1.6)));
  const tW = [Rg[1] * -0.5, Rg[4] * -0.5, Rg[7] * -0.5];
  const camT = [0, 1, 2].map((r) => V[r * 3] * (tW[0] - pos[0]) + V[r * 3 + 1] * (tW[1] - pos[1]) + V[r * 3 + 2] * (tW[2] - pos[2]));
  const fy = h / (2 * Math.tan((fov * Math.PI) / 360));
  const fx = fy, cx = w / 2, cy = h / 2;

  const px = new Float32Array(n), py = new Float32Array(n), dist = new Float32Array(n);
  const ex = new Float32Array(n), ey = new Float32Array(n), s1 = new Float32Array(n), s2 = new Float32Array(n);
  const rad = new Float32Array(n), op = new Float32Array(n);
  const order = [];
  for (let i = 0; i < n; i++) {
    const lx = s.centers[i * 3], ly = s.centers[i * 3 + 1], lz = s.centers[i * 3 + 2];
    const x = VR[0] * lx + VR[1] * ly + VR[2] * lz + camT[0];
    const y = VR[3] * lx + VR[4] * ly + VR[5] * lz + camT[1];
    const z = VR[6] * lx + VR[7] * ly + VR[8] * lz + camT[2];
    const tz = -z;
    if (tz <= NEAR || tz >= FAR) continue;
    if (Math.abs((fx * x) / tz) > clipXY * cx || Math.abs((fy * y) / tz) > clipXY * cy) continue;
    const qx = s.quats[i * 4], qy = s.quats[i * 4 + 1], qz = s.quats[i * 4 + 2], qw = s.quats[i * 4 + 3];
    const R = [
      1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qw * qz), 2 * (qx * qz + qw * qy),
      2 * (qx * qy + qw * qz), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qw * qx),
      2 * (qx * qz - qw * qy), 2 * (qy * qz + qw * qx), 1 - 2 * (qx * qx + qy * qy),
    ];
    const boost = siteScaleBoost(lx, lz);
    const M = mul3(VR, R);
    const sx = s.scales[i * 3] * boost, sy = s.scales[i * 3 + 1] * boost, sz = s.scales[i * 3 + 2] * boost;
    M[0] *= sx; M[3] *= sx; M[6] *= sx; M[1] *= sy; M[4] *= sy; M[7] *= sy; M[2] *= sz; M[5] *= sz; M[8] *= sz;
    const c00 = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
    const c01 = M[0] * M[3] + M[1] * M[4] + M[2] * M[5];
    const c02 = M[0] * M[6] + M[1] * M[7] + M[2] * M[8];
    const c11 = M[3] * M[3] + M[4] * M[4] + M[5] * M[5];
    const c12 = M[3] * M[6] + M[4] * M[7] + M[5] * M[8];
    const c22 = M[6] * M[6] + M[7] * M[7] + M[8] * M[8];
    const j00 = fx / tz, j02 = (fx * x) / (tz * tz), j11 = -fy / tz, j12 = (-fy * y) / (tz * tz);
    let a = (j00 * c00 + j02 * c02) * j00 + (j00 * c02 + j02 * c22) * j02;
    const b = (j00 * c01 + j02 * c12) * j11 + (j00 * c02 + j02 * c22) * j12;
    let d = (j11 * c11 + j12 * c12) * j11 + (j11 * c12 + j12 * c22) * j12;
    const det0 = a * d - b * b;
    a += blur; d += blur;
    const det = a * d - b * b;
    if (!(det > 1e-12)) continue;
    const alpha = s.alphas[i] * Math.sqrt(Math.max(det0, 0) / det);
    if (alpha < minAlpha) continue;
    const u = cx + (fx * x) / tz, v = cy - (fy * y) / tz;
    const mid = 0.5 * (a + d);
    const dl = Math.sqrt(Math.max(0, mid * mid - det));
    const e1 = mid + dl, e2 = Math.max(mid - dl, 1e-12);
    let vx = 1, vy = 0;
    if (Math.abs(b) > 0.001) { vx = b; vy = e1 - a; const l = Math.hypot(vx, vy); vx /= l; vy /= l; }
    else if (a < d) { vx = 0; vy = 1; }
    const k1 = Math.min(maxPixelRadius, maxStdDev * Math.sqrt(e1));
    const k2 = Math.min(maxPixelRadius, maxStdDev * Math.sqrt(e2));
    const r = Math.ceil(Math.max(k1, k2));
    if (u + r < 0 || u - r >= w || v + r < 0 || v - r >= h) continue;
    px[i] = u; py[i] = v; rad[i] = r; op[i] = alpha; ex[i] = vx; ey[i] = vy; s1[i] = k1; s2[i] = k2;
    dist[i] = Math.hypot(x, y, z);
    order.push(i);
  }
  order.sort((p, q) => dist[p] - dist[q]);

  const T = new Float32Array(w * h).fill(1);
  const coverage = new Float32Array(n);
  const maxQ = maxStdDev * maxStdDev;
  for (const i of order) {
    const u = px[i], v = py[i], r = rad[i];
    const x0 = Math.max(0, Math.floor(u - r)), x1 = Math.min(w - 1, Math.ceil(u + r));
    const y0 = Math.max(0, Math.floor(v - r)), y1 = Math.min(h - 1, Math.ceil(v + r));
    const vx = ex[i], vy = ey[i], m1 = maxStdDev / s1[i], m2 = maxStdDev / s2[i], a0 = op[i];
    let acc = 0;
    for (let yy = y0; yy <= y1; yy++) {
      const dy = yy + 0.5 - v;
      let p = yy * w + x0;
      for (let xx = x0; xx <= x1; xx++, p++) {
        const t = T[p];
        if (t < 1e-4) continue;
        const dx = xx + 0.5 - u;
        const u1 = (dx * vx + dy * vy) * m1, u2 = (dx * vy - dy * vx) * m2;
        const q = u1 * u1 + u2 * u2;
        if (q > maxQ) continue;
        const al = a0 * Math.exp(-0.5 * q);
        if (al < minAlpha) continue;
        acc += t * al;
        T[p] = t * (1 - al);
      }
    }
    coverage[i] = acc;
  }
  return coverage;
}
