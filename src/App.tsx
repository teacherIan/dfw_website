import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useControls, useCreateStore, Leva, folder } from 'leva';
import Scene from './components/scene/Scene';
import TextOverlay from './components/scene/TextOverlay';
import HandDrawnText from './components/scene/HandDrawnText';
import MenuOverlay from './components/navigation/MenuOverlay';
import BackButton from './components/navigation/BackButton';
import {
  ANIMATION_TIMING,
  EXIT_ANIMATION_DURATION,
  ENTRANCE_ANIMATION_DURATION,
  TRANSITION_DURATION,
} from './constants';
import ContactOverlay from './components/contact/ContactOverlay';
import type { SceneId, AnimationPhase } from './constants';
import './types/r3f.d';

function App() {
  const [showText, setShowText] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, ANIMATION_TIMING.TEXT_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey]);

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
      {showLeva && <Leva store={controlsStore} />}

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
        <HandDrawnText key={animationKey} show={showText} />
      )}

      {/* Contact overlay - show on contact scene */}
      {activeScene === 'contact' && animationPhase === 'idle' && (
        <ContactOverlay />
      )}

      {/* Back button - show during exit/transition animations and when on other scenes */}
      {(animationPhase === 'exiting' || animationPhase === 'transitioning' || (activeScene !== 'home' && animationPhase === 'idle')) && (
        <BackButton onClick={handleReturnHome} />
      )}
    </div>
  );
}

export default App;
