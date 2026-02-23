import { Canvas } from '@react-three/fiber';
import { useEffect, useCallback, useRef } from 'react';
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
import {
  ANIMATION_TIMING,
  EXIT_ANIMATION_DURATION,
  ENTRANCE_ANIMATION_DURATION,
} from './constants';
import ContactOverlay from './components/contact/ContactOverlay';
import { GalleryProvider, useGallery } from './contexts/GalleryContext';
import { DragDisplacementProvider } from './contexts/DragDisplacementContext';
import { useAnimationStore } from './stores';
import './types/r3f.d';

function AppContent() {
  // Gallery state from context
  const { viewState: galleryViewState, goToCategory, resetGallery, isViewerOpen } = useGallery();

  const controlsStore = useCreateStore();
  const showLeva = import.meta.env.DEV;

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
    setStreamingStarted,
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

  // Track when streaming starts and when splat is loaded
  useEffect(() => {
    const handleStreamingStarted = () => {
      setStreamingStarted();
    };

    const handleSplatLoaded = () => {
      // Splat fully loaded - could use this for additional timing if needed
      if (import.meta.env.DEV) {
        console.log('Splat fully loaded');
      }
    };

    window.addEventListener('splatStreamingStarted', handleStreamingStarted);
    window.addEventListener('splatLoaded', handleSplatLoaded);
    return () => {
      window.removeEventListener('splatStreamingStarted', handleStreamingStarted);
      window.removeEventListener('splatLoaded', handleSplatLoaded);
    };
  }, [setStreamingStarted]);

  useEffect(() => {
    // Start showing the text after loading screen completes
    // This ensures text appears after animation actually starts
    if (!loadingComplete) return;

    const timer = setTimeout(() => {
      setShowText(true);
    }, ANIMATION_TIMING.TEXT_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey, loadingComplete, setShowText]);

  useEffect(() => {
    const handleReset = () => {
      resetAnimation();
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, [resetAnimation]);

  // Determine when to show back button
  const shouldShowBackButton = useCallback(() => {
    // Show during exit animations (except when going to gallery)
    if (animationPhase === 'exiting' && targetScene !== 'gallery') return true;
    // Show during contact transition
    if (animationPhase === 'transitioning') return true;
    // Show on non-home scenes in idle state
    if (activeScene !== 'home' && animationPhase === 'idle') {
      // Hide when in gallery - BlueprintPicker and BlueprintGalleryGrid have their own exit buttons
      if (activeScene === 'gallery') return false;
      return true;
    }
    return false;
  }, [animationPhase, targetScene, activeScene]);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-white text-white">
      {/* Loading screen - signals when animation can start */}
      <LoadingScreen
        isReady={streamingStarted}
        onComplete={setLoadingComplete}
      />

      {/* Hide default Leva panel in production, show custom panel in dev */}
      {/* Home controls use custom store, gallery controls use default panel */}
      <Leva hidden={!showLeva} />
      {showLeva && activeScene !== 'gallery' && <LevaPanel store={controlsStore} />}

      {/* Main 3D Canvas */}
      <div className="relative z-0 h-full w-full bg-transparent" style={{ touchAction: 'none' }}>
        <ErrorBoundary>
          <Canvas gl={{ antialias: false }} camera={{ position: [0, 2, 4], fov: 50 }}>
            <Scene controlsStore={controlsStore} />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* Overlays - only show on home scene after loading completes */}
      {showOverlays && activeScene === 'home' && (animationPhase === 'idle' || animationPhase === 'exiting') && (loadingComplete || hasNavigated) && (
        <MenuOverlay
          onNavigate={navigateTo}
          skipDelay={hasNavigated}
          isExiting={animationPhase === 'exiting'}
          controlsStore={controlsStore}
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

      {/* Contact overlay - show on contact scene */}
      {activeScene === 'contact' && animationPhase === 'idle' && (
        <ContactOverlay />
      )}

      {/* Gallery picker - show when gallery is active or target */}
      {(activeScene === 'gallery' || targetScene === 'gallery') &&
        galleryViewState === 'picker' && (
        <BlueprintPicker
          onSelectCategory={goToCategory}
          onBack={handleReturnHome}
          wallReady={wallReady}
        />
      )}

      {/* Gallery grid - show when viewing a category */}
      {activeScene === 'gallery' && galleryViewState === 'grid' && (
        <BlueprintGalleryGrid />
      )}

      {/* Photo viewer - show when viewing an image */}
      {activeScene === 'gallery' && isViewerOpen && (
        <BlueprintPhotoViewer />
      )}

      {/* Back button - show during exit/transition animations and when on other scenes */}
      {shouldShowBackButton() && (
        <BackButton onClick={handleReturnHome} />
      )}
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
