import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useControls, useCreateStore, LevaPanel, Leva, folder } from 'leva';
import Scene from './components/scene/Scene';
import TextOverlay from './components/scene/TextOverlay';
import HandDrawnText from './components/scene/HandDrawnText';
import BlueprintPicker from './components/gallery/BlueprintPicker';
import MenuOverlay from './components/navigation/MenuOverlay';
import BackButton from './components/navigation/BackButton';
import {
  ANIMATION_TIMING,
  EXIT_ANIMATION_DURATION,
  ENTRANCE_ANIMATION_DURATION,
  TRANSITION_DURATION,
} from './constants';
import ContactOverlay from './components/contact/ContactOverlay';
import { GalleryProvider, useGallery } from './contexts/GalleryContext';
import type { SceneId, AnimationPhase } from './constants';
import './types/r3f.d';

function AppContent() {
  const [showText, setShowText] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Gallery state from context
  const { viewState: galleryViewState, setSelectedCategory } = useGallery();

  const controlsStore = useCreateStore();
  const showLeva = import.meta.env.DEV;

  // Scene navigation state
  const [activeScene, setActiveScene] = useState<SceneId>('home');
  const [targetScene, setTargetScene] = useState<SceneId>('home');
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [hasNavigated, setHasNavigated] = useState(false); // Track if we've left home before
  const exitStartTimeRef = useRef<number | null>(null);

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

  const safeExitDuration = Math.max(exitAnimationDuration ?? EXIT_ANIMATION_DURATION, 0.1);
  const safeReturnDuration = Math.max(returnAnimationDuration ?? ENTRANCE_ANIMATION_DURATION, 0.1);
  const overrideExitType = typeof exitTypeOverride === 'number' ? exitTypeOverride : null;

  // Handle navigation to a new scene
  const handleNavigate = useCallback((newTarget: SceneId) => {
    if (animationPhase !== 'idle' || newTarget === activeScene) return;

    // Set target scene for exit animation type lookup
    setTargetScene(newTarget);
    setHasNavigated(true);
    setShowText(false); // Hide title during transition
    // Use different animation for Contact (splat-to-splat transition)
    if (newTarget === 'contact') {
      setAnimationPhase('transitioning');
      exitStartTimeRef.current = performance.now();

      // After transition completes, show the contact scene
      setTimeout(() => {
        setActiveScene(newTarget);
        setAnimationPhase('idle');
      }, TRANSITION_DURATION * 1000);
    } else {
      // Use standard exit animation for other scenes
      setAnimationPhase('exiting');
      exitStartTimeRef.current = performance.now();

      // After exit animation completes, show the target scene
      setTimeout(() => {
        setActiveScene(newTarget);
        setAnimationPhase('idle');
      }, safeExitDuration * 1000);
    }
  }, [animationPhase, activeScene, safeExitDuration]);

  // Handle returning to home
  const handleReturnHome = useCallback(() => {
    if (animationPhase !== 'idle' || activeScene === 'home') return;

    exitStartTimeRef.current = performance.now();
    // Use different animation when returning from Contact (reverse transition)
    if (activeScene === 'contact') {
      setAnimationPhase('transitioningBack');

      // After transition completes, show menu and title
      setTimeout(() => {
        setActiveScene('home');
        setAnimationPhase('idle');
        setShowText(true);
      }, TRANSITION_DURATION * 1000);
    } else {
      // Start entrance animation (reverse of exit)
      // Keep targetScene the same so we use the same animation type in reverse
      setActiveScene('home');
      setAnimationPhase('entering');

      // After entrance animation completes, show menu and title
      setTimeout(() => {
        setAnimationPhase('idle');
        setShowText(true);
      }, safeReturnDuration * 1000);
    }
  }, [animationPhase, activeScene, safeReturnDuration]);

  // Leva control to hide overlays for screenshots
  const { showOverlays, useHandDrawn } = useControls({
    'UI Controls': folder({
      showOverlays: { value: true, label: 'Show Overlays' },
      useHandDrawn: { value: true, label: 'Use Hand-Drawn Text' },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Track when streaming starts and when splat is loaded
  const [streamingStarted, setStreamingStarted] = useState(false);
  const streamingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const handleStreamingStarted = () => {
      streamingStartTimeRef.current = performance.now();
      setStreamingStarted(true);
    };

    const handleSplatLoaded = () => {
      // Splat fully loaded - could use this for additional timing if needed
      console.log('Splat fully loaded');
    };

    window.addEventListener('splatStreamingStarted', handleStreamingStarted);
    window.addEventListener('splatLoaded', handleSplatLoaded);
    return () => {
      window.removeEventListener('splatStreamingStarted', handleStreamingStarted);
      window.removeEventListener('splatLoaded', handleSplatLoaded);
    };
  }, []);

  useEffect(() => {
    // Start showing the text after the splat animation has fully finished
    // Wait for streaming to start before beginning the timer
    if (!streamingStarted) return;

    const timer = setTimeout(() => {
      setShowText(true);
    }, ANIMATION_TIMING.TEXT_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey, streamingStarted]);

  useEffect(() => {
    const handleReset = () => {
      setShowText(false);
      setAnimationKey((prev) => prev + 1);
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, []);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-white text-white">
      {/* Hide default Leva panel in production, show custom panel in dev */}
      <Leva hidden={!showLeva} />
      {showLeva && <LevaPanel store={controlsStore} />}

      {/* Main 3D Canvas */}
      <div className="relative z-0 h-full w-full" style={{ touchAction: 'none' }}>
        <Canvas gl={{ antialias: false }} camera={{ position: [0, 2, 4], fov: 50 }}>
          <Scene
            activeScene={activeScene}
            targetScene={targetScene}
            animationPhase={animationPhase}
            exitAnimationDuration={safeExitDuration}
            returnAnimationDuration={safeReturnDuration}
            controlsStore={controlsStore}
            overrideExitType={overrideExitType}
          />
        </Canvas>
      </div>
      {/* Overlays - only show on home scene */}
      {showOverlays && activeScene === 'home' && (animationPhase === 'idle' || animationPhase === 'exiting') && (
        <MenuOverlay
          onNavigate={handleNavigate}
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

      {/* Gallery transition overlay - fades from white to blue during exit animation */}
      {targetScene === 'gallery' && animationPhase === 'exiting' && (
        <div className="gallery-transition-overlay" />
      )}

      {/* Gallery return overlay - fades from blue to white when returning from gallery */}
      {targetScene === 'gallery' && animationPhase === 'entering' && (
        <div className="gallery-return-overlay" />
      )}

      {/* Gallery picker - show when on gallery and in picker mode */}
      {/* Using new BlueprintPicker (2D DOM) instead of 3D picker */}
      {activeScene === 'gallery' && animationPhase === 'idle' && galleryViewState === 'picker' && (
        <BlueprintPicker onSelectCategory={setSelectedCategory} onBack={handleReturnHome} />
      )}

      {/* Back button - show during exit/transition animations and when on other scenes */}
      {/* Hide when BlueprintPicker is visible (it has its own exit button) */}
      {(animationPhase === 'exiting' || animationPhase === 'transitioning' ||
        (activeScene !== 'home' && animationPhase === 'idle' && !(activeScene === 'gallery' && galleryViewState === 'picker'))) && (
        <BackButton onClick={handleReturnHome} />
      )}
    </div>
  );
}

function App() {
  return (
    <GalleryProvider>
      <AppContent />
    </GalleryProvider>
  );
}

export default App;
