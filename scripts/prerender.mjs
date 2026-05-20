import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sirv from 'sirv';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist');
const PORT = 7321;
const USER_AGENT = 'DFWPrerender/1.0';
const HYDRATION_WAIT_MS = 2500;
const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://dougsfoundwood.com').replace(
  /\/+$/,
  '',
);

const serve = sirv(dist, { dev: false, single: true, etag: false });
const server = createServer(serve);

const listen = () =>
  new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const close = () =>
  new Promise((resolve) => server.close(() => resolve()));

const writeRouteHtml = (pathname, html) => {
  const cleaned = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
  const dir =
    cleaned === '/' ? dist : join(dist, cleaned.replace(/^\/+/, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
  console.log(`  wrote ${join(dir, 'index.html').replace(dist, 'dist')}`);
};

const collectAnchorHrefs = (page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href'))
      .filter(
        (href) =>
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          !href.includes('#'),
      ),
  );

const snapshot = async (page, pathname) => {
  const url = `http://127.0.0.1:${PORT}${pathname}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, HYDRATION_WAIT_MS));
  return page.content();
};

const run = async () => {
  await listen();
  console.log(`serving ${dist} at http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 720 });
    page.on('pageerror', (err) => {
      console.log(`  [pageerror] ${err.message}`);
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (!url.includes('fonts.g')) {
        console.log(`  [requestfailed] ${url} ${req.failure()?.errorText}`);
      }
    });

    const snapshots = new Map();
    const seen = new Set();
    const queue = ['/'];

    while (queue.length > 0) {
      const pathname = queue.shift();
      if (seen.has(pathname)) continue;
      seen.add(pathname);

      console.log(`snapshot ${pathname}`);
      const html = await snapshot(page, pathname);
      snapshots.set(pathname, html);

      if (pathname === '/' || pathname === '/gallery') {
        const hrefs = await collectAnchorHrefs(page);
        for (const href of hrefs) {
          if (!seen.has(href)) queue.push(href);
        }
      }
    }

    for (const [pathname, html] of snapshots) {
      writeRouteHtml(pathname, html);
    }

    const today = new Date().toISOString().slice(0, 10);
    const urls = [...snapshots.keys()].sort();
    const priorityFor = (p) => {
      if (p === '/') return '1.0';
      if (p === '/gallery' || p === '/ethos' || p === '/contact') return '0.8';
      return '0.6';
    };
    const urlset = urls
      .map(
        (p) =>
          `  <url>\n    <loc>${SITE_URL}${p === '/' ? '/' : p}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priorityFor(p)}</priority>\n  </url>`,
      )
      .join('\n');
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`;
    writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8');
    console.log(`  wrote dist/sitemap.xml (${urls.length} urls)`);

    console.log(`\nprerendered ${snapshots.size} routes`);
  } finally {
    await browser.close();
    await close();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
