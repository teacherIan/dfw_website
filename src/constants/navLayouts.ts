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
// Baked from the old MobileNavLayout BREAKPOINT_CONFIGS (one source now).
const mobileSlot = (leftPct: number, bottomSvh: number, side: NavButtonSide, size: number): NavSlot => ({
  position: {
    left: `${leftPct}%`,
    bottom: `calc(${bottomSvh}svh + env(safe-area-inset-bottom, 0px))`,
  },
  side,
  size,
});

const homeMobile = {
  small: {
    gallery: mobileSlot(82, 10, 'right', 70),
    ethos: mobileSlot(14, 3, 'left', 70),
    contact: mobileSlot(45, 8, 'left', 70),
  },
  mid: {
    gallery: mobileSlot(82, 10, 'right', 70),
    ethos: mobileSlot(14, 3, 'left', 70),
    contact: mobileSlot(45, 8, 'left', 70),
  },
  tablet: {
    gallery: mobileSlot(87, 9, 'right', 100),
    ethos: mobileSlot(7, 3, 'left', 100),
    contact: mobileSlot(44, 5, 'left', 100),
  },
  ipadPro: {
    gallery: mobileSlot(82, 10, 'right', 110),
    ethos: mobileSlot(14, 3, 'left', 110),
    contact: mobileSlot(45, 8, 'left', 110),
  },
} as const satisfies Record<string, NavLayout>;

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
