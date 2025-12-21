import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import Scene from "./components/Scene";
import TextOverlay from "./components/TextOverlay";
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
    <div className="relative h-screen w-screen bg-[#fdfcfb]">
      {/* Main 3D Canvas */}
      <Canvas 
        gl={{ antialias: false }}
        camera={{ position: [0, 2, 4], fov: 50 }}
      >
        <Scene />
      </Canvas>

      {/* Text Overlay */}
      <TextOverlay show={showText} />
    </div>
  );
}

export default App;
