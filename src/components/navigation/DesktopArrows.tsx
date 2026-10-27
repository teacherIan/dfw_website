import { useLayoutEffect, useState } from 'react';
import { DFW_PATHS, Handline, HandlineArt, HandlineLayer } from '../../lib/handline';
import { arrowStyle, NAV_ARROW_LAND, type ArrowEffectsConfig } from './arrowStyle';

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
      {...arrowStyle(effectsConfig, 'art')}
    />
  );
}

// 1. LOOP ARROW (Top)
export const LoopArrow = (props: ArrowProps) => <DesktopArrow shape="loop" {...props} />;

// 2. SPIRAL ARROW (Middle)
export const SpiralArrow = (props: ArrowProps) => <DesktopArrow shape="spiral" {...props} />;

// 3. WAVE ARROW (Bottom)
export const WaveArrow = (props: ArrowProps) => <DesktopArrow shape="wave" {...props} />;

/** An element's width, kept current. */
function useWidth(el: Element | null): number {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => setW(el.getBoundingClientRect().width);
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return w;
}

/**
 * The desktop menu's arrow, live: the row's hand-drawn path at its drawn size
 * in the arrow's own box, then on into the button (`slot`, the row's reserved
 * button slot) — NAV_ARROW_LAND says how far in. The box keeps the row's
 * layout exactly as the fixed arrow had it.
 */
export function DesktopNavArrow({
  shape,
  slot,
  isVisible,
  delay = 0,
  curveOffset,
  effectsConfig,
}: {
  shape: keyof typeof DFW_PATHS;
  slot: HTMLElement | null;
  isVisible: boolean;
  delay?: number;
  curveOffset?: CurveOffset;
  effectsConfig?: ArrowEffectsConfig;
}) {
  const [box, setBox] = useState<HTMLSpanElement | null>(null);
  const width = useWidth(box);
  return (
    <span
      ref={setBox}
      className="nav-arrow"
      style={{ display: 'block', aspectRatio: '70 / 50', position: 'relative', filter: 'none' }}
    >
      <HandlineLayer style={{ filter: 'drop-shadow(var(--shadow-nav-arrow))' }}>
        {box && slot && width > 0 && (
          <Handline
            // The drawn paths start 2 units into their 70 × 50 box, halfway down,
            // and span 74 units start to end.
            from={{ target: box, at: [2 / 70, 0.5] }}
            to={slot}
            gesture={{ kind: 'path', d: DFW_PATHS[shape], size: width * (74 / 70) }}
            side={1}
            land={NAV_ARROW_LAND}
            seed={`desktop-${shape}`}
            color="white"
            play={isVisible}
            delay={delay}
            follow={1500}
            nudge={curveOffset ? { x: curveOffset.x * 0.5, y: curveOffset.y * 0.5 } : undefined}
            {...arrowStyle(effectsConfig, 'desktop')}
          />
        )}
      </HandlineLayer>
    </span>
  );
}
