import { useState, useEffect } from 'react';
import { useDragDisplacementStore } from '../contexts/DragDisplacementContext';

interface UseArrowUnravelOptions {
  isVisible: boolean;
  delay: number;
  sensitivity?: number;
}

interface UseArrowUnravelResult {
  hasCompletedInitialAnimation: boolean;
  // Transform-based properties for sway effect
  transform: {
    rotate: number;
    skewX: number;
    skewY: number;
    translateX: number;
    translateY: number;
    scale: number;
  };
  // Offset values for spring-responsive elements
  curveOffset: {
    x: number;
    y: number;
  };
}

export const useArrowUnravel = ({
  isVisible,
  delay,
  sensitivity = 2.5,
}: UseArrowUnravelOptions): UseArrowUnravelResult => {
  const { getState } = useDragDisplacementStore();
  const [hasCompletedInitialAnimation, setHasCompletedInitialAnimation] = useState(false);

  useEffect(() => {
    if (isVisible && !hasCompletedInitialAnimation) {
      // Wait for delay + animation duration before enabling spring response
      const timer = setTimeout(() => {
        setHasCompletedInitialAnimation(true);
      }, delay + 600);
      return () => clearTimeout(timer);
    }

    if (!isVisible) {
      setHasCompletedInitialAnimation(false);
    }
  }, [isVisible, delay, hasCompletedInitialAnimation]);

  // Calculate transform values based on rotation direction
  const { rotation } = getState();
  const rotationX = rotation.x;
  const rotationY = rotation.y;

  // Transform calculations - elements sway with the drag
  const transform = {
    rotate: rotationY * sensitivity * 8,
    skewX: rotationY * sensitivity * 4,
    skewY: rotationX * sensitivity * 3,
    translateX: rotationY * sensitivity * 6,
    translateY: rotationX * sensitivity * -4,
    scale: 1,
  };

  // Bezier control point offsets - this bends the curve itself
  // These values are in SVG coordinate units
  const curveOffset = {
    x: rotationY * sensitivity * 25, // Push control point left/right
    y: rotationX * sensitivity * -20, // Push control point up/down
  };

  return {
    hasCompletedInitialAnimation,
    transform,
    curveOffset,
  };
};
