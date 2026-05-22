# Nav Buttons Migration — Plan

Branch: `feature/nav-buttons` (branched off `main`; `main` untouched).

## Goal

Make the three round nav buttons (gallery / ethos / contact) a **reusable,
movable component** that slides in from its nearest screen edge with a physics
spring. This is the foundation for the upcoming **Ethos screen**, where the
same three buttons are reused and glide to new positions so navigation feels
like one continuous space. Along the way, clean up the nav code — it has been
through many changes and is disorganized.

Decisions already made with Ian:
- **Framer Motion** drives the buttons (spring; `bounce ≈ 0.3` — one confident
  overshoot, "fun but weighty," not boingy).
- **Always slide from the nearest edge** (computed from button x-position).
- **Two-phase entrance:** buttons slide in first; once landed, labels + arrows
  run their own entrances. Labels keep their own entrances (not part of NavButton).
- **Positions are static config** in `navLayouts.ts` — the Leva position panels
  are retired (they were a tool for *finding* the positions; positions are found).

## Done (committed on `feature/nav-buttons`)

- `src/components/navigation/NavButton.tsx` — the reusable round button. A
  `motion.button` rendering `BlueprintButtonSVG`; springs in from its nearest
  edge, parks off-screen when hidden, `whileHover`/`whileTap`. Position is a prop.
- `src/components/navigation/NavButtonLayer.tsx` — renders the 3 buttons from
  `navLayouts`. **Desktop only so far** (returns null on portrait mobile).
- `src/constants/navLayouts.ts` — static config: `home.desktop`, `home.mobile`
  (4 breakpoints), `home.mobileLabels`, `mobileBreakpoint(width)`, and
  `NAV_TIMING` (the two-phase choreography timing).
- `src/components/navigation/MenuOverlay.tsx` — desktop migrated. Each desktop
  row is now label + arrow + a reserved button-sized slot the layer's button
  sits over. Labels/arrows re-timed to phase 2. Leva desktop-position controls
  retired.
- **Verified on desktop:** buttons spring in first, then labels + arrows;
  layout matches the old nav; clicks navigate; build/lint/typecheck clean; 0
  console errors.

### Step 2 + 3 (committed on `feature/nav-buttons`)

Mobile buttons moved to the layer; arrows decoupled from the button DOM.

- `NavButtonLayer.tsx` — now renders portrait mobile too: a `useViewportWidth`
  hook picks `navLayouts.home.mobile[mobileBreakpoint(width)]` and re-renders on
  resize. Layer `zIndex` is `-1` (was `31`) so it sits just below the
  label/arrow layers — arrowheads paint *on top of* the buttons, as before.
- `navLayouts.ts` — mobile positions are now `mobileSpecs` (raw numbers) with
  the old wrapper margins folded in as `leftPx` / `bottomPx`. The negative
  margin lived on the **wrapper div** (`.nav-mobile-*-btn` CSS: ethos
  `margin-left`, contact `margin-bottom` + `translateX(-50%)`, gallery's
  `margin-right` was inert) — the Tailwind `-ml-14` etc. on the button never
  generated. Offsets were measured against the live old layout; migrated
  buttons land **pixel-identical** at all four breakpoints. Added
  `mobileButtonCenter()` — config-derived button centre for arrow endpoints.
- `MobileArrows.tsx` — each arrow's `endPoint` now comes from
  `computeButtonEndpoint()` (→ `mobileButtonCenter()`), not a button DOM
  measurement. `buttonElement` prop removed. `startPoint` still measures the
  local label element.
- `MobileNavLayout.tsx` — the 12 hardcoded button blocks, `MobileButton`, the
  button refs, `useSizeControls`, and the button-position Leva controls are
  gone (~879 → ~470 lines). Still renders the 12 label blocks + 3 arrows.
- **Verified:** all 4 mobile breakpoints measured pixel-identical to the old
  layout; desktop + landscape unaffected; contact toggle + ethos nav work;
  build/lint/typecheck clean; 0 console errors.
- **Note for review:** the mobile button entrance now staggers in
  `NAV_BUTTON_IDS` order (gallery → ethos → contact) like desktop, instead of
  the old centre-out order (contact first). Intentional unification.

## Remaining steps

### Step 4 — Mobile labels de-duplicated

- `MobileNavLayout` renders each label ×4 (once per breakpoint). The label
  positions are identical across all 4 breakpoints, so collapse to **one label
  per id**, positioned from `navLayouts.home.mobileLabels`.
- Re-time to phase 2 (`NAV_TIMING.detailsOffset`).

### Step 5 — Cleanup

- Delete `BREAKPOINT_CONFIGS`, `useBreakpointControls`, `useSizeControls`, and
  the `mobileNavStore` position controls.
- Delete the `MobileArrows` Leva controls (`useArrowEndControls`,
  `useEthos/Contact/GalleryStartControls`) — bake the offsets as constants.
- Delete `useVisibleElement` + the button-ref machinery (with one label per id,
  the arrow start can use a plain ref).
- `MobileNavLayout` should shrink from ~879 lines to a small component (3 labels
  + 3 arrows from config). Consider merging it and `MenuOverlay`'s desktop
  section into one `NavOverlay` (optional, larger — both just render labels +
  arrows from `navLayouts`; the only real difference is the arrow visual set).

### Step 6 — Verify

All 4 mobile breakpoints (<400, 400–699, 700–999, 1000–1199) + desktop +
landscape. Buttons slide in first, then labels/arrows; arrows connect
label→button correctly; clicks + the contact-overlay toggle work; 0 console
errors.

## Known follow-ups / deferred

- **Small-landscape.** Desktop layout is currently used for landscape phones;
  the old small-landscape variant (container scaled 0.7, different positions)
  was not ported. Add a `navLayouts` entry and tune if it looks off.
- **Phase B — Ethos continuity.** Promote `NavButtonLayer` to *truly persistent*
  at the `App` root (never unmounts across home↔ethos), derive `show` from app
  state instead of `MenuOverlay`'s timer, and add an `ethos` entry to
  `navLayouts`. The buttons then glide from home → Ethos positions, choreographed
  on the same clock as the SparkJS splat/camera transition.

## Key files

| File | State |
| --- | --- |
| `src/components/navigation/NavButton.tsx` | done |
| `src/components/navigation/NavButtonLayer.tsx` | done — desktop + mobile |
| `src/components/navigation/MenuOverlay.tsx` | desktop done |
| `src/components/navigation/MobileNavLayout.tsx` | ~470 lines — labels + arrows; collapse labels (Steps 4–5) |
| `src/components/navigation/MobileArrows.tsx` | endpoint decoupled; retire Leva controls (Step 5) |
| `src/constants/navLayouts.ts` | done — desktop + mobile, margin offsets reconciled |
