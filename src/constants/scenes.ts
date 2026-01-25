/**
 * Scene navigation state management
 * Defines the available scenes and animation phases for transitions
 */

export type SceneId = 'home' | 'ethos' | 'contact' | 'gallery';

export type AnimationPhase = 'idle' | 'exiting' | 'entering' | 'transitioning' | 'transitioningBack';

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
 * 1 = Rising Thoughts (Ethos) - particles float upward
 * 2 = Signal Pulse (Contact) - radial burst outward
 * 3 = Spiral Vortex (Gallery) - particles spiral inward
 */
export const EXIT_ANIMATION_TYPE: Record<SceneId, number> = {
  home: 0,
  ethos: 1,
  contact: 2,
  gallery: 5,
} as const;

/**
 * Duration of exit animations in seconds
 */
export const EXIT_ANIMATION_DURATION = 5.9;

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
