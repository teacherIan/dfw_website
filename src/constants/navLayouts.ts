import type { NavButtonPosition, NavButtonSide } from '../components/navigation/NavButton';

/**
 * Static button-position config for the reusable nav buttons.
 *
 * Positions were tuned in the Leva dev panels and are now baked here — one
 * source of truth the persistent NavButtonLayer (buttons) and MenuOverlay
 * (labels + arrows) both read, so a button and its label always agree.
 * Adding a new screen (e.g. Ethos) is just another entry; the persistent
 * buttons then animate from one layout's positions to the next.
 */

export const NAV_BUTTON_IDS = ['gallery', 'ethos', 'contact'] as const;
export type NavButtonId = (typeof NAV_BUTTON_IDS)[number];

export interface NavSlot {
  position: NavButtonPosition;
  side: NavButtonSide;
  /** Explicit diameter in px; omitted = use the CSS responsive size. */
  size?: number;
}

export type NavLayout = Record<NavButtonId, NavSlot>;

// Desktop / landscape — a vertical stack pinned to the top-right corner.
// The vertical step is one button height (the CSS responsive clamp) + gap.
const DESKTOP_RIGHT = '1.25rem';
const DESKTOP_STEP = '(clamp(60px, 8vw, 90px) + 1.25rem)';

const homeDesktop: NavLayout = {
  gallery: { position: { top: '45%', right: DESKTOP_RIGHT }, side: 'right' },
  ethos: { position: { top: `calc(45% + ${DESKTOP_STEP})`, right: DESKTOP_RIGHT }, side: 'right' },
  contact: { position: { top: `calc(45% + 2 * ${DESKTOP_STEP})`, right: DESKTOP_RIGHT }, side: 'right' },
};

// Mobile (portrait) — three buttons in a triangular layout near the bottom.
//
// Baked from the old MobileNavLayout BREAKPOINT_CONFIGS, with the old wrapper
// margins folded in. The old MobileButton sat inside a wrapper div positioned
// at `leftPct%` / `bottomSvh`; the wrapper's CSS then shifted the button off
// that anchor by a fixed pixel margin (ethos `margin-left`, contact
// `margin-bottom` + a `translateX(-50%)` centring, gallery's `margin-right`
// was inert). NavButton has no wrapper, so those fixed offsets are folded in
// here as `leftPx` / `bottomPx`. Measured against the live old layout at all
// four breakpoints — see docs/nav-buttons-migration.md.
//
// The raw numbers live in `mobileSpecs` (one source) so both the rendered
// slot (CSS strings, below) and `mobileButtonCenter` (arrow endpoints) derive
// from the same values.
interface MobileSlotSpec {
  leftPct: number;
  bottomSvh: number;
  side: NavButtonSide;
  size: number;
  /** Fixed px offsets folded in from the old wrapper margin / centring. */
  leftPx: number;
  bottomPx: number;
}

const spec = (
  leftPct: number,
  bottomSvh: number,
  side: NavButtonSide,
  size: number,
  leftPx = 0,
  bottomPx = 0,
): MobileSlotSpec => ({ leftPct, bottomSvh, side, size, leftPx, bottomPx });

// ethos: leftPx = -margin (the old wrapper margin: -56px below 768px, -55px
// at/above it). contact: leftPx = -size/2 so it's horizontally centred, and
// bottomSvh/bottomPx are 0 so it rests flush with the screen's bottom edge —
// the way ethos/gallery sit flush against the left/right edges.
// `side` is the edge each button slides in from — its nearest edge: ethos
// from the left, gallery from the right, contact (bottom-centre) from below.
const mobileSpecs = {
  small: {
    gallery: spec(82, 10, 'right', 70),
    ethos: spec(14, 3, 'left', 70, -56),
    contact: spec(45, 0, 'bottom', 70, -35, 0),
  },
  mid: {
    gallery: spec(82, 10, 'right', 70),
    ethos: spec(14, 3, 'left', 70, -56),
    contact: spec(45, 0, 'bottom', 70, -35, 0),
  },
  tablet: {
    gallery: spec(87, 9, 'right', 100),
    ethos: spec(7, 3, 'left', 100, -55),
    contact: spec(44, 0, 'bottom', 100, -50, 0),
  },
  ipadPro: {
    gallery: spec(82, 10, 'right', 110),
    ethos: spec(14, 3, 'left', 110, -55),
    contact: spec(45, 0, 'bottom', 110, -55, 0),
  },
} as const satisfies Record<string, Record<NavButtonId, MobileSlotSpec>>;

const signedPx = (n: number): string => (n < 0 ? `- ${-n}px` : `+ ${n}px`);

const specToSlot = (s: MobileSlotSpec): NavSlot => ({
  position: {
    left: s.leftPx ? `calc(${s.leftPct}% ${signedPx(s.leftPx)})` : `${s.leftPct}%`,
    bottom: `calc(${s.bottomSvh}svh${s.bottomPx ? ` ${signedPx(s.bottomPx)}` : ''} + env(safe-area-inset-bottom, 0px))`,
  },
  side: s.side,
  size: s.size,
});

const layoutFromSpecs = (specs: Record<NavButtonId, MobileSlotSpec>): NavLayout => ({
  gallery: specToSlot(specs.gallery),
  ethos: specToSlot(specs.ethos),
  contact: specToSlot(specs.contact),
});

const homeMobile: Record<keyof typeof mobileSpecs, NavLayout> = {
  small: layoutFromSpecs(mobileSpecs.small),
  mid: layoutFromSpecs(mobileSpecs.mid),
  tablet: layoutFromSpecs(mobileSpecs.tablet),
  ipadPro: layoutFromSpecs(mobileSpecs.ipadPro),
};

// Mobile label anchors — absolutely positioned (unlike desktop, where the
// label sits inline beside the button). These don't vary by breakpoint.
export interface NavLabelAnchor {
  left: string;
  bottom: string;
}

const labelAnchor = (leftPct: number, bottomSvh: number): NavLabelAnchor => ({
  left: `${leftPct}%`,
  bottom: `calc(${bottomSvh}svh + env(safe-area-inset-bottom, 0px))`,
});

const homeMobileLabels: Record<NavButtonId, NavLabelAnchor> = {
  gallery: labelAnchor(67, 1),
  ethos: labelAnchor(20, 14),
  contact: labelAnchor(44, 15),
};

export type NavBreakpoint = keyof typeof homeMobile;

/** Resolve a portrait viewport width to its mobile breakpoint key. */
export const mobileBreakpoint = (width: number): NavBreakpoint => {
  if (width < 400) return 'small';
  if (width < 700) return 'mid';
  if (width < 1000) return 'tablet';
  return 'ipadPro';
};

/**
 * A mobile button's centre in viewport pixels — config-derived, no DOM read.
 * Used as the arrow endpoint so arrows no longer measure the button element.
 * `1svh` is treated as `1%` of the supplied height (exact on desktop; on a
 * mobile browser with a dynamic toolbar it tracks `visualViewport.height`).
 */
export const mobileButtonCenter = (
  id: NavButtonId,
  breakpoint: NavBreakpoint,
  viewport: { width: number; height: number },
): { x: number; y: number } => {
  const s = mobileSpecs[breakpoint][id];
  const left = (s.leftPct / 100) * viewport.width + s.leftPx;
  const bottom = (s.bottomSvh / 100) * viewport.height + s.bottomPx;
  return {
    x: left + s.size / 2,
    y: viewport.height - bottom - s.size / 2,
  };
};

/**
 * Signed px translate that parks a mobile button fully off its `side` edge.
 * Computed from the button's resting geometry so it clears the screen no
 * matter where the button rests — a fixed fraction of the button's own size
 * only works for buttons anchored at the edge they slide from.
 */
export const mobileParkedOffset = (
  id: NavButtonId,
  breakpoint: NavBreakpoint,
  viewport: { width: number; height: number },
): number => {
  const s = mobileSpecs[breakpoint][id];
  const center = mobileButtonCenter(id, breakpoint, viewport);
  const half = s.size / 2;
  const margin = 32; // buffer so the button is comfortably off-screen
  if (s.side === 'left') return -(center.x + half + margin); // clear left edge
  if (s.side === 'right') return viewport.width - center.x + half + margin; // clear right edge
  return viewport.height - center.y + half + margin; // 'bottom' — clear bottom edge
};

export const navLayouts = {
  home: {
    desktop: homeDesktop,
    mobile: homeMobile,
    mobileLabels: homeMobileLabels,
  },
} as const;

/**
 * Entrance choreography. Phase 1: buttons spring in, staggered. Phase 2:
 * once the buttons have landed, labels + arrows run their own entrances.
 */
export const NAV_TIMING = {
  /** ms between each button's entrance. */
  buttonStagger: 90,
  /** ms — one button's spring entrance (matches NavButton's ENTER_SPRING). */
  buttonDuration: 620,
  /**
   * ms after the button phase begins at which labels + arrows may start —
   * i.e. after the last staggered button has settled.
   */
  detailsOffset: 90 * 2 + 620,
} as const;
