import { useEffect, useState } from 'react';
import NavButton from './NavButton';
import {
  navLayouts,
  NAV_BUTTON_IDS,
  NAV_TIMING,
  mobileBreakpoint,
  mobileParkedOffset,
} from '../../constants/navLayouts';
import type { SceneId } from '../../constants';

/**
 * Renders the three reusable nav buttons from the static layout config.
 *
 * It picks the layout from `navLayouts.home` by viewport: the desktop/landscape
 * column, or one of the four portrait-mobile breakpoints. The buttons are
 * placed absolutely so they sit exactly over the label/arrow column that
 * MenuOverlay / MobileNavLayout still render.
 */

// Matches the CSS that switches desktop nav on (navigation.css).
const DESKTOP_QUERY = '(min-width: 1280px), (orientation: landscape)';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, [query]);
  return matches;
}

interface ViewportSize {
  width: number;
  height: number;
}

function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return size;
}

const ARIA_LABEL: Record<string, string> = {
  gallery: 'Open gallery',
  ethos: 'Open ethos',
  contact: 'Open contact',
};

interface NavButtonLayerProps {
  /** Phase 1 trigger — false parks the buttons off-screen. */
  show: boolean;
  onNavigate: (scene: SceneId) => void;
  onContactToggle: () => void;
  isContactActive: boolean;
}

export default function NavButtonLayer({ show, onNavigate, onContactToggle, isContactActive }: NavButtonLayerProps) {
  const isDesktopNav = useMediaQuery(DESKTOP_QUERY);
  const viewport = useViewportSize();
  const breakpoint = mobileBreakpoint(viewport.width);

  const layout = isDesktopNav ? navLayouts.home.desktop : navLayouts.home.mobile[breakpoint];

  // zIndex -1 keeps the buttons just below the label/arrow layers (.nav-exit-*),
  // matching the old paint order where arrowheads sat on top of the buttons.
  // It stays within MenuOverlay's z-30 stacking context, so still above the scene.
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
      {NAV_BUTTON_IDS.map((id, index) => {
        const slot = layout[id];
        // Mobile buttons aren't all edge-anchored, so give NavButton an
        // explicit parking distance computed from their resting geometry.
        const parkedOffset = isDesktopNav
          ? undefined
          : mobileParkedOffset(id, breakpoint, viewport);
        return (
          <NavButton
            key={id}
            id={id}
            position={slot.position}
            side={slot.side}
            size={slot.size}
            show={show}
            parkedOffset={parkedOffset}
            delay={index * NAV_TIMING.buttonStagger}
            isActive={id === 'contact' && isContactActive}
            ariaLabel={ARIA_LABEL[id]}
            onClick={id === 'contact' ? onContactToggle : () => onNavigate(id)}
          />
        );
      })}
    </div>
  );
}
