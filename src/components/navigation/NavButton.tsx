import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import BlueprintButtonSVG from './BlueprintButtonSVG';

/**
 * The reusable round blueprint button.
 *
 * It owns only its own motion: it slides in from the nearest screen edge
 * with a physics spring (a single confident overshoot), and parks back
 * off-screen when hidden. Position is supplied by the parent — the same
 * button can therefore be placed anywhere and reused across screens.
 *
 * Labels and arrows are deliberately NOT part of this component; they have
 * their own entrances, sequenced to run after the buttons land.
 */

export type NavButtonSide = 'left' | 'right' | 'bottom';

export interface NavButtonPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

interface NavButtonProps {
  /** Stable identity (e.g. 'ethos') — used for React keys. */
  id: string;
  /** Absolute placement within the nav layer. */
  position: NavButtonPosition;
  /** Which edge it enters from / parks behind. */
  side: NavButtonSide;
  /** When false the button waits off-screen; true springs it into place. */
  show: boolean;
  /**
   * Explicit off-screen parking distance in px (signed: negative = left/up,
   * positive = right/down). Overrides the default % offset — needed for
   * buttons that aren't anchored at the edge they slide from, where a fixed
   * fraction of the button's own size wouldn't clear the screen.
   */
  parkedOffset?: number;
  /** Entrance stagger, in milliseconds. */
  delay?: number;
  /** Optional explicit diameter; otherwise the CSS responsive size is used. */
  size?: number;
  onClick: () => void;
  ariaLabel: string;
  isActive?: boolean;
}

// One confident overshoot, then settle — "weighty," not springy/boingy.
const ENTER_SPRING = { type: 'spring', bounce: 0.3, duration: 0.62 } as const;
const HOVER_SPRING = { type: 'spring', bounce: 0.45, duration: 0.34 } as const;

// Default off-screen parking distance, as a multiple of the button's own
// size — enough to clear a button anchored at the edge it slides from.
// Buttons that aren't edge-anchored pass an explicit `parkedOffset` instead.
const OFFSCREEN = '165%';

export default function NavButton({
  position,
  side,
  show,
  parkedOffset,
  delay = 0,
  size,
  onClick,
  ariaLabel,
  isActive = false,
}: NavButtonProps) {
  // 'bottom' slides on the Y axis (up into place); 'left'/'right' on X.
  const axis: 'x' | 'y' = side === 'bottom' ? 'y' : 'x';
  const parked: number | string =
    parkedOffset != null ? parkedOffset : side === 'left' ? `-${OFFSCREEN}` : OFFSCREEN;

  const style: CSSProperties = {
    position: 'absolute',
    ...position,
    // Framer owns the transform; let CSS keep only the box-shadow hover ease.
    transition: 'box-shadow 0.4s ease-out',
    ...(size != null ? { width: `${size}px`, height: `${size}px` } : null),
  };

  return (
    <motion.button
      type="button"
      className={`nav-button-circle pointer-events-auto${isActive ? ' nav-button-circle--active' : ''}`}
      aria-label={ariaLabel}
      onClick={onClick}
      style={style}
      initial={{ [axis]: parked }}
      animate={{ [axis]: show ? 0 : parked }}
      transition={{ ...ENTER_SPRING, delay: delay / 1000 }}
      whileHover={{ scale: 1.05, rotate: 15, transition: HOVER_SPRING }}
      whileTap={{ scale: 0.95, transition: { duration: 0.12 } }}
    >
      <BlueprintButtonSVG />
      <span className="sr-only">{ariaLabel}</span>
    </motion.button>
  );
}
