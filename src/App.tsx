import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import Scene from "./components/Scene";
import TextOverlay from "./components/TextOverlay";
import MenuOverlay from "./components/MenuOverlay";
import "./types/r3f.d";

function App() {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Start showing the text after the splat animation has fully finished
    const timer = setTimeout(() => {
      setShowText(true);
    }, 13000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white text-white">

      {/* Main 3D Canvas */}
      <div className="relative z-0 h-full w-full">
        <Canvas
          gl={{ antialias: false }}
          camera={{ position: [0, 2, 4], fov: 50 }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Overlays */}
      <MenuOverlay />
      <TextOverlay show={showText} />
    </div>
  );
}

export default App;
