import type { CSSProperties } from 'react';

/**
 * Animation transition configuration
 */
export const TRANSITION = {
  CUBIC_BEZIER: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  DURATION: '0.8s',
} as const;

/**
 * Creates a fade + slide animation style object
 * @param isVisible - Whether element is visible
 * @param direction - Direction to slide ('x' or 'y')
 * @param amount - Amount to translate (e.g., '20px', '-30px')
 * @param delay - Animation delay in milliseconds
 */
export const createFadeSlideStyle = (
  isVisible: boolean,
  direction: 'x' | 'y',
  amount: string,
  delay: number
): CSSProperties => ({
  opacity: isVisible ? 1 : 0,
  transform: isVisible
    ? `translate${direction.toUpperCase()}(0)`
    : `translate${direction.toUpperCase()}(${amount})`,
  transition: `all ${TRANSITION.DURATION} ${TRANSITION.CUBIC_BEZIER} ${delay}ms`,
});

/**
 * Creates a fade + dual-axis slide animation style object
 * Used for contact button which needs both X and Y transforms
 */
export const createFadeSlideXYStyle = (
  isVisible: boolean,
  xAmount: string,
  yAmount: string,
  delay: number
): CSSProperties => ({
  opacity: isVisible ? 1 : 0,
  transform: isVisible
    ? `translateX(${xAmount}) translateY(0)`
    : `translateX(${xAmount}) translateY(${yAmount})`,
  transition: `all ${TRANSITION.DURATION} ${TRANSITION.CUBIC_BEZIER} ${delay}ms`,
});

/**
 * Text styling for navigation labels
 */
export const NAV_LABEL_TEXT_STYLE: CSSProperties = {
  textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
  WebkitTextStroke: '1px rgba(0, 0, 0, 0.85)',
  paintOrder: 'stroke fill',
};
