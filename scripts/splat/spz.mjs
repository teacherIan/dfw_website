/**
 * Minimal SPZ codec (Niantic SPZ v2/v3) for the offline splat tooling.
 *
 * Spark 2.2 moved its SPZ parsing into WASM and stopped exporting the
 * SpzReader / SpzWriter classes these scripts were built on, so the tooling
 * carries its own codec. Quantization mirrors Spark 2.1's SpzReader /
 * SpzWriter exactly: decoding matches SpzReader to float32 precision, and
 * re-encoding with the same header fields reproduces the original payload
 * except for rare (~0.2%) quaternions whose two largest components are within
 * one quantization step — those re-encode to an equivalent rotation.
 *
 * Everything is columnar typed arrays (no per-splat callbacks), so decoding
 * or encoding a ~1.4M-splat scene takes well under a second.
 *
 *   const splats = decodeSpz(readFileSync(path));
 *   // splats.centers / alphas / rgb / scales / quats / sh (see decodeSpz)
 *   writeFileSync(out, encodeSpz(splats));
 */
import { gunzipSync, gzipSync, constants as zlibConstants } from 'node:zlib';

const SPZ_MAGIC = 0x5053474e; // "NGSP"
const FLAG_ANTIALIASED = 0x1;
const FLAG_LOD = 0x80;
const SH_C0 = 0.28209479177387814;
// SPZ stores the DC colour as SH coefficients scaled by 0.15 around 0.5.
const COLOR_SCALE = SH_C0 / 0.15;
/** SH coefficient vectors (each × 3 channels) stored per splat, by degree. */
export const SH_VECS = { 0: 0, 1: 3, 2: 8, 3: 15 };
const QUAT_MASK = (1 << 9) - 1;

/**
 * Decode an .spz file into columnar float arrays.
 *
 * @param {Uint8Array} fileBytes gzipped .spz bytes
 * @param {{ sh?: boolean }} [opts] sh: false skips decoding the SH bands
 *   (sh comes back null) — saves ~180 B/splat when only SH0 is needed.
 * @returns {{
 *   numSplats: number, version: number, shDegree: number, fractionalBits: number,
 *   flagAntiAlias: boolean,
 *   centers: Float32Array, // n*3, local space
 *   alphas: Float32Array,  // n, 0..1
 *   rgb: Float32Array,     // n*3, base colour (≈0..1, may exceed slightly)
 *   scales: Float32Array,  // n*3, linear (not log) scale
 *   quats: Float32Array,   // n*4, x y z w
 *   sh: Float32Array|null, // n*SH_VECS[shDegree]*3, file order
 * }}
 */
export function decodeSpz(fileBytes, opts = {}) {
  const raw = gunzipSync(fileBytes);
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  if (view.getUint32(0, true) !== SPZ_MAGIC) throw new Error('not an SPZ file');
  const version = view.getUint32(4, true);
  if (version !== 2 && version !== 3) throw new Error(`unsupported SPZ version ${version}`);
  const n = view.getUint32(8, true);
  const shDegree = view.getUint8(12);
  const fractionalBits = view.getUint8(13);
  const flags = view.getUint8(14);
  if (flags & FLAG_LOD) throw new Error('SPZ files with an LoD tree are not supported');

  let o = 16;
  const centers = new Float32Array(n * 3);
  const fixed = 1 << fractionalBits;
  for (let i = 0; i < n * 3; i++, o += 3) {
    // 24-bit little-endian two's complement → sign-extend via << 8 >> 8
    centers[i] = ((raw[o + 2] << 24) | (raw[o + 1] << 16) | (raw[o] << 8)) >> 8;
    centers[i] /= fixed;
  }
  const alphas = new Float32Array(n);
  for (let i = 0; i < n; i++) alphas[i] = raw[o++] / 255;
  const rgb = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) rgb[i] = (raw[o++] / 255 - 0.5) * COLOR_SCALE + 0.5;
  const scales = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) scales[i] = Math.exp(raw[o++] / 16 - 10);

  const quats = new Float32Array(n * 4);
  if (version === 3) {
    // "smallest three": 2-bit index of the largest component, then the other
    // three as sign + 9-bit magnitude scaled by 1/√2.
    for (let i = 0; i < n; i++, o += 4) {
      const packed = (raw[o] | (raw[o + 1] << 8) | (raw[o + 2] << 16) | (raw[o + 3] << 24)) >>> 0;
      const largest = packed >>> 30;
      let rest = packed;
      let sumSq = 0;
      const q = i * 4;
      for (let c = 3; c >= 0; c--) {
        if (c === largest) continue;
        const mag = rest & QUAT_MASK;
        const neg = (rest >>> 9) & 1;
        rest >>>= 10;
        const v = Math.SQRT1_2 * (mag / QUAT_MASK);
        quats[q + c] = neg ? -v : v;
        sumSq += v * v;
      }
      quats[q + largest] = Math.sqrt(Math.max(1 - sumSq, 0));
    }
  } else {
    for (let i = 0; i < n; i++, o += 3) {
      const x = raw[o] / 127.5 - 1;
      const y = raw[o + 1] / 127.5 - 1;
      const z = raw[o + 2] / 127.5 - 1;
      const q = i * 4;
      quats[q] = x;
      quats[q + 1] = y;
      quats[q + 2] = z;
      quats[q + 3] = Math.sqrt(Math.max(0, 1 - x * x - y * y - z * z));
    }
  }

  let sh = null;
  const shCount = SH_VECS[shDegree] * 3;
  if (shCount && opts.sh !== false) {
    sh = new Float32Array(n * shCount);
    for (let i = 0; i < n * shCount; i++) sh[i] = (raw[o++] - 128) / 128;
  }

  return {
    numSplats: n,
    version,
    shDegree,
    fractionalBits,
    flagAntiAlias: (flags & FLAG_ANTIALIASED) !== 0,
    centers,
    alphas,
    rgb,
    scales,
    quats,
    sh,
  };
}

const clampByte = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// SpzWriter.quantizeSh: round to 8 bits, then snap to a `bits`-bit bucket.
const quantizeSh = (v, bits) => {
  const value = Math.round(v * 128) + 128;
  const bucket = 1 << (8 - bits);
  return clampByte(Math.floor((value + bucket / 2) / bucket) * bucket);
};

/**
 * Encode columnar splats (the shape decodeSpz returns) as a v3 .spz.
 *
 * `shDegree` may be lowered below the source's degree: higher bands in `sh`
 * are dropped. `sh` must hold SH_VECS[srcShDegree]*3 floats per splat, where
 * srcShDegree is `splats.srcShDegree ?? splats.shDegree`.
 *
 * @param {object} splats  { numSplats, centers, alphas, rgb, scales, quats, sh? }
 * @param {object} [opts]  { shDegree, fractionalBits, flagAntiAlias, level }
 * @returns {Uint8Array} gzipped .spz bytes
 */
export function encodeSpz(splats, opts = {}) {
  const n = splats.numSplats;
  const srcSh = splats.srcShDegree ?? splats.shDegree ?? 0;
  const shDegree = Math.min(opts.shDegree ?? splats.shDegree ?? 0, splats.sh ? srcSh : 0);
  const fractionalBits = opts.fractionalBits ?? splats.fractionalBits ?? 12;
  const flagAntiAlias = opts.flagAntiAlias ?? splats.flagAntiAlias ?? true;
  const outShCount = SH_VECS[shDegree] * 3;
  const srcShCount = SH_VECS[srcSh] * 3;

  const raw = new Uint8Array(16 + n * (9 + 1 + 3 + 3 + 4 + outShCount));
  const view = new DataView(raw.buffer);
  view.setUint32(0, SPZ_MAGIC, true);
  view.setUint32(4, 3, true);
  view.setUint32(8, n, true);
  view.setUint8(12, shDegree);
  view.setUint8(13, fractionalBits);
  view.setUint8(14, flagAntiAlias ? FLAG_ANTIALIASED : 0);

  let o = 16;
  let clipped = 0;
  const fixed = 1 << fractionalBits;
  const { centers, alphas, rgb, scales, quats, sh } = splats;
  for (let i = 0; i < n * 3; i++, o += 3) {
    const rounded = Math.round(centers[i] * fixed);
    const v = Math.max(-8388607, Math.min(8388607, rounded));
    if (v !== rounded) clipped++;
    raw[o] = v & 255;
    raw[o + 1] = (v >> 8) & 255;
    raw[o + 2] = (v >> 16) & 255;
  }
  for (let i = 0; i < n; i++) raw[o++] = clampByte(Math.round(alphas[i] * 255));
  for (let i = 0; i < n * 3; i++) {
    raw[o++] = clampByte(Math.round(((rgb[i] - 0.5) / COLOR_SCALE + 0.5) * 255));
  }
  for (let i = 0; i < n * 3; i++) {
    raw[o++] = clampByte(Math.round((Math.log(scales[i]) + 10) * 16));
  }
  for (let i = 0; i < n; i++, o += 4) {
    const q = i * 4;
    const x = quats[q];
    const y = quats[q + 1];
    const z = quats[q + 2];
    const w = quats[q + 3];
    // same expression as Spark's normalize() (not Math.hypot, which can
    // differ by an ulp and flip a rounding boundary)
    const len = Math.sqrt(x * x + y * y + z * z + w * w) || 1;
    const quat = [x / len, y / len, z / len, w / len];
    let largest = 0;
    for (let c = 1; c < 4; c++) if (Math.abs(quat[c]) > Math.abs(quat[largest])) largest = c;
    const negate = quat[largest] < 0 ? 1 : 0;
    let packed = largest;
    for (let c = 0; c < 4; c++) {
      if (c === largest) continue;
      const negbit = (quat[c] < 0 ? 1 : 0) ^ negate;
      const mag = Math.floor(QUAT_MASK * (Math.abs(quat[c]) / Math.SQRT1_2) + 0.5);
      packed = (packed << 10) | (negbit << 9) | mag;
    }
    raw[o] = packed & 255;
    raw[o + 1] = (packed >> 8) & 255;
    raw[o + 2] = (packed >> 16) & 255;
    raw[o + 3] = (packed >>> 24) & 255;
  }
  if (outShCount) {
    for (let i = 0; i < n; i++) {
      const s = i * srcShCount;
      // degree-1 band uses 5-bit buckets, higher bands 4-bit (SpzWriter)
      for (let k = 0; k < outShCount; k++) raw[o++] = quantizeSh(sh[s + k], k < 9 ? 5 : 4);
    }
  }

  const out = gzipSync(raw, { level: opts.level ?? zlibConstants.Z_BEST_COMPRESSION });
  if (clipped) console.warn(`encodeSpz: ${clipped} coordinates clipped to the 24-bit range`);
  return new Uint8Array(out.buffer, out.byteOffset, out.byteLength);
}

/**
 * Return a copy of `splats` holding only the indices in `order` (in that
 * order). Used both to filter (keep-mask → index list) and to reorder.
 */
export function selectSplats(splats, order) {
  const n = order.length;
  const shCount = splats.sh ? SH_VECS[splats.srcShDegree ?? splats.shDegree] * 3 : 0;
  const out = {
    ...splats,
    numSplats: n,
    centers: new Float32Array(n * 3),
    alphas: new Float32Array(n),
    rgb: new Float32Array(n * 3),
    scales: new Float32Array(n * 3),
    quats: new Float32Array(n * 4),
    sh: shCount ? new Float32Array(n * shCount) : null,
  };
  for (let j = 0; j < n; j++) {
    const i = order[j];
    out.centers.set(splats.centers.subarray(i * 3, i * 3 + 3), j * 3);
    out.alphas[j] = splats.alphas[i];
    out.rgb.set(splats.rgb.subarray(i * 3, i * 3 + 3), j * 3);
    out.scales.set(splats.scales.subarray(i * 3, i * 3 + 3), j * 3);
    out.quats.set(splats.quats.subarray(i * 4, i * 4 + 4), j * 4);
    if (shCount) out.sh.set(splats.sh.subarray(i * shCount, (i + 1) * shCount), j * shCount);
  }
  return out;
}
