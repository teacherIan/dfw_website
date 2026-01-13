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
  overrideExitType?: number | null;
}

/**
 * Scene component for the 3D splat visualization
 * Handles camera controls, splat mesh rendering, entrance and exit animations
 */
const Scene = ({ activeScene, targetScene, animationPhase, overrideExitType }: SceneProps) => {
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
  
  // Exit animation controls
  const explodedExpansionStrengthRef = useRef(dyno.dynoFloat(6.0));
  const explodedRotationSpeedRef = useRef(dyno.dynoFloat(0.5));
  const explodedFadeStartRef = useRef(dyno.dynoFloat(0.5));
  const explodedFadeEndRef = useRef(dyno.dynoFloat(0.95));
  
  // Pond ripple controls
  const pondWaveSpeedRef = useRef(dyno.dynoFloat(8.0));
  const pondWaveFrequencyRef = useRef(dyno.dynoFloat(3.0));
  const pondWaveAmplitudeRef = useRef(dyno.dynoFloat(0.5));
  const pondWaveCountRef = useRef(dyno.dynoFloat(20.0));

  // Physics explosion controls
  const physicsStrengthRef = useRef(dyno.dynoFloat(15.0));
  const physicsGravityRef = useRef(dyno.dynoFloat(25.0));
  const physicsFrictionRef = useRef(dyno.dynoFloat(0.90));
  const physicsTumbleSpeedRef = useRef(dyno.dynoFloat(5.0));
  
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
    
    // Exit Animation - Exploded View
    explodedExpansionStrength,
    explodedRotationSpeed,
    explodedFadeStart,
    explodedFadeEnd,
    
    // Exit Animation - Pond Ripple
    pondWaveSpeed,
    pondWaveFrequency,
    pondWaveAmplitude,
    pondWaveCount,
    
    // Exit Animation - Physics Explosion
    physicsStrength,
    physicsGravity,
    physicsFriction,
    physicsTumbleSpeed,
    
    exitAnimationDuration,
    
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
              // Exit animation controls
              explodedExpansionStrength: 'float',
              explodedRotationSpeed: 'float',
              explodedFadeStart: 'float',
              explodedFadeEnd: 'float',
              // Pond ripple controls
              pondWaveSpeed: 'float',
              pondWaveFrequency: 'float',
              pondWaveAmplitude: 'float',
              pondWaveCount: 'float',
              // Physics explosion controls
              physicsStrength: 'float',
              physicsGravity: 'float',
              physicsFriction: 'float',
              physicsTumbleSpeed: 'float',
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

                // ============================================================
                // EXIT ANIMATION FUNCTIONS
                // ============================================================

                // 1. Gust of Wind (Ethos) - Toned down
                vec4 exitGust(vec3 pos, vec3 scale, float progress, vec3 h) {
                  vec3 windDir = normalize(vec3(1.0, 0.4, -0.2));
                  float weight = mix(0.7, 1.3, h.x);
                  float xDelay = (pos.x + 8.0) / 16.0;
                  float effectiveProgress = smoothstep(xDelay * 0.3, 1.0, progress);
                  float movement = pow(effectiveProgress, 2.0) * 15.0 / weight;
                  vec3 newPos = pos + windDir * movement;
                  float turbulence = sin(effectiveProgress * 10.0 + h.y * 6.28) * effectiveProgress * 0.8;
                  newPos.y += turbulence;
                  newPos.z += cos(effectiveProgress * 8.0 + h.z * 6.28) * effectiveProgress * 0.6;
                  float scaleMult = 1.0 - effectiveProgress * 0.7;
                  float opacity = 1.0 - effectiveProgress;
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 2. Sonic Boom (Contact) - Toned down
                vec4 exitSonic(vec3 pos, vec3 scale, float progress, vec3 h) {
                  vec3 origin = vec3(0.0, -1.5, 3.0);
                  vec3 diff = pos - origin;
                  float dist = length(diff);
                  vec3 dir = normalize(diff + vec3(0.001));
                  float radius = progress * 35.0;
                  float width = 3.0;
                  float shock = smoothstep(width, 0.0, abs(dist - radius));
                  vec3 newPos = pos;
                  newPos += dir * shock * 1.5;
                  if (dist < radius) {
                     float jitter = (1.0 - progress) * 0.5;
                     newPos += (h - 0.5) * jitter * 1.0;
                     newPos += dir * progress * 4.0;
                  }
                  float scaleMult = 1.0;
                  if (dist < radius) {
                     scaleMult = 1.0 - (progress * 0.9); 
                     scaleMult *= (0.8 + 0.4 * sin(progress * 15.0 + h.x * 10.0));
                  } else {
                     scaleMult = 1.0 + shock * 0.3;
                  }
                  float opacity = 1.0;
                  if (dist < radius) opacity = 1.0 - progress;
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 3. Cosmic Vortex (Gallery) - Toned down
                vec4 exitCosmic(vec3 pos, vec3 scale, float progress, vec3 h) {
                  vec3 center = vec3(0.0, 2.0, 0.0);
                  vec3 offset = pos - center;
                  float dist = length(offset);
                  float suction = progress * progress * 12.0;
                  float newDist = max(0.0, dist - suction);
                  float suckedFactor = 1.0 - (newDist / (dist + 0.001));
                  float rotation = progress * 2.0 + suckedFactor * 4.0;
                  float cosA = cos(rotation);
                  float sinA = sin(rotation);
                  float rotX = offset.x * cosA - offset.z * sinA;
                  float rotZ = offset.x * sinA + offset.z * cosA;
                  vec3 newPos = center + vec3(rotX, offset.y, rotZ) * (newDist / (dist + 0.001));
                  newPos.y += suckedFactor * 4.0 * (h.y + 0.2);
                  float scaleMult = 1.0 - suckedFactor;
                  float opacity = 1.0 - suckedFactor;
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 4. Pond Ripple (Gentle)
                vec4 exitPond(vec3 pos, vec3 scale, float progress, vec3 h, float speed, float freq, float amp, float waveCount) {
                  vec3 origin = vec3(0.0, 0.0, 0.0);
                  float dist = length(pos.xz - origin.xz);
                  
                  // Wave parameters from uniforms
                  float wavefront = progress * speed * 2.5; // Multiplier to match scale
                  float phase = dist * freq - progress * speed;
                  
                  float distFromFront = wavefront - dist;
                  
                  // Before wave hits: normal position
                  if (distFromFront < 0.0) return vec4(pos, 1000.0 + 0.999);
                  
                  // Calculate ripple envelope
                  // Only show ripple for a certain distance behind wavefront
                  float rippleWidth = waveCount / freq;
                  float envelope = smoothstep(rippleWidth, 0.0, distFromFront) * smoothstep(0.0, 1.0, distFromFront);
                  
                  // Calculate wave displacement
                  float rippleY = sin(phase) * amp * envelope;
                  
                  // Apply position changes
                  vec3 newPos = pos;
                  newPos.y += rippleY;
                  
                  vec2 dir = normalize(pos.xz - origin.xz + vec2(0.001));
                  float rippleH = cos(phase) * amp * 0.3 * envelope;
                  newPos.x += dir.x * rippleH;
                  newPos.z += dir.y * rippleH;
                  
                  // Fading logic:
                  // Particles fade out AFTER the wave passes them
                  // Calculate how "passed" the wave is
                  float passedDistance = distFromFront;
                  float fadeStart = rippleWidth * 0.2; // Start fading just after peak
                  float fadeEnd = rippleWidth * 0.8;   // Fully faded by end of tail
                  
                  float fadeProgress = smoothstep(fadeStart, fadeEnd, passedDistance);
                  float opacity = 1.0 - fadeProgress;
                  
                  // Scale effect: bulge up on wave, then shrink on fade
                  float scaleMult = 1.0 + rippleY * 0.5 - fadeProgress * 0.5;
                  
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 5. Exploded View (Gentle)
                vec4 exitExploded(vec3 pos, vec3 scale, float progress, vec3 h, float expansionStrength, float rotationSpeed, float fadeStart, float fadeEnd) {
                  vec3 center = vec3(0.0, 2.0, 0.0);
                  vec3 offset = pos - center;
                  
                  // Use uniform for expansion strength
                  float expansion = 1.0 + smoothstep(0.0, 1.0, progress) * expansionStrength;
                  vec3 newPos = center + offset * expansion;
                  
                  // Use uniform for rotation speed
                  float rotAngle = progress * rotationSpeed * (h.y + 0.5);
                  float cosA = cos(rotAngle);
                  float sinA = sin(rotAngle);
                  vec3 relPos = newPos - center;
                  float rotX = relPos.x * cosA - relPos.z * sinA;
                  float rotZ = relPos.x * sinA + relPos.z * cosA;
                  newPos = center + vec3(rotX, relPos.y, rotZ);
                  
                  // Use uniforms for fade timing
                  float opacity = 1.0 - smoothstep(fadeStart, fadeEnd, progress);
                  
                  // Scale down completely to 0 to ensure tiny particles disappear (sync with opacity fade)
                  // Use a slightly more aggressive scale down to prevent single-pixel flickering
                  // The smoothstep end point should be slightly BEFORE the fade end to ensure
                  // they are scaled to 0 before they are fully transparent but still technically rendering
                  float scaleMult = 1.0 - smoothstep(fadeStart, fadeEnd * 0.95, progress);
                  
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 6. Sawdust Drift (Gentle)
                vec4 exitSawdust(vec3 pos, vec3 scale, float progress, vec3 h) {
                  // Coordinate Space Correction:
                  // Mesh has -90 deg X rotation.
                  // Local +Z is World Up (approx)
                  // Local -Y is World Back (Away from Camera)
                  
                  // Drift direction: 
                  // We want them to fall DOWN (Local +Z) and drift BACK (Local -Y)
                  // drift x, y, z
                  vec3 drift = vec3(0.2, -1.0, 1.0); // -Y is back, +Z is down? No.
                  
                  // Let's re-verify:
                  // Rotation X = -1.6 (-90 deg)
                  // Local Z -> World Y (Up)  [Rotated -90 deg around X means Z goes to Y]
                  // Local Y -> World -Z (Away) [Rotated -90 deg around X means Y goes to -Z]
                  
                  // So "Falling" means decreasing World Y, which means decreasing Local Z.
                  // "Drifting Away" means decreasing World Z, which means increasing Local Y? No, Y goes to -Z.
                  // Wait. 
                  // (0,1,0) * RotX(-90) = (0, 0, -1) -> Y became -Z.
                  // (0,0,1) * RotX(-90) = (0, 1, 0) -> Z became Y.
                  
                  // So to fall (World -Y), we need Local -Z.
                  // To drift away (World -Z), we need Local +Y.
                  
                  vec3 gravityDir = vec3(0.0, 0.0, -1.0); // Local -Z is World -Y (Down)
                  vec3 windDir = vec3(0.2, 1.0, 0.0);    // Local +Y is World -Z (Away)
                  
                  float normY = (pos.z + 5.0) / 10.0; // Use Z for vertical gradient (since Z is Up/Down)
                  
                  float dissolveThreshold = 1.0 - (progress * 1.5);
                  // Dissolve from top to bottom (World Y) -> Local Z
                  float isDissolving = smoothstep(dissolveThreshold + 0.2, dissolveThreshold - 0.2, normY + (h.x * 0.4 - 0.2));
                  
                  if (isDissolving < 0.01) return vec4(pos, 1000.0 + 0.999);
                  
                  float particleTime = progress; 
                  vec3 newPos = pos;
                  
                  float fallSpeed = 3.0 + h.y * 2.0;
                  
                  // Apply movement
                  vec3 movement = (gravityDir * fallSpeed) + (windDir * fallSpeed * 0.5);
                  newPos += movement * particleTime * isDissolving;
                  
                  float t = particleTime * 2.0;
                  // Add noise
                  newPos.x += sin(t * 3.0 + h.z * 10.0) * 0.5 * isDissolving;
                  
                  // Oscillate other axes
                  newPos.y += cos(t * 2.5 + h.x * 10.0) * 0.2 * isDissolving; // Forward/Back oscillation
                  newPos.z += sin(t * 2.0 + h.y * 10.0) * 0.2 * isDissolving; // Up/Down oscillation
                  
                  float scaleMult = 1.0 - isDissolving * 0.8;
                  float opacity = 1.0 - isDissolving;
                  
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 7. Physics Explosion (Radial)
                vec4 exitExplosion(vec3 pos, vec3 scale, float progress, vec3 h, float strength, float gravity, float friction, float tumbleSpeed) {
                  float t = progress * 1.5; // Duration in seconds (approx)
                  if (t <= 0.0) return vec4(pos, 1000.0 + 0.999);
                  
                  // Center of explosion (approximate center of mesh)
                  // Place center slightly in FRONT of the object to push everything backwards away from camera
                  vec3 center = vec3(0.0, 1.0, 2.0);
                  
                  // Radial direction from center
                  vec3 dir = pos - center;
                  
                  // No need for manual bias if we move the center forward, 
                  // but let's clamp Z to be safe if desired, or just let physics do it.
                  // Since center.z is 2.0 and object is around 0.0, dir.z will be negative (approx -2.0).
                  // This ensures strong backward momentum.
                  
                  float dist = length(dir);
                  vec3 normDir = normalize(dir + vec3(0.001));
                  
                  // Calculate initial velocity
                  // Mix of radial (explosive) and random (chaos)
                  
                  // Radial component
                  vec3 radialVel = normDir * strength;
                  
                  // Coordinate Space Correction:
                  // The mesh is rotated by -1.6 radians on X (approx -90 deg).
                  // Local Y aligns with World Z.
                  // BUT, if we are modifying position in local space, and the mesh is rotated...
                  // Let's try forcing Z heavily negative in local space, and if that fails, Y.
                  // If rotation is -90 deg X:
                  // Local (0, 0, -1) -> World (0, 1, 0) [Up]
                  // Local (0, 1, 0) -> World (0, 0, 1) [Towards Camera]
                  // Local (0, -1, 0) -> World (0, 0, -1) [Away from Camera]
                  
                  // So we want NEGATIVE Y in local space to go AWAY from camera (World -Z).
                  
                  if (radialVel.y > 0.0) {
                     radialVel.y = -radialVel.y * 0.5; // Flip to negative Y
                  } else {
                     radialVel.y *= 2.0; // Boost negative Y
                  }
                  
                  // Random component
                  vec3 randomDir = h - 0.5;
                  if (randomDir.y > 0.0) randomDir.y *= -1.0; // Force negative Y
                  vec3 randomVel = randomDir * strength * 0.5;
                  
                  // Combine
                  vec3 velocity = radialVel + randomVel;
                  
                  // Final safety check: subtract constant from Y to guarantee backward drift in World Space
                  // (Negative Y local = Negative Z world)
                  velocity.y -= 5.0; 
                  
                  // Apply friction (damping)
                  float frictionFactor = pow(friction, t * 60.0);
                  
                  // Update position
                  vec3 newPos = pos;
                  newPos += velocity * t * frictionFactor;
                  newPos.y -= 0.5 * gravity * t * t;
                  
                  // Add subtle turbulence/tumble to position (fake tumbling)
                  // Using tumbleSpeed to drive high frequency noise
                  vec3 tumble = vec3(
                    sin(t * tumbleSpeed * 5.0 + h.x * 10.0),
                    cos(t * tumbleSpeed * 4.0 + h.y * 10.0),
                    sin(t * tumbleSpeed * 6.0 + h.z * 10.0)
                  ) * 0.1 * t;
                  newPos += tumble;

                  // Scale down over time
                  float scaleMult = 1.0 - smoothstep(0.5, 1.5, t);
                  float opacity = 1.0 - smoothstep(1.0, 1.5, t);
                  
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // Apply exit animation based on type
                // 1=Gust, 2=Sonic, 3=Cosmic, 4=Pond, 5=Exploded, 6=Sawdust, 7=Explosion
                vec4 applyExitAnimation(vec3 pos, vec3 scale, float exitType, float exitProgress, vec3 h, 
                                       float expStrength, float expRotSpeed, float expFadeStart, float expFadeEnd,
                                       float pondSpeed, float pondFreq, float pondAmp, float pondCount,
                                       float physStrength, float physGravity, float physFriction, float physTumble) {
                  if (exitProgress <= 0.001 || exitType < 0.5) {
                    return vec4(pos, 1000.0 + 0.999);
                  }

                  if (exitType < 1.5) return exitGust(pos, scale, exitProgress, h);
                  if (exitType < 2.5) return exitSonic(pos, scale, exitProgress, h);
                  if (exitType < 3.5) return exitCosmic(pos, scale, exitProgress, h);
                  if (exitType < 4.5) return exitPond(pos, scale, exitProgress, h, pondSpeed, pondFreq, pondAmp, pondCount);
                  if (exitType < 5.5) return exitExploded(pos, scale, exitProgress, h, expStrength, expRotSpeed, expFadeStart, expFadeEnd);
                  if (exitType < 6.5) return exitSawdust(pos, scale, exitProgress, h);
                  return exitExplosion(pos, scale, exitProgress, h, physStrength, physGravity, physFriction, physTumble);
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
              
              // Exploded view controls
              float expStrength = ${inputs.explodedExpansionStrength};
              float expRotSpeed = ${inputs.explodedRotationSpeed};
              float expFadeStart = ${inputs.explodedFadeStart};
              float expFadeEnd = ${inputs.explodedFadeEnd};
              
              // Pond ripple controls
              float pondSpeed = ${inputs.pondWaveSpeed};
              float pondFreq = ${inputs.pondWaveFrequency};
              float pondAmp = ${inputs.pondWaveAmplitude};
              float pondCount = ${inputs.pondWaveCount};

              // Physics explosion controls
              float physStrength = ${inputs.physicsStrength};
              float physGravity = ${inputs.physicsGravity};
              float physFriction = ${inputs.physicsFriction};
              float physTumble = ${inputs.physicsTumbleSpeed};

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
                  vec4 exitResult = applyExitAnimation(${outputs.gsplat}.center, ${outputs.gsplat}.scales, exitType, exitProgress, h, 
                                                      expStrength, expRotSpeed, expFadeStart, expFadeEnd,
                                                      pondSpeed, pondFreq, pondAmp, pondCount,
                                                      physStrength, physGravity, physFriction, physTumble);
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
            explodedExpansionStrength: explodedExpansionStrengthRef.current,
            explodedRotationSpeed: explodedRotationSpeedRef.current,
            explodedFadeStart: explodedFadeStartRef.current,
            explodedFadeEnd: explodedFadeEndRef.current,
            pondWaveSpeed: pondWaveSpeedRef.current,
            pondWaveFrequency: pondWaveFrequencyRef.current,
            pondWaveAmplitude: pondWaveAmplitudeRef.current,
            pondWaveCount: pondWaveCountRef.current,
            physicsStrength: physicsStrengthRef.current,
            physicsGravity: physicsGravityRef.current,
            physicsFriction: physicsFrictionRef.current,
            physicsTumbleSpeed: physicsTumbleSpeedRef.current,
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
      // Set the exit animation type based on target scene or override
      // Use override if present, otherwise fallback to scene default
      const type = overrideExitType !== null && overrideExitType !== undefined 
        ? overrideExitType 
        : (EXIT_ANIMATION_TYPE[targetScene] || 0);
        
      exitTypeRef.current.value = type;
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
  }, [animationPhase, targetScene, activeScene, overrideExitType]);

  // Animate the entrance effect and camera
  useFrame((_, delta) => {
    baseTimeRef.current += delta;
    animateT.current.value = baseTimeRef.current;
    depthOffsetRef.current.value = depthOffset;
    animationSpeedRef.current.value = animationSpeed;

    // Update exit animation progress with easing
    if (animationPhase === 'exiting' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      // Use dynamic animation duration from controls
      const linearProgress = Math.min(elapsed / exitAnimationDuration, 1);
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
    // Exit animation parameters
    explodedExpansionStrengthRef.current.value = explodedExpansionStrength;
    explodedRotationSpeedRef.current.value = explodedRotationSpeed;
    explodedFadeStartRef.current.value = explodedFadeStart;
    explodedFadeEndRef.current.value = explodedFadeEnd;

    // Pond ripple parameters
    pondWaveSpeedRef.current.value = pondWaveSpeed;
    pondWaveFrequencyRef.current.value = pondWaveFrequency;
    pondWaveAmplitudeRef.current.value = pondWaveAmplitude;
    pondWaveCountRef.current.value = pondWaveCount;

    // Physics explosion parameters
    physicsStrengthRef.current.value = physicsStrength;
    physicsGravityRef.current.value = physicsGravity;
    physicsFrictionRef.current.value = physicsFriction;
    physicsTumbleSpeedRef.current.value = physicsTumbleSpeed;

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
