import { Canvas } from '@react-three/fiber';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useControls, Leva } from 'leva';
import Scene from './components/scene/Scene';
import TextOverlay from './components/scene/TextOverlay';
import HandDrawnText from './components/scene/HandDrawnText';
import MenuOverlay from './components/navigation/MenuOverlay';
import BackButton from './components/navigation/BackButton';
import AnimationDebug from './components/debug/AnimationDebug';
import {
  ANIMATION_TIMING,
  EXIT_ANIMATION_DURATION,
  ENTRANCE_ANIMATION_DURATION,
} from './constants';
import type { SceneId, AnimationPhase } from './constants';
import './types/r3f.d';

function App() {
  const [showText, setShowText] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Debug state for exit animation override
  const [overrideExitType, setOverrideExitType] = useState<number | null>(null);

  // Scene navigation state
  const [activeScene, setActiveScene] = useState<SceneId>('home');
  const [targetScene, setTargetScene] = useState<SceneId>('home');
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [hasNavigated, setHasNavigated] = useState(false); // Track if we've left home before
  const exitStartTimeRef = useRef<number | null>(null);

  // Handle navigation to a new scene
  const handleNavigate = useCallback((newTarget: SceneId) => {
    if (animationPhase !== 'idle' || newTarget === activeScene) return;

    // Set target scene for exit animation type lookup
    setTargetScene(newTarget);
    setHasNavigated(true);

    // Start exit animation
    setAnimationPhase('exiting');
    exitStartTimeRef.current = performance.now();
    setShowText(false); // Hide title during transition

    // After exit animation completes, show the target scene
    setTimeout(() => {
      setActiveScene(newTarget);
      setAnimationPhase('idle');
    }, EXIT_ANIMATION_DURATION * 1000);
  }, [animationPhase, activeScene]);

  // Handle returning to home
  const handleReturnHome = useCallback(() => {
    if (animationPhase !== 'idle' || activeScene === 'home') return;

    // Start entrance animation (reverse of exit)
    // Keep targetScene the same so we use the same animation type in reverse
    setActiveScene('home');
    setAnimationPhase('entering');
    exitStartTimeRef.current = performance.now();

    // After entrance animation completes, show menu and title
    setTimeout(() => {
      setAnimationPhase('idle');
      setShowText(true);
    }, ENTRANCE_ANIMATION_DURATION * 1000);
  }, [animationPhase, activeScene]);

  // Leva control to hide overlays for screenshots
  const { showOverlays, useHandDrawn } = useControls('UI Controls', {
    showOverlays: { value: true, label: 'Show Overlays' },
    useHandDrawn: { value: true, label: 'Use Hand-Drawn Text' },
  }, { collapsed: true });

  useEffect(() => {
    // Start showing the text after the splat animation has fully finished
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
      <Leva />

      {/* Main 3D Canvas */}
      <div className="relative z-0 h-full w-full" style={{ touchAction: 'none' }}>
        <Canvas gl={{ antialias: false }} camera={{ position: [0, 2, 4], fov: 50 }}>
          <Scene
            activeScene={activeScene}
            targetScene={targetScene}
            animationPhase={animationPhase}
            overrideExitType={overrideExitType}
          />
        </Canvas>
      </div>

      {/* Debug Controls - Visible on Home Screen */}
      {activeScene === 'home' && (
        <AnimationDebug selectedType={overrideExitType} onSelect={setOverrideExitType} />
      )}

      {/* Overlays - only show on home scene */}
      {showOverlays && activeScene === 'home' && animationPhase === 'idle' && (
        <MenuOverlay onNavigate={handleNavigate} skipDelay={hasNavigated} />
      )}
      {showOverlays && activeScene === 'home' && !useHandDrawn && (
        <TextOverlay key={animationKey} show={showText} />
      )}
      {showOverlays && activeScene === 'home' && useHandDrawn && (
        <HandDrawnText key={animationKey} show={showText} />
      )}

      {/* Back button - show during exit animation and when on other scenes (not during entrance) */}
      {(animationPhase === 'exiting' || (activeScene !== 'home' && animationPhase === 'idle')) && (
        <BackButton onClick={handleReturnHome} />
      )}
    </div>
  );
}

export default App;
