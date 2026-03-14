import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react';
import { InteractivePresentationControls } from './InteractivePresentationControls';
import { Euler, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { SplatMesh as SparkSplatMesh } from '@sparkjsdev/spark';
import { dyno } from '@sparkjsdev/spark';
import { easeOutCubic, easeOutBack, easeInOutCubic, lerp } from '../../utils';
import { useSceneControls, DESKTOP_BREAKPOINT } from '../../hooks';
import { EXIT_ANIMATION_TYPE, GALLERY_WALL_DURATION } from '../../constants';
import { useAnimationStore } from '../../stores';
import { hashFunction, assembleFunction, allExitAnimations } from './shaders';
import '../spark';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

interface SceneProps {
  controlsStore?: LevaStore;
  mobileFov?: number;
  isMobileView?: boolean;
  cameraSpeedMultiplier?: number;
}

/**
 * Scene component for the 3D splat visualization
 * Handles camera controls, splat mesh rendering, entrance and exit animations
 */
const Scene = ({ controlsStore, mobileFov = 50, isMobileView = false, cameraSpeedMultiplier = 1 }: SceneProps) => {
  // Get animation state from Zustand store
  const {
    activeScene,
    targetScene,
    animationPhase,
    exitAnimationDuration,
    returnAnimationDuration,
    exitTypeOverride,
    loadingComplete,
    setStreamingStarted,
  } = useAnimationStore();
  const renderer = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  // Use state + callback ref pattern so we can properly react to mesh being ready
  const [meshReady, setMeshReady] = useState<SparkSplatMesh | null>(null);
  const meshRef = useRef<SparkSplatMesh | null>(null);
  const meshCallbackRef = useCallback((node: SparkSplatMesh | null) => {
    meshRef.current = node;
    if (node) {
      setMeshReady(node);
      // Signal that streaming has started via store action
      setStreamingStarted();
    }
  }, [setStreamingStarted]);

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

  // Gallery transition controls (Blueprint Wall type 16)
  // Local Y = -2.0 → World Z = 2.0 (in front of camera at Z=3.1)
  const wallPlaneYRef = useRef(dyno.dynoFloat(-2.0));  // Wall position
  const screenCoverageRef = useRef(dyno.dynoFloat(3.0));  // Scale multiplier for coverage
  const gustStrengthRef = useRef(dyno.dynoFloat(8.0));  // Wind intensity (reduced for slower motion)

  // Mobile simplification refs - reduce small particle chaos
  const smallParticleThresholdRef = useRef(dyno.dynoFloat(0.0));
  const smallMotionReductionRef = useRef(dyno.dynoFloat(0.0));
  const skipSmallAnimationRef = useRef(dyno.dynoFloat(0.0));
  const smallSpeedMultiplierRef = useRef(dyno.dynoFloat(1.0));
  // Exit animation refs
  const exitTypeRef = useRef(dyno.dynoFloat(0.0));
  const exitProgressRef = useRef(dyno.dynoFloat(0.0));
  const returnProgressRef = useRef(dyno.dynoFloat(0.0));
  // Entrance animation type (for returning from non-home scenes)
  // Uses same animation types as exit but runs them in reverse
  const entranceTypeRef = useRef(dyno.dynoFloat(0.0));
  const exitStartTimeRef = useRef<number | null>(null);
  const baseTimeRef = useRef(0);
  const effectSetupRef = useRef(false);
  const cameraAnimationComplete = useRef(false);
  const cameraHoldRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const cameraReturnProgressRef = useRef(0); // 0 = at hold, 1 = fully returned to natural position
  const swayFactorRef = useRef(1); // Smoothly transitions sway on/off for gallery


  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Only hold camera for non-gallery animations (gallery keeps swaying naturally)
    const isGalleryTransition = targetScene === 'gallery' || activeScene === 'gallery';

    if (animationPhase !== 'idle' && !isGalleryTransition) {
      // Entering non-idle state - capture camera position and reset return progress
      cameraHoldRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
      cameraReturnProgressRef.current = 0;
    } else if (animationPhase === 'idle' || isGalleryTransition) {
      // Going to idle - don't immediately release hold, let useFrame lerp back
      // The hold will be released once return progress reaches 1
    }
  }, [animationPhase, activeScene, targetScene, camera]);

  // Note: We no longer reset the mesh when gallery is active
  // because we want the splat to remain visible as the "wall" background
  // The mesh will stay mounted and display the wall animation (type 16)

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
    fov,
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

    // Exit Animation - Gallery Transition
    wallPlaneY,
    screenCoverage,
    gustStrength,

    currentCameraX,
    currentCameraY,
    currentCameraZ,
  } = useSceneControls({
    isMobile,
    onResetAnimation: handleResetAnimation,
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

  // Update camera FOV from Leva controls (use mobile or desktop FOV based on viewport)
  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.fov = isMobileView ? mobileFov : fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov, mobileFov, isMobileView]);

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
        onLoad: () => {
          // Dispatch event when splat finishes loading (streaming complete)
          window.dispatchEvent(new Event('splatLoaded'));
        },
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
              entranceType: 'float',
              // Gallery transition controls (type 16)
              wallPlaneY: 'float',
              screenCoverage: 'float',
              gustStrength: 'float',
            },
            outTypes: { gsplat: dyno.Gsplat },
            // GLSL shader globals imported from ./shaders/
            globals: () => [
              dyno.unindent(hashFunction + assembleFunction + allExitAnimations),
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
              float entranceType = ${inputs.entranceType};

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

              // Gallery transition controls (type 16)
              float wallPlaneY = ${inputs.wallPlaneY};
              float screenCoverage = ${inputs.screenCoverage};
              float gustStrength = ${inputs.gustStrength};

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
                                                      teleSpd, teleSparkle, teleBand, teleDir,
                                                      motionReduction,
                                                      wallPlaneY, screenCoverage, gustStrength);
                  ${outputs.gsplat}.center = exitResult.xyz;

                  // Unpack scale multiplier and opacity from w component
                  // Packing: floor(scale * 1000) + opacity, so w = SSSS.OOO
                  float scaleRaw = floor(exitResult.w);
                  float exitScaleMultiplier = scaleRaw / 1000.0;
                  float exitOpacity = exitResult.w - scaleRaw;
                  exitOpacity = clamp(exitOpacity, 0.0, 1.0);

                  ${outputs.gsplat}.scales *= exitScaleMultiplier;
                  ${outputs.gsplat}.rgba.a *= exitOpacity;

                  // Color shift for gallery transition (type 16) - transform TO blueprint blue
                  // Stage 1 (0-50%): particles exit, keep original colors
                  // Stage 2 (50-100%): particles return, shift to blueprint blue
                  if (exitType > 15.5 && exitType < 16.5) {
                    vec3 blueprintBlue = vec3(0.039, 0.082, 0.145);  // #0a1525

                    // Only apply color shift during stage 2 (return phase)
                    float fillProgress = 0.0;
                    if (exitProgress > 0.5) {
                      fillProgress = (exitProgress - 0.5) / 0.5;  // 0 to 1 within stage 2
                      fillProgress = 1.0 - pow(1.0 - fillProgress, 2.0);  // Ease out
                    }

                    // Preserve luminance for texture variation
                    float luma = dot(${outputs.gsplat}.rgba.rgb, vec3(0.299, 0.587, 0.114));
                    vec3 blueWithTexture = blueprintBlue * (0.6 + luma * 0.8);

                    // Blend to blue based on fill progress
                    ${outputs.gsplat}.rgba.rgb = mix(${outputs.gsplat}.rgba.rgb, blueWithTexture, fillProgress);
                  }
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

              // Return-to-home animation (uses returnProgress: 1 -> 0)
              // When entranceType > 0, use a reversed exit animation for a more interesting entrance
              if (returnProgress > 0.001 && entranceType > 0.5) {
                // Use exit animation functions with returnProgress to run them in reverse
                // returnProgress goes 1->0, so the animation reverses (particles come together)
                vec4 entranceResult = applyExitAnimation(
                  ${outputs.gsplat}.center, ${outputs.gsplat}.scales, entranceType, returnProgress, h,
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
                  teleSpd, teleSparkle, teleBand, teleDir,
                  motionReduction,
                  wallPlaneY, screenCoverage, gustStrength
                );
                ${outputs.gsplat}.center = entranceResult.xyz;
                float entrancePacked = entranceResult.w;
                float entranceScaleMult = floor(entrancePacked) / 1000.0;
                float entranceOpacity = fract(entrancePacked);
                ${outputs.gsplat}.scales *= entranceScaleMult;
                ${outputs.gsplat}.rgba.a *= entranceOpacity;

                // Color shift for return from gallery (type 16) - transform FROM blueprint blue back to original
                // returnProgress: 1.0 → 0.0 (reversed two-stage animation)
                // Stage 2 reversed (1.0 → 0.5): Wall unfills, shift FROM blue back to original
                // Stage 1 reversed (0.5 → 0.0): Particles return, keep original colors
                if (entranceType > 15.5 && entranceType < 16.5) {
                  vec3 blueprintBlue = vec3(0.039, 0.082, 0.145);  // #0a1525

                  // Only apply color shift during reversed stage 2 (returnProgress 1.0 → 0.5)
                  float fillFactor = 0.0;
                  if (returnProgress > 0.5) {
                    // returnProgress goes 1 → 0.5 in this stage
                    fillFactor = (returnProgress - 0.5) / 0.5;  // 1 to 0
                    fillFactor = fillFactor * fillFactor;  // Ease in (reversed ease out)
                  }

                  float luma = dot(${outputs.gsplat}.rgba.rgb, vec3(0.299, 0.587, 0.114));
                  vec3 blueWithTexture = blueprintBlue * (0.6 + luma * 0.8);
                  ${outputs.gsplat}.rgba.rgb = mix(${outputs.gsplat}.rgba.rgb, blueWithTexture, fillFactor);
                }
              } else if (returnProgress > 0.001) {
                // Simple fade/scale for default entrance
                float returnAlpha = clamp(1.0 - returnProgress, 0.0, 1.0);
                float returnEase = smoothstep(0.0, 1.0, returnAlpha);
                float returnScale = mix(0.86, 1.0, returnEase);
                ${outputs.gsplat}.scales *= returnScale;
                ${outputs.gsplat}.rgba.a *= returnEase;
              }
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
            entranceType: entranceTypeRef.current,
            // Gallery transition (type 16)
            wallPlaneY: wallPlaneYRef.current,
            screenCoverage: screenCoverageRef.current,
            gustStrength: gustStrengthRef.current,
          }).gsplat;

          return { gsplat };
        }
      );

      // Trigger update after setting up the modifier
      meshReady.updateGenerator();
    }
  }, [meshReady]);

  // Update exit animation when phase changes
  // Use useLayoutEffect to ensure animation state is set BEFORE paint (prevents flash)
  useLayoutEffect(() => {
    if (animationPhase === 'exiting') {
      // Set the exit animation type based on target scene or override
      // Use override if present, otherwise fallback to scene default
      const type = exitTypeOverride !== null && exitTypeOverride !== undefined
        ? exitTypeOverride
        : (EXIT_ANIMATION_TYPE[targetScene] || 0);

      console.log('[Scene] Starting exit animation:', { targetScene, type, phase: animationPhase });
      exitTypeRef.current.value = type;
      exitStartTimeRef.current = performance.now();
      exitProgressRef.current.value = 0;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'transitioning') {
      // Start transition (for Contact)
      exitStartTimeRef.current = performance.now();
      exitProgressRef.current.value = 0;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'transitioningBack') {
      // Start transition back from contact to main scene
      exitStartTimeRef.current = performance.now();
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene === 'home') {
      // Only reset exit animation when back on home
      exitTypeRef.current.value = 0;
      exitProgressRef.current.value = 0;
      exitStartTimeRef.current = null;
      returnProgressRef.current.value = 0;
      entranceTypeRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene === 'contact') {
      // Keep splat hidden on contact scene
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'wallHolding') {
      // Wall is fully formed, keep it visible
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
    } else if (animationPhase === 'idle' && activeScene === 'gallery') {
      // Gallery idle: Keep wall visible (exit animation complete = wall formed)
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
      exitStartTimeRef.current = null; // Reset for next entrance animation
    } else if (animationPhase === 'idle' && activeScene !== 'home') {
      // Keep splat hidden when on other scenes (ethos, etc.)
      exitProgressRef.current.value = 1;
      returnProgressRef.current.value = 0;
      exitStartTimeRef.current = null; // Reset for next entrance animation
    } else if (animationPhase === 'entering') {
      // Only initialize on first entry to 'entering' phase
      // Prevent re-initialization when targetScene changes during animation
      if (exitStartTimeRef.current === null) {
        // Start return animation back to home
        exitStartTimeRef.current = performance.now();
        exitTypeRef.current.value = 0;
        exitProgressRef.current.value = 0;
        returnProgressRef.current.value = 1;
        // Use the same animation type for entrance (reverse) as was used for exit
        // For gallery (type 16), the wall will dissolve back to the original splat
        entranceTypeRef.current.value = EXIT_ANIMATION_TYPE[targetScene] || 0;
      }
    }
  }, [animationPhase, targetScene, activeScene, exitTypeOverride]);

  // Animate the entrance effect and camera
  useFrame((_, delta) => {
    // Only advance animation time after loading screen completes
    if (loadingComplete) {
      baseTimeRef.current += delta;
      animateT.current.value = baseTimeRef.current;
    }
    depthOffsetRef.current.value = depthOffset;
    animationSpeedRef.current.value = animationSpeed;
    // Only hold camera for non-gallery animations
    const isGalleryTransition = targetScene === 'gallery' || activeScene === 'gallery';

    // Capture camera position when entering non-idle state
    // Don't immediately release - let the lerp code handle gradual return
    if (animationPhase !== 'idle' && !cameraHoldRef.current && !isGalleryTransition) {
      cameraHoldRef.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
      cameraReturnProgressRef.current = 0; // Reset lerp progress
    }
    // For gallery transitions, release hold immediately
    if (isGalleryTransition && cameraHoldRef.current) {
      cameraHoldRef.current = null;
    }

    // Update exit animation progress with easing
    if (animationPhase === 'exiting' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      // Use gallery-specific duration for type 16, otherwise use dynamic duration
      const isGalleryExit = exitTypeRef.current.value > 15.5 && exitTypeRef.current.value < 16.5;
      const duration = Math.max(isGalleryExit ? GALLERY_WALL_DURATION : exitAnimationDuration, 0.001);
      const linearProgress = Math.min(elapsed / duration, 1);
      // Use easeOutCubic for smooth deceleration at the end
      const easedProgress = easeOutCubic(linearProgress);
      exitProgressRef.current.value = easedProgress;
    }

    // Update return-to-home animation progress (1 -> 0) with easing
    if (animationPhase === 'entering' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      // Use gallery-specific duration for type 16 entrance (wall dissolve)
      const isGalleryEntrance = entranceTypeRef.current.value > 15.5 && entranceTypeRef.current.value < 16.5;
      const duration = Math.max(isGalleryEntrance ? GALLERY_WALL_DURATION : returnAnimationDuration, 0.001);
      const linearProgress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - easeInOutCubic(linearProgress);
      returnProgressRef.current.value = easedProgress;
    }

    // Update transition progress for contact page
    if (animationPhase === 'transitioning' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      const duration = Math.max(exitAnimationDuration, 0.001);
      const linearProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(linearProgress);
      exitProgressRef.current.value = easedProgress;
    }

    // Update transition back progress from contact page
    if (animationPhase === 'transitioningBack' && exitStartTimeRef.current !== null) {
      const elapsed = (performance.now() - exitStartTimeRef.current) / 1000;
      const duration = Math.max(returnAnimationDuration, 0.001);
      const linearProgress = Math.min(elapsed / duration, 1);
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

    // Gallery transition parameters (type 16)
    wallPlaneYRef.current.value = wallPlaneY;
    screenCoverageRef.current.value = screenCoverage;
    gustStrengthRef.current.value = gustStrength;

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

    // Smoothly transition sway factor for gallery (prevents camera jump)
    const targetSwayFactor = activeScene === 'gallery' ? 0 : 1;
    swayFactorRef.current = lerp(swayFactorRef.current, targetSwayFactor, 0.005);
    const effectiveSway = swayFactorRef.current;

    // Animate camera position during startup
    if (animateCamera && !cameraAnimationComplete.current) {
      const progress = Math.min((baseTimeRef.current * cameraSpeedMultiplier) / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);

      // Interpolate camera position from start to target, plus sway
      const newX = lerp(startX, cameraX, easedProgress) + swayX * effectiveSway;
      const newY = lerp(startY, cameraY, easedProgress) + swayY * effectiveSway;
      const newZ = lerp(startZ, cameraZ, easedProgress);

      camera.position.set(newX, newY, newZ);

      // Mark animation as complete when finished
      if (progress >= 1) {
        cameraAnimationComplete.current = true;
      }
    } else if (ambientSway) {
      // After entrance animation, apply sway (scaled by factor) to final position
      camera.position.set(
        cameraX + swayX * effectiveSway,
        cameraY + swayY * effectiveSway,
        cameraZ
      );
    } else {
      // No sway - hold camera steady
      camera.position.set(cameraX, cameraY, cameraZ);
    }

    // Handle camera hold with smooth return transition
    if (cameraHoldRef.current) {
      const hold = cameraHoldRef.current;
      const isGalleryTransition = targetScene === 'gallery' || activeScene === 'gallery';

      if (animationPhase === 'idle' && !isGalleryTransition) {
        // Returning to idle - sync camera return with animation duration, gentle overshoot settle
        const returnSpeed = 1.0 / Math.max(returnAnimationDuration, 0.5);
        cameraReturnProgressRef.current = Math.min(cameraReturnProgressRef.current + delta * returnSpeed, 1);
        const progress = easeOutBack(cameraReturnProgressRef.current);

        // Get current natural position (with sway if enabled)
        const naturalX = ambientSway ? cameraX + swayX * effectiveSway : cameraX;
        const naturalY = ambientSway ? cameraY + swayY * effectiveSway : cameraY;
        const naturalZ = cameraZ;

        // Lerp from held to natural
        camera.position.set(
          lerp(hold.x, naturalX, progress),
          lerp(hold.y, naturalY, progress),
          lerp(hold.z, naturalZ, progress)
        );

        // Release hold once transition is complete
        if (cameraReturnProgressRef.current >= 1) {
          cameraHoldRef.current = null;
        }
      } else {
        // Still in non-idle state - hold camera at captured position
        camera.position.set(hold.x, hold.y, hold.z);
      }
    }

    // Camera movement for gallery - subtle zoom in (moving closer to the work)
    if ((targetScene === 'gallery' || activeScene === 'gallery') && animationPhase !== 'entering') {
      const galleryTargetZ = cameraZ - 0.3;
      camera.position.z = lerp(camera.position.z, galleryTargetZ, 0.03);
    }

    // Camera movement for gallery wall transition (type 16) - pull back and lower for wall view
    if (animationPhase === 'exiting' && exitTypeRef.current.value > 15.5 && exitTypeRef.current.value < 16.5) {
      const progress = exitProgressRef.current.value;
      const targetZ = lerp(cameraZ, 4.0, easeInOutCubic(progress));
      const targetY = lerp(cameraY, 1.2, easeInOutCubic(progress));
      camera.position.z = lerp(camera.position.z, targetZ, 0.08);
      camera.position.y = lerp(camera.position.y, targetY, 0.08);
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
    </sparkRenderer>
  );

  // Always render InteractivePresentationControls to keep splatContent in stable position
  // This prevents remounting when activeScene changes, preserving visual adjustments
  const enableInteractiveControls = activeScene === 'home';

  return (
    <InteractivePresentationControls
      global
      snap
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 3, Math.PI / 3]}
      azimuth={[-Math.PI / 1.4, Math.PI / 1.4]}
      enabled={enableInteractiveControls}
    >
      {splatContent}
    </InteractivePresentationControls>
  );
};

export default Scene;
