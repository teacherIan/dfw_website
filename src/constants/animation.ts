export const ANIMATION_TIMING = {
  TEXT_APPEAR: 13000,
  MENU_APPEAR: 16500, // TEXT_APPEAR + TITLE_DURATION + 300ms buffer
} as const;

/** Faster timings for returning visitors (2x camera speed means ~10s entrance instead of ~20s) */
export const FAST_ANIMATION_TIMING = {
  TEXT_APPEAR: 10500,
  MENU_APPEAR: 13000,
} as const;

export const FAST_MIN_DISPLAY_TIME = 2000;

/**
 * Mobile navigation animation delays (in milliseconds)
 * Order: Center-outward (Contact first → Ethos & Gallery together)
 */
export const MOBILE_NAV_DELAYS = {
  // Contact (center) - first
  CONTACT_BUTTON: 0,
  CONTACT_LABEL: 100,
  CONTACT_ARROW: 450,
  // Ethos (left) + Gallery (right) - together, after Contact
  ETHOS_BUTTON: 200,
  ETHOS_LABEL: 300,
  ETHOS_ARROW: 550,
  GALLERY_BUTTON: 200,
  GALLERY_LABEL: 300,
  GALLERY_ARROW: 550,
} as const;

/**
 * Blueprint picker animation timing (in milliseconds)
 */
export const BLUEPRINT_PICKER_TIMING = {
  ROLL_DELAY: 100,
  CONTENT_DELAY: 1200,
} as const;
