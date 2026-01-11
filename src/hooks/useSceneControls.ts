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

    // Monitor refs
    currentCameraX,
    currentCameraY,
    currentCameraZ,
  };
};
