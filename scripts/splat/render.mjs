/**
 * Splat renders — screenshot a splat the way the site shows it, from the
 * site's own camera poses, in headless Chrome (three + Spark straight from
 * node_modules; the page itself is render-page.js).
 *
 * Use it to check a rebuilt splat before shipping it, e.g. before/after a
 * change to edits.json:
 *
 *   node --max-old-space-size=6000 scripts/splat/optimize.mjs <README flags> --out=/tmp/new.spz
 *   node scripts/splat/render.mjs --spz=public/assets/v_one_final.opt.spz,/tmp/new.spz
 *
 * Options:
 *   --spz=PATH[,PATH...]  splat(s) to render (default public/assets/v_one_final.opt.spz).
 *                  Every view is rendered for every splat, as
 *                  <out>/<view>--<splat name>.png, so they can be flipped between.
 *   --views=LIST   comma-separated view names (below), or "all"
 *                  (default desktop,desktop-left,desktop-right,mobile-right).
 *   --shots=FILE   JSON array of custom views to use instead of --views:
 *                  [{ "name": "x", "w": 1280, "h": 720, "fov": 50, "pos": [0, 1.6, 3.1], "az": 0, "pol": 0 }]
 *                  (omitted fields default to the desktop view).
 *   --out=DIR      output folder (default splat-renders/, git-ignored).
 *   --no-grade     raw splat colours, without the site's colour grade.
 *   --swiftshader  software WebGL, for machines without a usable GPU
 *                  (containers, CI). Much slower.
 *   --chrome=PATH  browser to drive (default puppeteer's own, or $CHROME_PATH).
 *
 * Views use the site's camera: FOV 50, orientation fixed by R3F's initial
 * lookAt from [0, 2, 4], orbit limited to ±20° azimuth / ±13° polar (Scene.tsx,
 * useSceneControls, App.tsx). left / right / up / down = orbit dragged fully
 * that way (PresentationControls: drag right → +azimuth, drag down → +polar).
 */
import { createServer } from 'node:http';
import { createReadStream, mkdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../..');

// --- args ----------------------------------------------------------------
const args = {};
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/);
  if (m) args[m[1]] = m[2] ?? true;
}

// --- views ---------------------------------------------------------------
const DESKTOP = { w: 1280, h: 720, fov: 50, pos: [0, 1.6, 3.1] };
const MOBILE = { w: 390, h: 844, fov: 50, pos: [0, 2.5, 4.0] };
const VIEWS = {
  desktop: DESKTOP,
  'desktop-left': { ...DESKTOP, az: -20 },
  'desktop-right': { ...DESKTOP, az: 20 },
  'desktop-up': { ...DESKTOP, pol: -13 },
  'desktop-down': { ...DESKTOP, pol: 13 },
  mobile: MOBILE,
  'mobile-left': { ...MOBILE, az: -20 },
  'mobile-right': { ...MOBILE, az: 20 },
  'ultrawide-right': { ...DESKTOP, w: 1680, az: 20 }, // 21:9
  gallery: { ...DESKTOP, pos: [0, 1.6, 2.8] }, // gallery zooms the camera 0.3 closer
};

let views;
if (args.shots) {
  views = JSON.parse(readFileSync(resolve(repoRoot, args.shots), 'utf8'));
  views = views.map((v, i) => ({ ...DESKTOP, name: `shot${i + 1}`, ...v }));
} else {
  const list = String(args.views ?? 'desktop,desktop-left,desktop-right,mobile-right');
  const names = list === 'all' ? Object.keys(VIEWS) : list.split(',');
  for (const name of names) {
    if (!VIEWS[name]) {
      console.error(`unknown view "${name}" — one of: ${Object.keys(VIEWS).join(', ')}`);
      process.exit(1);
    }
  }
  views = names.map((name) => ({ name, ...VIEWS[name] }));
}

const spzPaths = String(args.spz ?? 'public/assets/v_one_final.opt.spz')
  .split(',')
  .map((p) => resolve(repoRoot, p));
for (const p of spzPaths) {
  try {
    statSync(p);
  } catch {
    console.error(`no such splat: ${p}`);
    process.exit(1);
  }
}
const labels = spzPaths.map((p) => basename(p).replace(/\.spz$/, ''));
if (new Set(labels).size < labels.length) labels.forEach((l, i) => (labels[i] = `${i + 1}-${l}`));
const outDir = resolve(repoRoot, args.out ?? 'splat-renders');
const grade = !args['no-grade'];

// --- static server ---------------------------------------------------------
// Serves the page, three + Spark from node_modules (resolved by the import
// map) and each splat as /spz/<index>.spz — nothing else.
const nodeModules = join(repoRoot, 'node_modules');
const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>splat render</title><link rel="icon" href="data:,">
<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style>
<script type="importmap">${JSON.stringify({
  imports: {
    three: '/nm/three/build/three.module.js',
    'three/addons/': '/nm/three/examples/jsm/',
    '@sparkjsdev/spark': '/nm/@sparkjsdev/spark/dist/spark.module.js',
  },
})}</script>
</head><body><script type="module" src="/render-page.js"></script></body></html>`;
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm' };

const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(PAGE);
    return;
  }
  let file = null;
  if (path === '/render-page.js') file = join(here, 'render-page.js');
  else if (path.startsWith('/spz/')) file = spzPaths[parseInt(path.slice(5), 10)] ?? null;
  else if (path.startsWith('/nm/three/') || path.startsWith('/nm/@sparkjsdev/spark/')) {
    file = resolve(nodeModules, path.slice(4));
    if (!file.startsWith(nodeModules + sep)) file = null;
  }
  try {
    if (!file) throw new Error('not served');
    const { size } = statSync(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Content-Length': size });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const { port } = server.address();

// --- render ----------------------------------------------------------------
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
try {
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.log(`  [pageerror] ${err?.message ?? err}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`  [console] ${msg.text()}`);
  });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction('window.viewerReady || window.viewerError', { timeout: 60_000 });
  const pageError = await page.evaluate(() => window.viewerError);
  if (pageError) {
    throw new Error(`${pageError}${args.swiftshader ? '' : ' — no usable GPU? try --swiftshader'}`);
  }

  mkdirSync(outDir, { recursive: true });
  for (let i = 0; i < spzPaths.length; i++) {
    const t0 = Date.now();
    const count = await page.evaluate((url, g) => window.viewer.load(url, { grade: g }), `/spz/${i}.spz`, grade);
    console.log(`${labels[i]}: ${count.toLocaleString()} splats, loaded in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    for (const view of views) {
      const t1 = Date.now();
      await page.setViewport({ width: view.w, height: view.h });
      await page.evaluate((v) => window.viewer.shot(v), view);
      const file = join(outDir, `${view.name}--${labels[i]}.png`);
      await (await page.$('canvas')).screenshot({ path: file });
      const shown = relative(process.cwd(), file);
      console.log(`  ${shown.startsWith('..') ? file : shown}  (${((Date.now() - t1) / 1000).toFixed(1)} s)`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
