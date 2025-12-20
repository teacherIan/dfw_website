import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PresentationControls } from "@react-three/drei";
import { useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { useControls } from "leva";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { dyno } from "@sparkjsdev/spark";
import "./components/spark/SplatMesh";
import "./components/spark/SparkRenderer";

// TypeScript declaration for extended R3F elements
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        sparkRenderer: any;
        splatMesh: any;
      }
    }
  }
}

function App() {
  return (
    <div className="relative h-screen w-screen bg-gradient-to-b from-sky-200 to-blue-300">
      {/* Main 3D Canvas */}
      <Canvas 
        gl={{ antialias: false }}
        camera={{ position: [0, 2, 4], fov: 50 }}
      >
        <Scene />
      </Canvas>

      {/* Text Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-4 left-1 pointer-events-none select-none">
        <h1 className="font-cursive text-6xl md:text-8xl text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)] text-center">
          Doug's Found Wood
        </h1>
      </div>
    </div>
  );
}

/**
 * Separate Scene component to use R3F hooks
 */
const Scene = () => {
  const renderer = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const meshRef = useRef<SparkSplatMesh>(null);
  const animateT = useRef(dyno.dynoFloat(0));
  const baseTimeRef = useRef(0);
  const effectSetupRef = useRef(false);

  // Leva controls for camera position
  const { cameraX, cameraY, cameraZ } = useControls('Camera', {
    cameraX: { value: 0, min: -10, max: 10, step: 0.1 },
    cameraY: { value: 1.6, min: -5, max: 10, step: 0.1 },
    cameraZ: { value: 3.1, min: 0.5, max: 10, step: 0.1 },
  });

  // Leva controls for splat rotation
  const { rotationX, rotationY, rotationZ } = useControls('Splat Rotation', {
    rotationX: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  // Update camera position from Leva controls
  useEffect(() => {
    camera.position.set(cameraX, cameraY, cameraZ);
  }, [camera, cameraX, cameraY, cameraZ]);

  // Memoize SparkRenderer args
  const sparkRendererArgs = useMemo(() => {
    return { renderer };
  }, [renderer]);

  // Memoize SplatMesh args
  const splatMeshArgs = useMemo(
    () =>
      ({
        url: "/assets/dfw_logo_2_fixed_together.spz",
        stream: true,
      }) as const,
    [],
  );

  // Setup entrance effect modifier AFTER mesh loads
  // Use useLayoutEffect to minimize flicker
  useLayoutEffect(() => {
    if (meshRef.current && !effectSetupRef.current) {
      effectSetupRef.current = true;
      
      meshRef.current.objectModifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }) => {
          const d = new dyno.Dyno({
            inTypes: { gsplat: dyno.Gsplat, t: "float" },
            outTypes: { gsplat: dyno.Gsplat },
            globals: () => [
              dyno.unindent(`
                // Hash function for pseudo-random values
                vec3 hash(vec3 p) {
                  p = fract(p * vec3(443.537, 537.247, 247.428));
                  p += dot(p, p.yxz + 19.19);
                  return fract((p.xxy + p.yxx) * p.zyx);
                }

                // Graceful entrance effect: particles assemble from a swirl
                vec4 assemble(vec3 pos, vec3 scale, float t) {
                  vec3 h = hash(pos);
                  // Staggered start based on radial distance and hash
                  float dist = length(pos.xz);
                  float start = dist * 0.8 + h.x * 4.0;
                  float s = smoothstep(start, start + 4.0, t);
                  
                  // Initial state: scattered much further away
                  vec3 scattered = pos + (h - 0.5) * 30.0 * (1.0 - s);
                  
                  // Add a vertical offset: assembly from below
                  scattered.y -= 15.0 * (1.0 - s);
                  
                  // Add a slight swirl during entrance
                  float angle = (1.0 - s) * 4.0;
                  float cosA = cos(angle);
                  float sinA = sin(angle);
                  float x = scattered.x * cosA - scattered.z * sinA;
                  float z = scattered.x * sinA + scattered.z * cosA;
                  scattered.x = x;
                  scattered.z = z;
                  
                  return vec4(scattered, s);
                }
              `)
            ],
            statements: ({ inputs, outputs }) => dyno.unindentLines(`
              ${outputs.gsplat} = ${inputs.gsplat};
              vec3 scales = ${inputs.gsplat}.scales;
              vec3 localPos = ${inputs.gsplat}.center;
              float t = ${inputs.t};
              
              // Apply graceful entrance effect
              vec4 effectResult = assemble(localPos, scales, t);
              ${outputs.gsplat}.center = effectResult.xyz;
              // Smoother scaling based on progress
              ${outputs.gsplat}.scales = scales * effectResult.w;
            `),
          });

          gsplat = d.apply({
            gsplat,
            t: animateT.current,
          }).gsplat;

          return { gsplat };
        }
      );
      
      // Trigger update after setting up the modifier
      meshRef.current.updateGenerator();
    }
  }, [meshRef.current]);

  // Animate the entrance effect
  useFrame((_, delta) => {
    baseTimeRef.current += delta;
    animateT.current.value = baseTimeRef.current;
    
    if (meshRef.current) {
      meshRef.current.updateVersion();
    }
  });

  return (
    <>
      <PresentationControls
        global
        snap
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 3, Math.PI / 3]}
        azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
      >
        <sparkRenderer args={[sparkRendererArgs]}>
          <splatMesh 
            ref={meshRef} 
            args={[splatMeshArgs]} 
            position={[0, -0.5, 0]}
            rotation={[rotationX, rotationY, rotationZ]}
          />
        </sparkRenderer>
      </PresentationControls>
    </>
  );
};

export default App;
