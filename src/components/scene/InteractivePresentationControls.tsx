import { useRef, type ReactNode } from 'react';
import { PresentationControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useDragDisplacementStore } from '../../contexts/DragDisplacementContext';

interface DisplacementReaderProps {
  children: ReactNode;
}

const DisplacementReader = ({ children }: DisplacementReaderProps) => {
  const groupRef = useRef<Group>(null);
  const { setState } = useDragDisplacementStore();
  const previousMagnitude = useRef(0);

  useFrame(() => {
    if (!groupRef.current?.parent) return;

    const parentRotation = groupRef.current.parent.rotation;
    const magnitude = Math.sqrt(parentRotation.x ** 2 + parentRotation.y ** 2);

    if (Math.abs(magnitude - previousMagnitude.current) > 0.001) {
      setState({
        magnitude,
        rotation: {
          x: parentRotation.x,
          y: parentRotation.y,
          z: parentRotation.z,
        },
      });
      previousMagnitude.current = magnitude;
    }
  });

  return <group ref={groupRef}>{children}</group>;
};

interface InteractivePresentationControlsProps {
  children: ReactNode;
  global?: boolean;
  snap?: boolean | number;
  rotation?: [number, number, number];
  polar?: [number, number];
  azimuth?: [number, number];
  config?: object;
  enabled?: boolean;
  cursor?: boolean;
  speed?: number;
  zoom?: number;
  domElement?: HTMLElement;
}

export const InteractivePresentationControls = ({
  children,
  ...props
}: InteractivePresentationControlsProps) => {
  return (
    <PresentationControls {...props}>
      <DisplacementReader>{children}</DisplacementReader>
    </PresentationControls>
  );
};
