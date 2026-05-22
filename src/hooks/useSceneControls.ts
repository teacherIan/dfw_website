import { useControls, monitor, button, buttonGroup, folder } from 'leva';
import { useRef } from 'react';

/**
 * Return type for scene controls hook
 */
export interface SceneControls {
  // Camera
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  fov: number;
  animateCamera: boolean;
  animationDuration: number;
  startX: number;
  startY: number;
  startZ: number;
  ambientSway: boolean;
  swayIntensity: number;

  // Entrance Animation
  depthOffset: number;
  animationSpeed: number;
  smallParticleThreshold: number;
  smallMotionReduction: number;
  skipSmallAnimation: boolean;
  smallSpeedMultiplier: number;

  // Visual Adjustments
  grassDarkenAmount: number;
  bottomLeftMultiplier: number;
  bottomRightMultiplier: number;
  holeFillMultiplier: number;
  holeXMin: number;
  holeXMax: number;
  holeYMin: number;
  holeYMax: number;
  holeZMin: number;
  holeZMax: number;

  // Splat Transform
  rotationX: number;
  rotationY: number;
  rotationZ: number;

  // Splat Blending
  syntheticBrightness: number;
  syntheticSaturation: number;
  syntheticOpacity: number;
  syntheticZMin: number;
  syntheticZMax: number;
  syntheticYMin: number;
  syntheticYMax: number;

  // Exit Animation - Exploded View
  explodedExpansionStrength: number;
  explodedRotationSpeed: number;
  explodedFadeStart: number;
  explodedFadeEnd: number;

  // Exit Animation - Pond Ripple
  pondWaveSpeed: number;
  pondWaveFrequency: number;
  pondWaveAmplitude: number;
  pondWaveCount: number;

  // Exit Animation - Physics Explosion
  physicsStrength: number;
  physicsGravity: number;
  physicsFriction: number;
  physicsTumbleSpeed: number;

  // Exit Animation - Sawdust Drift
  sawdustFallSpeed: number;
  sawdustWindStrength: number;
  sawdustTurbulence: number;
  sawdustDissolveSpeed: number;

  // Exit Animation - Disintegration/Ash
  ashRiseSpeed: number;
  ashSpreadRadius: number;
  ashEmberGlow: number;
  ashBurnSpeed: number;

  // Exit Animation - Shatter/Glass
  shatterForce: number;
  shatterGravity: number;
  shatterSpread: number;
  shatterRotation: number;

  // Exit Animation - Pixelate/Glitch
  glitchIntensity: number;
  glitchBlockSize: number;
  glitchSpeed: number;
  glitchChroma: number;

  // Exit Animation - Black Hole
  blackHoleStrength: number;
  blackHoleSpinSpeed: number;
  blackHoleRadius: number;
  blackHoleStretch: number;

  // Exit Animation - Bloom/Pollen
  pollenDriftSpeed: number;
  pollenSpread: number;
  pollenWaveStrength: number;
  pollenRiseSpeed: number;

  // Exit Animation - Freeze/Shatter
  freezeSpeed: number;
  freezeCrackDensity: number;
  freezeShatterDelay: number;
  freezeShardSpeed: number;

  // Exit Animation - Sand/Hourglass
  sandFallSpeed: number;
  sandFunnelWidth: number;
  sandSpread: number;
  sandGrainSize: number;

  // Exit Animation - Teleport/Beam
  teleportSpeed: number;
  teleportSparkle: number;
  teleportBandWidth: number;
  teleportDirection: number;

  // Exit Animation - Gallery Transition (Type 16)
  wallPlaneY: number;
  screenCoverage: number;
  gustStrength: number;

  // Monitor refs
  currentCameraX: React.MutableRefObject<number>;
  currentCameraY: React.MutableRefObject<number>;
  currentCameraZ: React.MutableRefObject<number>;
}

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

interface UseSceneControlsParams {
  isMobile: boolean;
  onResetAnimation: () => void;
  store?: LevaStore;
}

/**
 * Custom hook that encapsulates all Leva controls for the Scene component.
 * Extracts ~150 lines of control definitions into a reusable hook.
 */
export const useSceneControls = ({
  isMobile,
  onResetAnimation,
  store,
}: UseSceneControlsParams): SceneControls => {
  // Refs for monitoring current camera position
  const currentCameraX = useRef(0);
  const currentCameraY = useRef(0);
  const currentCameraZ = useRef(0);

  // Mobile vs desktop camera positions
  const mobileCameraDefaults = { x: 0, y: 2.5, z: 4.0 };
  const desktopCameraDefaults = { x: 0, y: 1.6, z: 3.1 };
  const cameraDefaults = isMobile ? mobileCameraDefaults : desktopCameraDefaults;

  const normalizeRange = (range: [number, number]) => {
    const min = Math.min(range[0], range[1]);
    const max = Math.max(range[0], range[1]);
    return [min, max] as const;
  };

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
  } = useControls({
    '🏠 Base.🎥 Camera': folder({
      fov: { value: 50, min: 20, max: 120, step: 1, label: 'FOV' },
      position: folder({
        cameraX: { value: cameraDefaults.x, min: -10, max: 10, step: 0.1, label: 'X' },
        cameraY: { value: cameraDefaults.y, min: -5, max: 10, step: 0.1, label: 'Y' },
        cameraZ: { value: cameraDefaults.z, min: 0.5, max: 10, step: 0.1, label: 'Z' },
      }, { collapsed: true }),
      animation: folder({
        animateCamera: { value: true, label: 'Animate on Start' },
        // 25s (was 20): the gentler entrance — entranceAnimation.ts spreads
        // the per-particle start times to de-clump the dense chair — pushed
        // the splat's assembly out by ~5s, so the camera fly-in is lengthened
        // to match and still arrive as the scene settles.
        animationDuration: { value: 25, min: 1, max: 40, step: 0.5, label: 'Duration (s)' },
        startX: { value: -1.0, min: -10, max: 10, step: 0.1, label: 'Start X' },
        startY: { value: 15.0, min: -5, max: 25, step: 0.1, label: 'Start Y' },
        startZ: { value: 20.0, min: 0.5, max: 30, step: 0.1, label: 'Start Z' },
      }, { collapsed: true }),
      ambientSway: folder({
        ambientSway: { value: true, label: 'Enable Sway' },
        swayIntensity: { value: 5, min: 0, max: 20, step: 0.5, label: 'Intensity' },
      }, { collapsed: true }),
    }, { collapsed: true }),
  }, { store });

  const {
    depthOffset,
    animationSpeed,
    smallParticleThreshold,
    smallMotionReduction,
    skipSmallAnimation,
    smallSpeedMultiplier,
  } = useControls({
    '🏠 Base.✨ Entrance Animation': folder({
      depthOffset: { value: 14, min: 0, max: 30, step: 0.5, label: 'Depth Offset' },
      animationSpeed: { value: 1.5, min: 0.1, max: 3.0, step: 0.1, label: 'Animation Speed' },
      'Mobile Simplify': folder({
        smallParticleThreshold: { value: 0, min: 0, max: 0.5, step: 0.05, label: 'Hide Tiny (threshold)' },
        smallMotionReduction: { value: 0.2, min: 0, max: 1, step: 0.1, label: 'Calm Motion (0-1)' },
        skipSmallAnimation: { value: false, label: 'Skip Small Anim' },
        smallSpeedMultiplier: { value: 1, min: 1, max: 4, step: 0.25, label: 'Small Speed (1-4x)' },
      }, { collapsed: true }),
      resetAnimation: button(onResetAnimation),
    }, { collapsed: true }),
  }, { store });

  const {
    grassDarkenAmount,
    bottomLeftMultiplier,
    bottomRightMultiplier,
    holeFillMultiplier,
    holeXRange,
    holeYRange,
    holeZRange,
  } = useControls({
    '🏠 Base.🎨 Visual Adjustments': folder({
      darkening: folder({
        grassDarkenAmount: { value: 2.35, min: 0, max: 5, step: 0.05, label: 'Grass Darken' },
        bottomLeftMultiplier: {
          value: 0.55,
          min: 0,
          max: 2.0,
          step: 0.05,
          label: 'Bottom Left Scale',
        },
        bottomRightMultiplier: {
          value: 0.55,
          min: 0,
          max: 2.0,
          step: 0.05,
          label: 'Bottom Right Scale',
        },
      }, { collapsed: true }),
      holeFilling: folder(
        {
          holeFillMultiplier: { value: 0.0, min: 0, max: 3.0, step: 0.05, label: 'Fill Scale' },
          holeXRange: { value: [-2.0, 2.0], min: -10, max: 10, step: 0.5, label: 'X Range' },
          holeYRange: { value: [3.0, 7.0], min: -10, max: 10, step: 0.5, label: 'Y Range' },
          holeZRange: { value: [-2.0, 3.0], min: -10, max: 10, step: 0.5, label: 'Z Range' },
        },
        { collapsed: true }
      ),
    }, { collapsed: true }),
  }, { store });

  const [holeXMin, holeXMax] = normalizeRange(holeXRange);
  const [holeYMin, holeYMax] = normalizeRange(holeYRange);
  const [holeZMin, holeZMax] = normalizeRange(holeZRange);

  const { rotationX, rotationY, rotationZ } = useControls({
    '🏠 Base.🔄 Splat Transform': folder({
      rotationX: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation X' },
      rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Y' },
      rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Z' },
    }, { collapsed: true }),
  }, { store });

  const {
    syntheticBrightness,
    syntheticSaturation,
    syntheticOpacity,
    syntheticZRange,
    syntheticYRange,
  } = useControls({
    '🏠 Base.🌈 Splat Blending': folder(
      {
        syntheticBrightness: { value: 1.0, min: 0.1, max: 2.0, step: 0.05, label: 'Brightness' },
        syntheticSaturation: { value: 0.65, min: 0.0, max: 1.5, step: 0.05, label: 'Saturation' },
        syntheticOpacity: { value: 1.0, min: 0.1, max: 1.0, step: 0.05, label: 'Opacity' },
        syntheticZRange: { value: [-5.0, 2.0], min: -20, max: 20, step: 0.5, label: 'Z Range' },
        syntheticYRange: { value: [-10.0, 5.0], min: -20, max: 20, step: 0.5, label: 'Y Range' },
      },
      { collapsed: true }
    ),
  }, { store });

  const [syntheticZMin, syntheticZMax] = normalizeRange(syntheticZRange);
  const [syntheticYMin, syntheticYMax] = normalizeRange(syntheticYRange);

  const exitTypeOverridePath = '💥 Exit Animations.exitTypeOverride';
  const shouldShowExitFolder = (get: (path: string) => unknown, type: number) => {
    const selected = get(exitTypeOverridePath);
    return selected === null || selected === undefined || selected === type;
  };

  const [
    {
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
    },
    setExitControls,
  ] = useControls(
    () => ({
      '💥 Exit Animations': folder({
        'Physics Explosion': folder({
          physicsPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Soft: () =>
                setExitControls({
                  physicsStrength: 10.0,
                  physicsGravity: 18.0,
                  physicsFriction: 0.92,
                  physicsTumbleSpeed: 4.0,
                }),
              Punchy: () =>
                setExitControls({
                  physicsStrength: 28.0,
                  physicsGravity: 35.0,
                  physicsFriction: 0.7,
                  physicsTumbleSpeed: 8.0,
                }),
            },
          }),
          physicsStrength: { value: 15.0, min: 0.0, max: 50.0, step: 0.5, label: 'Strength' },
          physicsGravity: { value: 25.0, min: 0.0, max: 100.0, step: 1.0, label: 'Gravity' },
          physicsFriction: { value: 0.90, min: 0.0, max: 1.0, step: 0.01, label: 'Friction' },
          physicsTumbleSpeed: { value: 5.0, min: 0.0, max: 20.0, step: 0.5, label: 'Tumble Speed' },
        }, { collapsed: false, render: (get) => shouldShowExitFolder(get, 7) }),
        'Pond Ripple': folder({
          pondPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Calm: () =>
                setExitControls({
                  pondWaveSpeed: 6.0,
                  pondWaveFrequency: 2.2,
                  pondWaveAmplitude: 0.35,
                  pondWaveCount: 16.0,
                }),
              Storm: () =>
                setExitControls({
                  pondWaveSpeed: 12.0,
                  pondWaveFrequency: 5.0,
                  pondWaveAmplitude: 1.2,
                  pondWaveCount: 30.0,
                }),
            },
          }),
          pondWaveSpeed: { value: 8.0, min: 1.0, max: 20.0, step: 0.5, label: 'Wave Speed' },
          pondWaveFrequency: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Wave Frequency' },
          pondWaveAmplitude: { value: 0.5, min: 0.1, max: 5.0, step: 0.1, label: 'Wave Amplitude' },
          pondWaveCount: { value: 20.0, min: 5.0, max: 50.0, step: 1.0, label: 'Wave Count' },
        }, { collapsed: false, render: (get) => shouldShowExitFolder(get, 4) }),
        'Exploded View': folder({
          explodedPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Gentle: () =>
                setExitControls({
                  explodedExpansionStrength: 12.0,
                  explodedRotationSpeed: 0.2,
                  explodedFadeStart: 0.25,
                  explodedFadeEnd: 1.0,
                }),
              Dramatic: () =>
                setExitControls({
                  explodedExpansionStrength: 30.0,
                  explodedRotationSpeed: 2.0,
                  explodedFadeStart: 0.1,
                  explodedFadeEnd: 0.9,
                }),
            },
          }),
          explodedExpansionStrength: { value: 18.5, min: 0.0, max: 50.0, step: 0.5, label: 'Expansion Strength' },
          explodedRotationSpeed: { value: 0.5, min: 0.0, max: 20.0, step: 0.1, label: 'Rotation Speed' },
          explodedFadeStart: { value: 0.17, min: 0.0, max: 1.0, step: 0.01, label: 'Fade Start (0-1)' },
          explodedFadeEnd: { value: 1.00, min: 0.0, max: 1.0, step: 0.01, label: 'Fade End (0-1)' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 5) }),
        'Sawdust Drift': folder({
          sawdustPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Soft: () =>
                setExitControls({
                  sawdustFallSpeed: 3.0,
                  sawdustWindStrength: 1.0,
                  sawdustTurbulence: 0.6,
                  sawdustDissolveSpeed: 1.2,
                }),
              Breezy: () =>
                setExitControls({
                  sawdustFallSpeed: 7.0,
                  sawdustWindStrength: 4.0,
                  sawdustTurbulence: 2.0,
                  sawdustDissolveSpeed: 2.0,
                }),
            },
          }),
          sawdustFallSpeed: { value: 4.0, min: 0.5, max: 15.0, step: 0.5, label: 'Fall Speed' },
          sawdustWindStrength: { value: 2.0, min: 0.0, max: 10.0, step: 0.5, label: 'Wind Strength' },
          sawdustTurbulence: { value: 1.0, min: 0.0, max: 5.0, step: 0.1, label: 'Turbulence' },
          sawdustDissolveSpeed: { value: 1.5, min: 0.5, max: 3.0, step: 0.1, label: 'Dissolve Speed' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 6) }),
        'Disintegration/Ash': folder({
          ashPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Smolder: () =>
                setExitControls({
                  ashRiseSpeed: 2.0,
                  ashSpreadRadius: 3.5,
                  ashEmberGlow: 0.35,
                  ashBurnSpeed: 1.0,
                }),
              Blaze: () =>
                setExitControls({
                  ashRiseSpeed: 6.0,
                  ashSpreadRadius: 8.0,
                  ashEmberGlow: 0.8,
                  ashBurnSpeed: 1.6,
                }),
            },
          }),
          ashRiseSpeed: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Rise Speed' },
          ashSpreadRadius: { value: 5.0, min: 1.0, max: 15.0, step: 0.5, label: 'Spread Radius' },
          ashEmberGlow: { value: 0.5, min: 0.0, max: 1.0, step: 0.1, label: 'Ember Glow' },
          ashBurnSpeed: { value: 1.2, min: 0.5, max: 3.0, step: 0.1, label: 'Burn Speed' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 8) }),
        'Shatter/Glass': folder({
          shatterPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Crack: () =>
                setExitControls({
                  shatterForce: 14.0,
                  shatterGravity: 10.0,
                  shatterSpread: 0.7,
                  shatterRotation: 3.0,
                }),
              Burst: () =>
                setExitControls({
                  shatterForce: 32.0,
                  shatterGravity: 25.0,
                  shatterSpread: 2.0,
                  shatterRotation: 9.0,
                }),
            },
          }),
          shatterForce: { value: 20.0, min: 5.0, max: 50.0, step: 1.0, label: 'Force' },
          shatterGravity: { value: 15.0, min: 0.0, max: 50.0, step: 1.0, label: 'Gravity' },
          shatterSpread: { value: 1.0, min: 0.0, max: 3.0, step: 0.1, label: 'Spread' },
          shatterRotation: { value: 5.0, min: 0.0, max: 20.0, step: 0.5, label: 'Rotation' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 9) }),
        'Pixelate/Glitch': folder({
          glitchPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Subtle: () =>
                setExitControls({
                  glitchIntensity: 0.7,
                  glitchBlockSize: 0.7,
                  glitchSpeed: 8.0,
                  glitchChroma: 0.15,
                }),
              Harsh: () =>
                setExitControls({
                  glitchIntensity: 2.0,
                  glitchBlockSize: 0.3,
                  glitchSpeed: 18.0,
                  glitchChroma: 0.6,
                }),
            },
          }),
          glitchIntensity: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Intensity' },
          glitchBlockSize: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: 'Block Size' },
          glitchSpeed: { value: 10.0, min: 1.0, max: 30.0, step: 1.0, label: 'Speed' },
          glitchChroma: { value: 0.3, min: 0.0, max: 1.0, step: 0.05, label: 'Chroma Split' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 10) }),
        'Black Hole': folder({
          blackHolePresets: buttonGroup({
            label: 'Presets',
            opts: {
              Orbit: () =>
                setExitControls({
                  blackHoleStrength: 10.0,
                  blackHoleSpinSpeed: 2.0,
                  blackHoleRadius: 0.8,
                  blackHoleStretch: 1.5,
                }),
              Singularity: () =>
                setExitControls({
                  blackHoleStrength: 26.0,
                  blackHoleSpinSpeed: 6.0,
                  blackHoleRadius: 0.3,
                  blackHoleStretch: 3.5,
                }),
            },
          }),
          blackHoleStrength: { value: 15.0, min: 5.0, max: 50.0, step: 1.0, label: 'Strength' },
          blackHoleSpinSpeed: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Spin Speed' },
          blackHoleRadius: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: 'Event Horizon' },
          blackHoleStretch: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Stretch' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 11) }),
        'Bloom/Pollen': folder({
          pollenPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Float: () =>
                setExitControls({
                  pollenDriftSpeed: 1.5,
                  pollenSpread: 6.0,
                  pollenWaveStrength: 1.0,
                  pollenRiseSpeed: 0.6,
                }),
              Burst: () =>
                setExitControls({
                  pollenDriftSpeed: 3.5,
                  pollenSpread: 14.0,
                  pollenWaveStrength: 2.5,
                  pollenRiseSpeed: 2.0,
                }),
            },
          }),
          pollenDriftSpeed: { value: 2.0, min: 0.5, max: 8.0, step: 0.5, label: 'Drift Speed' },
          pollenSpread: { value: 8.0, min: 2.0, max: 20.0, step: 1.0, label: 'Spread' },
          pollenWaveStrength: { value: 1.5, min: 0.0, max: 5.0, step: 0.5, label: 'Wave Strength' },
          pollenRiseSpeed: { value: 1.0, min: 0.0, max: 5.0, step: 0.5, label: 'Rise Speed' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 12) }),
        'Freeze/Shatter': folder({
          freezePresets: buttonGroup({
            label: 'Presets',
            opts: {
              Slow: () =>
                setExitControls({
                  freezeSpeed: 1.5,
                  freezeCrackDensity: 4.0,
                  freezeShatterDelay: 0.5,
                  freezeShardSpeed: 8.0,
                }),
              Snap: () =>
                setExitControls({
                  freezeSpeed: 3.5,
                  freezeCrackDensity: 10.0,
                  freezeShatterDelay: 0.25,
                  freezeShardSpeed: 18.0,
                }),
            },
          }),
          freezeSpeed: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Freeze Speed' },
          freezeCrackDensity: { value: 5.0, min: 1.0, max: 15.0, step: 1.0, label: 'Crack Density' },
          freezeShatterDelay: { value: 0.4, min: 0.1, max: 0.8, step: 0.1, label: 'Shatter Delay' },
          freezeShardSpeed: { value: 10.0, min: 2.0, max: 30.0, step: 1.0, label: 'Shard Speed' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 13) }),
        'Sand/Hourglass': folder({
          sandPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Smooth: () =>
                setExitControls({
                  sandFallSpeed: 4.5,
                  sandFunnelWidth: 1.2,
                  sandSpread: 2.0,
                  sandGrainSize: 0.9,
                }),
              Fast: () =>
                setExitControls({
                  sandFallSpeed: 10.0,
                  sandFunnelWidth: 0.6,
                  sandSpread: 5.0,
                  sandGrainSize: 0.7,
                }),
            },
          }),
          sandFallSpeed: { value: 6.0, min: 1.0, max: 15.0, step: 0.5, label: 'Fall Speed' },
          sandFunnelWidth: { value: 1.0, min: 0.2, max: 3.0, step: 0.1, label: 'Funnel Width' },
          sandSpread: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Spread' },
          sandGrainSize: { value: 0.8, min: 0.3, max: 1.5, step: 0.1, label: 'Grain Size' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 14) }),
        'Teleport/Beam': folder({
          teleportPresets: buttonGroup({
            label: 'Presets',
            opts: {
              Clean: () =>
                setExitControls({
                  teleportSpeed: 1.5,
                  teleportSparkle: 0.6,
                  teleportBandWidth: 1.5,
                  teleportDirection: 1.0,
                }),
              Sparkle: () =>
                setExitControls({
                  teleportSpeed: 3.0,
                  teleportSparkle: 2.0,
                  teleportBandWidth: 2.5,
                  teleportDirection: 1.0,
                }),
            },
          }),
          teleportSpeed: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Speed' },
          teleportSparkle: { value: 1.0, min: 0.0, max: 3.0, step: 0.1, label: 'Sparkle' },
          teleportBandWidth: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Band Width' },
          teleportDirection: {
            value: 1.0,
            options: { Up: 1.0 },
            label: 'Direction',
          },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 15) }),
        '🖼️ 16.Gallery': folder({
          wallPlaneY: { value: -2.0, min: -4.0, max: 0.0, step: 0.1, label: 'Wall Plane Y' },
          screenCoverage: { value: 3.0, min: 1.0, max: 6.0, step: 0.1, label: 'Screen Coverage' },
          gustStrength: { value: 8.0, min: 2.0, max: 20.0, step: 0.5, label: 'Gust Strength' },
        }, { collapsed: true, render: (get) => shouldShowExitFolder(get, 16) }),
      }, { collapsed: false }),
    }),
    { store }
  );

  useControls({
    '🏠 Base.📊 Monitor': folder(
      {
        cameraX: monitor(() => currentCameraX.current, { graph: false }),
        cameraY: monitor(() => currentCameraY.current, { graph: false }),
        cameraZ: monitor(() => currentCameraZ.current, { graph: false }),
      },
      { collapsed: true }
    ),
  }, { store });

  return {
    // Camera
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

    // Entrance Animation
    depthOffset,
    animationSpeed,
    smallParticleThreshold,
    smallMotionReduction,
    skipSmallAnimation,
    smallSpeedMultiplier,

    // Visual Adjustments
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

    // Splat Transform
    rotationX,
    rotationY,
    rotationZ,

    // Splat Blending
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

    // Monitor refs
    currentCameraX,
    currentCameraY,
    currentCameraZ,
  };
};
