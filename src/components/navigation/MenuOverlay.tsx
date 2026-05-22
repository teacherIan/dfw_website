import { useEffect, useState } from 'react';
import { useControls, folder } from 'leva';
import clsx from 'clsx';
import MobileNavLayout from './MobileNavLayout';
import { LoopArrow, SpiralArrow, WaveArrow } from './DesktopArrows';
import NavButtonLayer from './NavButtonLayer';
import { ANIMATION_TIMING, navItems, fontOptions, fontFamilyMap } from '../../constants';
import { NAV_TIMING } from '../../constants/navLayouts';
import type { ArrowType, SceneId } from '../../constants';
import type { ArrowEffectsConfig } from './ArrowFilters';
import { useArrowUnravel } from '../../hooks';
import { useAnimationStore, useIsContactOverlayOpen } from '../../stores/animationStore';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Arrow component mapping for desktop navigation
const ArrowComponents: Record<ArrowType, typeof LoopArrow> = {
  loop: LoopArrow,
  spiral: SpiralArrow,
  wave: WaveArrow,
};

const MENU_RETURN_DELAY = 160;

// Desktop nav layout — baked (was Leva-tunable). The label/arrow column is
// pinned top-right; the buttons (NavButtonLayer) are placed from navLayouts
// to land exactly over the reserved button slot in each row.
const DESKTOP_NAV = { top: '45%', right: '1.25rem', gap: '1.25rem', labelEm: 3.6 };
const DESKTOP_BTN_SIZE = 'clamp(60px, 8vw, 90px)';

interface MenuOverlayProps {
  onNavigate: (scene: SceneId) => void;
  skipDelay?: boolean;
  isExiting?: boolean;
  controlsStore?: LevaStore;
  arrowControlsStore?: LevaStore;
  mobileNavStore?: LevaStore;
  arrowEffectsConfig?: ArrowEffectsConfig;
  menuAppearDelay?: number;
}

// Desktop nav row: label + arrow, with a reserved slot the real button
// (rendered by NavButtonLayer) sits over. Labels and arrows keep their own
// entrances, re-timed to run after the buttons have landed.
const DesktopNavRow = ({
  label,
  isVisible,
  delay,
  arrowType,
  currentFont,
  fontSize,
  effectsConfig,
}: {
  label: string;
  isVisible: boolean;
  delay: number;
  arrowType: keyof typeof ArrowComponents;
  currentFont: string;
  fontSize: number;
  effectsConfig?: ArrowEffectsConfig;
}) => {
  const ArrowComponent = ArrowComponents[arrowType];

  // Phase 2: labels + arrows start after the buttons have settled.
  const labelDelay = NAV_TIMING.detailsOffset + delay;
  const arrowDelay = NAV_TIMING.detailsOffset + delay + 150;

  const { hasCompletedInitialAnimation, transform, curveOffset } = useArrowUnravel({
    isVisible,
    delay: arrowDelay,
  });

  return (
    <div className="nav-item flex items-center gap-3">
      {/* Label - desktop only - fade + slide + spring sway */}
      <span
        className={clsx(
          'nav-label desktop-label-only',
          'hidden xl:block',
          'text-3xl sm:text-4xl xl:text-5xl 2xl:text-6xl',
          'text-white/95'
        )}
        style={{
          fontFamily: currentFont,
          textShadow: '0 3px 6px rgba(0, 0, 0, 0.5)',
          WebkitTextStroke: '1.2px rgba(0, 0, 0, 0.7)',
          paintOrder: 'stroke fill',
          fontSize: `${fontSize}em`,
          opacity: isVisible ? 1 : 0,
          transform: !isVisible
            ? 'translateX(20px)'
            : hasCompletedInitialAnimation
              ? `translateX(${(curveOffset?.x ?? 0) * 0.08}px) rotate(${(curveOffset?.x ?? 0) * 0.06}deg)`
              : 'translateX(0)',
          transition: hasCompletedInitialAnimation
            ? 'transform 0.1s ease-out'
            : `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${labelDelay}ms, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${labelDelay}ms`,
        }}
      >
        {label}
      </span>

      {/* Unique arrow per row - desktop only - draw-in animation */}
      <span className={clsx('desktop-arrow-only', 'hidden xl:block', 'relative z-10')}>
        <ArrowComponent
          isVisible={isVisible}
          delay={arrowDelay}
          springTransform={hasCompletedInitialAnimation ? transform : undefined}
          curveOffset={hasCompletedInitialAnimation ? curveOffset : undefined}
          effectsConfig={effectsConfig}
        />
      </span>

      {/* Reserved slot — the real button is rendered by NavButtonLayer and
          sits exactly here. Keeps the row height = button height so the
          column stacking matches navLayouts. */}
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          flex: 'none',
          width: DESKTOP_BTN_SIZE,
          height: DESKTOP_BTN_SIZE,
        }}
      />
    </div>
  );
};

const MenuOverlay = ({
  onNavigate,
  skipDelay = false,
  isExiting = false,
  controlsStore,
  arrowControlsStore,
  mobileNavStore,
  arrowEffectsConfig,
  menuAppearDelay,
}: MenuOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const toggleContactOverlay = useAnimationStore((state) => state.toggleContactOverlay);
  const isContactOverlayOpen = useIsContactOverlayOpen();

  const { menuFont } = useControls({
    '🏠 Base.🎨 Menu Style': folder({
      menuFont: {
        value: 'Caveat',
        options: [...fontOptions],
        label: 'Font Family',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  const currentFont = fontFamilyMap[menuFont];

  useEffect(() => {
    // Animate in after the main content has loaded (skip delay when returning home)
    if (isExiting) {
      setIsVisible(false);
      return;
    }
    if (skipDelay) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, MENU_RETURN_DELAY);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, menuAppearDelay ?? ANIMATION_TIMING.MENU_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey, skipDelay, isExiting, menuAppearDelay]);

  useEffect(() => {
    const handleReset = () => {
      setIsVisible(false);
      setAnimationKey((prev) => prev + 1);
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, []);

  return (
    <div className={clsx('pointer-events-none absolute inset-0 z-30', isExiting && 'nav-exiting')}>
      {/* ============================================
          MOBILE NAVIGATION
          ============================================ */}
      <div className="nav-exit-mobile">
        <MobileNavLayout
          font={currentFont}
          isVisible={isVisible}
          onNavigate={onNavigate}
          controlsStore={controlsStore}
          arrowControlsStore={arrowControlsStore}
          mobileNavStore={mobileNavStore}
          arrowEffectsConfig={arrowEffectsConfig}
        />
      </div>

      {/* ============================================
          DESKTOP NAVIGATION — labels + arrows
          ============================================ */}
      <div className="nav-exit-desktop">
        <div
          className="desktop-nav-only"
          style={{ top: DESKTOP_NAV.top, right: DESKTOP_NAV.right, gap: DESKTOP_NAV.gap }}
        >
          {navItems.map((item) => (
            <DesktopNavRow
              key={item.id}
              label={item.label}
              isVisible={isVisible}
              delay={item.delay}
              arrowType={item.arrowType as keyof typeof ArrowComponents}
              currentFont={currentFont}
              fontSize={DESKTOP_NAV.labelEm}
              effectsConfig={arrowEffectsConfig}
            />
          ))}
        </div>
      </div>

      {/* ============================================
          NAV BUTTONS — reusable, persistent button layer
          ============================================ */}
      <NavButtonLayer
        show={isVisible}
        onNavigate={onNavigate}
        onContactToggle={toggleContactOverlay}
        isContactActive={isContactOverlayOpen}
      />
    </div>
  );
};

export default MenuOverlay;
