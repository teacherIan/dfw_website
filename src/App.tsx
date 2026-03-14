import { Canvas } from '@react-three/fiber';
import { useEffect, useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useControls, useCreateStore, LevaPanel, Leva, folder } from 'leva';
import Scene from './components/scene/Scene';
import TextOverlay from './components/scene/TextOverlay';
import HandDrawnText from './components/scene/HandDrawnText';
import BlueprintPicker from './components/gallery/BlueprintPicker';
import BlueprintGalleryGrid from './components/gallery/BlueprintGalleryGrid';
import BlueprintPhotoViewer from './components/gallery/BlueprintPhotoViewer';
import MenuOverlay from './components/navigation/MenuOverlay';
import BackButton from './components/navigation/BackButton';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import DragHint from './components/scene/DragHint';
import {
  ANIMATION_TIMING,
  FAST_ANIMATION_TIMING,
  FAST_MIN_DISPLAY_TIME,
  EXIT_ANIMATION_DURATION,
  ENTRANCE_ANIMATION_DURATION,
} from './constants';
import ContactOverlay from './components/contact/ContactOverlay';
import EthosOverlay from './components/ethos/EthosOverlay';
import { GalleryProvider, useGallery } from './contexts/GalleryContext';
import { DragDisplacementProvider } from './contexts/DragDisplacementContext';
import { useAnimationStore, useIsContactOverlayOpen } from './stores';
import { useStandaloneMode, useWindowWidth, DESKTOP_BREAKPOINT, useArrowEffectsControls } from './hooks';
import { ArrowFilterDefs } from './components/navigation/ArrowFilters';
import './types/r3f.d';

function AppContent() {
  // Gallery state from context
  const { viewState: galleryViewState, goToCategory, resetGallery, isViewerOpen } = useGallery();

  const controlsStore = useCreateStore();
  const arrowControlsStore = useCreateStore();
  const mobileNavStore = useCreateStore();
  const showLeva = import.meta.env.DEV; // Hidden in production
  const showArrowControls = import.meta.env.DEV; // Arrow controls only in dev

  // Detect returning visitor for faster entrance animation
  const [isReturningVisitor] = useState(() => {
    try {
      return sessionStorage.getItem('dfw_visited') === 'true';
    } catch {
      return false;
    }
  });
  const timing = isReturningVisitor ? FAST_ANIMATION_TIMING : ANIMATION_TIMING;

  // Detect if running as installed PWA for fullscreen layout
  const isStandalone = useStandaloneMode();

  // Detect viewport width for conditional Leva panel visibility
  const { windowWidth } = useWindowWidth();
  const isMobileView = windowWidth < DESKTOP_BREAKPOINT;

  // Mobile-specific FOV control (separate from desktop FOV in main controls)
  const { mobileFov } = useControls({
    '📷 Camera': folder({
      mobileFov: { value: 50, min: 20, max: 120, step: 1, label: 'Mobile FOV' },
    }),
  }, { store: mobileNavStore });

  // Arrow woodworker-style effects controls
  const arrowEffectsConfig = useArrowEffectsControls(controlsStore);

  // Get state and actions from Zustand store
  const {
    activeScene,
    targetScene,
    animationPhase,
    hasNavigated,
    wallReady,
    showText,
    animationKey,
    entranceType,
    navigateTo,
    returnHome,
    setShowText,
    setLoadingComplete,
    setExitAnimationDuration,
    setReturnAnimationDuration,
    setExitTypeOverride,
    resetAnimation,
  } = useAnimationStore();

  const { exitAnimationDuration, returnAnimationDuration, exitTypeOverride } = useControls({
    '💥 Exit Animations': folder({
      exitTypeOverride: {
        value: null,
        options: {
          Auto: null,
          Gust: 1,
          Sonic: 2,
          Cosmic: 3,
          'Pond Ripple': 4,
          'Exploded View': 5,
          'Sawdust Drift': 6,
          'Physics Explosion': 7,
          'Disintegration/Ash': 8,
          'Shatter/Glass': 9,
          'Pixelate/Glitch': 10,
          'Black Hole': 11,
          'Bloom/Pollen': 12,
          'Freeze/Shatter': 13,
          'Sand/Hourglass': 14,
          'Teleport/Beam': 15,
        },
        label: 'Exit Type',
      },
      exitAnimationDuration: {
        value: EXIT_ANIMATION_DURATION,
        min: 0.1,
        max: 10.0,
        step: 0.1,
        label: 'Duration (sec)',
      },
      returnAnimationDuration: {
        value: 2.6,
        min: 0.5,
        max: 10.0,
        step: 0.1,
        label: 'Return Duration (sec)',
      },
    }, { collapsed: false }),
  }, { store: controlsStore });

  // Sync Leva controls to Zustand store
  useEffect(() => {
    setExitAnimationDuration(Math.max(exitAnimationDuration ?? EXIT_ANIMATION_DURATION, 0.1));
  }, [exitAnimationDuration, setExitAnimationDuration]);

  useEffect(() => {
    setReturnAnimationDuration(Math.max(returnAnimationDuration ?? ENTRANCE_ANIMATION_DURATION, 0.1));
  }, [returnAnimationDuration, setReturnAnimationDuration]);

  useEffect(() => {
    setExitTypeOverride(typeof exitTypeOverride === 'number' ? exitTypeOverride : null);
  }, [exitTypeOverride, setExitTypeOverride]);

  // Track previous activeScene to detect when returning from gallery
  const prevActiveSceneRef = useRef(activeScene);

  // Track when Ethos overlay fade-in completes (for BackButton visibility)
  const [ethosReady, setEthosReady] = useState(false);
  useEffect(() => {
    // When we return from gallery to home, reset gallery state
    if (prevActiveSceneRef.current === 'gallery' && activeScene === 'home' && animationPhase === 'idle') {
      resetGallery();
    }
    prevActiveSceneRef.current = activeScene;
  }, [activeScene, animationPhase, resetGallery]);

  // Handle return home (just calls store action)
  const handleReturnHome = useCallback(() => {
    returnHome();
  }, [returnHome]);

  // Browser back button support — return to home on popstate
  useEffect(() => {
    const handlePopState = () => {
      const state = useAnimationStore.getState();
      if (state.activeScene !== 'home' && state.animationPhase === 'idle') {
        returnHome();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [returnHome]);

  // Leva control to hide overlays for screenshots
  const { showOverlays, useHandDrawn } = useControls({
    'UI Controls': folder({
      showOverlays: { value: true, label: 'Show Overlays' },
      useHandDrawn: { value: true, label: 'Use Hand-Drawn Text' },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Get streamingStarted and loadingComplete from store
  const streamingStarted = useAnimationStore((state) => state.streamingStarted);
  const loadingComplete = useAnimationStore((state) => state.loadingComplete);
  const isContactOverlayOpen = useIsContactOverlayOpen();

  // Track when splat is fully loaded (for debugging)
  useEffect(() => {
    const handleSplatLoaded = () => {
      if (import.meta.env.DEV) {
        console.log('Splat fully loaded');
      }
    };

    window.addEventListener('splatLoaded', handleSplatLoaded);
    return () => {
      window.removeEventListener('splatLoaded', handleSplatLoaded);
    };
  }, []);

  useEffect(() => {
    // Start showing the text after loading screen completes
    // This ensures text appears after animation actually starts
    if (!loadingComplete) return;

    const timer = setTimeout(() => {
      setShowText(true);
    }, timing.TEXT_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey, loadingComplete, setShowText, timing.TEXT_APPEAR]);

  useEffect(() => {
    const handleReset = () => {
      resetAnimation();
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, [resetAnimation]);

  // Reset ethosReady when leaving ethos
  useEffect(() => {
    if (activeScene !== 'ethos' && animationPhase === 'idle') {
      setEthosReady(false);
    }
  }, [activeScene, animationPhase]);

  // Determine when to show back button
  const shouldShowBackButton = useCallback(() => {
    // For Ethos: only show after overlay has faded in
    if (activeScene === 'ethos' || targetScene === 'ethos') {
      // Show only when ethos is active, idle, and fade-in complete
      return activeScene === 'ethos' && animationPhase === 'idle' && ethosReady;
    }
    // Show during contact transition
    if (animationPhase === 'transitioning') return true;
    // Show on non-home scenes in idle state
    if (activeScene !== 'home' && animationPhase === 'idle') {
      // Hide when in gallery - BlueprintPicker and BlueprintGalleryGrid have their own exit buttons
      if (activeScene === 'gallery') return false;
      return true;
    }
    return false;
  }, [animationPhase, targetScene, activeScene, ethosReady]);

  return (
    <div className={`relative w-screen overflow-hidden bg-[#f8f5ef] text-white ${isStandalone ? 'h-dvh' : 'h-svh'}`}>
      {/* SVG filter definitions for arrow woodworker effects */}
      <ArrowFilterDefs config={arrowEffectsConfig} />

      {/* Loading screen - signals when animation can start */}
      <LoadingScreen
        isReady={streamingStarted}
        onComplete={() => {
          setLoadingComplete();
          try { sessionStorage.setItem('dfw_visited', 'true'); } catch { /* noop */ }
        }}
        minDisplayTime={isReturningVisitor ? FAST_MIN_DISPLAY_TIME : undefined}
      />

      {/* Hide default Leva panel in production, show custom panel in dev */}
      {/* Home controls use custom store, gallery controls use default panel */}
      <Leva hidden={!showLeva} />
      {showLeva && activeScene !== 'gallery' && <LevaPanel store={controlsStore} />}

      {/* Mobile arrow controls - separate panel for arrow positioning (mobile only) */}
      {showArrowControls && isMobileView && (
        <LevaPanel
          store={arrowControlsStore}
          flat
          titleBar={{ title: 'Mobile Arrow Controls' }}
          theme={{
            sizes: { rootWidth: '320px' },
          }}
        />
      )}

      {/* Mobile navigation controls - button/label positions and sizes (mobile only) */}
      {showLeva && isMobileView && (
        <LevaPanel
          store={mobileNavStore}
          flat
          titleBar={{ title: 'Mobile Navigation' }}
          theme={{
            sizes: { rootWidth: '320px' },
          }}
        />
      )}

      {/* Main 3D Canvas - fills lvh, extends under mobile URL bar */}
      <div className="relative z-0 h-full w-full bg-transparent" style={{ touchAction: 'none' }}>
        <ErrorBoundary>
          <Canvas gl={{ antialias: false }} camera={{ position: [0, 2, 4], fov: 50 }}>
            <Scene controlsStore={controlsStore} mobileFov={mobileFov} isMobileView={isMobileView} cameraSpeedMultiplier={isReturningVisitor ? 2 : 1} />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* UI Overlay container - constrained to svh (visible viewport) for correct positioning */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-svh">
        {/* Overlays - only show on home scene after loading completes */}
        {showOverlays && activeScene === 'home' && (animationPhase === 'idle' || animationPhase === 'exiting') && (loadingComplete || hasNavigated) && (
          <MenuOverlay
            onNavigate={navigateTo}
            skipDelay={hasNavigated}
            isExiting={animationPhase === 'exiting'}
            controlsStore={controlsStore}
            arrowControlsStore={arrowControlsStore}
            mobileNavStore={mobileNavStore}
            arrowEffectsConfig={arrowEffectsConfig}
            menuAppearDelay={timing.MENU_APPEAR}
          />
        )}
        {showOverlays && activeScene === 'home' && !useHandDrawn && (
          <TextOverlay key={animationKey} show={showText} />
        )}
        {showOverlays && activeScene === 'home' && (animationPhase === 'idle' || animationPhase === 'exiting') && useHandDrawn && (
          <HandDrawnText
            key={animationKey}
            show={showText}
            isExiting={animationPhase === 'exiting'}
            controlsStore={controlsStore}
          />
        )}

        {/* Drag hint - show once after entrance animation */}
        {loadingComplete && activeScene === 'home' && animationPhase === 'idle' && !hasNavigated && (
          <DragHint />
        )}

        {/* Contact overlay - toggle from nav button */}
        <AnimatePresence>
          {isContactOverlayOpen && (
            <ContactOverlay />
          )}
        </AnimatePresence>

        {/* Ethos overlay - mount during exit animation, keep during return animation */}
        {(activeScene === 'ethos' ||
          (targetScene === 'ethos' && animationPhase === 'exiting') ||
          (activeScene === 'home' && animationPhase === 'entering' && entranceType > 0)) && (
          <EthosOverlay
            isEntering={targetScene === 'ethos' && animationPhase === 'exiting'}
            isReturning={activeScene === 'home' && animationPhase === 'entering'}
            exitDuration={exitAnimationDuration ?? 5.9}
            returnDuration={returnAnimationDuration ?? 2.6}
            onFadeInComplete={() => setEthosReady(true)}
          />
        )}

        {/* Gallery picker - keep mounted while in gallery to prevent re-animation */}
        {(activeScene === 'gallery' || targetScene === 'gallery') && (
          <BlueprintPicker
            onSelectCategory={goToCategory}
            onBack={handleReturnHome}
            wallReady={wallReady}
            hideContent={galleryViewState === 'grid'}
          />
        )}

        {/* Gallery grid - show when viewing a category (overlays picker) */}
        {activeScene === 'gallery' && galleryViewState === 'grid' && (
          <BlueprintGalleryGrid />
        )}

        {/* Photo viewer - show when viewing an image */}
        {activeScene === 'gallery' && isViewerOpen && (
          <BlueprintPhotoViewer />
        )}

        {/* Back button - show during exit/transition animations and when on other scenes */}
        <AnimatePresence>
          {shouldShowBackButton() && (
            <BackButton onClick={handleReturnHome} />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function App() {
  return (
    <DragDisplacementProvider>
      <GalleryProvider>
        <AppContent />
      </GalleryProvider>
    </DragDisplacementProvider>
  );
}

export default App;
