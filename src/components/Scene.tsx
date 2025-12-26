import { useFrame, useThree } from "@react-three/fiber";
import { PresentationControls } from "@react-three/drei";
import { useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { useControls, monitor } from "leva";
import type { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";
import { dyno } from "@sparkjsdev/spark";
import "./spark";

// Easing function for smooth camera animation (ease-out cubic)
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

// Linear interpolation helper
const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Scene component for the 3D splat visualization
 * Handles camera controls, splat mesh rendering, and entrance animation
 */
const Scene = () => {
  const renderer = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const meshRef = useRef<SparkSplatMesh>(null);
  const animateT = useRef(dyno.dynoFloat(0));
  const depthOffsetRef = useRef(dyno.dynoFloat(15.0));
  const grassDarkenRef = useRef(dyno.dynoFloat(0.5));
  const baseTimeRef = useRef(0);
  const effectSetupRef = useRef(false);
  const cameraAnimationComplete = useRef(false);
  
  // Refs for monitoring current camera position
  const currentCameraX = useRef(0);
  const currentCameraY = useRef(0);
  const currentCameraZ = useRef(0);

  // Leva controls for camera position (target position)
  const { cameraX, cameraY, cameraZ } = useControls('Camera', {
    cameraX: { value: 0, min: -10, max: 10, step: 0.1 },
    cameraY: { value: 1.6, min: -5, max: 10, step: 0.1 },
    cameraZ: { value: 3.1, min: 0.5, max: 10, step: 0.1 },
  });

  // Leva controls for camera animation
  const { animateCamera, animationDuration, startX, startY, startZ } = useControls('Camera Animation', {
    animateCamera: { value: true, label: 'Animate on Start' },
    animationDuration: { value: 8, min: 1, max: 20, step: 0.5, label: 'Duration (s)' },
    startX: { value: 2, min: -10, max: 10, step: 0.1, label: 'Start X' },
    startY: { value: 4, min: -5, max: 15, step: 0.1, label: 'Start Y' },
    startZ: { value: 8, min: 0.5, max: 20, step: 0.1, label: 'Start Z' },
  });

  // Leva controls for entrance animation
  const { depthOffset } = useControls('Entrance Animation', {
    depthOffset: { value: 15.0, min: 0, max: 30, step: 0.5, label: 'Depth Offset' },
  });

  // Leva controls for visual adjustments
  const { grassDarkenAmount } = useControls('Visual Adjustments', {
    grassDarkenAmount: { value: 0.5, min: 0, max: 2, step: 0.05, label: 'Grass Darken' },
  });

  // Leva controls for splat rotation
  const { rotationX, rotationY, rotationZ } = useControls('Splat Rotation', {
    rotationX: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  // Leva monitor for current camera position (read-only, updates in real-time)
  useControls('Current Camera Position', {
    x: monitor(() => currentCameraX.current, { graph: false }),
    y: monitor(() => currentCameraY.current, { graph: false }),
    z: monitor(() => currentCameraZ.current, { graph: false }),
  });

  // Initialize camera to starting position if animation is enabled
  useEffect(() => {
    if (animateCamera && !cameraAnimationComplete.current) {
      camera.position.set(startX, startY, startZ);
    } else {
      camera.position.set(cameraX, cameraY, cameraZ);
    }
  }, []);

  // Update camera position from Leva controls when animation is complete or disabled
  useEffect(() => {
    if (!animateCamera || cameraAnimationComplete.current) {
      camera.position.set(cameraX, cameraY, cameraZ);
    }
  }, [camera, cameraX, cameraY, cameraZ, animateCamera]);

  // Memoize SparkRenderer args
  const sparkRendererArgs = useMemo(() => {
    return { renderer };
  }, [renderer]);

  // Memoize SplatMesh args
  const splatMeshArgs = useMemo(
    () =>
      ({
        url: "/assets/full_scene_remove_blue_two_splat.spz",
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
            inTypes: { gsplat: dyno.Gsplat, t: "float", depthOffset: "float", grassDarken: "float" },
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
                // Far particles appear first, building the scene towards the camera
                // Smaller particles appear before larger ones
                vec4 assemble(vec3 pos, vec3 scale, float t, float depthOffset) {
                  vec3 h = hash(pos);
                  
                  // Calculate particle size magnitude (average of scale components)
                  float scaleMag = (scale.x + scale.y + scale.z) / 3.0;
                  
                  // Normalize scale to a reasonable range (0-1) for timing
                  // Smaller particles (low scaleMag) get earlier start times
                  // Using log scale for more pleasing distribution since scales vary widely
                  float normalizedScale = clamp(log(scaleMag + 1.0) * 0.5, 0.0, 1.0);
                  
                  // Depth factor: particles further back (higher y due to rotation) appear first
                  // Negative multiplier means higher y = earlier appearance
                  // Add offset to ensure all start times are positive
                  float depthFactor = -pos.y * 2.5 + depthOffset;
                  
                  // Radial distance adds spatial variation
                  float dist = length(pos.xz);
                  
                  // Stagger formula: far particles and smaller particles appear first
                  // - depthFactor: higher y (farther back) = lower start time (primary factor)
                  // - normalizedScale * 8.0: larger particles delayed more (secondary factor)
                  // - dist * 0.2: subtle radial wave effect
                  // - h.x * 1.5: randomness for organic feel
                  float start = depthFactor + normalizedScale * 8.0 + dist * 0.2 + h.x * 1.5;
                  
                  // Longer transition window for smoother, slower appearance
                  float s = smoothstep(start, start + 5.0, t);
                  
                  // Initial state: scattered based on particle size
                  // Smaller particles start closer, larger ones from further away
                  float scatterAmount = 20.0 + normalizedScale * 15.0;
                  vec3 scattered = pos + (h - 0.5) * scatterAmount * (1.0 - s);
                  
                  // Vertical offset: smaller particles rise from below first
                  // Larger particles descend from above for dramatic contrast
                  float verticalOffset = mix(-12.0, 8.0, normalizedScale);
                  scattered.y += verticalOffset * (1.0 - s);
                  
                  // Swirl intensity varies with size - smaller particles swirl more
                  float swirlIntensity = mix(5.0, 2.0, normalizedScale);
                  float angle = (1.0 - s) * swirlIntensity;
                  float cosA = cos(angle);
                  float sinA = sin(angle);
                  float x = scattered.x * cosA - scattered.z * sinA;
                  float z = scattered.x * sinA + scattered.z * cosA;
                  scattered.x = x;
                  scattered.z = z;
                  
                  // Add a gentle floating motion during entrance for smaller particles
                  float floatPhase = h.y * 6.28318 + t * 1.0;
                  float floatAmount = (1.0 - normalizedScale) * (1.0 - s) * 0.5;
                  scattered.y += sin(floatPhase) * floatAmount;
                  
                  return vec4(scattered, s);
                }
              `)
            ],
            statements: ({ inputs, outputs }) => dyno.unindentLines(`
              ${outputs.gsplat} = ${inputs.gsplat};
              vec3 scales = ${inputs.gsplat}.scales;
              vec3 localPos = ${inputs.gsplat}.center;
              float t = ${inputs.t};
              float depthOffset = ${inputs.depthOffset};
              float grassDarken = ${inputs.grassDarken};
              
              // Apply graceful entrance effect
              vec4 effectResult = assemble(localPos, scales, t, depthOffset);
              ${outputs.gsplat}.center = effectResult.xyz;
              
              // Smoother scaling with eased-in appearance
              // Smaller particles pop in quickly, larger ones grow more gradually
              float scaleProgress = effectResult.w * effectResult.w; // Ease-in curve
              ${outputs.gsplat}.scales = scales * scaleProgress;
              
              // Fade in opacity for smoother entrance
              ${outputs.gsplat}.rgba.a *= effectResult.w;

              // Darken the area under the text for better legibility
              // We target points that are in the foreground-left area (Negative X, Negative Y in local space)
              float darkenArea = smoothstep(1.0, -4.0, localPos.x) * smoothstep(2.0, -6.0, localPos.y);
              ${outputs.gsplat}.rgba.rgb *= (1.0 - darkenArea * 0.7);
              
              // Darken green grass areas in lower right to improve contrast with white text
              // Detect green by checking if green channel is dominant
              vec3 color = ${outputs.gsplat}.rgba.rgb;
              float greenness = color.g - max(color.r, color.b);
              float isGreen = smoothstep(0.05, 0.15, greenness);
              
              // Also check that it's actually a greenish color (not too dark/light)
              float brightness = (color.r + color.g + color.b) / 3.0;
              float isGrassColor = smoothstep(0.2, 0.4, brightness) * smoothstep(0.9, 0.7, brightness);
              
              // Target lower right area where white text appears
              // Right side: positive X
              float isRight = smoothstep(-1.0, 3.0, localPos.x);
              // Lower area: negative Y
              float isLower = smoothstep(0.0, -4.0, localPos.y);
              
              // Combine all factors with gradient falloff
              float grassDarkenFactor = isGreen * isGrassColor * isRight * isLower * grassDarken;
              ${outputs.gsplat}.rgba.rgb *= (1.0 - grassDarkenFactor);
            `),
          });

          gsplat = d.apply({
            gsplat,
            t: animateT.current,
            depthOffset: depthOffsetRef.current,
            grassDarken: grassDarkenRef.current,
          }).gsplat;

          return { gsplat };
        }
      );
      
      // Trigger update after setting up the modifier
      meshRef.current.updateGenerator();
    }
  }, [meshRef.current]);

  // Animate the entrance effect and camera
  useFrame((_, delta) => {
    baseTimeRef.current += delta;
    animateT.current.value = baseTimeRef.current;
    depthOffsetRef.current.value = depthOffset;
    grassDarkenRef.current.value = grassDarkenAmount;
    
    // Animate camera position during startup
    if (animateCamera && !cameraAnimationComplete.current) {
      const progress = Math.min(baseTimeRef.current / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);
      
      // Interpolate camera position from start to target
      const newX = lerp(startX, cameraX, easedProgress);
      const newY = lerp(startY, cameraY, easedProgress);
      const newZ = lerp(startZ, cameraZ, easedProgress);
      
      camera.position.set(newX, newY, newZ);
      
      // Mark animation as complete when finished
      if (progress >= 1) {
        cameraAnimationComplete.current = true;
      }
    }
    
    // Update current camera position refs for Leva monitoring
    currentCameraX.current = Math.round(camera.position.x * 100) / 100;
    currentCameraY.current = Math.round(camera.position.y * 100) / 100;
    currentCameraZ.current = Math.round(camera.position.z * 100) / 100;
    
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

export default Scene;
