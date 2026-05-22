import { useEffect, useState } from 'react';
import NavButton from './NavButton';
import { navLayouts, NAV_BUTTON_IDS, NAV_TIMING } from '../../constants/navLayouts';
import type { SceneId } from '../../constants';

/**
 * Renders the three reusable nav buttons from the static layout config.
 *
 * Phase A: desktop only — it returns null on portrait mobile, where the
 * existing MobileNavLayout still owns the buttons. The buttons are placed
 * absolutely from navLayouts so they sit exactly over the label/arrow
 * column in MenuOverlay.
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

  // Mobile portrait still uses MobileNavLayout's own buttons (Phase 2).
  if (!isDesktopNav) return null;

  const layout = navLayouts.home.desktop;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 31, pointerEvents: 'none' }}>
      {NAV_BUTTON_IDS.map((id, index) => {
        const slot = layout[id];
        return (
          <NavButton
            key={id}
            id={id}
            position={slot.position}
            side={slot.side}
            size={slot.size}
            show={show}
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
