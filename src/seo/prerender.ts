/**
 * Detects whether the app is running inside a prerender snapshot tool
 * (scripts/prerender.mjs sets a distinctive UA). Used to skip the 3D canvas
 * and loading screen so crawler HTML is stable.
 */
export const isPrerender = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /DFWPrerender/.test(navigator.userAgent);
};
