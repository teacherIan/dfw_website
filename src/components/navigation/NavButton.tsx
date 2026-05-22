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

export type NavButtonSide = 'left' | 'right';

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

// Off-screen parking distance, as a multiple of the button's own width —
// far enough to fully clear an edge-anchored button.
const OFFSCREEN = '165%';

export default function NavButton({
  position,
  side,
  show,
  delay = 0,
  size,
  onClick,
  ariaLabel,
  isActive = false,
}: NavButtonProps) {
  const parked = side === 'right' ? OFFSCREEN : `-${OFFSCREEN}`;

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
      initial={{ x: parked }}
      animate={{ x: show ? '0%' : parked }}
      transition={{ ...ENTER_SPRING, delay: delay / 1000 }}
      whileHover={{ scale: 1.05, rotate: 15, transition: HOVER_SPRING }}
      whileTap={{ scale: 0.95, transition: { duration: 0.12 } }}
    >
      <BlueprintButtonSVG />
      <span className="sr-only">{ariaLabel}</span>
    </motion.button>
  );
}
