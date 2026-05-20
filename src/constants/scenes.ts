/**
 * Scene navigation state management
 * Defines the available scenes and animation phases for transitions
 */

export type SceneId = 'home' | 'ethos' | 'contact' | 'gallery';

export type AnimationPhase = 'idle' | 'exiting' | 'entering' | 'transitioning' | 'transitioningBack' | 'wallHolding';

/**
 * Splat transition types for transitioning between two splat meshes
 * Used when navigating to Contact (main scene -> logo)
 */
export type TransitionType = 'morph' | 'dissolve' | 'vortex' | 'wipe' | 'pixelate';

export const TRANSITION_TYPE_VALUES: Record<TransitionType, number> = {
  morph: 0,
  dissolve: 1,
  vortex: 2,
  wipe: 3,
  pixelate: 4,
} as const;

/**
 * Duration of splat-to-splat transitions in seconds
 */
export const TRANSITION_DURATION = 3.0;

/**
 * Exit animation types mapped to shader values
 * 0 = no exit animation (home/idle)
 * 1 = Gust (Ethos)
 * 2 = Sonic (Contact)
 * 16 = Blueprint Wall (Gallery) - disabled for transparent overlay effect
 */
export const EXIT_ANIMATION_TYPE: Record<SceneId, number> = {
  home: 0,
  ethos: 1,
  contact: 2,
  gallery: 0,  // No animation - scene stays visible behind gallery UI
} as const;

/**
 * Duration of exit animations in seconds
 */
export const EXIT_ANIMATION_DURATION = 5.9;

/**
 * Duration of gallery wall formation animation in seconds
 * Shorter than general exit animation for snappier gallery transition
 */
export const GALLERY_WALL_DURATION = 2.5;

/**
 * Delay in seconds after wall forms before completing gallery transition
 */
export const GALLERY_WALL_HOLD_DELAY = 0.5;

/**
 * Duration of entrance animation (returning home) in seconds
 */
export const ENTRANCE_ANIMATION_DURATION = 1.8;

/**
 * Scene state interface for App-level state management
 */
export interface SceneState {
  activeScene: SceneId;
  animationPhase: AnimationPhase;
  exitStartTime: number | null;
}

/**
 * Initial scene state
 */
export const INITIAL_SCENE_STATE: SceneState = {
  activeScene: 'home',
  animationPhase: 'idle',
  exitStartTime: null,
};

/**
 * Canonical URL path for each scene. URLs are a projection of scene state,
 * not the source of truth — the animation store owns state. The router
 * mirrors scene transitions so each view gets a crawlable URL.
 */
export const SCENE_PATH: Record<SceneId, string> = {
  home: '/',
  ethos: '/ethos',
  contact: '/contact',
  gallery: '/gallery',
} as const;

/**
 * Inverse lookup: resolve a pathname to its corresponding scene.
 * /gallery and /gallery/<anything> both map to the gallery scene;
 * deeper routing (category, product slug) is handled inside the gallery UI.
 */
export const pathToScene = (pathname: string): SceneId => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized.startsWith('/gallery')) return 'gallery';
  if (normalized === '/ethos') return 'ethos';
  if (normalized === '/contact') return 'contact';
  return 'home';
};
