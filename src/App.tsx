import { Canvas } from '@react-three/fiber';
import { useEffect, useCallback, useRef } from 'react';
import { useControls, useCreateStore, LevaPanel, Leva, folder } from 'leva';
import Scene from './components/scene/Scene';
import TextOverlay from './components/scene/TextOverlay';
import HandDrawnText from './components/scene/HandDrawnText';
import BlueprintPicker from './components/gallery/BlueprintPicker';
import MenuOverlay from './components/navigation/MenuOverlay';
import BackButton from './components/navigation/BackButton';
import ErrorBoundary from './components/ErrorBoundary';
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
  const { viewState: galleryViewState, setSelectedCategory, resetGallery } = useGallery();

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

  // Get streamingStarted from store
  const streamingStarted = useAnimationStore((state) => state.streamingStarted);

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
    // Start showing the text after the splat animation has fully finished
    // Wait for streaming to start before beginning the timer
    if (!streamingStarted) return;

    const timer = setTimeout(() => {
      setShowText(true);
    }, ANIMATION_TIMING.TEXT_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey, streamingStarted, setShowText]);

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
      // Hide when BlueprintPicker is visible (it has its own exit button)
      return !(activeScene === 'gallery' && galleryViewState === 'picker');
    }
    return false;
  }, [animationPhase, targetScene, activeScene, galleryViewState]);

  // Dark blue background for canvas during gallery transitions (fills gaps between particles)
  const isGalleryView = activeScene === 'gallery' ||
    (animationPhase === 'exiting' && targetScene === 'gallery') ||
    (animationPhase === 'entering' && entranceType === 16);
  const canvasBgClass = isGalleryView ? 'bg-[#0a1525]' : 'bg-transparent';

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-white text-white">
      {/* Hide default Leva panel in production, show custom panel in dev */}
      <Leva hidden={!showLeva} />
      {showLeva && <LevaPanel store={controlsStore} />}

      {/* Main 3D Canvas - dark blue background during gallery view */}
      <div className={`relative z-0 h-full w-full ${canvasBgClass}`} style={{ touchAction: 'none' }}>
        <ErrorBoundary>
          <Canvas gl={{ antialias: false }} camera={{ position: [0, 2, 4], fov: 50 }}>
            <Scene controlsStore={controlsStore} />
          </Canvas>
        </ErrorBoundary>
      </div>

      {/* Overlays - only show on home scene */}
      {showOverlays && activeScene === 'home' && (animationPhase === 'idle' || animationPhase === 'exiting') && (
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
      {showOverlays && activeScene === 'home' && useHandDrawn && (
        <HandDrawnText key={animationKey} show={showText} controlsStore={controlsStore} />
      )}

      {/* Contact overlay - show on contact scene */}
      {activeScene === 'contact' && animationPhase === 'idle' && (
        <ContactOverlay />
      )}

      {/* Gallery picker - show when on gallery and during exit animation */}
      {/* Keep mounted during 'entering' phase so paper can animate out */}
      {/* Also keep mounted during return from gallery (entranceType 16) so we see unroll */}
      {((activeScene === 'gallery' && animationPhase === 'idle') ||
        (targetScene === 'gallery' && animationPhase === 'entering') ||
        (activeScene === 'home' && animationPhase === 'entering' && entranceType === 16)) &&
        galleryViewState === 'picker' && (
        <BlueprintPicker
          onSelectCategory={setSelectedCategory}
          onBack={handleReturnHome}
          wallReady={wallReady}
        />
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
