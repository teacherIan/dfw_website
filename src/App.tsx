import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PresentationControls } from "@react-three/drei";
import { useMemo, useRef, useEffect } from "react";
import { useControls } from "leva";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { dyno } from "@sparkjsdev/spark";
import "./components/spark/SplatMesh";
import "./components/spark/SparkRenderer";

// TypeScript declaration for extended R3F elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      sparkRenderer: any;
      splatMesh: any;
    }
  }
}

function App() {
  return (
    <div className="relative h-screen w-screen bg-gradient-to-b from-sky-100 to-sky-200">
      {/* Logo */}
      <header className="absolute top-8 left-8 z-10">
        <img 
          src="/assets/dfw_logo_3d.png" 
          alt="DFW Furniture" 
          className="h-48 w-auto drop-shadow-2xl"
        />
      </header>

      {/* 3D Canvas */}
      <Canvas 
        gl={{ antialias: false }}
        camera={{ position: [0, 2, 4], fov: 50 }}
      >
        <Scene />
      </Canvas>
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
        url: "/assets/full_scene.spz",
      }) as const,
    [],
  );

  // Setup rain effect modifier AFTER mesh loads
  useEffect(() => {
    if (meshRef.current && !effectSetupRef.current) {
      effectSetupRef.current = true;
      
      meshRef.current.objectModifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }) => {
          const d = new dyno.Dyno({
            inTypes: { gsplat: dyno.Gsplat, t: "float" },
            outTypes: { gsplat: dyno.Gsplat },
            globals: ({ inputs }) => [
              dyno.unindent(`
                // Hash function for pseudo-random values
                vec3 hash(vec3 p) {
                  p = fract(p * vec3(443.537, 537.247, 247.428));
                  p += dot(p, p.yxz + 19.19);
                  return fract((p.xxy + p.yxx) * p.zyx);
                }

                // Rain weather effect from top
                vec4 rain(vec3 pos, vec3 scale, float t) {
                  vec3 h = hash(pos);
                  // Use y position instead of radial distance for top-down effect
                  float s = pow(smoothstep(0., 5., t*t*.1 - pos.y*2.5 + h.x*1.), .5 + h.x);
                  float y = pos.y;
                  pos.y = min(-10. + s*15., pos.y);
                  pos.xz = mix(pos.xz*.3, pos.xz, s);
                  return vec4(pos, smoothstep(-10., y, pos.y));
                }
              `)
            ],
            statements: ({ inputs, outputs }) => dyno.unindentLines(`
              ${outputs.gsplat} = ${inputs.gsplat};
              vec3 scales = ${inputs.gsplat}.scales;
              vec3 localPos = ${inputs.gsplat}.center;
              float t = ${inputs.t};
              
              // Apply rain effect
              vec4 effectResult = rain(localPos, scales, t);
              ${outputs.gsplat}.center = effectResult.xyz;
              ${outputs.gsplat}.scales = mix(vec3(.005), scales, pow(effectResult.w, 30.));
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

  // Animate the rain effect
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
        config={{ mass: 2, tension: 500 }}
        snap={{ mass: 4, tension: 1500 }}
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
