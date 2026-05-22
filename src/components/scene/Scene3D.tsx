import type { ComponentProps } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './Scene';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Lazy boundary for the 3D scene. App.tsx imports this via React.lazy, which
 * pulls three.js, react-three-fiber, drei, and the Spark splat renderer into
 * a separate chunk. The intro (React + RoughJS + LoadingScreen) ships in the
 * small initial bundle and renders without waiting on the 3D engine.
 */
export type Scene3DProps = ComponentProps<typeof Scene>;

export default function Scene3D(props: Scene3DProps) {
  // Cap the splat canvas's device-pixel-ratio. Gaussian-splat rendering is
  // heavily fill-rate bound, so on phones/tablets (weaker GPUs, often dpr 2-3)
  // we render at a lower ratio — a big frame-budget saving where it's needed
  // most. The splat is soft by nature so the lower ratio is barely visible,
  // and the DOM UI (text, nav) is unaffected — it keeps native sharpness.
  const maxDpr = props.isMobileView ? 1.5 : 2;
  return (
    <ErrorBoundary>
      <Canvas
        gl={{ antialias: false }}
        camera={{ position: [0, 2, 4], fov: 50 }}
        dpr={[1, maxDpr]}
      >
        <Scene {...props} />
      </Canvas>
    </ErrorBoundary>
  );
}
