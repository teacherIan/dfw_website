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
  return (
    <ErrorBoundary>
      <Canvas gl={{ antialias: false }} camera={{ position: [0, 2, 4], fov: 50 }}>
        <Scene {...props} />
      </Canvas>
    </ErrorBoundary>
  );
}
