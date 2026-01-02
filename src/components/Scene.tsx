import { useFrame, useThree } from "@react-three/fiber";
import { PresentationControls } from "@react-three/drei";
import { useMemo, useRef, useEffect, useLayoutEffect } from "react";
import { useControls, monitor, button } from "leva";
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
  const animationSpeedRef = useRef(dyno.dynoFloat(1.0));
  const grassDarkenRef = useRef(dyno.dynoFloat(0.5));
  const syntheticBrightnessRef = useRef(dyno.dynoFloat(1.0));
  const syntheticSaturationRef = useRef(dyno.dynoFloat(1.0));
  const syntheticOpacityRef = useRef(dyno.dynoFloat(1.0));
  const syntheticZMinRef = useRef(dyno.dynoFloat(-5.0));
  const syntheticZMaxRef = useRef(dyno.dynoFloat(2.0));
  const syntheticYMinRef = useRef(dyno.dynoFloat(-10.0));
  const syntheticYMaxRef = useRef(dyno.dynoFloat(5.0));
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
    animationDuration: { value: 20, min: 1, max: 30, step: 0.5, label: 'Duration (s)' },
    startX: { value: -1.0, min: -10, max: 10, step: 0.1, label: 'Start X' },
    startY: { value: 15.0, min: -5, max: 25, step: 0.1, label: 'Start Y' },
    startZ: { value: 20.0, min: 0.5, max: 30, step: 0.1, label: 'Start Z' },
  });

  // Leva controls for entrance animation
  const { depthOffset, animationSpeed } = useControls('Entrance Animation', {
    depthOffset: { value: 10.5, min: 0, max: 30, step: 0.5, label: 'Depth Offset' },
    animationSpeed: { value: 1.5, min: 0.1, max: 3.0, step: 0.1, label: 'Animation Speed' },
    resetAnimation: button(() => {
      baseTimeRef.current = 0;
      animateT.current.value = 0;
      cameraAnimationComplete.current = false;
      if (animateCamera) {
        camera.position.set(startX, startY, startZ);
      }
      if (meshRef.current) {
        meshRef.current.updateVersion();
      }
      window.dispatchEvent(new Event('resetAnimation'));
    }),
  });

  // Leva controls for visual adjustments
  const { grassDarkenAmount } = useControls('Visual Adjustments', {
    grassDarkenAmount: { value: 2.0, min: 0, max: 5, step: 0.05, label: 'Grass Darken' },
  });

  // Leva controls for splat rotation
  const { rotationX, rotationY, rotationZ } = useControls('Splat Rotation', {
    rotationX: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
    rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01 },
  });

  // Leva controls for splat blending (synthetic vs camera-captured)
  const { 
    syntheticBrightness, 
    syntheticSaturation, 
    syntheticOpacity,
    syntheticZMin,
    syntheticZMax,
    syntheticYMin,
    syntheticYMax,
  } = useControls('Splat Blending', {
    syntheticBrightness: { value: 1.0, min: 0.1, max: 2.0, step: 0.05, label: 'Brightness' },
    syntheticSaturation: { value: 0.55, min: 0.0, max: 1.5, step: 0.05, label: 'Saturation' },
    syntheticOpacity: { value: 1.0, min: 0.1, max: 1.0, step: 0.05, label: 'Opacity' },
    syntheticZMin: { value: -5.0, min: -20, max: 20, step: 0.5, label: 'Z Min' },
    syntheticZMax: { value: 2.0, min: -20, max: 20, step: 0.5, label: 'Z Max' },
    syntheticYMin: { value: -10.0, min: -20, max: 20, step: 0.5, label: 'Y Min' },
    syntheticYMax: { value: 5.0, min: -20, max: 20, step: 0.5, label: 'Y Max' },
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
        url: "/assets/v_one_final.spz",
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
            inTypes: { 
              gsplat: dyno.Gsplat, 
              t: "float", 
              depthOffset: "float", 
              animationSpeed: "float",
              grassDarken: "float",
              syntheticBrightness: "float",
              syntheticSaturation: "float",
              syntheticOpacity: "float",
              syntheticZMin: "float",
              syntheticZMax: "float",
              syntheticYMin: "float",
              syntheticYMax: "float",
            },
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
                // Dark/grayscale objects appear first (sketch-like), then colorful elements
                vec4 assemble(vec3 pos, vec3 scale, vec3 color, float t, float depthOffset, float speed) {
                  // Apply speed multiplier to time for faster/slower animation
                  t = t * speed;
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
                  
                  // Color-based timing: dark/grayscale objects appear first
                  float brightness = (color.r + color.g + color.b) / 3.0;
                  float saturation = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
                  
                  // Bright and saturated colors are delayed
                  // This makes dark wireframe/mesh appear first, then colorful furniture/grass
                  float colorDelay = brightness * 4.0 + saturation * 6.0;
                  
                  // Stagger formula: far particles and smaller particles appear first
                  // - depthFactor: higher y (farther back) = lower start time (primary factor)
                  // - normalizedScale * 8.0: larger particles delayed more (secondary factor)
                  // - colorDelay: dark/gray objects first, then colorful (NEW!)
                  // - dist * 0.2: subtle radial wave effect
                  // - h.x * 1.5: randomness for organic feel
                  float start = depthFactor + normalizedScale * 8.0 + colorDelay + dist * 0.2 + h.x * 1.5;
                  
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
              vec3 particleColor = ${inputs.gsplat}.rgba.rgb;
              float t = ${inputs.t};
              float depthOffset = ${inputs.depthOffset};
              float animationSpeed = ${inputs.animationSpeed};
              float grassDarken = ${inputs.grassDarken};
              float syntheticBrightness = ${inputs.syntheticBrightness};
              float syntheticSaturation = ${inputs.syntheticSaturation};
              float syntheticOpacity = ${inputs.syntheticOpacity};
              float syntheticZMin = ${inputs.syntheticZMin};
              float syntheticZMax = ${inputs.syntheticZMax};
              float syntheticYMin = ${inputs.syntheticYMin};
              float syntheticYMax = ${inputs.syntheticYMax};
              
              // Apply graceful entrance effect with color-based timing and adjustable speed
              vec4 effectResult = assemble(localPos, scales, particleColor, t, depthOffset, animationSpeed);
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
              
              // Darken green grass areas on the right side to improve contrast with menu items
              // Detect green by checking if green channel is dominant
              vec3 color = ${outputs.gsplat}.rgba.rgb;
              float greenness = color.g - max(color.r, color.b);
              float isGreen = smoothstep(0.05, 0.15, greenness);
              
              // Also check that it's actually a greenish color (not too dark/light)
              float brightness = (color.r + color.g + color.b) / 3.0;
              float isGrassColor = smoothstep(0.2, 0.4, brightness) * smoothstep(0.9, 0.7, brightness);
              
              // Target right side area where menu items appear (expanded coverage)
              // Right side: positive X (expanded to cover more area)
              float isRight = smoothstep(-2.0, 4.0, localPos.x);
              // Lower-middle area: negative Y (where menu sits)
              float isInMenuArea = smoothstep(2.0, -6.0, localPos.y);
              
              // Combine all factors with gradient falloff
              float grassDarkenFactor = isGreen * isGrassColor * isRight * isInMenuArea * grassDarken;
              ${outputs.gsplat}.rgba.rgb *= (1.0 - grassDarkenFactor);
              
              // Detect synthetic data region based on position
              // Smooth transitions at boundaries
              float inZRange = smoothstep(syntheticZMin - 1.0, syntheticZMin, localPos.z) * 
                               smoothstep(syntheticZMax + 1.0, syntheticZMax, localPos.z);
              float inYRange = smoothstep(syntheticYMin - 1.0, syntheticYMin, localPos.y) * 
                               smoothstep(syntheticYMax + 1.0, syntheticYMax, localPos.y);
              float isSynthetic = inZRange * inYRange;
              
              // Apply brightness adjustment to synthetic region
              ${outputs.gsplat}.rgba.rgb *= mix(1.0, syntheticBrightness, isSynthetic);
              
              // Apply saturation adjustment to synthetic region
              vec3 gray = vec3(dot(${outputs.gsplat}.rgba.rgb, vec3(0.299, 0.587, 0.114)));
              ${outputs.gsplat}.rgba.rgb = mix(${outputs.gsplat}.rgba.rgb, 
                                               mix(gray, ${outputs.gsplat}.rgba.rgb, syntheticSaturation), 
                                               isSynthetic);
              
              // Apply opacity adjustment to synthetic region
              ${outputs.gsplat}.rgba.a *= mix(1.0, syntheticOpacity, isSynthetic);
            `),
          });

          gsplat = d.apply({
            gsplat,
            t: animateT.current,
            depthOffset: depthOffsetRef.current,
            animationSpeed: animationSpeedRef.current,
            grassDarken: grassDarkenRef.current,
            syntheticBrightness: syntheticBrightnessRef.current,
            syntheticSaturation: syntheticSaturationRef.current,
            syntheticOpacity: syntheticOpacityRef.current,
            syntheticZMin: syntheticZMinRef.current,
            syntheticZMax: syntheticZMaxRef.current,
            syntheticYMin: syntheticYMinRef.current,
            syntheticYMax: syntheticYMaxRef.current,
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
    animationSpeedRef.current.value = animationSpeed;
    grassDarkenRef.current.value = grassDarkenAmount;
    syntheticBrightnessRef.current.value = syntheticBrightness;
    syntheticSaturationRef.current.value = syntheticSaturation;
    syntheticOpacityRef.current.value = syntheticOpacity;
    syntheticZMinRef.current.value = syntheticZMin;
    syntheticZMaxRef.current.value = syntheticZMax;
    syntheticYMinRef.current.value = syntheticYMin;
    syntheticYMaxRef.current.value = syntheticYMax;
    
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
