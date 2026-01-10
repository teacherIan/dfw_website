import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { useControls, Leva } from 'leva';
import Scene from './components/scene/Scene';
import TextOverlay from './components/scene/TextOverlay';
import HandDrawnText from './components/scene/HandDrawnText';
import MenuOverlay from './components/navigation/MenuOverlay';
import { ANIMATION_TIMING } from './constants';
import './types/r3f.d';

function App() {
  const [showText, setShowText] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

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
          <Scene />
        </Canvas>
      </div>

      {/* Overlays */}
      {showOverlays && <MenuOverlay />}
      {showOverlays && !useHandDrawn && <TextOverlay key={animationKey} show={showText} />}
      {showOverlays && useHandDrawn && <HandDrawnText key={animationKey} show={showText} />}
    </div>
  );
}

export default App;
