# Ideas and open questions

Notes written after the splat-entrance work (PR #1, September 2026). The doc covers four things:

- what still needs checking
- what could go wrong but wasn't tested
- questions only you can answer
- ideas for what to do next

Numbers were measured on the code as of this commit unless they're marked as estimates. Effort is rough: **S** is an hour or two, **M** is about a day.

## Start here

1. **Look at the new work on a real phone and laptop.** Nothing in PR #1 ran on real hardware; see [Not verified on real devices](#not-verified-on-real-devices). Hold a notched iPhone sideways in particular.
2. **Resize the gallery photos.** The 66 originals add up to 46 MB, and the gallery grid uses them as its thumbnails. Resized thumbnails bring the grid down to about 3 MB.
3. **Stop slow connections from missing the garden.** The loading screen gives up after 45 s. Below about 2.7 Mbit/s the 15 MB splat takes longer than that, so the intro starts without the garden.
4. **Decide how long the intro should be.** On a first visit the menu arrives at least 20 s after the page opens.
5. **Answer the [questions](#questions-for-you).** Several of the ideas depend on them.

## Things I'm not sure about

### Not verified on real devices

Every check ran in headless Chromium with software rendering (SwiftShader) in a cloud container. That means no GPU, no phone and no Safari. Frame rate, memory use and heat on phones are unknown. The Spark 2.2 speed-ups come from its release notes; they weren't measured here.

Worth a look on hardware:

- **Phones held sideways: the notch.** `index.html` sets `viewport-fit=cover`, so the page draws under the notch.
  - The landscape menu sits `1.25rem` from the right edge and doesn't add `env(safe-area-inset-right)`. The portrait layout does use the bottom inset.
  - With the notch on the right, the notch or the rounded corner may cover the buttons. Headless Chrome has no safe areas, so this couldn't be checked.
  - Likely fix: `calc(1.25rem + env(safe-area-inset-right, 0px))` for `DESKTOP_RIGHT` in `src/constants/navLayouts.ts` and `DESKTOP_NAV.right` in `src/components/navigation/MenuOverlay.tsx`.
- **The back-right trees.** These were judged from still frames. It's unknown whether the cloned foliage looks repeated while the scene sways, or on a sharp high-DPI screen.
- **Pruned splats.** A splat was removed only if it stayed hidden in all 65 sampled views.
  - A view outside those could show a small hole: browser zoom, split screen, or a very wide or tall window.
  - To undo it, rebuild without `--prune-hidden` (see `scripts/splat/README.md`).
- **The sun-washed tree and the other clean-ups.** Where an artifact ends and the "unreal" look begins is a judgement call. Each change is one entry in `scripts/splat/edits.json`, with a note. To undo one, delete its entry and rebuild.
- **Gallery blueprint wall and exit effects.** These now use ~3% fewer particles, because the hidden splats are gone. They should look the same.
- **Laptops and iPad landscape.** At 1280×720, 1366×768, 1536×864, 1024×768 and 1180×820 the menu now sits a little higher than it used to. That's intended, but it's a visible change.

### Could go wrong, not tested

These come from reading the code; none of them were tried.

- **A slow or failed splat download.** The loading screen waits for the 15 MB splat, but only for 45 s (the safety timeout in `src/App.tsx`).
  - **Slow connection:** 15 MB in 45 s needs about 2.7 Mbit/s, plus the 1.2 MB of 3D code that loads first. Below that speed the intro starts over an empty scene and the garden pops in when the download finishes. How the particle swirl looks then is unknown.
  - **Failed download:** there's no error message and no retry. Visitors wait 45 s and then get the intro without the garden.
- **Losing the WebGL context.** Nothing in `src/` listens for `webglcontextlost` or `webglcontextrestored`.
  - Phones, iOS especially, can drop the GPU context under memory pressure or after a long time in the background.
  - three.js rebuilds its own state when the context comes back. It's unclear whether Spark's splat data comes back too, so the scene might stay blank until a reload.
  - In the headless runs the context was lost after a few minutes. That's most likely SwiftShader's watchdog, and it happens on `main` too. What the page did afterwards wasn't checked.
  - To try it in desktop Chrome, paste this into the console:

    ```js
    const x = document.querySelector('canvas[data-engine]').getContext('webgl2').getExtension('WEBGL_lose_context');
    x.loseContext();
    setTimeout(() => x.restoreContext(), 2000);
    ```

- **The title-height estimate.** The layout works out the title's height from the shape of the title artwork. That's the `0.1391` in `--title-block` in `src/styles/variables.css`, which is 89.889 / 646.076 from the SVG's viewBox. If the title artwork changes shape, update that number. Otherwise the menu can run into the title again on short screens.

### Questions the code can't answer

- **Which Vercel project is production?** Both `dfw` and `dfw-website` build and deploy every push. If only one of them serves dougsfoundwood.com, the other one doubles the builds and the preview links.
- **Does production run the prerender step?**
  - What it does: `npm run build:prerender` (`scripts/prerender.mjs`) writes static HTML for each route, for search engines and link previews. It also writes the `sitemap.xml` that `robots.txt` points to.
  - Why it's in doubt: there's no `vercel.json`, and Vercel runs `npm run build` unless the project's Build Command says otherwise.
  - Quick test: open dougsfoundwood.com/sitemap.xml. If it isn't there, the prerender isn't running. The live site couldn't be reached from the environment this was written in.

## Questions for you

- **Is the intro length deliberate?** A first visit shows the loading screen for at least 3.5 s. The menu arrives 16.5 s after that, and the scene settles at ~18 s (see "Animation Timeline" in `repo.md`).
- **Should returning visitors get the short intro on later days too?** Right now only a reload in the same tab gets it, because `dfw_visited` is kept in `sessionStorage`.
- **Is the ±20° / ±13° orbit final?** The optimized splat is culled and pruned for that range. Widening it means rebuilding the splat.
- **Can the back-right of the garden be photographed again?** Real photos would replace the cloned trees. It would also mean redoing the edits in `scripts/splat/edits.json`.
- **Which devices matter most?** That decides whether a phone-specific splat is worth making. Site analytics would answer it, if there are any.
- **Keep the `?splat=` switch in production?** It loads the untouched 27 MB original. That's handy for comparisons, but anyone can use it.
- **Can the unused files go?** Nothing references these:
  - `public/assets/dfw_logo.spz` (3.6 MB)
  - `public/assets/spritesheet/` (4 MB)
  - `public/path.svg`

  Visitors never download them, but every deploy carries them.
- **Are the Leva dev panels still needed?** They're hidden in production but still ship in the first script (see [Speed](#speed)). Many of their values have already been baked into constants.

## Ideas

### Speed

- **Resize the gallery photos (M).** This is the biggest win outside the 3D scene.
  - **Now:** the 66 photos in `src/gallery/` add up to 46 MB, and `glass_table_side.png` alone is 9.7 MB. The grid in `BlueprintGalleryGrid.tsx` shows each full-size file as its thumbnail.
  - **Measured:** saved as WebP at quality 80 (with Pillow), 1600 px copies add up to ~10 MB and 480 px thumbnails to ~2.9 MB. `glass_table_side.png` becomes 436 KB and 69 KB.
  - **How:** resize at build time (for example with the `vite-imagetools` plugin) or with a one-off script. Add `srcset` so phones get the small copies.
- **Keep Leva out of the production bundle (M).**
  - The first script is ~260 KB gzipped, and Leva is roughly 70 KB of that (measured on its own). Its panel is hidden in production, but the library is still downloaded and parsed with the app's first script.
  - The 45 `useControls` calls in 9 files could become plain constants in production builds, as many values already have.
- **Trim and self-host the fonts (S).**
  - `index.html` loads two stylesheets from Google Fonts, covering seven families. The page can't paint anything until they arrive, not even the boot wordmark.
  - Production uses two of the families: Caveat for the menu and Patrick Hand on the loading screen.
  - Architects Daughter, Indie Flower, Permanent Marker and Shadows Into Light are only menu-font options in the dev controls. Pinyon Script (`--font-cursive`) isn't used at all.
  - Serving just those two from the site itself (woff2 files plus `@font-face` with `font-display: swap`) removes the wait on another server.
- **Start the splat download earlier (M).**
  - Right now the download only starts once the lazy 3D chunk has loaded and the scene has mounted. This matters most on the slow connections described above.
  - Fetching it from the start would help: for example in `main.tsx`, then handing Spark the bytes.
  - A `<link rel="preload">` would have to match Spark's fetch exactly, or the file downloads twice.
- **Wait for progress, not for 45 s (S).**
  - Give up on the loading screen only when the download stops making progress, rather than after a fixed 45 s. The app already receives `splatProgress` events, so a timer that resets on each one would do it.
  - Keep a longer overall limit as well. Progress events only arrive when the server sends the file's size.
- **A lighter splat for phones (M).** For example ~8 MB with a stronger density cap, picked when `isMobileView` is true. `scripts/splat/optimize.mjs` can build it. Check it with `node scripts/splat/render.mjs --views=mobile,mobile-right`.
- **The idle cost of the ambient sway (S to measure).** The sway moves the camera every frame, which keeps Spark re-sorting even when nothing else changes. Measure it on a phone (battery, heat). If it's a problem, `SparkRenderer`'s `minSortIntervalMs` can throttle the sort.
- **Right-size the icons (S).**
  - **Now:** the favicon, the Apple touch icon, the PWA icons and the social-preview image are all the same 300 KB, 485×485 `dfw_logo_3d.png`. `manifest.json` also declares it as both the 192 px and the 512 px icon, which doesn't match its real size.
  - **Better:** a 32 px favicon, a 180 px touch icon, proper 192 px and 512 px PWA icons, and a 1200×630 image for link previews.

### Intro

- **A shorter, skippable intro (M).**
  - Options: a tap, click or key that jumps to the settled scene; bringing the menu in before the title; a camera move shorter than 20 s.
  - A ~10 s version (no blank start, the chair earlier, tap to skip) could be built on a branch. Filmstrips from `scripts/ui-shots.mjs --film` would let you compare the two side by side.
- **Remember returning visitors across visits (S).** `localStorage`, perhaps with a date, would give the faster intro to people who come back another day, not just to a reload in the same tab.
- **Fill the gap after the loading screen (S).**
  - For ~2 s after the loading screen fades the page is blank. Then a few specks appear mid-screen.
  - Starting the particles a little earlier would remove the dead air. One way is a lower depth offset: the code has 14, and each 1.5 less starts everything 1 s sooner. Another is overlapping the particles with the loading screen's fade.
- **Give the chair its own moment (M).** The chair is the product, but it forms last (14–18 s), together with the title and the menu. Bringing it in earlier, right after the sculpture, would put the furniture first.
- **Speed up the particles for returning visitors too (S).**
  - The returning-visitor speed-up covers the camera (2×), the title and the menu. The particles still take ~18 s.
  - As a result, the nearest grass keeps flying in after the camera has stopped.
- **Respect `prefers-reduced-motion` in the 3D intro (S).** The loading screen and the drag hint already do. For the 3D intro, skip the crane move and the swirl, and fade the scene in.
- **Already on file:**
  - White cursive writing in the bottom left of "DFW", for branding (from an earlier `ideas.txt`).
  - Ideas for the title animation are in `TODO-handdrawn-text.md`.

### Robustness

- **Recover from a failed splat download (S).** Catch the load error, and also a download that stops making progress. Show a short "couldn't load the garden, try again" message with a retry button instead of the 45 s wait.
- **Recover from a lost WebGL context (M).** Listen for `webglcontextlost` on the canvas. If the scene doesn't come back on `webglcontextrestored`, show a tap-to-reload message.
- **Safe areas in landscape (S).** See the notch item under [Not verified on real devices](#not-verified-on-real-devices).

### Code health

- **Lint: 74 problems, mostly quote marks (S).**
  - 66 of them are `react/no-unescaped-entities`: straight quotes (50) and apostrophes (16) in JSX text. Escape them or turn the rule off.
  - The other 8 deserve a real look:
    - `react-hooks/refs` at `Scene.tsx:1416` and `useSceneControls.ts:704–706`. Reading a ref during render can show stale values.
    - `react-hooks/exhaustive-deps` at `BlueprintGalleryGrid.tsx:103`.
- **A CI workflow (S).** There's no GitHub Actions workflow. Vercel's build runs `tsc`, but nothing runs lint. Once lint is clean, a workflow that runs `npm run typecheck`, `npm run lint` and `npm run build` on each PR would keep it clean.
- **Prettier: 48 files fail `npm run format:check` (S).** One formatting-only commit would let CI enforce formatting. It touches many files, so make it when no other branches are open.
- **Screenshots before merging layout changes (M).** `scripts/ui-shots.mjs --light` captures the settled home screen at 8 sizes in a few minutes, even with software rendering. Running it before merging (or in CI) would catch problems like the menu/title collision that PR #1 fixed.
- **Refresh the README (S).** It still describes React 18, a `full_scene.spz` asset and an early project layout. `repo.md` is more current, so the README could point to it.

## Checking changes

- **Layout and the intro:** `node scripts/ui-shots.mjs`. See "Checking layout and the intro" in `repo.md`.
- **The splat itself**, for example before and after an `edits.json` change: `node scripts/splat/render.mjs`. See `scripts/splat/README.md`.
