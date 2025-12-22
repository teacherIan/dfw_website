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
    <div className="relative h-screen w-screen overflow-hidden bg-[#040605] text-white">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(41,94,65,0.55),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(14,7,5,0.8),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#020302]/70 via-[#05170b]/60 to-[#070208]/70 mix-blend-screen" />

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
