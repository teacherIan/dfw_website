import { useFrame, useThree } from '@react-three/fiber';
import { PresentationControls } from '@react-three/drei';
import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import type { SplatMesh as SparkSplatMesh } from '@sparkjsdev/spark';
import { dyno } from '@sparkjsdev/spark';
import { easeOutCubic, lerp } from '../../utils';
import { useSceneControls } from '../../hooks';
import { EXIT_ANIMATION_TYPE, EXIT_ANIMATION_DURATION, ENTRANCE_ANIMATION_DURATION } from '../../constants';
import type { SceneId, AnimationPhase } from '../../constants';
import '../spark';

interface SceneProps {
  activeScene: SceneId;
  targetScene: SceneId;
  animationPhase: AnimationPhase;
}

/**
 * Scene component for the 3D splat visualization
 * Handles camera controls, splat mesh rendering, entrance and exit animations
 */
const Scene = ({ activeScene, targetScene, animationPhase }: SceneProps) => {
  const renderer = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  // Use state + callback ref pattern so we can properly react to mesh being ready
  const [meshReady, setMeshReady] = useState<SparkSplatMesh | null>(null);
  const meshRef = useRef<SparkSplatMesh | null>(null);
  const meshCallbackRef = useCallback((node: SparkSplatMesh | null) => {
    meshRef.current = node;
    if (node) {
      setMeshReady(node);
    }
  }, []);
  const animateT = useRef(dyno.dynoFloat(0));
  const depthOffsetRef = useRef(dyno.dynoFloat(15.0));
  const animationSpeedRef = useRef(dyno.dynoFloat(1.0));
  const grassDarkenRef = useRef(dyno.dynoFloat(0.5));
  const bottomLeftMultiplierRef = useRef(dyno.dynoFloat(0.9));
  const bottomRightMultiplierRef = useRef(dyno.dynoFloat(0.0));
  const holeFillMultiplierRef = useRef(dyno.dynoFloat(0.0));
  const holeXMinRef = useRef(dyno.dynoFloat(-2.0));
  const holeXMaxRef = useRef(dyno.dynoFloat(2.0));
  const holeYMinRef = useRef(dyno.dynoFloat(3.0));
  const holeYMaxRef = useRef(dyno.dynoFloat(7.0));
  const holeZMinRef = useRef(dyno.dynoFloat(-2.0));
  const holeZMaxRef = useRef(dyno.dynoFloat(3.0));
  const syntheticBrightnessRef = useRef(dyno.dynoFloat(1.0));
  const syntheticSaturationRef = useRef(dyno.dynoFloat(1.0));
  const syntheticOpacityRef = useRef(dyno.dynoFloat(1.0));
  const syntheticZMinRef = useRef(dyno.dynoFloat(-5.0));
  const syntheticZMaxRef = useRef(dyno.dynoFloat(2.0));
  const syntheticYMinRef = useRef(dyno.dynoFloat(-10.0));
  const syntheticYMaxRef = useRef(dyno.dynoFloat(5.0));
  // Mobile simplification refs - reduce small particle chaos
  const smallParticleThresholdRef = useRef(dyno.dynoFloat(0.0));
  const smallMotionReductionRef = useRef(dyno.dynoFloat(0.0));
  const skipSmallAnimationRef = useRef(dyno.dynoFloat(0.0));
  const smallSpeedMultiplierRef = useRef(dyno.dynoFloat(1.0));
  // Exit animation refs
  const exitTypeRef = useRef(dyno.dynoFloat(0.0));
  const exitProgressRef = useRef(dyno.dynoFloat(0.0));
  const exitStartTimeRef = useRef<number | null>(null);
  const baseTimeRef = useRef(0);
  const effectSetupRef = useRef(false);
  const cameraAnimationComplete = useRef(false);

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1200);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset animation handler - passed to useSceneControls
  const handleResetAnimation = useCallback(() => {
    baseTimeRef.current = 0;
    animateT.current.value = 0;
    cameraAnimationComplete.current = false;
    if (meshRef.current) {
      meshRef.current.updateVersion();
    }
    window.dispatchEvent(new Event('resetAnimation'));
  }, []);

  // All Leva controls extracted to custom hook
  const {
    cameraX,
    cameraY,
    cameraZ,
    animateCamera,
    animationDuration,
    startX,
    startY,
    startZ,
    ambientSway,
    swayIntensity,
    depthOffset,
    animationSpeed,
    smallParticleThreshold,
    smallMotionReduction,
    skipSmallAnimation,
    smallSpeedMultiplier,
    grassDarkenAmount,
    bottomLeftMultiplier,
    bottomRightMultiplier,
    holeFillMultiplier,
    holeXMin,
    holeXMax,
    holeYMin,
    holeYMax,
    holeZMin,
    holeZMax,
    rotationX,
    rotationY,
    rotationZ,
    syntheticBrightness,
    syntheticSaturation,
    syntheticOpacity,
    syntheticZMin,
    syntheticZMax,
    syntheticYMin,
    syntheticYMax,
    currentCameraX,
    currentCameraY,
    currentCameraZ,
  } = useSceneControls({
    isMobile,
    onResetAnimation: handleResetAnimation,
  });

  // Initialize camera to starting position if animation is enabled (runs once on mount)
  useEffect(() => {
    if (animateCamera && !cameraAnimationComplete.current) {
      camera.position.set(startX, startY, startZ);
    } else {
      camera.position.set(cameraX, cameraY, cameraZ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        url: '/assets/v_one_final.spz',
        stream: true,
      }) as const,
    []
  );

  // Setup entrance effect modifier AFTER mesh loads
  // Using meshReady state (via callback ref) ensures this runs when mesh is actually available
  useEffect(() => {
    if (meshReady && !effectSetupRef.current) {
      effectSetupRef.current = true;

      meshReady.objectModifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }) => {
          const d = new dyno.Dyno({
            inTypes: {
              gsplat: dyno.Gsplat,
              t: 'float',
              depthOffset: 'float',
              animationSpeed: 'float',
              grassDarken: 'float',
              bottomLeftMultiplier: 'float',
              bottomRightMultiplier: 'float',
              holeFillMultiplier: 'float',
              holeXMin: 'float',
              holeXMax: 'float',
              holeYMin: 'float',
              holeYMax: 'float',
              holeZMin: 'float',
              holeZMax: 'float',
              syntheticBrightness: 'float',
              syntheticSaturation: 'float',
              syntheticOpacity: 'float',
              syntheticZMin: 'float',
              syntheticZMax: 'float',
              syntheticYMin: 'float',
              syntheticYMax: 'float',
              // Mobile simplification inputs
              smallThreshold: 'float',
              motionReduction: 'float',
              skipSmall: 'float',
              smallSpeed: 'float',
              // Exit animation inputs
              exitType: 'float',
              exitProgress: 'float',
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
                // Mobile options: hide tiny, calm motion, skip animation, speed up small particles
                vec4 assemble(vec3 pos, vec3 scale, vec3 color, float t, float depthOffset, float speed,
                              float smallThreshold, float motionReduction, float skipSmall, float smallSpeed) {
                  vec3 h = hash(pos);

                  // Calculate particle size magnitude (average of scale components)
                  float scaleMag = (scale.x + scale.y + scale.z) / 3.0;

                  // Normalize scale to a reasonable range (0-1) for timing
                  float normalizedScale = clamp(log(scaleMag + 1.0) * 0.5, 0.0, 1.0);

                  // Option 1: Hide tiny particles (return early with -1 marker)
                  if (normalizedScale < smallThreshold) {
                    return vec4(pos, -1.0);
                  }

                  // Option 4: Speed up small particles (smaller = faster)
                  float effectiveSpeed = speed;
                  if (normalizedScale < 0.5 && smallSpeed > 1.0) {
                    effectiveSpeed = speed * mix(smallSpeed, 1.0, normalizedScale * 2.0);
                  }
                  t = t * effectiveSpeed;

                  // Option 3: Skip animation for small particles (just fade in)
                  if (skipSmall > 0.5 && normalizedScale < 0.4) {
                    float fadeIn = smoothstep(0.0, 3.0, t);
                    return vec4(pos, fadeIn);
                  }

                  // Calculate start time based on depth, size, color
                  float depthFactor = -pos.y * 2.5 + depthOffset;
                  float dist = length(pos.xz);
                  float brightness = (color.r + color.g + color.b) / 3.0;
                  float saturation = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
                  float colorDelay = brightness * 4.0 + saturation * 6.0;
                  float start = depthFactor + normalizedScale * 8.0 + colorDelay + dist * 0.2 + h.x * 1.5;

                  float s = smoothstep(start, start + 5.0, t);

                  // Option 2: Reduce motion for small particles
                  float motionScale = 1.0;
                  if (normalizedScale < 0.5 && motionReduction > 0.0) {
                    motionScale = mix(1.0 - motionReduction, 1.0, normalizedScale * 2.0);
                  }

                  // Apply scatter with motion reduction
                  float scatterAmount = (20.0 + normalizedScale * 15.0) * motionScale;
                  vec3 scattered = pos + (h - 0.5) * scatterAmount * (1.0 - s);

                  // Apply vertical offset with motion reduction
                  float verticalOffset = mix(-12.0, 8.0, normalizedScale) * motionScale;
                  scattered.y += verticalOffset * (1.0 - s);

                  // Apply swirl with motion reduction
                  float swirlIntensity = mix(5.0, 2.0, normalizedScale) * motionScale;
                  float angle = (1.0 - s) * swirlIntensity;
                  float cosA = cos(angle);
                  float sinA = sin(angle);
                  float x = scattered.x * cosA - scattered.z * sinA;
                  float z = scattered.x * sinA + scattered.z * cosA;
                  scattered.x = x;
                  scattered.z = z;

                  // Apply floating motion with motion reduction
                  float floatPhase = h.y * 6.28318 + t * 1.0;
                  float floatAmount = (1.0 - normalizedScale) * (1.0 - s) * 0.5 * motionScale;
                  scattered.y += sin(floatPhase) * floatAmount;

                  return vec4(scattered, s);
                }

                // ============================================================
                // EXIT ANIMATIONS - Simplified for immediate response
                // Progress is already eased in JavaScript, so we keep GLSL simple
                // ============================================================

                // Spiral Vortex exit animation for Gallery
                // Particles spiral inward to a center point
                vec4 spiralVortex(vec3 pos, vec3 scale, float progress, vec3 h) {
                  vec3 vortexCenter = vec3(0.0, 2.0, 0.0);

                  // Light stagger based on distance for visual interest
                  float dist = length(pos - vortexCenter);
                  float distFactor = clamp(dist / 12.0, 0.0, 1.0);
                  float p = clamp((progress - distFactor * 0.15) / (1.0 - distFactor * 0.15), 0.0, 1.0);

                  // Spiral rotation - varies by particle
                  float spiralSpeed = 3.0 + h.x * 1.5;
                  float angle = p * spiralSpeed;

                  // Pull toward center
                  vec3 newPos = mix(pos, vortexCenter, p * p);

                  // Apply spiral rotation around Y axis
                  vec3 offset = newPos - vortexCenter;
                  float cosA = cos(angle);
                  float sinA = sin(angle);
                  newPos.x = vortexCenter.x + offset.x * cosA - offset.z * sinA;
                  newPos.z = vortexCenter.z + offset.x * sinA + offset.z * cosA;

                  // Scale and fade
                  float scaleMultiplier = 1.0 - p * 0.8;
                  float opacity = 1.0 - p;

                  // Pack: scale in integer part (x1000), opacity in fractional (capped at 0.999)
                  return vec4(newPos, scaleMultiplier * 1000.0 + min(opacity, 0.999));
                }

                // Page Turn exit animation for Ethos
                // Particles sweep from left to right like turning a book page
                vec4 pageTurn(vec3 pos, vec3 scale, float progress, vec3 h) {
                  // Page turn sweeps from left (-X) to right (+X)
                  // Ethos button is on the left side

                  // Normalize X position for stagger (left starts first)
                  float xNorm = clamp((pos.x + 8.0) / 16.0, 0.0, 1.0);
                  float p = clamp((progress - xNorm * 0.3) / (1.0 - xNorm * 0.3), 0.0, 1.0);

                  vec3 newPos = pos;

                  // Sweep to the right
                  newPos.x += p * 15.0;

                  // Curl effect - particles lift up in the middle of their journey
                  float curlPhase = p * 3.14159;
                  float curlHeight = sin(curlPhase) * 3.0;
                  newPos.y += curlHeight;

                  // Slight rotation/tumble as they move
                  float tumble = p * (h.y - 0.5) * 2.0;
                  newPos.z += sin(tumble) * p * 2.0;

                  // Scale - grow slightly during curl, then shrink
                  float scaleMultiplier = 1.0 + sin(curlPhase) * 0.2 - p * 0.3;

                  // Fade out as they exit right
                  float opacity = 1.0 - p;

                  // Pack: scale in integer part (x1000), opacity in fractional (capped at 0.999)
                  return vec4(newPos, scaleMultiplier * 1000.0 + min(opacity, 0.999));
                }

                // Ripple Wave exit animation for Contact
                // Concentric waves emanate from button position (bottom center)
                vec4 rippleWave(vec3 pos, vec3 scale, float progress, vec3 h) {
                  // Origin at Contact button location (bottom center, near camera)
                  vec3 waveOrigin = vec3(0.0, -1.5, 3.0);

                  // Calculate distance from wave origin
                  vec3 fromOrigin = pos - waveOrigin;
                  float dist = length(fromOrigin);
                  vec3 direction = normalize(fromOrigin + vec3(0.001));

                  // Wave front expands outward over time
                  float maxRadius = 20.0;
                  float waveRadius = progress * maxRadius;
                  float waveWidth = 4.0;

                  // How close is this particle to the current wave front?
                  float distToWave = abs(dist - waveRadius);
                  float waveInfluence = 1.0 - smoothstep(0.0, waveWidth, distToWave);

                  // Particles behind the wave get pushed and fade
                  float behindWave = smoothstep(waveRadius - waveWidth, waveRadius, dist);
                  float aheadOfWave = 1.0 - smoothstep(waveRadius, waveRadius + waveWidth * 2.0, dist);

                  // Combined effect - particles affected by passing wave
                  float waveEffect = behindWave * (1.0 - progress * 0.3);

                  vec3 newPos = pos;

                  // Push outward as wave passes
                  float pushAmount = waveInfluence * 3.0 + waveEffect * progress * 8.0;
                  newPos += direction * pushAmount;

                  // Slight upward drift for passed particles
                  newPos.y += waveEffect * progress * 4.0;

                  // Scale - particles grow slightly as wave hits, then shrink
                  float scaleMultiplier = 1.0 + waveInfluence * 0.3 - waveEffect * progress * 0.5;

                  // Opacity - fade out after wave passes
                  float opacity = 1.0 - waveEffect * progress;

                  // Pack: scale in integer part (x1000), opacity in fractional (capped at 0.999)
                  return vec4(newPos, scaleMultiplier * 1000.0 + min(opacity, 0.999));
                }

                // Apply exit animation based on type
                // exitType: 0=none, 1=ethos(pageTurn), 2=contact(ripple), 3=gallery(spiral)
                vec4 applyExitAnimation(vec3 pos, vec3 scale, float exitType, float exitProgress, vec3 h) {
                  if (exitProgress <= 0.001 || exitType < 0.5) {
                    return vec4(pos, 1000.0 + 0.999); // No animation, full scale and opacity
                  }

                  if (exitType < 1.5) {
                    return pageTurn(pos, scale, exitProgress, h);
                  } else if (exitType < 2.5) {
                    return rippleWave(pos, scale, exitProgress, h);
                  } else {
                    return spiralVortex(pos, scale, exitProgress, h);
                  }
                }
              `),
            ],
            statements: ({ inputs, outputs }) =>
              dyno.unindentLines(`
              ${outputs.gsplat} = ${inputs.gsplat};
              vec3 scales = ${inputs.gsplat}.scales;
              vec3 localPos = ${inputs.gsplat}.center;
              vec3 particleColor = ${inputs.gsplat}.rgba.rgb;
              float t = ${inputs.t};
              float depthOffset = ${inputs.depthOffset};
              float animationSpeed = ${inputs.animationSpeed};
              float grassDarken = ${inputs.grassDarken};
              float bottomLeftMultiplier = ${inputs.bottomLeftMultiplier};
              float bottomRightMultiplier = ${inputs.bottomRightMultiplier};
              float holeFillMultiplier = ${inputs.holeFillMultiplier};
              float holeXMin = ${inputs.holeXMin};
              float holeXMax = ${inputs.holeXMax};
              float holeYMin = ${inputs.holeYMin};
              float holeYMax = ${inputs.holeYMax};
              float holeZMin = ${inputs.holeZMin};
              float holeZMax = ${inputs.holeZMax};
              float syntheticBrightness = ${inputs.syntheticBrightness};
              float syntheticSaturation = ${inputs.syntheticSaturation};
              float syntheticOpacity = ${inputs.syntheticOpacity};
              float syntheticZMin = ${inputs.syntheticZMin};
              float syntheticZMax = ${inputs.syntheticZMax};
              float syntheticYMin = ${inputs.syntheticYMin};
              float syntheticYMax = ${inputs.syntheticYMax};
              float smallThreshold = ${inputs.smallThreshold};
              float motionReduction = ${inputs.motionReduction};
              float skipSmall = ${inputs.skipSmall};
              float smallSpeed = ${inputs.smallSpeed};
              float exitType = ${inputs.exitType};
              float exitProgress = ${inputs.exitProgress};

              // Get random hash for this particle (used by both entrance and exit animations)
              vec3 h = hash(localPos);

              // Apply graceful entrance effect with mobile simplification options
              vec4 effectResult = assemble(localPos, scales, particleColor, t, depthOffset, animationSpeed,
                                           smallThreshold, motionReduction, skipSmall, smallSpeed);

              // Handle hidden particles (threshold culling returns -1)
              if (effectResult.w < 0.0) {
                ${outputs.gsplat}.rgba.a = 0.0;
              } else {
                ${outputs.gsplat}.center = effectResult.xyz;

                // Smoother scaling with eased-in appearance
                float scaleProgress = effectResult.w * effectResult.w;
                ${outputs.gsplat}.scales = scales * scaleProgress;

                // Fade in opacity for smoother entrance
                ${outputs.gsplat}.rgba.a *= effectResult.w;

                // Apply exit animation if active
                if (exitProgress > 0.0 && exitType > 0.5) {
                  vec4 exitResult = applyExitAnimation(${outputs.gsplat}.center, ${outputs.gsplat}.scales, exitType, exitProgress, h);
                  ${outputs.gsplat}.center = exitResult.xyz;

                  // Unpack scale multiplier and opacity from w component
                  // Packing: floor(scale * 1000) + opacity, so w = SSSS.OOO
                  float scaleRaw = floor(exitResult.w);
                  float exitScaleMultiplier = scaleRaw / 1000.0;
                  float exitOpacity = exitResult.w - scaleRaw;
                  exitOpacity = clamp(exitOpacity, 0.0, 1.0);

                  ${outputs.gsplat}.scales *= exitScaleMultiplier;
                  ${outputs.gsplat}.rgba.a *= exitOpacity;
                }
              }

              // Darken the area under the text for better legibility
              // We target points that are in the foreground-left area (Negative X, Negative Y in local space)
              float darkenArea = smoothstep(1.0, -4.0, localPos.x) * smoothstep(2.0, -6.0, localPos.y);
              ${outputs.gsplat}.rgba.rgb *= (1.0 - darkenArea * 0.7);
              
              // Scale up splats in bottom areas to provide better coverage and hide white background
              // Due to rotation, we target low Z values (bottom in screen space)
              
              // Bottom left area
              float scaleAreaBottomLeft = smoothstep(3.0, -2.0, localPos.z) * smoothstep(1.5, -1.5, localPos.x);
              ${outputs.gsplat}.scales *= (1.0 + scaleAreaBottomLeft * bottomLeftMultiplier);
              
              // Bottom right area (where main title appears)
              float scaleAreaBottomRight = smoothstep(3.0, -2.0, localPos.z) * smoothstep(-1.5, 1.5, localPos.x);
              ${outputs.gsplat}.scales *= (1.0 + scaleAreaBottomRight * bottomRightMultiplier);
              
              // Fill the white hole - adjustable bounds via sliders
              float holeAreaX = smoothstep(holeXMin - 1.0, holeXMin, localPos.x) * smoothstep(holeXMax + 1.0, holeXMax, localPos.x);
              float holeAreaY = smoothstep(holeYMin - 1.0, holeYMin, localPos.y) * smoothstep(holeYMax + 1.0, holeYMax, localPos.y);
              float holeAreaZ = smoothstep(holeZMin - 1.0, holeZMin, localPos.z) * smoothstep(holeZMax + 1.0, holeZMax, localPos.z);
              float holeFillArea = holeAreaX * holeAreaY * holeAreaZ;
              ${outputs.gsplat}.scales *= (1.0 + holeFillArea * holeFillMultiplier);
              
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
            bottomLeftMultiplier: bottomLeftMultiplierRef.current,
            bottomRightMultiplier: bottomRightMultiplierRef.current,
            holeFillMultiplier: holeFillMultiplierRef.current,
            holeXMin: holeXMinRef.current,
            holeXMax: holeXMaxRef.current,
            holeYMin: holeYMinRef.current,
            holeYMax: holeYMaxRef.current,
            holeZMin: holeZMinRef.current,
            holeZMax: holeZMaxRef.current,
            syntheticBrightness: syntheticBrightnessRef.current,
            syntheticSaturation: syntheticSaturationRef.current,
            syntheticOpacity: syntheticOpacityRef.current,
            syntheticZMin: syntheticZMinRef.current,
            syntheticZMax: syntheticZMaxRef.current,
            syntheticYMin: syntheticYMinRef.current,
            syntheticYMax: syntheticYMaxRef.current,
            smallThreshold: smallParticleThresholdRef.current,
            motionReduction: smallMotionReductionRef.current,
            skipSmall: skipSmallAnimationRef.current,
            smallSpeed: smallSpeedMultiplierRef.current,
            exitType: exitTypeRef.current,
            exitProgress: exitProgressRef.current,
          }).gsplat;

          return { gsplat };
        }
      );

      // Trigger update after setting up the modifier
      meshReady.updateGenerator();
    }
  }, [meshReady]);

  // Update exit animation when phase changes
  useEffect(() => {
    if (animationPhase === 'exiting') {
      // Set the exit animation type based on target scene
      exitTypeRef.current.value = EXIT_ANIMATION_TYPE[targetScene] || 0;
      exitStartTimeRef.current = performance.now();
      exitProgressRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene === 'home') {
      // Only reset exit animation when back on home
      exitTypeRef.current.value = 0;
      exitProgressRef.current.value = 0;
      exitStartTimeRef.current = null;
    } else if (animationPhase === 'idle' && activeScene !== 'home') {
      // Keep splat hidden when on other scenes
      exitProgressRef.current.value = 1;
    } else if (animationPhase === 'entering') {
      // Start entrance animation (reverse of exit)
      // Keep exitType the same so we animate back using the same effect
      exitStartTimeRef.current = performance.now();
      // Explicitly set progress to 1 - will animate to 0 in useFrame
      exitProgressRef.current.value = 1;
    }
  }, [animationPhase, targetScene, activeScene]);

  // Animate the entrance effect and camera
  useFrame((_, delta) => {
    baseTimeRef.current += delta;
    animateT.current.value = baseTimeRef.current;
    depthOffsetRef.current.value = depthOffset;
    animationSpeedRef.current.value = animationSpeed;

    // Update exit animation progress with easing
    if (animationPhase === 'exiting' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      const linearProgress = Math.min(elapsed / EXIT_ANIMATION_DURATION, 1);
      // Use easeOutCubic for smooth deceleration at the end
      const easedProgress = easeOutCubic(linearProgress);
      exitProgressRef.current.value = easedProgress;
    }

    // Update entrance animation progress (reverse - from 1 to 0) with easing
    if (animationPhase === 'entering' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      const linearProgress = Math.min(elapsed / ENTRANCE_ANIMATION_DURATION, 1);
      // Use easeOutCubic for smooth arrival
      const easedProgress = 1 - easeOutCubic(linearProgress);
      exitProgressRef.current.value = easedProgress;
    }
    grassDarkenRef.current.value = grassDarkenAmount;
    bottomLeftMultiplierRef.current.value = bottomLeftMultiplier;
    bottomRightMultiplierRef.current.value = bottomRightMultiplier;
    holeFillMultiplierRef.current.value = holeFillMultiplier;
    holeXMinRef.current.value = holeXMin;
    holeXMaxRef.current.value = holeXMax;
    holeYMinRef.current.value = holeYMin;
    holeYMaxRef.current.value = holeYMax;
    holeZMinRef.current.value = holeZMin;
    holeZMaxRef.current.value = holeZMax;
    syntheticBrightnessRef.current.value = syntheticBrightness;
    syntheticSaturationRef.current.value = syntheticSaturation;
    syntheticOpacityRef.current.value = syntheticOpacity;
    syntheticZMinRef.current.value = syntheticZMin;
    syntheticZMaxRef.current.value = syntheticZMax;
    syntheticYMinRef.current.value = syntheticYMin;
    syntheticYMaxRef.current.value = syntheticYMax;
    // Mobile simplification - reduce small particle chaos
    smallParticleThresholdRef.current.value = smallParticleThreshold;
    smallMotionReductionRef.current.value = smallMotionReduction;
    skipSmallAnimationRef.current.value = skipSmallAnimation ? 1.0 : 0.0;
    smallSpeedMultiplierRef.current.value = smallSpeedMultiplier;

    // Calculate ambient sway offset (runs from start for seamless feel)
    let swayX = 0;
    let swayY = 0;
    if (ambientSway) {
      const t = baseTimeRef.current;
      const intensity = swayIntensity * 0.01; // Scale down for subtle effect

      // Layered sine waves for organic, non-repeating movement
      // Different frequencies create natural-feeling motion
      swayX = (Math.sin(t * 0.3) * 0.5 + Math.sin(t * 0.7) * 0.3 + Math.sin(t * 0.13) * 0.2) * intensity;
      swayY = (Math.sin(t * 0.2) * 0.4 + Math.cos(t * 0.5) * 0.3 + Math.sin(t * 0.11) * 0.3) * intensity;
    }

    // Animate camera position during startup
    if (animateCamera && !cameraAnimationComplete.current) {
      const progress = Math.min(baseTimeRef.current / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);

      // Interpolate camera position from start to target, plus sway
      const newX = lerp(startX, cameraX, easedProgress) + swayX;
      const newY = lerp(startY, cameraY, easedProgress) + swayY;
      const newZ = lerp(startZ, cameraZ, easedProgress);

      camera.position.set(newX, newY, newZ);

      // Mark animation as complete when finished
      if (progress >= 1) {
        cameraAnimationComplete.current = true;
      }
    } else if (ambientSway) {
      // After entrance animation, apply sway to final position
      camera.position.set(
        cameraX + swayX,
        cameraY + swayY,
        cameraZ
      );
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
            ref={meshCallbackRef}
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
