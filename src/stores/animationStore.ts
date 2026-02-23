import { create } from 'zustand';
import type { SceneId, AnimationPhase } from '../constants';
import {
  EXIT_ANIMATION_TYPE,
  EXIT_ANIMATION_DURATION,
  ENTRANCE_ANIMATION_DURATION,
  TRANSITION_DURATION,
} from '../constants';

// DEV-only logging helper
const log = import.meta.env.DEV
  ? (...args: unknown[]) => console.log('[Store]', ...args)
  : () => {};

interface AnimationState {
  // Navigation
  activeScene: SceneId;
  targetScene: SceneId;
  animationPhase: AnimationPhase;

  // Timing
  exitStartTime: number | null;

  // Animation Types (tracked for debugging/observation)
  exitType: number;
  entranceType: number;

  // UI State
  showText: boolean;
  hasNavigated: boolean;
  wallReady: boolean;
  streamingStarted: boolean;
  cameraAnimationComplete: boolean;
  loadingComplete: boolean;
  isContactOverlayOpen: boolean;

  // Animation key for resetting
  animationKey: number;

  // Duration overrides (from Leva controls)
  exitAnimationDuration: number;
  returnAnimationDuration: number;
  exitTypeOverride: number | null;
}

interface AnimationActions {
  // Navigation actions
  navigateTo: (scene: SceneId) => void;
  returnHome: () => void;

  // State setters
  setAnimationPhase: (phase: AnimationPhase) => void;
  setStreamingStarted: () => void;
  setWallReady: (ready: boolean) => void;
  setCameraAnimationComplete: () => void;
  setShowText: (show: boolean) => void;
  setLoadingComplete: () => void;

  // Duration setters (for Leva controls)
  setExitAnimationDuration: (duration: number) => void;
  setReturnAnimationDuration: (duration: number) => void;
  setExitTypeOverride: (type: number | null) => void;

  // Reset
  resetAnimation: () => void;

  // Contact overlay toggle
  toggleContactOverlay: () => void;
}

type AnimationStore = AnimationState & AnimationActions;

// Timeout IDs for cleanup
let navigationTimeouts: ReturnType<typeof setTimeout>[] = [];

const clearNavigationTimeouts = () => {
  navigationTimeouts.forEach(clearTimeout);
  navigationTimeouts = [];
};

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  // Initial state
  activeScene: 'home',
  targetScene: 'home',
  animationPhase: 'idle',
  exitStartTime: null,
  exitType: 0,
  entranceType: 0,
  showText: false,
  hasNavigated: false,
  wallReady: false,
  streamingStarted: false,
  cameraAnimationComplete: false,
  loadingComplete: false,
  isContactOverlayOpen: false,
  animationKey: 0,
  exitAnimationDuration: EXIT_ANIMATION_DURATION,
  returnAnimationDuration: ENTRANCE_ANIMATION_DURATION,
  exitTypeOverride: null,

  // Navigation to a new scene
  navigateTo: (newTarget: SceneId) => {
    const state = get();
    if (state.animationPhase !== 'idle' || newTarget === state.activeScene) return;

    clearNavigationTimeouts();

    const exitType = state.exitTypeOverride ?? EXIT_ANIMATION_TYPE[newTarget] ?? 0;

    set({
      targetScene: newTarget,
      hasNavigated: true,
      showText: false,
      exitType,
      exitStartTime: performance.now(),
      isContactOverlayOpen: false, // Close contact overlay when navigating
    });

    if (newTarget === 'contact') {
      // Contact: splat-to-splat transition
      set({ animationPhase: 'transitioning' });

      const timeout = setTimeout(() => {
        set({
          activeScene: newTarget,
          animationPhase: 'idle',
        });
      }, TRANSITION_DURATION * 1000);
      navigationTimeouts.push(timeout);
    } else if (newTarget === 'gallery') {
      // Gallery: no splat animation - scene stays visible behind gallery UI
      log('navigateTo gallery - immediate transition (no animation)');
      set({ animationPhase: 'exiting', wallReady: false });

      // Short delay for UI transition, then show gallery
      const transitionDelay = 300; // Quick fade-in for gallery UI

      const timeout1 = setTimeout(() => {
        log('Gallery ready');
        set({ animationPhase: 'wallHolding', wallReady: true });
      }, transitionDelay);
      navigationTimeouts.push(timeout1);

      const timeout2 = setTimeout(() => {
        set({ activeScene: newTarget, animationPhase: 'idle' });
      }, transitionDelay + 200);
      navigationTimeouts.push(timeout2);
    } else {
      // Standard exit animation (ethos, etc.)
      set({ animationPhase: 'exiting' });

      const duration = Math.max(state.exitAnimationDuration, 0.1);
      const timeout = setTimeout(() => {
        set({ activeScene: newTarget, animationPhase: 'idle' });
      }, duration * 1000);
      navigationTimeouts.push(timeout);
    }
  },

  // Return to home
  returnHome: () => {
    const state = get();
    if (state.animationPhase !== 'idle' || state.activeScene === 'home') return;

    clearNavigationTimeouts();

    set({ exitStartTime: performance.now() });

    if (state.activeScene === 'contact') {
      // Contact: reverse transition
      set({ animationPhase: 'transitioningBack' });

      const timeout = setTimeout(() => {
        set({
          activeScene: 'home',
          animationPhase: 'idle',
          targetScene: 'home',
          showText: true,
        });
      }, TRANSITION_DURATION * 1000);
      navigationTimeouts.push(timeout);
    } else if (state.activeScene === 'gallery') {
      // Gallery: no animation - immediate return
      // Paper roll-up already completed (BlueprintPicker waits 800ms before calling onBack)
      // Go directly to idle - no animation phases needed
      log('returnHome from gallery - direct to idle (no animation)');
      set({
        wallReady: false,
        activeScene: 'home',
        animationPhase: 'idle',
        targetScene: 'home',
        showText: true,
        entranceType: 0,
      });
    } else {
      // Standard entrance animation
      const entranceType = EXIT_ANIMATION_TYPE[state.targetScene] ?? 0;
      set({
        activeScene: 'home',
        animationPhase: 'entering',
        entranceType,
      });

      const duration = Math.max(state.returnAnimationDuration, 0.1);
      const timeout = setTimeout(() => {
        set({
          animationPhase: 'idle',
          targetScene: 'home',
          showText: true,
          entranceType: 0,
        });
      }, duration * 1000);
      navigationTimeouts.push(timeout);
    }
  },

  // State setters
  setAnimationPhase: (phase) => set({ animationPhase: phase }),
  setStreamingStarted: () => set({ streamingStarted: true }),
  setWallReady: (ready) => {
    log('setWallReady called with:', ready);
    set({ wallReady: ready });
  },
  setCameraAnimationComplete: () => set({ cameraAnimationComplete: true }),
  setShowText: (show) => set({ showText: show }),
  setLoadingComplete: () => set({ loadingComplete: true }),

  // Duration setters
  setExitAnimationDuration: (duration) => set({ exitAnimationDuration: duration }),
  setReturnAnimationDuration: (duration) => set({ returnAnimationDuration: duration }),
  setExitTypeOverride: (type) => set({ exitTypeOverride: type }),

  // Reset animation
  resetAnimation: () => {
    clearNavigationTimeouts();
    set({
      showText: false,
      animationKey: get().animationKey + 1,
    });
  },

  // Toggle contact overlay
  toggleContactOverlay: () => {
    set((state) => ({ isContactOverlayOpen: !state.isContactOverlayOpen }));
  },
}));

// Selector hooks for common patterns
export const useActiveScene = () => useAnimationStore((state) => state.activeScene);
export const useAnimationPhase = () => useAnimationStore((state) => state.animationPhase);
export const useTargetScene = () => useAnimationStore((state) => state.targetScene);
export const useShowText = () => useAnimationStore((state) => state.showText);
export const useEntranceType = () => useAnimationStore((state) => state.entranceType);
export const useIsContactOverlayOpen = () => useAnimationStore((state) => state.isContactOverlayOpen);
