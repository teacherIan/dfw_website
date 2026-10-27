import { DFW_PATHS, HandlineArt } from '../../lib/handline';
import { arrowStyle, type ArrowEffectsConfig } from './arrowStyle';

interface SpringTransform {
  rotate: number;
  skewX: number;
  skewY: number;
  translateX: number;
  translateY: number;
  scale: number;
}

interface CurveOffset {
  x: number;
  y: number;
}

interface ArrowProps {
  className?: string;
  isVisible?: boolean;
  delay?: number;
  springTransform?: SpringTransform;
  curveOffset?: CurveOffset;
  effectsConfig?: ArrowEffectsConfig;
}

/**
 * The sway each arrow does with the scene drag: a transform of the whole
 * svg, a different mix per arrow so the three don't move in lockstep.
 */
type Sway = (st: SpringTransform | undefined, ox: number, oy: number) => string;

const SWAYS: Record<keyof typeof DFW_PATHS, Sway> = {
  loop: (st, ox, oy) =>
    `translate(${(st?.translateX ?? 0) + ox * 0.1}px, ${(st?.translateY ?? 0) + oy * 0.1}px) rotate(${(st?.rotate ?? 0) + ox * 0.2}deg) skewY(${oy * 0.25}deg)`,
  spiral: (st, ox, oy) =>
    `translate(${(st?.translateX ?? 0) + ox * 0.08}px, ${(st?.translateY ?? 0) + oy * 0.12}px) rotate(${(st?.rotate ?? 0) - ox * 0.17}deg) skewX(${ox * 0.2}deg)`,
  wave: (st, ox, oy) =>
    `translate(${(st?.translateX ?? 0) + ox * 0.07}px, ${(st?.translateY ?? 0) + oy * 0.14}px) rotate(${(st?.rotate ?? 0) + ox * 0.14}deg) skewY(${-oy * 0.35}deg) scaleY(${1 + Math.abs(oy) * 0.007})`,
};

function DesktopArrow({
  shape,
  className = 'nav-arrow',
  isVisible = true,
  delay = 0,
  springTransform,
  curveOffset,
  effectsConfig,
}: ArrowProps & { shape: keyof typeof DFW_PATHS }) {
  const sway =
    springTransform || curveOffset
      ? SWAYS[shape](springTransform, curveOffset?.x ?? 0, curveOffset?.y ?? 0)
      : undefined;
  return (
    <HandlineArt
      className={className}
      viewBox="0 0 70 50"
      d={DFW_PATHS[shape]}
      seed={`desktop-${shape}`}
      color="white"
      play={isVisible}
      delay={delay}
      style={{ transform: sway, transformOrigin: 'left center', opacity: 0.95 }}
      {...arrowStyle(effectsConfig, 'desktop')}
    />
  );
}

// 1. LOOP ARROW (Top)
export const LoopArrow = (props: ArrowProps) => <DesktopArrow shape="loop" {...props} />;

// 2. SPIRAL ARROW (Middle)
export const SpiralArrow = (props: ArrowProps) => <DesktopArrow shape="spiral" {...props} />;

// 3. WAVE ARROW (Bottom)
export const WaveArrow = (props: ArrowProps) => <DesktopArrow shape="wave" {...props} />;
