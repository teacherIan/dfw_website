/**
 * UI shots — screenshots of the production build (dist/) at device sizes, on a
 * controlled clock, for checking the layout and the intro frame by frame even
 * where rendering is slow (software WebGL, CI).
 *
 *   npm run build
 *   node scripts/ui-shots.mjs [options]
 *
 * The page runs on a virtual clock: performance.now, Date.now,
 * requestAnimationFrame and every setTimeout of 1 s or more only advance when
 * this script steps them. Each shot therefore shows exactly the requested
 * moment of the intro, however long a frame takes to render. (Shorter timers,
 * CSS transitions and web fonts still run in real time and settle on their own.)
 *
 * Options:
 *   --sizes=WxH[,WxH...]  viewport sizes (default: phones, tablets, laptops, desktop)
 *   --film[=STEP]         capture the intro every STEP seconds (default 1) from the
 *                         end of the loading screen, instead of the settled screen
 *   --until=SEC           last intro second to capture with --film (default 20)
 *   --light               serve a thinned splat (every 40th splat): fast, and fine
 *                         for layout checks, but not for judging the scene itself
 *   --out=DIR             output folder (default ui-shots/, git-ignored)
 *   --swiftshader         software WebGL, for machines without a usable GPU
 *   --chrome=PATH         browser to drive (default puppeteer's own, or $CHROME_PATH)
 *
 * Output: <out>/<W>x<H>.png (settled), or <out>/<W>x<H>/t<seconds>.png (--film).
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import sirv from 'sirv';
import { decodeSpz, encodeSpz, selectSplats } from './splat/spz.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const dist = join(repoRoot, 'dist');

// --- args ----------------------------------------------------------------
const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args[m[1]] = m[2] ?? true;
}
const DEFAULT_SIZES = '390x844,768x1024,844x390,800x450,1024x768,1280x720,1366x768,1920x1080';
const sizes = String(args.sizes ?? DEFAULT_SIZES)
  .split(',')
  .map((s) => s.split('x').map(Number));
const film = args.film ? (args.film === true ? 1 : Number(args.film)) : 0;
const until = Number(args.until ?? 20);
const outDir = resolve(repoRoot, typeof args.out === 'string' ? args.out : 'ui-shots');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/ not found — run `npm run build` first');
  process.exit(1);
}

// --- server ----------------------------------------------------------------
// dist/ as-is; with --light the hero splat is swapped for a thinned copy.
const HERO = '/assets/v_one_final.opt.spz';
let lightSplat = null;
if (args.light) {
  const s = decodeSpz(readFileSync(join(dist, HERO)), { sh: false });
  const keep = [];
  for (let i = 0; i < s.numSplats; i += 40) keep.push(i);
  lightSplat = encodeSpz(selectSplats(s, Uint32Array.from(keep)), { shDegree: 0 });
}
const serve = sirv(dist, { dev: false, single: true, etag: false });
const server = createServer((req, res) => {
  if (lightSplat && req.url.split('?')[0] === HERO) {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': lightSplat.length });
    res.end(lightSplat);
    return;
  }
  serve(req, res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const { port } = server.address();

// --- virtual clock (injected before any page script) ------------------------
const CLOCK = `(() => {
  const epoch = Date.now();
  let vt = 0;
  performance.now = () => vt;
  Date.now = () => epoch + vt;
  let frames = new Map();
  let nextFrame = 1;
  window.requestAnimationFrame = (cb) => { const id = nextFrame++; frames.set(id, cb); return id; };
  window.cancelAnimationFrame = (id) => { frames.delete(id); };
  const realSetTimeout = window.setTimeout.bind(window);
  const realClearTimeout = window.clearTimeout.bind(window);
  const timers = new Map();
  let nextTimer = 1e9;
  window.setTimeout = (fn, delay = 0, ...rest) => {
    if (typeof fn !== 'function' || delay < 1000) return realSetTimeout(fn, delay, ...rest);
    const id = nextTimer++;
    timers.set(id, { due: vt + delay, fn, rest });
    return id;
  };
  window.clearTimeout = (id) => { if (!timers.delete(id)) realClearTimeout(id); };
  window.__clock = {
    step(ms) {
      vt += ms;
      for (const [id, t] of [...timers].sort((a, b) => a[1].due - b[1].due)) {
        if (t.due <= vt) { timers.delete(id); t.fn(...t.rest); }
      }
      const due = [...frames.values()];
      frames = new Map();
      for (const cb of due) cb(vt);
    },
    now: () => vt,
  };
})();`;

// --- capture ---------------------------------------------------------------
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const step = (page, ms) => page.evaluate((m) => window.__clock.step(m), ms);

/** Re-render the same moment until two consecutive frames match (Spark's sort has landed). */
async function settledShot(page) {
  let prev = null;
  for (let i = 0; i < 6; i++) {
    await sleep(i === 0 ? 400 : 700);
    await step(page, 0);
    await sleep(150);
    const shot = await page.screenshot({ type: 'png' });
    if (prev && Buffer.compare(shot, prev) === 0) return shot;
    prev = shot;
  }
  return prev;
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: typeof args.chrome === 'string' ? args.chrome : process.env.CHROME_PATH,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--ignore-gpu-blocklist',
    ...(args.swiftshader ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
  ],
  protocolTimeout: 15 * 60_000,
});
const shown = (file) => {
  const rel = relative(process.cwd(), file);
  return rel.startsWith('..') ? file : rel;
};
try {
  mkdirSync(outDir, { recursive: true });
  for (const [w, h] of sizes) {
    const page = await browser.newPage();
    page.on('pageerror', (err) => console.log(`  [pageerror] ${err?.message ?? err}`));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(CLOCK);
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });

    // Loading screen, paced roughly in real time (the splat downloads and
    // decodes for real), until it starts fading out: the intro's t = 0.
    for (let waited = 0; ; waited += 200) {
      await step(page, 200);
      await sleep(60);
      const fading = await page.evaluate(() => document.querySelector('.ls-root')?.style.opacity === '0');
      if (fading) break;
      if (waited > 60_000) throw new Error(`${w}x${h}: the loading screen never finished`);
    }

    if (film) {
      const dir = join(outDir, `${w}x${h}`);
      mkdirSync(dir, { recursive: true });
      for (let t = 0; t <= until + 1e-9; t += film) {
        if (t > 0) await step(page, film * 1000);
        const file = join(dir, `t${t.toFixed(1).padStart(4, '0')}.png`);
        writeFileSync(file, await settledShot(page));
        console.log(`  ${shown(file)}`);
      }
    } else {
      // Play the whole intro in 1 s steps so every entrance animation runs.
      for (let t = 0; t < 32; t++) {
        await step(page, 1000);
        await sleep(120);
      }
      const file = join(outDir, `${w}x${h}.png`);
      writeFileSync(file, await settledShot(page));
      console.log(`  ${shown(file)}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
