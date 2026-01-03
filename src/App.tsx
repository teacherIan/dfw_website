import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import Scene, { ANIMATION_TIMING } from "./components/Scene";
import TextOverlay from "./components/TextOverlay";
import MenuOverlay from "./components/MenuOverlay";
import "./types/r3f.d";

function App() {
  const [showText, setShowText] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

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
      setAnimationKey(prev => prev + 1);
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, []);

  return (
    <div className="relative h-svh w-screen overflow-hidden bg-white text-white">

      {/* Main 3D Canvas */}
      <div className="relative z-0 h-full w-full" style={{ touchAction: 'none' }}>
        <Canvas
          gl={{ antialias: false }}
          camera={{ position: [0, 2, 4], fov: 50 }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Overlays */}
      <MenuOverlay />
      <TextOverlay key={animationKey} show={showText} />
    </div>
  );
}

export default App;
