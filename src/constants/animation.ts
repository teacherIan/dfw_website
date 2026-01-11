export const ANIMATION_TIMING = {
  ENTRANCE_DURATION: 13000,
  TEXT_APPEAR: 13000,
  TITLE_DURATION: 3200,
  MENU_APPEAR: 16500, // TEXT_APPEAR + TITLE_DURATION + 300ms buffer
  CAMERA_DURATION: 20,
  WRITING_DURATION: 5000,
} as const;

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
