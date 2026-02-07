import { useFrame, useThree } from '@react-three/fiber';
import { PresentationControls } from '@react-three/drei';
import { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { Euler, Quaternion, Vector3 } from 'three';
import type { SplatMesh as SparkSplatMesh } from '@sparkjsdev/spark';
import { dyno } from '@sparkjsdev/spark';
import { easeOutCubic, easeInOutCubic, lerp } from '../../utils';
import { useSceneControls } from '../../hooks';
import { EXIT_ANIMATION_TYPE } from '../../constants';
import type { SceneId, AnimationPhase } from '../../constants';
import '../spark';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

interface SceneProps {
  activeScene: SceneId;
  targetScene: SceneId;
  animationPhase: AnimationPhase;
  exitAnimationDuration: number;
  returnAnimationDuration: number;
  controlsStore?: LevaStore;
  overrideExitType?: number | null;
}

/**
 * Scene component for the 3D splat visualization
 * Handles camera controls, splat mesh rendering, entrance and exit animations
 */
const Scene = ({
  activeScene,
  targetScene,
  animationPhase,
  exitAnimationDuration,
  returnAnimationDuration,
  controlsStore,
  overrideExitType,
}: SceneProps) => {
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

  // Logo splat mesh refs for transitions
  const [logoMeshReady, setLogoMeshReady] = useState<SparkSplatMesh | null>(null);
  const logoMeshRef = useRef<SparkSplatMesh | null>(null);
  const logoMeshCallbackRef = useCallback((node: SparkSplatMesh | null) => {
    logoMeshRef.current = node;
    if (node) {
      setLogoMeshReady(node);
    }
  }, []);
  const logoEffectSetupRef = useRef(false);
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

  // Sawdust drift controls
  const sawdustFallSpeedRef = useRef(dyno.dynoFloat(4.0));
  const sawdustWindStrengthRef = useRef(dyno.dynoFloat(2.0));
  const sawdustTurbulenceRef = useRef(dyno.dynoFloat(1.0));
  const sawdustDissolveSpeedRef = useRef(dyno.dynoFloat(1.5));

  // Disintegration/Ash controls
  const ashRiseSpeedRef = useRef(dyno.dynoFloat(3.0));
  const ashSpreadRadiusRef = useRef(dyno.dynoFloat(5.0));
  const ashEmberGlowRef = useRef(dyno.dynoFloat(0.5));
  const ashBurnSpeedRef = useRef(dyno.dynoFloat(1.2));

  // Shatter/Glass controls
  const shatterForceRef = useRef(dyno.dynoFloat(20.0));
  const shatterGravityRef = useRef(dyno.dynoFloat(15.0));
  const shatterSpreadRef = useRef(dyno.dynoFloat(1.0));
  const shatterRotationRef = useRef(dyno.dynoFloat(5.0));

  // Pixelate/Glitch controls
  const glitchIntensityRef = useRef(dyno.dynoFloat(1.0));
  const glitchBlockSizeRef = useRef(dyno.dynoFloat(0.5));
  const glitchSpeedRef = useRef(dyno.dynoFloat(10.0));
  const glitchChromaRef = useRef(dyno.dynoFloat(0.3));

  // Black Hole controls
  const blackHoleStrengthRef = useRef(dyno.dynoFloat(15.0));
  const blackHoleSpinSpeedRef = useRef(dyno.dynoFloat(3.0));
  const blackHoleRadiusRef = useRef(dyno.dynoFloat(0.5));
  const blackHoleStretchRef = useRef(dyno.dynoFloat(2.0));

  // Bloom/Pollen controls
  const pollenDriftSpeedRef = useRef(dyno.dynoFloat(2.0));
  const pollenSpreadRef = useRef(dyno.dynoFloat(8.0));
  const pollenWaveStrengthRef = useRef(dyno.dynoFloat(1.5));
  const pollenRiseSpeedRef = useRef(dyno.dynoFloat(1.0));

  // Freeze/Shatter controls
  const freezeSpeedRef = useRef(dyno.dynoFloat(2.0));
  const freezeCrackDensityRef = useRef(dyno.dynoFloat(5.0));
  const freezeShatterDelayRef = useRef(dyno.dynoFloat(0.4));
  const freezeShardSpeedRef = useRef(dyno.dynoFloat(10.0));

  // Sand/Hourglass controls
  const sandFallSpeedRef = useRef(dyno.dynoFloat(6.0));
  const sandFunnelWidthRef = useRef(dyno.dynoFloat(1.0));
  const sandSpreadRef = useRef(dyno.dynoFloat(3.0));
  const sandGrainSizeRef = useRef(dyno.dynoFloat(0.8));
  const sandViewRightRef = useRef(dyno.dynoVec3(new Vector3(1, 0, 0)));
  const sandViewUpRef = useRef(dyno.dynoVec3(new Vector3(0, 1, 0)));
  const sandCameraPosRef = useRef(dyno.dynoVec3(new Vector3(0, 0, 0)));
  const sandBasisRef = useRef({
    cameraRight: new Vector3(),
    cameraUp: new Vector3(),
    localRight: new Vector3(),
    localUp: new Vector3(),
    cameraLocal: new Vector3(),
    meshEuler: new Euler(),
    meshQuat: new Quaternion(),
  });
  const splatOffsetRef = useRef(new Vector3(0, -0.5, 0));

  // Teleport/Beam controls
  const teleportSpeedRef = useRef(dyno.dynoFloat(2.0));
  const teleportSparkleRef = useRef(dyno.dynoFloat(1.0));
  const teleportBandWidthRef = useRef(dyno.dynoFloat(2.0));
  const teleportDirectionRef = useRef(dyno.dynoFloat(1.0));
  
  // Mobile simplification refs - reduce small particle chaos
  const smallParticleThresholdRef = useRef(dyno.dynoFloat(0.0));
  const smallMotionReductionRef = useRef(dyno.dynoFloat(0.0));
  const skipSmallAnimationRef = useRef(dyno.dynoFloat(0.0));
  const smallSpeedMultiplierRef = useRef(dyno.dynoFloat(1.0));
  // Exit animation refs
  const exitTypeRef = useRef(dyno.dynoFloat(0.0));
  const exitProgressRef = useRef(dyno.dynoFloat(0.0));
  const returnProgressRef = useRef(dyno.dynoFloat(0.0));
  const exitStartTimeRef = useRef<number | null>(null);
  const baseTimeRef = useRef(0);
  const effectSetupRef = useRef(false);
  const cameraAnimationComplete = useRef(false);
  const cameraHoldRef = useRef<{ x: number; y: number; z: number } | null>(null);

  // Splat transition refs (for transitioning between main scene and logo)
  const transitionProgressRef = useRef(dyno.dynoFloat(0.0));
  const transitionStartTimeRef = useRef<number | null>(null);
  const logoOpacityRef = useRef(dyno.dynoFloat(0.0));

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

  useEffect(() => {
    if (animationPhase !== 'idle') {
      cameraHoldRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
    } else {
      cameraHoldRef.current = null;
    }
  }, [animationPhase, camera]);

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

  // Transition test handlers
  const handleTestTransition = useCallback(() => {
    transitionStartTimeRef.current = performance.now();
    transitionProgressRef.current.value = 0;
  }, []);

  const handleResetTransition = useCallback(() => {
    transitionStartTimeRef.current = null;
    transitionProgressRef.current.value = 0;
    logoOpacityRef.current.value = 0;
    if (meshRef.current) meshRef.current.updateVersion();
    if (logoMeshRef.current) logoMeshRef.current.updateVersion();
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

    // Exit Animation - Sawdust Drift
    sawdustFallSpeed,
    sawdustWindStrength,
    sawdustTurbulence,
    sawdustDissolveSpeed,

    // Exit Animation - Disintegration/Ash
    ashRiseSpeed,
    ashSpreadRadius,
    ashEmberGlow,
    ashBurnSpeed,

    // Exit Animation - Shatter/Glass
    shatterForce,
    shatterGravity,
    shatterSpread,
    shatterRotation,

    // Exit Animation - Pixelate/Glitch
    glitchIntensity,
    glitchBlockSize,
    glitchSpeed,
    glitchChroma,

    // Exit Animation - Black Hole
    blackHoleStrength,
    blackHoleSpinSpeed,
    blackHoleRadius,
    blackHoleStretch,

    // Exit Animation - Bloom/Pollen
    pollenDriftSpeed,
    pollenSpread,
    pollenWaveStrength,
    pollenRiseSpeed,

    // Exit Animation - Freeze/Shatter
    freezeSpeed,
    freezeCrackDensity,
    freezeShatterDelay,
    freezeShardSpeed,

    // Exit Animation - Sand/Hourglass
    sandFallSpeed,
    sandFunnelWidth,
    sandSpread,
    sandGrainSize,

    // Exit Animation - Teleport/Beam
    teleportSpeed,
    teleportSparkle,
    teleportBandWidth,
    teleportDirection,
    // Splat Transitions
    transitionType,
    transitionDuration,
    transitionScatterRadius: _transitionScatterRadius,
    transitionSpinSpeed: _transitionSpinSpeed,
    transitionWipeDirection: _transitionWipeDirection,

    // Logo Transform
    logoRotationX,
    logoRotationY,
    logoRotationZ,
    logoScale,
    logoPositionX,
    logoPositionY,
    logoPositionZ,

    currentCameraX,
    currentCameraY,
    currentCameraZ,
  } = useSceneControls({
    isMobile,
    onResetAnimation: handleResetAnimation,
    onTestTransition: handleTestTransition,
    onResetTransition: handleResetTransition,
    store: controlsStore,
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

  // Memoize Logo SplatMesh args for transitions
  const logoSplatMeshArgs = useMemo(
    () =>
      ({
        url: '/assets/dfw_logo.spz',
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
              // Sawdust drift controls
              sawdustFallSpeed: 'float',
              sawdustWindStrength: 'float',
              sawdustTurbulence: 'float',
              sawdustDissolveSpeed: 'float',
              // Ash/Disintegration controls
              ashRiseSpeed: 'float',
              ashSpreadRadius: 'float',
              ashEmberGlow: 'float',
              ashBurnSpeed: 'float',
              // Shatter controls
              shatterForce: 'float',
              shatterGravity: 'float',
              shatterSpread: 'float',
              shatterRotation: 'float',
              // Glitch controls
              glitchIntensity: 'float',
              glitchBlockSize: 'float',
              glitchSpeed: 'float',
              glitchChroma: 'float',
              // Black hole controls
              blackHoleStrength: 'float',
              blackHoleSpinSpeed: 'float',
              blackHoleRadius: 'float',
              blackHoleStretch: 'float',
              // Pollen controls
              pollenDriftSpeed: 'float',
              pollenSpread: 'float',
              pollenWaveStrength: 'float',
              pollenRiseSpeed: 'float',
              // Freeze controls
              freezeSpeed: 'float',
              freezeCrackDensity: 'float',
              freezeShatterDelay: 'float',
              freezeShardSpeed: 'float',
              // Sand controls
              sandFallSpeed: 'float',
              sandFunnelWidth: 'float',
              sandSpread: 'float',
              sandGrainSize: 'float',
              sandViewRight: 'vec3',
              sandViewUp: 'vec3',
              sandCameraPos: 'vec3',
              // Teleport controls
              teleportSpeed: 'float',
              teleportSparkle: 'float',
              teleportBandWidth: 'float',
              teleportDirection: 'float',
              // Mobile simplification inputs
              smallThreshold: 'float',
              motionReduction: 'float',
              skipSmall: 'float',
              smallSpeed: 'float',
              // Exit animation inputs
              exitType: 'float',
              exitProgress: 'float',
              returnProgress: 'float',
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
                  float shock = 1.0 - smoothstep(0.0, width, abs(dist - radius));
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
                  float wavefront = progress * speed * 2.5;
                  float phase = dist * freq - progress * speed;

                  float distFromFront = wavefront - dist;

                  // Before wave hits: stay in place, fully visible
                  if (distFromFront < 0.0) return vec4(pos, 1000.0 + 0.999);

                  // Ripple envelope - how much this particle is affected
                  float rippleWidth = waveCount / freq;
                  float envelope = (1.0 - smoothstep(0.0, rippleWidth, distFromFront)) * smoothstep(0.0, 2.0, distFromFront);

                  // Gentle wave displacement
                  float rippleY = sin(phase) * amp * envelope * 0.5;

                  vec3 newPos = pos;
                  newPos.y += rippleY;

                  // Subtle horizontal ripple
                  vec2 dir = normalize(pos.xz - origin.xz + vec2(0.001));
                  float rippleH = cos(phase) * amp * 0.15 * envelope;
                  newPos.x += dir.x * rippleH;
                  newPos.z += dir.y * rippleH;

                  // Fade calculation - ensure BOTH scale and opacity reach 0
                  float fadeStart = rippleWidth * 0.3;
                  float fadeEnd = rippleWidth * 0.95;
                  float fadeProgress = smoothstep(fadeStart, fadeEnd, distFromFront);

                  // Critical: Both scale AND opacity must go to 0 to avoid white artifacts
                  float scaleMult = max(0.0, 1.0 - fadeProgress);
                  float opacity = max(0.0, 1.0 - fadeProgress);

                  // If fully faded, ensure complete invisibility
                  if (fadeProgress > 0.99) {
                    scaleMult = 0.0;
                    opacity = 0.0;
                  }

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
                  
                  // Use uniforms for fade timing (guarded for ordering/degenerate ranges)
                  float fadeMin = min(fadeStart, fadeEnd);
                  float fadeRange = max(0.0001, abs(fadeEnd - fadeStart));
                  float fadeMax = fadeMin + fadeRange;
                  float scaleFadeEnd = fadeMin + fadeRange * 0.95;
                  float opacity = 1.0 - smoothstep(fadeMin, fadeMax, progress);
                  
                  // Scale down completely to 0 to ensure tiny particles disappear (sync with opacity fade)
                  // Use a slightly more aggressive scale down to prevent single-pixel flickering
                  // The smoothstep end point should be slightly BEFORE the fade end to ensure
                  // they are scaled to 0 before they are fully transparent but still technically rendering
                  float scaleMult = 1.0 - smoothstep(fadeMin, scaleFadeEnd, progress);
                  
                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 6. Sawdust Drift (Gentle falling particles like sawdust)
                vec4 exitSawdust(vec3 pos, vec3 scale, float progress, vec3 h,
                                 float fallSpeed, float windStrength, float turbulence, float dissolveSpeed) {
                  // Coordinate Space: Mesh has -90 deg X rotation
                  // Local -Z = World Down, Local +Y = World Away from camera

                  // All particles participate - use progress directly with per-particle delay
                  float particleDelay = h.x * 0.4; // Stagger start times
                  float adjustedProgress = max(0.0, (progress - particleDelay) / (1.0 - particleDelay));

                  // Smooth easing for graceful motion
                  float t = adjustedProgress * adjustedProgress * 2.0;

                  // Per-particle fall speed variation
                  float particleFallSpeed = fallSpeed * (0.7 + h.y * 0.6);

                  vec3 newPos = pos;

                  // Gravity: fall down (Local -Z = World -Y)
                  newPos.z -= particleFallSpeed * t;

                  // Wind: drift away from camera (Local +Y = World -Z)
                  newPos.y += windStrength * t * (0.5 + h.z * 0.5);

                  // Gentle lateral drift
                  newPos.x += (h.x - 0.5) * windStrength * 0.3 * t;

                  // Soft turbulence oscillation
                  float turbTime = adjustedProgress * 4.0;
                  newPos.x += sin(turbTime * 2.0 + h.z * 6.28) * turbulence * 0.3 * adjustedProgress;
                  newPos.y += cos(turbTime * 1.5 + h.x * 6.28) * turbulence * 0.2 * adjustedProgress;
                  newPos.z += sin(turbTime * 1.0 + h.y * 6.28) * turbulence * 0.1 * adjustedProgress;

                  // Graceful fade - both scale AND opacity go to 0 (dissolveSpeed controls fade rate)
                  float dissolveProgress = clamp(adjustedProgress * dissolveSpeed, 0.0, 1.0);
                  float fadeProgress = smoothstep(0.3, 1.0, dissolveProgress);
                  float scaleMult = 1.0 - fadeProgress;
                  float opacity = 1.0 - fadeProgress;

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 7. Physics Explosion (Radial burst with gravity AND ground bounce!)
                vec4 exitExplosion(vec3 pos, vec3 scale, float progress, vec3 h,
                                   float strength, float gravity, float friction, float tumbleSpeed) {
                  float t = progress * 2.5; // Slightly longer time scale for bounces
                  if (t <= 0.0) return vec4(pos, 1000.0 + 0.999);
                  float safeGravity = max(gravity, 0.001);

                  // Ground plane in local space (Local -Z = World Down)
                  // Position it below the scene
                  float groundZ = -4.0;
                  float bounceDamping = 0.55; // Energy retained after bounce (0.55 = decent bounce)

                  // Explosion center in local space
                  vec3 center = vec3(0.0, 0.0, 0.0);
                  vec3 dir = pos - center;
                  float dist = length(dir);
                  vec3 normDir = normalize(dir + vec3(0.001));

                  // Initial radial velocity - explode outward
                  vec3 velocity = normDir * strength * (0.5 + h.x * 0.5);

                  // Add random scatter
                  velocity += (h - 0.5) * strength * 0.4;

                  // Bias toward going away from camera (Local +Y = World -Z)
                  velocity.y += strength * 0.3;

                  // Slight upward initial velocity so particles arc before falling
                  velocity.z += strength * 0.15 * (0.5 + h.z * 0.5);

                  // Simulate position with bouncing
                  vec3 newPos = pos;
                  float remainingTime = t;
                  vec2 xy = pos.xy;
                  vec2 velXY = velocity.xy;
                  float currentZ = pos.z;
                  float currentVelZ = velocity.z;

                  // Simulate up to 4 bounces
                  for (int bounce = 0; bounce < 4; bounce++) {
                    // Calculate time to hit ground: z + vz*t - 0.5*g*t^2 = groundZ
                    // Solving quadratic: -0.5*g*t^2 + vz*t + (z - groundZ) = 0
                    // t = (vz + sqrt(vz^2 + 2*g*(z - groundZ))) / g

                    float heightAboveGround = currentZ - groundZ;

                    // If already below ground or no time left, stop
                    if (heightAboveGround < 0.0 || remainingTime <= 0.0) break;

                    // Quadratic formula for time to impact
                    float a = 0.5 * safeGravity;
                    float b = -currentVelZ;
                    float c = -heightAboveGround;
                    float discriminant = b * b - 4.0 * a * c;

                    if (discriminant < 0.0) {
                      // No impact - particle stays in air
                      // Just apply normal physics for remaining time
                      float segmentFriction = exp(-friction * 0.5 * remainingTime);
                      xy += velXY * remainingTime * segmentFriction;
                      newPos.z = currentZ + currentVelZ * remainingTime - 0.5 * safeGravity * remainingTime * remainingTime;
                      break;
                    }

                    float sqrtDisc = sqrt(discriminant);
                    float t1 = (-b - sqrtDisc) / (2.0 * a);
                    float t2 = (-b + sqrtDisc) / (2.0 * a);

                    // We want the smallest positive time
                    float timeToImpact = t1 > 0.001 ? t1 : t2;

                    if (timeToImpact > remainingTime || timeToImpact < 0.001) {
                      // No impact within remaining time
                      float segmentFriction = exp(-friction * 0.5 * remainingTime);
                      xy += velXY * remainingTime * segmentFriction;
                      newPos.z = currentZ + currentVelZ * remainingTime - 0.5 * safeGravity * remainingTime * remainingTime;
                      break;
                    }

                    // Move to impact point
                    float segmentFriction = exp(-friction * 0.5 * timeToImpact);
                    xy += velXY * timeToImpact * segmentFriction;
                    newPos.z = groundZ;

                    // Velocity at impact (v = v0 - g*t)
                    float impactVelZ = currentVelZ - safeGravity * timeToImpact;

                    // Bounce! Reflect and dampen Z velocity
                    currentVelZ = -impactVelZ * bounceDamping;
                    currentZ = groundZ + 0.01; // Slightly above ground

                    // Also dampen horizontal velocity on ground contact (use friction)
                    velXY *= 0.85 * segmentFriction;

                    remainingTime -= timeToImpact;

                    // If bounce velocity is very small, just settle on ground
                    if (abs(currentVelZ) < 0.5) {
                      newPos.z = groundZ;
                      break;
                    }

                    // Continue simulation from bounce point
                    if (remainingTime > 0.0) {
                      newPos.z = currentZ + currentVelZ * remainingTime - 0.5 * safeGravity * remainingTime * remainingTime;
                      // Clamp to ground
                      newPos.z = max(newPos.z, groundZ);
                    }
                  }

                  newPos.x = xy.x;
                  newPos.y = xy.y;

                  // Final ground clamp (safety)
                  newPos.z = max(newPos.z, groundZ);

                  // Tumble effect - more intense during flight, settles after bouncing
                  float flightPhase = 1.0 - smoothstep(0.5, 1.0, progress);
                  float tumblePhase = t * tumbleSpeed;
                  vec3 tumble = vec3(
                    sin(tumblePhase * 5.0 + h.x * 20.0),
                    cos(tumblePhase * 4.0 + h.y * 20.0),
                    sin(tumblePhase * 6.0 + h.z * 20.0)
                  ) * 0.12 * flightPhase;
                  newPos += tumble;

                  // Final ground clamp again after tumble
                  newPos.z = max(newPos.z, groundZ);

                  // Fade and shrink - delayed to let bounces be visible
                  float scaleMult = 1.0 - smoothstep(0.5, 1.0, progress);
                  float opacity = 1.0 - smoothstep(0.6, 1.0, progress);

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 8. Disintegration/Ash (Burn away with rising embers)
                vec4 exitAsh(vec3 pos, vec3 scale, float progress, vec3 h,
                             float riseSpeed, float spreadRadius, float emberGlow, float burnSpeed) {
                  // All particles participate with staggered timing based on distance from center
                  vec3 center = vec3(0.0, 0.0, 0.0);
                  float distFromCenter = length(pos.xz - center.xz);
                  float maxDist = 8.0;
                  float normDist = clamp(distFromCenter / maxDist, 0.0, 1.0);

                  // Edges burn first - particle delay based on distance (outer = earlier)
                  float particleDelay = (1.0 - normDist) * 0.5 + h.x * 0.2;
                  float adjustedProgress = max(0.0, (progress * burnSpeed - particleDelay) / (1.0 - particleDelay * 0.5));
                  adjustedProgress = min(adjustedProgress, 1.0);

                  // Smooth easing
                  float t = adjustedProgress * 2.0;

                  vec3 newPos = pos;

                  // Rise up like embers (Local +Z = World +Y) - graceful upward motion
                  float riseAmount = riseSpeed * t * t * (0.5 + h.y * 0.5);
                  newPos.z += riseAmount;

                  // Gentle spread outward
                  vec2 spreadDir = normalize(pos.xz - center.xz + vec2(0.001));
                  float spreadAmount = spreadRadius * t * (0.3 + h.z * 0.4);
                  newPos.x += spreadDir.x * spreadAmount;
                  newPos.y += spreadDir.y * spreadAmount * 0.5;

                  // Subtle ember flicker (not jarring)
                  float flickerPhase = t * 8.0 + h.x * 6.28;
                  float flicker = sin(flickerPhase) * cos(flickerPhase * 0.7) * 0.5 + 0.5;
                  newPos.x += (flicker - 0.5) * 0.05 * adjustedProgress;

                  // Graceful fade out - scale and opacity both go to 0
                  float fadeProgress = smoothstep(0.2, 1.0, adjustedProgress);
                  float scaleMult = (1.0 - fadeProgress) * (0.9 + emberGlow * 0.2 * flicker);
                  float opacity = 1.0 - fadeProgress;

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 9. Shatter/Glass Break (Crack, burst, then fall)
                vec4 exitShatter(vec3 pos, vec3 scale, float progress, vec3 h,
                                 float force, float grav, float spread, float rotation) {
                  float crackPhase = smoothstep(0.0, 0.18, progress);
                  float burstPhase = smoothstep(0.1, 0.35, progress);
                  float fallPhase = smoothstep(0.25, 1.0, progress);

                  vec3 newPos = pos;
                  vec3 center = vec3(0.0, 1.0, 0.0);
                  vec3 fromCenter = normalize(pos - center + (h - 0.5) * spread + vec3(0.001));

                  // Subtle crack jitter
                  newPos += (h - 0.5) * 0.06 * crackPhase;

                  // Shards separate outward
                  float burstStrength = force * (0.12 + h.x * 0.08);
                  newPos += fromCenter * burstStrength * burstPhase;
                  newPos += (h - 0.5) * spread * 0.25 * burstPhase;

                  // Gravity fall (Local -Z = World Down)
                  float fallAmount = grav * 0.7 * fallPhase * fallPhase;
                  newPos.z -= fallAmount;

                  // Gentle swirl while falling
                  float rotPhase = progress * rotation * 0.25;
                  newPos.x += sin(rotPhase + h.y * 6.28) * 0.15 * fallPhase;
                  newPos.y += cos(rotPhase * 1.1 + h.x * 6.28) * 0.15 * fallPhase;

                  // Fade out with fall
                  float fadeProgress = smoothstep(0.35, 1.0, progress);
                  float scaleMult = 1.0 - fadeProgress;
                  float opacity = 1.0 - fadeProgress;

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 10. Pixelate/Glitch (Digital dissolution)
                vec4 exitGlitch(vec3 pos, vec3 scale, float progress, vec3 h,
                                float intensity, float blockSize, float speed, float chroma) {
                  float t = progress;

                  // Snap to grid blocks
                  vec3 blockPos = floor(pos / blockSize) * blockSize;
                  float blockHash = fract(sin(dot(blockPos.xy, vec2(12.9898, 78.233))) * 43758.5453);

                  // Glitch timing - different blocks glitch at different times
                  float glitchStart = blockHash * 0.5;
                  float glitchEnd = glitchStart + 0.25;
                  if (t < glitchStart) return vec4(pos, 1000.0 + 0.999);

                  float glitchPhase = smoothstep(glitchStart, glitchEnd, t);
                  float fallEnd = min(glitchEnd + 0.6, 1.0);
                  float fallPhase = smoothstep(glitchEnd, fallEnd, t);

                  vec3 newPos = pos;

                  // Random block displacement
                  float glitchStep = floor(t * speed + blockHash * 10.0);
                  float displacement = fract(sin(glitchStep * 12.9898 + blockHash * 78.233) * 43758.5453);

                  // Horizontal glitch bands
                  newPos.x += (displacement - 0.5) * intensity * 2.0 * glitchPhase;

                  // Vertical jitter
                  newPos.z += (fract(displacement * 7.0) - 0.5) * intensity * 0.5 * glitchPhase;

                  // Chromatic aberration offset (position shift simulates color separation)
                  float chromaOffset = chroma * sin(t * speed * 2.0 + blockHash * 20.0) * glitchPhase;
                  newPos.x += chromaOffset * h.x;

                  // After glitching, blocks drift down and fade
                  float fallDistance = (3.5 + intensity * 2.0) * (0.6 + h.y * 0.4);
                  newPos.z -= fallDistance * fallPhase * fallPhase;
                  newPos.x += (h.x - 0.5) * intensity * 0.4 * fallPhase;
                  newPos.y += (h.z - 0.5) * intensity * 0.3 * fallPhase;

                  // Scale pulsing
                  float scalePulse = 1.0 + sin(t * speed * 3.0 + blockHash * 30.0) * 0.2 * glitchPhase;
                  float scaleMult = scalePulse * (1.0 - fallPhase * 0.85);
                  float opacity = 1.0 - fallPhase;

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 11. Black Hole (Spiral into singularity)
                vec4 exitBlackHole(vec3 pos, vec3 scale, float progress, vec3 h,
                                   float strength, float spinSpeed, float radius, float stretch) {
                  vec3 center = vec3(0.0, 2.0, 0.0);
                  vec3 offset = pos - center;
                  float dist = length(offset);

                  // Gravitational pull increases with progress
                  float pullStrength = progress * progress * strength;
                  float newDist = max(radius * 0.1, dist - pullStrength);
                  float pullFactor = 1.0 - (newDist / (dist + 0.001));

                  // Spiral rotation
                  float angle = pullFactor * spinSpeed * 10.0 + h.x * 6.28;
                  float cosA = cos(angle);
                  float sinA = sin(angle);

                  vec3 newPos = center;
                  float rotX = offset.x * cosA - offset.y * sinA;
                  float rotY = offset.x * sinA + offset.y * cosA;
                  newPos.x += rotX * (newDist / (dist + 0.001));
                  newPos.y += rotY * (newDist / (dist + 0.001));
                  newPos.z += offset.z * (newDist / (dist + 0.001));

                  // Spaghettification - stretch toward center
                  vec3 stretchDir = normalize(center - pos + vec3(0.001));
                  newPos += stretchDir * pullFactor * stretch;

                  // Particles compress as they approach event horizon
                  float horizonDist = newDist / radius;
                  float scaleMult = smoothstep(0.0, 1.0, horizonDist) * (1.0 - pullFactor * 0.9);
                  float opacity = smoothstep(0.0, 0.5, horizonDist);

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 12. Bloom/Pollen (Gentle outward drift like dandelion seeds)
                vec4 exitPollen(vec3 pos, vec3 scale, float progress, vec3 h,
                                float driftSpeed, float spread, float waveStrength, float riseSpeed) {
                  float t = progress * 2.0;

                  // Gentle radial expansion
                  vec3 center = vec3(0.0, 0.0, 0.0);
                  vec3 dir = normalize(pos - center + vec3(0.001));

                  vec3 newPos = pos;

                  // Drift outward
                  newPos += dir * driftSpeed * t * (0.5 + h.x * 0.5);

                  // Random spread
                  newPos += (h - 0.5) * spread * t;

                  // Gentle rise (Local +Z = World Up)
                  newPos.z += riseSpeed * t * (0.3 + h.y * 0.7);

                  // Floating wave motion
                  float wavePhase = t * 2.0 + h.z * 10.0;
                  newPos.x += sin(wavePhase) * waveStrength * 0.3;
                  newPos.y += cos(wavePhase * 0.7) * waveStrength * 0.2;
                  newPos.z += sin(wavePhase * 0.5 + 1.0) * waveStrength * 0.15;

                  // Slow fade
                  float scaleMult = 1.0 - smoothstep(0.3, 1.0, progress) * 0.7;
                  float opacity = 1.0 - smoothstep(0.4, 1.0, progress);

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 13. Freeze/Shatter (Ice crystallization then break apart)
                vec4 exitFreeze(vec3 pos, vec3 scale, float progress, vec3 h,
                                float freezeSpd, float crackDensity, float shatterDelay, float shardSpeed) {
                  // Phase 1: Freeze (0 to shatterDelay)
                  // Phase 2: Shatter (shatterDelay to 1)

                  float adjustedProgress = clamp(progress * freezeSpd, 0.0, 1.0);
                  float freezeProgress = smoothstep(0.0, shatterDelay, adjustedProgress);
                  float shatterProgress = smoothstep(shatterDelay, 1.0, adjustedProgress);

                  vec3 newPos = pos;

                  // Freeze phase: slight contraction and jitter
                  if (adjustedProgress < shatterDelay) {
                    // Crystallization jitter
                    float jitter = sin(adjustedProgress * crackDensity * 50.0 + h.x * 100.0) * 0.02 * freezeProgress;
                    newPos += vec3(jitter, jitter * 0.5, jitter * 0.7);

                    // Slight pull toward center (ice forming)
                    vec3 center = vec3(0.0, 0.0, 0.0);
                    vec3 toCenter = normalize(center - pos + vec3(0.001));
                    newPos += toCenter * freezeProgress * 0.1;

                    return vec4(newPos, 1000.0 + 0.999);
                  }

                  // Shatter phase
                  float t = shatterProgress;

                  // Create ice shard groups
                  vec3 shardCenter = floor(pos * crackDensity) / crackDensity;
                  vec3 shardDir = normalize(shardCenter + vec3(0.001));

                  // Burst outward
                  vec3 velocity = shardDir * shardSpeed * (0.5 + h.y * 0.5);
                  velocity += (h - 0.5) * shardSpeed * 0.3;

                  newPos += velocity * t;

                  // Ice falls down
                  newPos.z -= 8.0 * t * t;

                  // Spin
                  float spin = t * 5.0 * (h.x - 0.5);
                  newPos.x += sin(spin) * 0.1;

                  float scaleMult = 1.0 - smoothstep(0.5, 1.0, shatterProgress);
                  float opacity = 1.0 - smoothstep(0.6, 1.0, shatterProgress);

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 14. Sand/Hourglass (Smooth flowing sand through a point)
                vec4 exitSand(vec3 pos, vec3 scale, float progress, vec3 h,
                              float fallSpd, float funnelWidth, float spread, float grainSize,
                              vec3 viewRight, vec3 viewUp, vec3 cameraPos) {
                  vec3 rightDir = normalize(viewRight);
                  vec3 upDir = normalize(viewUp);
                  vec3 forwardDir = normalize(cross(rightDir, upDir));

                  // Funnel center point
                  vec3 funnel = vec3(0.0, 1.0, 0.0);

                  // Distance from funnel axis (view-aligned plane)
                  vec3 relPos = pos - cameraPos;
                  vec3 relFunnel = funnel - cameraPos;
                  vec2 posPlane = vec2(dot(relPos, rightDir), dot(relPos, forwardDir));
                  vec2 funnelPlane = vec2(dot(relFunnel, rightDir), dot(relFunnel, forwardDir));
                  float distFromAxis = length(posPlane - funnelPlane);

                  // Smooth staggered start - center particles move first, then outward
                  float particleDelay = distFromAxis * 0.08 + h.y * 0.15;
                  float clampedDelay = min(particleDelay, 0.95);
                  float adjustedProgress = (progress - clampedDelay) / max(0.001, 1.0 - clampedDelay);
                  adjustedProgress = clamp(adjustedProgress, 0.0, 1.0);

                  // Smooth easing for graceful motion
                  float t = adjustedProgress * adjustedProgress;

                  vec3 newPos = pos;

                  // Gentle pull toward funnel axis
                  vec2 toAxis = funnelPlane - posPlane;
                  float pullStrength = 1.0 - smoothstep(0.0, funnelWidth * 3.0, distFromAxis);
                  newPos += rightDir * toAxis.x * pullStrength * t * 0.4;
                  newPos += forwardDir * toAxis.y * pullStrength * t * 0.4;

                  // Smooth gravity fall (view-aligned down)
                  float fallAmount = fallSpd * t * t * (0.6 + h.x * 0.4);
                  float fallBoost = 1.0 + smoothstep(0.65, 1.0, progress) * 1.2;
                  newPos += -upDir * fallAmount * fallBoost;

                  // Gentle spread after falling past funnel
                  float height = dot(newPos - funnel, upDir);
                  float belowFunnel = 1.0 - smoothstep(-4.0, 0.0, height);
                  newPos += rightDir * (h.x - 0.5) * spread * belowFunnel * 0.5;
                  newPos += forwardDir * (h.z - 0.5) * spread * belowFunnel * 0.3;

                  // Very subtle grain tumble (not jarring)
                  float tumble = sin(adjustedProgress * 4.0 + h.y * 6.28) * 0.03 * adjustedProgress;
                  newPos += rightDir * tumble;

                  // Graceful fade - both scale and opacity
                  float fadeProgress = smoothstep(0.5, 1.0, adjustedProgress);
                  float scaleMult = grainSize * (1.0 - fadeProgress);
                  float opacity = 1.0 - fadeProgress;

                  float endFade = smoothstep(0.85, 1.0, progress);
                  scaleMult *= (1.0 - endFade);
                  opacity *= (1.0 - endFade);

                  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
                }

                // 15. Teleport/Beam (Star Trek-style vertical dissolve)
                vec4 exitTeleport(vec3 pos, vec3 scale, float progress, vec3 h,
                                  float speed, float sparkle, float bandWidth, float direction) {
                  // Dissolve band moves vertically
                  // direction: >= 0.0 = up
                  float dir = direction >= 0.0 ? 1.0 : -1.0;
                  float bandCenter = mix(-12.0, 12.0, progress);
                  float signedDist = (pos.z - bandCenter) * dir;
                  float distFromBand = abs(signedDist);

                  // Particles dissolve when band passes
                  float inBand = 1.0 - smoothstep(0.0, bandWidth, distFromBand);
                  float trail = bandWidth * 2.5;
                  float dissolved = 1.0 - smoothstep(-trail, 0.0, signedDist);

                  if (dissolved > 0.99) return vec4(pos, 0.0 + 0.0);

                  vec3 newPos = pos;

                  // Sparkle effect at the band edge
                  float sparkleIntensity = inBand * sparkle;
                  float sparklePhase = progress * speed * 20.0 + h.x * 100.0;

                  // Horizontal scatter at band
                  newPos.x += sin(sparklePhase) * sparkleIntensity * 0.3;
                  newPos.y += cos(sparklePhase * 1.3) * sparkleIntensity * 0.3;

                  // Vertical stretch toward band
                  newPos.z += (bandCenter - pos.z) * inBand * 0.2;

                  // Scale pulsing at band edge (sparkle effect)
                  float scalePulse = 1.0 + sin(sparklePhase * 2.0) * sparkleIntensity * 0.5;
                  float scaleMult = scalePulse * (1.0 - dissolved);
                  float opacity = (1.0 - dissolved) * (1.0 + sparkleIntensity * 0.3);

                  return vec4(newPos, floor(max(0.001, scaleMult) * 1000.0) + min(opacity, 0.999));
                }

                // Apply exit animation based on type
                // 1=Gust, 2=Sonic, 3=Cosmic, 4=Pond, 5=Exploded, 6=Sawdust, 7=Explosion
                // 8=Ash, 9=Shatter, 10=Glitch, 11=BlackHole, 12=Pollen, 13=Freeze, 14=Sand, 15=Teleport
                vec4 applyExitAnimation(vec3 pos, vec3 scale, float exitType, float exitProgress, vec3 h,
                                       float expStrength, float expRotSpeed, float expFadeStart, float expFadeEnd,
                                       float pondSpeed, float pondFreq, float pondAmp, float pondCount,
                                       float physStrength, float physGravity, float physFriction, float physTumble,
                                       float sawFall, float sawWind, float sawTurb, float sawDissolve,
                                       float ashRise, float ashSpread, float ashEmber, float ashBurn,
                                       float shatterForce, float shatterGrav, float shatterSpread, float shatterRot,
                                       float glitchInt, float glitchBlock, float glitchSpd, float glitchChroma,
                                       float bhStrength, float bhSpin, float bhRadius, float bhStretch,
                                       float pollenDrift, float pollenSpread, float pollenWave, float pollenRise,
                                       float freezeSpd, float freezeCrack, float freezeDelay, float freezeShard,
                                       float sandFall, float sandFunnel, float sandSpread, float sandGrain,
                                       vec3 sandViewRight, vec3 sandViewUp, vec3 sandCameraPos,
                                       float teleSpd, float teleSparkle, float teleBand, float teleDir) {
                  if (exitProgress <= 0.001 || exitType < 0.5) {
                    return vec4(pos, 1000.0 + 0.999);
                  }

                  if (exitType < 1.5) return exitGust(pos, scale, exitProgress, h);
                  if (exitType < 2.5) return exitSonic(pos, scale, exitProgress, h);
                  if (exitType < 3.5) return exitCosmic(pos, scale, exitProgress, h);
                  if (exitType < 4.5) return exitPond(pos, scale, exitProgress, h, pondSpeed, pondFreq, pondAmp, pondCount);
                  if (exitType < 5.5) return exitExploded(pos, scale, exitProgress, h, expStrength, expRotSpeed, expFadeStart, expFadeEnd);
                  if (exitType < 6.5) return exitSawdust(pos, scale, exitProgress, h, sawFall, sawWind, sawTurb, sawDissolve);
                  if (exitType < 7.5) return exitExplosion(pos, scale, exitProgress, h, physStrength, physGravity, physFriction, physTumble);
                  if (exitType < 8.5) return exitAsh(pos, scale, exitProgress, h, ashRise, ashSpread, ashEmber, ashBurn);
                  if (exitType < 9.5) return exitShatter(pos, scale, exitProgress, h, shatterForce, shatterGrav, shatterSpread, shatterRot);
                  if (exitType < 10.5) return exitGlitch(pos, scale, exitProgress, h, glitchInt, glitchBlock, glitchSpd, glitchChroma);
                  if (exitType < 11.5) return exitBlackHole(pos, scale, exitProgress, h, bhStrength, bhSpin, bhRadius, bhStretch);
                  if (exitType < 12.5) return exitPollen(pos, scale, exitProgress, h, pollenDrift, pollenSpread, pollenWave, pollenRise);
                  if (exitType < 13.5) return exitFreeze(pos, scale, exitProgress, h, freezeSpd, freezeCrack, freezeDelay, freezeShard);
                  if (exitType < 14.5) return exitSand(pos, scale, exitProgress, h, sandFall, sandFunnel, sandSpread, sandGrain,
                                                      sandViewRight, sandViewUp, sandCameraPos);
                  return exitTeleport(pos, scale, exitProgress, h, teleSpd, teleSparkle, teleBand, teleDir);
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
              float returnProgress = ${inputs.returnProgress};
              
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

              // Sawdust drift controls
              float sawFall = ${inputs.sawdustFallSpeed};
              float sawWind = ${inputs.sawdustWindStrength};
              float sawTurb = ${inputs.sawdustTurbulence};
              float sawDissolve = ${inputs.sawdustDissolveSpeed};

              // Ash/Disintegration controls
              float ashRise = ${inputs.ashRiseSpeed};
              float ashSpread = ${inputs.ashSpreadRadius};
              float ashEmber = ${inputs.ashEmberGlow};
              float ashBurn = ${inputs.ashBurnSpeed};

              // Shatter controls
              float shatterForce = ${inputs.shatterForce};
              float shatterGrav = ${inputs.shatterGravity};
              float shatterSpread = ${inputs.shatterSpread};
              float shatterRot = ${inputs.shatterRotation};

              // Glitch controls
              float glitchInt = ${inputs.glitchIntensity};
              float glitchBlock = ${inputs.glitchBlockSize};
              float glitchSpd = ${inputs.glitchSpeed};
              float glitchChroma = ${inputs.glitchChroma};

              // Black hole controls
              float bhStrength = ${inputs.blackHoleStrength};
              float bhSpin = ${inputs.blackHoleSpinSpeed};
              float bhRadius = ${inputs.blackHoleRadius};
              float bhStretch = ${inputs.blackHoleStretch};

              // Pollen controls
              float pollenDrift = ${inputs.pollenDriftSpeed};
              float pollenSpread = ${inputs.pollenSpread};
              float pollenWave = ${inputs.pollenWaveStrength};
              float pollenRise = ${inputs.pollenRiseSpeed};

              // Freeze controls
              float freezeSpd = ${inputs.freezeSpeed};
              float freezeCrack = ${inputs.freezeCrackDensity};
              float freezeDelay = ${inputs.freezeShatterDelay};
              float freezeShard = ${inputs.freezeShardSpeed};

              // Sand controls
              float sandFall = ${inputs.sandFallSpeed};
              float sandFunnel = ${inputs.sandFunnelWidth};
              float sandSpread = ${inputs.sandSpread};
              float sandGrain = ${inputs.sandGrainSize};
              vec3 sandViewRight = ${inputs.sandViewRight};
              vec3 sandViewUp = ${inputs.sandViewUp};
              vec3 sandCameraPos = ${inputs.sandCameraPos};

              // Teleport controls
              float teleSpd = ${inputs.teleportSpeed};
              float teleSparkle = ${inputs.teleportSparkle};
              float teleBand = ${inputs.teleportBandWidth};
              float teleDir = ${inputs.teleportDirection};

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
                                                      physStrength, physGravity, physFriction, physTumble,
                                                      sawFall, sawWind, sawTurb, sawDissolve,
                                                      ashRise, ashSpread, ashEmber, ashBurn,
                                                      shatterForce, shatterGrav, shatterSpread, shatterRot,
                                                      glitchInt, glitchBlock, glitchSpd, glitchChroma,
                                                      bhStrength, bhSpin, bhRadius, bhStretch,
                                                      pollenDrift, pollenSpread, pollenWave, pollenRise,
                                                      freezeSpd, freezeCrack, freezeDelay, freezeShard,
                                                      sandFall, sandFunnel, sandSpread, sandGrain,
                                                      sandViewRight, sandViewUp, sandCameraPos,
                                                      teleSpd, teleSparkle, teleBand, teleDir);
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
              float darkenArea = (1.0 - smoothstep(-4.0, 1.0, localPos.x)) * (1.0 - smoothstep(-6.0, 2.0, localPos.y));
              ${outputs.gsplat}.rgba.rgb *= (1.0 - darkenArea * 0.7);
              
              // Scale up splats in bottom areas to provide better coverage and hide white background
              // Due to rotation, we target low Z values (bottom in screen space)
              
              // Bottom left area
              float scaleAreaBottomLeft = (1.0 - smoothstep(-2.0, 3.0, localPos.z)) * (1.0 - smoothstep(-1.5, 1.5, localPos.x));
              ${outputs.gsplat}.scales *= (1.0 + scaleAreaBottomLeft * bottomLeftMultiplier);
              
              // Bottom right area (where main title appears)
              float scaleAreaBottomRight = (1.0 - smoothstep(-2.0, 3.0, localPos.z)) * smoothstep(-1.5, 1.5, localPos.x);
              ${outputs.gsplat}.scales *= (1.0 + scaleAreaBottomRight * bottomRightMultiplier);
              
              // Fill the white hole - adjustable bounds via sliders
              float holeAreaX = smoothstep(holeXMin - 1.0, holeXMin, localPos.x) *
                               (1.0 - smoothstep(holeXMax, holeXMax + 1.0, localPos.x));
              float holeAreaY = smoothstep(holeYMin - 1.0, holeYMin, localPos.y) *
                               (1.0 - smoothstep(holeYMax, holeYMax + 1.0, localPos.y));
              float holeAreaZ = smoothstep(holeZMin - 1.0, holeZMin, localPos.z) *
                               (1.0 - smoothstep(holeZMax, holeZMax + 1.0, localPos.z));
              float holeFillArea = holeAreaX * holeAreaY * holeAreaZ;
              ${outputs.gsplat}.scales *= (1.0 + holeFillArea * holeFillMultiplier);
              
              // Darken green grass areas on the right side to improve contrast with menu items
              // Detect green by checking if green channel is dominant
              vec3 color = ${outputs.gsplat}.rgba.rgb;
              float greenness = color.g - max(color.r, color.b);
              float isGreen = smoothstep(0.05, 0.15, greenness);
              
              // Also check that it's actually a greenish color (not too dark/light)
              float brightness = (color.r + color.g + color.b) / 3.0;
              float isGrassColor = smoothstep(0.2, 0.4, brightness) * (1.0 - smoothstep(0.7, 0.9, brightness));
              
              // Target right side area where menu items appear (expanded coverage)
              // Right side: positive X (expanded to cover more area)
              float isRight = smoothstep(-2.0, 4.0, localPos.x);
              // Lower-middle area: negative Y (where menu sits)
              float isInMenuArea = 1.0 - smoothstep(-6.0, 2.0, localPos.y);
              
              // Combine all factors with gradient falloff
              float grassDarkenFactor = isGreen * isGrassColor * isRight * isInMenuArea * grassDarken;
              ${outputs.gsplat}.rgba.rgb *= (1.0 - grassDarkenFactor);
              
              // Detect synthetic data region based on position
              // Smooth transitions at boundaries
              float inZRange = smoothstep(syntheticZMin - 1.0, syntheticZMin, localPos.z) *
                               (1.0 - smoothstep(syntheticZMax, syntheticZMax + 1.0, localPos.z));
              float inYRange = smoothstep(syntheticYMin - 1.0, syntheticYMin, localPos.y) *
                               (1.0 - smoothstep(syntheticYMax, syntheticYMax + 1.0, localPos.y));
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

              // Return-to-home fade/scale (uses returnProgress: 1 -> 0)
              float returnAlpha = clamp(1.0 - returnProgress, 0.0, 1.0);
              float returnEase = smoothstep(0.0, 1.0, returnAlpha);
              float returnScale = mix(0.86, 1.0, returnEase);
              ${outputs.gsplat}.scales *= returnScale;
              ${outputs.gsplat}.rgba.a *= returnEase;
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
            // Sawdust
            sawdustFallSpeed: sawdustFallSpeedRef.current,
            sawdustWindStrength: sawdustWindStrengthRef.current,
            sawdustTurbulence: sawdustTurbulenceRef.current,
            sawdustDissolveSpeed: sawdustDissolveSpeedRef.current,
            // Ash
            ashRiseSpeed: ashRiseSpeedRef.current,
            ashSpreadRadius: ashSpreadRadiusRef.current,
            ashEmberGlow: ashEmberGlowRef.current,
            ashBurnSpeed: ashBurnSpeedRef.current,
            // Shatter
            shatterForce: shatterForceRef.current,
            shatterGravity: shatterGravityRef.current,
            shatterSpread: shatterSpreadRef.current,
            shatterRotation: shatterRotationRef.current,
            // Glitch
            glitchIntensity: glitchIntensityRef.current,
            glitchBlockSize: glitchBlockSizeRef.current,
            glitchSpeed: glitchSpeedRef.current,
            glitchChroma: glitchChromaRef.current,
            // Black Hole
            blackHoleStrength: blackHoleStrengthRef.current,
            blackHoleSpinSpeed: blackHoleSpinSpeedRef.current,
            blackHoleRadius: blackHoleRadiusRef.current,
            blackHoleStretch: blackHoleStretchRef.current,
            // Pollen
            pollenDriftSpeed: pollenDriftSpeedRef.current,
            pollenSpread: pollenSpreadRef.current,
            pollenWaveStrength: pollenWaveStrengthRef.current,
            pollenRiseSpeed: pollenRiseSpeedRef.current,
            // Freeze
            freezeSpeed: freezeSpeedRef.current,
            freezeCrackDensity: freezeCrackDensityRef.current,
            freezeShatterDelay: freezeShatterDelayRef.current,
            freezeShardSpeed: freezeShardSpeedRef.current,
            // Sand
            sandFallSpeed: sandFallSpeedRef.current,
            sandFunnelWidth: sandFunnelWidthRef.current,
            sandSpread: sandSpreadRef.current,
            sandGrainSize: sandGrainSizeRef.current,
            sandViewRight: sandViewRightRef.current,
            sandViewUp: sandViewUpRef.current,
            sandCameraPos: sandCameraPosRef.current,
            // Teleport
            teleportSpeed: teleportSpeedRef.current,
            teleportSparkle: teleportSparkleRef.current,
            teleportBandWidth: teleportBandWidthRef.current,
            teleportDirection: teleportDirectionRef.current,
            smallThreshold: smallParticleThresholdRef.current,
            motionReduction: smallMotionReductionRef.current,
            skipSmall: skipSmallAnimationRef.current,
            smallSpeed: smallSpeedMultiplierRef.current,
            exitType: exitTypeRef.current,
            exitProgress: exitProgressRef.current,
            returnProgress: returnProgressRef.current,
          }).gsplat;

          return { gsplat };
        }
      );

      // Trigger update after setting up the modifier
      meshReady.updateGenerator();
    }
  }, [meshReady]);

  // Setup logo mesh modifier for transitions
  useEffect(() => {
    if (logoMeshReady && !logoEffectSetupRef.current) {
      logoEffectSetupRef.current = true;

      logoMeshReady.objectModifier = dyno.dynoBlock(
        { gsplat: dyno.Gsplat },
        { gsplat: dyno.Gsplat },
        ({ gsplat }) => {
          const d = new dyno.Dyno({
            inTypes: {
              gsplat: dyno.Gsplat,
              logoOpacity: 'float',
            },
            outTypes: { gsplat: dyno.Gsplat },
            globals: () => [],
            statements: ({ inputs, outputs }) =>
              dyno.unindentLines(`
              ${outputs.gsplat} = ${inputs.gsplat};
              float logoOpacity = ${inputs.logoOpacity};

              // Control logo visibility based on transition progress
              // When logoOpacity is 0, the logo is invisible
              // When logoOpacity is 1, the logo is fully visible
              ${outputs.gsplat}.rgba.a *= logoOpacity;
              ${outputs.gsplat}.scales *= logoOpacity;
            `),
          });

          gsplat = d.apply({
            gsplat,
            logoOpacity: logoOpacityRef.current,
          }).gsplat;

          return { gsplat };
        }
      );

      logoMeshReady.updateGenerator();
    }
  }, [logoMeshReady]);

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
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'transitioning') {
      // Start transition to logo (for Contact)
      transitionStartTimeRef.current = performance.now();
      transitionProgressRef.current.value = 0;
      logoOpacityRef.current.value = 0;
      exitProgressRef.current.value = 0;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'transitioningBack') {
      // Start transition back from logo to main scene
      transitionStartTimeRef.current = performance.now();
      transitionProgressRef.current.value = 1;
      logoOpacityRef.current.value = 1;
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene === 'home') {
      // Only reset exit animation when back on home
      exitTypeRef.current.value = 0;
      exitProgressRef.current.value = 0;
      exitStartTimeRef.current = null;
      returnProgressRef.current.value = 0;
      // Reset transition state
      transitionProgressRef.current.value = 0;
      logoOpacityRef.current.value = 0;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene === 'contact') {
      // Keep logo visible on contact scene
      transitionProgressRef.current.value = 1;
      logoOpacityRef.current.value = 1;
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene !== 'home') {
      // Keep splat hidden when on other scenes
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'entering') {
      // Start return animation back to home
      exitStartTimeRef.current = performance.now();
      exitTypeRef.current.value = 0;
      exitProgressRef.current.value = 0;
      returnProgressRef.current.value = 1;
    }
  }, [animationPhase, targetScene, activeScene, overrideExitType]);

  // Animate the entrance effect and camera
  useFrame((_, delta) => {
    baseTimeRef.current += delta;
    animateT.current.value = baseTimeRef.current;
    depthOffsetRef.current.value = depthOffset;
    animationSpeedRef.current.value = animationSpeed;
    if (animationPhase !== 'idle' && !cameraHoldRef.current) {
      cameraHoldRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
    } else if (animationPhase === 'idle' && cameraHoldRef.current) {
      cameraHoldRef.current = null;
    }

    // Update exit animation progress with easing
    if (animationPhase === 'exiting' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      // Use dynamic animation duration from controls
      const duration = Math.max(exitAnimationDuration, 0.001);
      const linearProgress = Math.min(elapsed / duration, 1);
      // Use easeOutCubic for smooth deceleration at the end
      const easedProgress = easeOutCubic(linearProgress);
      exitProgressRef.current.value = easedProgress;
    }

    // Update return-to-home animation progress (1 -> 0) with easing
    if (animationPhase === 'entering' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      const duration = Math.max(returnAnimationDuration, 0.001);
      const linearProgress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - easeInOutCubic(linearProgress);
      returnProgressRef.current.value = easedProgress;
    }

    // Update transition progress (main scene -> logo)
    if (animationPhase === 'transitioning' && transitionStartTimeRef.current !== null) {
      const elapsed = (performance.now() - transitionStartTimeRef.current) / 1000;
      const linearProgress = Math.min(elapsed / transitionDuration, 1);
      const easedProgress = easeOutCubic(linearProgress);
      transitionProgressRef.current.value = easedProgress;
      // Main scene fades out, logo fades in
      logoOpacityRef.current.value = easedProgress;
      // Use existing exit animation to hide the main scene
      exitProgressRef.current.value = easedProgress;
      exitTypeRef.current.value = transitionType + 1; // Offset by 1 since 0 means no animation

      if (logoMeshRef.current) logoMeshRef.current.updateVersion();
    }

    // Update transition back progress (logo -> main scene)
    if (animationPhase === 'transitioningBack' && transitionStartTimeRef.current !== null) {
      const elapsed = (performance.now() - transitionStartTimeRef.current) / 1000;
      const linearProgress = Math.min(elapsed / transitionDuration, 1);
      const easedProgress = 1 - easeOutCubic(linearProgress);
      transitionProgressRef.current.value = easedProgress;
      // Logo fades out, main scene fades in
      logoOpacityRef.current.value = easedProgress;
      exitProgressRef.current.value = easedProgress;

      if (logoMeshRef.current) logoMeshRef.current.updateVersion();
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

    // Sawdust drift parameters
    sawdustFallSpeedRef.current.value = sawdustFallSpeed;
    sawdustWindStrengthRef.current.value = sawdustWindStrength;
    sawdustTurbulenceRef.current.value = sawdustTurbulence;
    sawdustDissolveSpeedRef.current.value = sawdustDissolveSpeed;

    // Ash/Disintegration parameters
    ashRiseSpeedRef.current.value = ashRiseSpeed;
    ashSpreadRadiusRef.current.value = ashSpreadRadius;
    ashEmberGlowRef.current.value = ashEmberGlow;
    ashBurnSpeedRef.current.value = ashBurnSpeed;

    // Shatter parameters
    shatterForceRef.current.value = shatterForce;
    shatterGravityRef.current.value = shatterGravity;
    shatterSpreadRef.current.value = shatterSpread;
    shatterRotationRef.current.value = shatterRotation;

    // Glitch parameters
    glitchIntensityRef.current.value = glitchIntensity;
    glitchBlockSizeRef.current.value = glitchBlockSize;
    glitchSpeedRef.current.value = glitchSpeed;
    glitchChromaRef.current.value = glitchChroma;

    // Black hole parameters
    blackHoleStrengthRef.current.value = blackHoleStrength;
    blackHoleSpinSpeedRef.current.value = blackHoleSpinSpeed;
    blackHoleRadiusRef.current.value = blackHoleRadius;
    blackHoleStretchRef.current.value = blackHoleStretch;

    // Pollen parameters
    pollenDriftSpeedRef.current.value = pollenDriftSpeed;
    pollenSpreadRef.current.value = pollenSpread;
    pollenWaveStrengthRef.current.value = pollenWaveStrength;
    pollenRiseSpeedRef.current.value = pollenRiseSpeed;

    // Freeze parameters
    freezeSpeedRef.current.value = freezeSpeed;
    freezeCrackDensityRef.current.value = freezeCrackDensity;
    freezeShatterDelayRef.current.value = freezeShatterDelay;
    freezeShardSpeedRef.current.value = freezeShardSpeed;

    // Sand parameters
    sandFallSpeedRef.current.value = sandFallSpeed;
    sandFunnelWidthRef.current.value = sandFunnelWidth;
    sandSpreadRef.current.value = sandSpread;
    sandGrainSizeRef.current.value = sandGrainSize;

    // Teleport parameters
    teleportSpeedRef.current.value = teleportSpeed;
    teleportSparkleRef.current.value = teleportSparkle;
    teleportBandWidthRef.current.value = teleportBandWidth;
    teleportDirectionRef.current.value = Math.max(0.0, teleportDirection);

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

    if (cameraHoldRef.current) {
      const hold = cameraHoldRef.current;
      camera.position.set(hold.x, hold.y, hold.z);
    }

    const sandBasis = sandBasisRef.current;
    sandBasis.cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    sandBasis.cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    sandBasis.meshEuler.set(rotationX, rotationY, rotationZ);
    sandBasis.meshQuat.setFromEuler(sandBasis.meshEuler).invert();
    sandBasis.localRight.copy(sandBasis.cameraRight).applyQuaternion(sandBasis.meshQuat).normalize();
    sandBasis.localUp.copy(sandBasis.cameraUp).applyQuaternion(sandBasis.meshQuat).normalize();
    sandBasis.cameraLocal.copy(camera.position).sub(splatOffsetRef.current).applyQuaternion(sandBasis.meshQuat);
    sandViewRightRef.current.value.copy(sandBasis.localRight);
    sandViewUpRef.current.value.copy(sandBasis.localUp);
    sandCameraPosRef.current.value.copy(sandBasis.cameraLocal);

    // Update current camera position refs for Leva monitoring
    currentCameraX.current = Math.round(camera.position.x * 100) / 100;
    currentCameraY.current = Math.round(camera.position.y * 100) / 100;
    currentCameraZ.current = Math.round(camera.position.z * 100) / 100;

    if (meshRef.current) {
      meshRef.current.updateVersion();
    }
  });

  const splatContent = (
    <sparkRenderer args={[sparkRendererArgs]}>
      <splatMesh
        ref={meshCallbackRef}
        args={[splatMeshArgs]}
        position={[splatOffsetRef.current.x, splatOffsetRef.current.y, splatOffsetRef.current.z]}
        rotation={[rotationX, rotationY, rotationZ]}
      />
      <splatMesh
        ref={logoMeshCallbackRef}
        args={[logoSplatMeshArgs]}
        position={[logoPositionX, logoPositionY, logoPositionZ]}
        rotation={[logoRotationX, logoRotationY, logoRotationZ]}
        scale={logoScale}
      />
    </sparkRenderer>
  );

  return (
    <>
      {activeScene === 'gallery' ? null : activeScene === 'home' ? (
        <PresentationControls
          global
          snap
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
        >
          {splatContent}
        </PresentationControls>
      ) : (
        splatContent
      )}
    </>
  );
};

export default Scene;
