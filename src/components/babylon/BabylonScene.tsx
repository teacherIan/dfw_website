import { useEffect, useRef, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  WebGPUEngine,
} from '@babylonjs/core';
import { GaussianSplattingMesh } from '@babylonjs/core/Meshes/GaussianSplatting/gaussianSplattingMesh';
// Register the SPLAT/SPZ file loader for decompression support
import '@babylonjs/loaders/SPLAT';

// Splat data format: 32 bytes per splat
// - Bytes 0-11: Position (3 floats: x, y, z)
// - Bytes 12-23: Scale (3 floats)
// - Bytes 24-27: Color (4 bytes: r, g, b, a)
// - Bytes 28-31: Rotation quaternion (4 bytes)
const BYTES_PER_SPLAT = 32;

// Simple seeded random for consistent per-splat randomness
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Easing function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface BabylonSceneProps {
  splatUrl?: string;
}

export function BabylonScene({ splatUrl = '/assets/v_one_final.spz' }: BabylonSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | WebGPUEngine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [isWebGPU, setIsWebGPU] = useState<boolean | null>(null);
  const [fps, setFps] = useState(0);
  const [splatCount, setSplatCount] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    let engine: Engine | WebGPUEngine;
    let scene: Scene;
    let disposed = false;

    // Animation state
    let animationStartTime: number | null = null;
    let originalPositions: Float32Array | null = null;
    let scatteredOffsets: Float32Array | null = null;
    let animatedBuffer: ArrayBuffer | null = null;
    let splatMeshRef: GaussianSplattingMesh | null = null;
    const ANIMATION_DURATION = 3.0; // seconds
    const SCATTER_STRENGTH = 8.0;

    const initScene = async () => {
      try {
        // Try WebGPU first
        const webGPUSupported = await WebGPUEngine.IsSupportedAsync;

        if (webGPUSupported) {
          engine = new WebGPUEngine(canvas, {
            antialias: true,
            stencil: true,
          });
          await (engine as WebGPUEngine).initAsync();
          setIsWebGPU(true);
          console.log('Babylon.js: Using WebGPU engine');
        } else {
          engine = new Engine(canvas, true);
          setIsWebGPU(false);
          console.log('Babylon.js: WebGPU not supported, falling back to WebGL');
        }

        if (disposed) {
          engine.dispose();
          return;
        }

        engineRef.current = engine;
        scene = new Scene(engine);
        sceneRef.current = scene;

        // Camera setup
        const camera = new ArcRotateCamera(
          'camera',
          -Math.PI / 2,
          Math.PI / 2.5,
          5,
          new Vector3(0, 1, 0),
          scene
        );
        camera.fov = (50 * Math.PI) / 180;
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 10;
        camera.wheelPrecision = 50;

        // Lighting
        const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
        light.intensity = 1;

        // Load the gaussian splat with keepInRam for buffer access
        console.log('Loading splat from:', splatUrl);
        const splatMesh = new GaussianSplattingMesh('splat', splatUrl, scene, true); // keepInRam = true
        splatMeshRef = splatMesh;

        const loadingPromise = splatMesh.getLoadingPromise();
        if (loadingPromise) {
          loadingPromise.then(() => {
            if (disposed) return;

            // Adjust rotation to match our coordinate system
            splatMesh.rotation.x = -Math.PI / 2;
            splatMesh.position.y = -0.5;

            const count = splatMesh.splatCount ?? 0;
            console.log('Splat loaded successfully, count:', count);
            setSplatCount(count);

            // Get the original splat data
            const splatsData = splatMesh.splatsData;
            if (splatsData && count > 0) {
              console.log('Splats data size:', splatsData.byteLength, 'bytes');

              // Store original positions and create scatter offsets
              originalPositions = new Float32Array(count * 3);
              scatteredOffsets = new Float32Array(count * 3);
              animatedBuffer = splatsData.slice(0); // Clone the buffer

              const originalView = new Float32Array(splatsData);

              for (let i = 0; i < count; i++) {
                const baseIndex = (i * BYTES_PER_SPLAT) / 4; // Convert byte offset to float offset

                // Store original position
                originalPositions[i * 3] = originalView[baseIndex];
                originalPositions[i * 3 + 1] = originalView[baseIndex + 1];
                originalPositions[i * 3 + 2] = originalView[baseIndex + 2];

                // Generate per-splat random scatter offset using position as seed
                const seed = originalPositions[i * 3] * 1000 + originalPositions[i * 3 + 1] * 100 + originalPositions[i * 3 + 2] * 10;
                const rx = (seededRandom(seed) - 0.5) * 2 * SCATTER_STRENGTH;
                const ry = (seededRandom(seed + 1) - 0.5) * 2 * SCATTER_STRENGTH;
                const rz = (seededRandom(seed + 2) - 0.5) * 2 * SCATTER_STRENGTH;

                scatteredOffsets[i * 3] = rx;
                scatteredOffsets[i * 3 + 1] = ry;
                scatteredOffsets[i * 3 + 2] = rz;
              }

              console.log('Animation buffers prepared');
              animationStartTime = performance.now();
            } else {
              console.warn('No splats data available for animation');
            }

            setIsLoaded(true);
          }).catch((err) => {
            console.error('Failed to load splat:', err);
            setError(`Failed to load splat: ${err.message || err}`);
          });
        }

        // Render loop with buffer animation
        engine.runRenderLoop(() => {
          // Animate splats by modifying buffer
          if (
            animationStartTime !== null &&
            originalPositions !== null &&
            scatteredOffsets !== null &&
            animatedBuffer !== null &&
            splatMeshRef !== null
          ) {
            const elapsed = (performance.now() - animationStartTime) / 1000;
            const rawProgress = Math.min(elapsed / ANIMATION_DURATION, 1);
            const progress = easeOutCubic(rawProgress);

            // Only update during animation
            if (rawProgress < 1) {
              const animatedView = new Float32Array(animatedBuffer);
              const count = originalPositions.length / 3;

              for (let i = 0; i < count; i++) {
                const baseIndex = (i * BYTES_PER_SPLAT) / 4;

                // Lerp from scattered to original position
                // scattered = original + offset, so: current = original + offset * (1 - progress)
                const offsetScale = 1 - progress;

                animatedView[baseIndex] = originalPositions[i * 3] + scatteredOffsets[i * 3] * offsetScale;
                animatedView[baseIndex + 1] = originalPositions[i * 3 + 1] + scatteredOffsets[i * 3 + 1] * offsetScale;
                animatedView[baseIndex + 2] = originalPositions[i * 3 + 2] + scatteredOffsets[i * 3 + 2] * offsetScale;
              }

              // Update the mesh with animated data
              splatMeshRef.updateData(animatedBuffer);
            }

            setAnimationProgress(rawProgress);
          }

          scene.render();
          setFps(Math.round(engine.getFps()));
        });

        // Handle resize
        const handleResize = () => engine.resize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
      } catch (err) {
        console.error('Failed to initialize Babylon.js:', err);
        setError(`Failed to initialize: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    initScene();

    return () => {
      disposed = true;
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [splatUrl]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ outline: 'none' }}
      />

      {/* Debug overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded font-mono text-sm space-y-1">
        <div>
          Engine: {isWebGPU === null ? 'Initializing...' : isWebGPU ? 'WebGPU' : 'WebGL (fallback)'}
        </div>
        <div>FPS: {fps}</div>
        {!isLoaded && !error && <div>Loading...</div>}
        {isLoaded && (
          <>
            <div className="text-green-400">Splat Loaded</div>
            {splatCount && <div>Splats: {splatCount.toLocaleString()}</div>}
            <div>Animation: {(animationProgress * 100).toFixed(0)}%</div>
          </>
        )}
        {error && <div className="text-red-400 text-xs max-w-xs break-words">{error}</div>}
      </div>
    </div>
  );
}
