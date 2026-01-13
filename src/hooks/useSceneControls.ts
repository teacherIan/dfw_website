import { useControls, monitor, button, folder } from 'leva';
import { useRef } from 'react';

/**
 * Return type for scene controls hook
 */
export interface SceneControls {
  // Camera
  cameraX: number;
  cameraY: number;
  cameraZ: number;
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

  // Global Exit Settings
  exitAnimationDuration: number;

  // Monitor refs
  currentCameraX: React.MutableRefObject<number>;
  currentCameraY: React.MutableRefObject<number>;
  currentCameraZ: React.MutableRefObject<number>;
}

interface UseSceneControlsParams {
  isMobile: boolean;
  onResetAnimation: () => void;
}

/**
 * Custom hook that encapsulates all Leva controls for the Scene component.
 * Extracts ~150 lines of control definitions into a reusable hook.
 */
export const useSceneControls = ({
  isMobile,
  onResetAnimation,
}: UseSceneControlsParams): SceneControls => {
  // Refs for monitoring current camera position
  const currentCameraX = useRef(0);
  const currentCameraY = useRef(0);
  const currentCameraZ = useRef(0);

  // Mobile vs desktop camera positions
  const mobileCameraDefaults = { x: 0, y: 2.5, z: 4.0 };
  const desktopCameraDefaults = { x: 0, y: 1.6, z: 3.1 };
  const cameraDefaults = isMobile ? mobileCameraDefaults : desktopCameraDefaults;

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
  } = useControls({
    '🏠 Base.🎥 Camera': folder({
      position: folder({
        cameraX: { value: cameraDefaults.x, min: -10, max: 10, step: 0.1, label: 'X' },
        cameraY: { value: cameraDefaults.y, min: -5, max: 10, step: 0.1, label: 'Y' },
        cameraZ: { value: cameraDefaults.z, min: 0.5, max: 10, step: 0.1, label: 'Z' },
      }, { collapsed: true }),
      animation: folder({
        animateCamera: { value: true, label: 'Animate on Start' },
        animationDuration: { value: 20, min: 1, max: 30, step: 0.5, label: 'Duration (s)' },
        startX: { value: -1.0, min: -10, max: 10, step: 0.1, label: 'Start X' },
        startY: { value: 15.0, min: -5, max: 25, step: 0.1, label: 'Start Y' },
        startZ: { value: 20.0, min: 0.5, max: 30, step: 0.1, label: 'Start Z' },
      }, { collapsed: true }),
      ambientSway: folder({
        ambientSway: { value: true, label: 'Enable Sway' },
        swayIntensity: { value: 5, min: 0, max: 20, step: 0.5, label: 'Intensity' },
      }, { collapsed: true }),
    }, { collapsed: true }),
  });

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
  });

  const {
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
          holeXMin: { value: -2.0, min: -10, max: 10, step: 0.5, label: 'X Min' },
          holeXMax: { value: 2.0, min: -10, max: 10, step: 0.5, label: 'X Max' },
          holeYMin: { value: 3.0, min: -10, max: 10, step: 0.5, label: 'Y Min' },
          holeYMax: { value: 7.0, min: -10, max: 10, step: 0.5, label: 'Y Max' },
          holeZMin: { value: -2.0, min: -10, max: 10, step: 0.5, label: 'Z Min' },
          holeZMax: { value: 3.0, min: -10, max: 10, step: 0.5, label: 'Z Max' },
        },
        { collapsed: true }
      ),
    }, { collapsed: true }),
  });

  const { rotationX, rotationY, rotationZ } = useControls({
    '🏠 Base.🔄 Splat Transform': folder({
      rotationX: { value: -1.6, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation X' },
      rotationY: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Y' },
      rotationZ: { value: 0, min: -Math.PI, max: Math.PI, step: 0.01, label: 'Rotation Z' },
    }, { collapsed: true }),
  });

  const {
    syntheticBrightness,
    syntheticSaturation,
    syntheticOpacity,
    syntheticZMin,
    syntheticZMax,
    syntheticYMin,
    syntheticYMax,
  } = useControls({
    '🏠 Base.🌈 Splat Blending': folder(
      {
        syntheticBrightness: { value: 1.0, min: 0.1, max: 2.0, step: 0.05, label: 'Brightness' },
        syntheticSaturation: { value: 0.65, min: 0.0, max: 1.5, step: 0.05, label: 'Saturation' },
        syntheticOpacity: { value: 1.0, min: 0.1, max: 1.0, step: 0.05, label: 'Opacity' },
        syntheticZMin: { value: -5.0, min: -20, max: 20, step: 0.5, label: 'Z Min' },
        syntheticZMax: { value: 2.0, min: -20, max: 20, step: 0.5, label: 'Z Max' },
        syntheticYMin: { value: -10.0, min: -20, max: 20, step: 0.5, label: 'Y Min' },
        syntheticYMax: { value: 5.0, min: -20, max: 20, step: 0.5, label: 'Y Max' },
      },
      { collapsed: true }
    ),
  });

  const {
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

    exitAnimationDuration,
  } = useControls({
    '💥 Exit Animations': folder({
      exitAnimationDuration: { value: 5.9, min: 0.1, max: 10.0, step: 0.1, label: 'Duration (sec)' },
      'Physics Explosion': folder({
        physicsStrength: { value: 15.0, min: 0.0, max: 50.0, step: 0.5, label: 'Strength' },
        physicsGravity: { value: 25.0, min: 0.0, max: 100.0, step: 1.0, label: 'Gravity' },
        physicsFriction: { value: 0.90, min: 0.0, max: 1.0, step: 0.01, label: 'Friction' },
        physicsTumbleSpeed: { value: 5.0, min: 0.0, max: 20.0, step: 0.5, label: 'Tumble Speed' },
      }, { collapsed: false }),
      'Pond Ripple': folder({
        pondWaveSpeed: { value: 8.0, min: 1.0, max: 20.0, step: 0.5, label: 'Wave Speed' },
        pondWaveFrequency: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Wave Frequency' },
        pondWaveAmplitude: { value: 0.5, min: 0.1, max: 5.0, step: 0.1, label: 'Wave Amplitude' },
        pondWaveCount: { value: 20.0, min: 5.0, max: 50.0, step: 1.0, label: 'Wave Count' },
      }, { collapsed: false }),
      'Exploded View': folder({
        explodedExpansionStrength: { value: 18.5, min: 0.0, max: 50.0, step: 0.5, label: 'Expansion Strength' },
        explodedRotationSpeed: { value: 0.5, min: 0.0, max: 20.0, step: 0.1, label: 'Rotation Speed' },
        explodedFadeStart: { value: 0.17, min: 0.0, max: 1.0, step: 0.01, label: 'Fade Start (0-1)' },
        explodedFadeEnd: { value: 1.00, min: 0.0, max: 1.0, step: 0.01, label: 'Fade End (0-1)' },
      }, { collapsed: true }),
      'Sawdust Drift': folder({
        sawdustFallSpeed: { value: 4.0, min: 0.5, max: 15.0, step: 0.5, label: 'Fall Speed' },
        sawdustWindStrength: { value: 2.0, min: 0.0, max: 10.0, step: 0.5, label: 'Wind Strength' },
        sawdustTurbulence: { value: 1.0, min: 0.0, max: 5.0, step: 0.1, label: 'Turbulence' },
        sawdustDissolveSpeed: { value: 1.5, min: 0.5, max: 3.0, step: 0.1, label: 'Dissolve Speed' },
      }, { collapsed: true }),
      'Disintegration/Ash': folder({
        ashRiseSpeed: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Rise Speed' },
        ashSpreadRadius: { value: 5.0, min: 1.0, max: 15.0, step: 0.5, label: 'Spread Radius' },
        ashEmberGlow: { value: 0.5, min: 0.0, max: 1.0, step: 0.1, label: 'Ember Glow' },
        ashBurnSpeed: { value: 1.2, min: 0.5, max: 3.0, step: 0.1, label: 'Burn Speed' },
      }, { collapsed: true }),
      'Shatter/Glass': folder({
        shatterForce: { value: 20.0, min: 5.0, max: 50.0, step: 1.0, label: 'Force' },
        shatterGravity: { value: 15.0, min: 0.0, max: 50.0, step: 1.0, label: 'Gravity' },
        shatterSpread: { value: 1.0, min: 0.0, max: 3.0, step: 0.1, label: 'Spread' },
        shatterRotation: { value: 5.0, min: 0.0, max: 20.0, step: 0.5, label: 'Rotation' },
      }, { collapsed: true }),
      'Pixelate/Glitch': folder({
        glitchIntensity: { value: 1.0, min: 0.1, max: 3.0, step: 0.1, label: 'Intensity' },
        glitchBlockSize: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: 'Block Size' },
        glitchSpeed: { value: 10.0, min: 1.0, max: 30.0, step: 1.0, label: 'Speed' },
        glitchChroma: { value: 0.3, min: 0.0, max: 1.0, step: 0.05, label: 'Chroma Split' },
      }, { collapsed: true }),
      'Black Hole': folder({
        blackHoleStrength: { value: 15.0, min: 5.0, max: 50.0, step: 1.0, label: 'Strength' },
        blackHoleSpinSpeed: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Spin Speed' },
        blackHoleRadius: { value: 0.5, min: 0.1, max: 2.0, step: 0.1, label: 'Event Horizon' },
        blackHoleStretch: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Stretch' },
      }, { collapsed: true }),
      'Bloom/Pollen': folder({
        pollenDriftSpeed: { value: 2.0, min: 0.5, max: 8.0, step: 0.5, label: 'Drift Speed' },
        pollenSpread: { value: 8.0, min: 2.0, max: 20.0, step: 1.0, label: 'Spread' },
        pollenWaveStrength: { value: 1.5, min: 0.0, max: 5.0, step: 0.5, label: 'Wave Strength' },
        pollenRiseSpeed: { value: 1.0, min: 0.0, max: 5.0, step: 0.5, label: 'Rise Speed' },
      }, { collapsed: true }),
      'Freeze/Shatter': folder({
        freezeSpeed: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Freeze Speed' },
        freezeCrackDensity: { value: 5.0, min: 1.0, max: 15.0, step: 1.0, label: 'Crack Density' },
        freezeShatterDelay: { value: 0.4, min: 0.1, max: 0.8, step: 0.1, label: 'Shatter Delay' },
        freezeShardSpeed: { value: 10.0, min: 2.0, max: 30.0, step: 1.0, label: 'Shard Speed' },
      }, { collapsed: true }),
      'Sand/Hourglass': folder({
        sandFallSpeed: { value: 6.0, min: 1.0, max: 15.0, step: 0.5, label: 'Fall Speed' },
        sandFunnelWidth: { value: 1.0, min: 0.2, max: 3.0, step: 0.1, label: 'Funnel Width' },
        sandSpread: { value: 3.0, min: 0.5, max: 10.0, step: 0.5, label: 'Spread' },
        sandGrainSize: { value: 0.8, min: 0.3, max: 1.5, step: 0.1, label: 'Grain Size' },
      }, { collapsed: true }),
      'Teleport/Beam': folder({
        teleportSpeed: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Speed' },
        teleportSparkle: { value: 1.0, min: 0.0, max: 3.0, step: 0.1, label: 'Sparkle' },
        teleportBandWidth: { value: 2.0, min: 0.5, max: 5.0, step: 0.5, label: 'Band Width' },
        teleportDirection: { value: 1.0, min: -1.0, max: 1.0, step: 2.0, label: 'Direction (Up/Down)' },
      }, { collapsed: true }),
    }, { collapsed: false }),
  });

  useControls({
    '🏠 Base.📊 Monitor': folder(
      {
        cameraX: monitor(() => currentCameraX.current, { graph: false, label: 'Camera X' }),
        cameraY: monitor(() => currentCameraY.current, { graph: false, label: 'Camera Y' }),
        cameraZ: monitor(() => currentCameraZ.current, { graph: false, label: 'Camera Z' }),
      },
      { collapsed: true }
    ),
  });

  return {
    // Camera
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

    exitAnimationDuration,

    // Monitor refs
    currentCameraX,
    currentCameraY,
    currentCameraZ,
  };
};
