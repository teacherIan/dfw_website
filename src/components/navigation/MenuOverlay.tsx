import { useEffect, useState } from 'react';
import { useControls, folder } from 'leva';
import clsx from 'clsx';
import MobileNavLayout from './MobileNavLayout';
import { LoopArrow, SpiralArrow, WaveArrow } from './DesktopArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import { ANIMATION_TIMING, navItems, fontOptions, fontFamilyMap } from '../../constants';
import type { ArrowType, SceneId } from '../../constants';
import { useWindowWidth, useArrowUnravel } from '../../hooks';
import { useAnimationStore, useIsContactOverlayOpen } from '../../stores/animationStore';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

interface MenuOverlayProps {
  onNavigate: (scene: SceneId) => void;
  skipDelay?: boolean;
  isExiting?: boolean;
  controlsStore?: LevaStore;
  arrowControlsStore?: LevaStore;
}

// Arrow component mapping for desktop navigation
const ArrowComponents: Record<ArrowType, typeof LoopArrow> = {
  loop: LoopArrow,
  spiral: SpiralArrow,
  wave: WaveArrow,
};

const MENU_RETURN_DELAY = 160;

// Small circular blueprint button component
const BlueprintButton = ({
  label,
  sceneId,
  isVisible,
  delay,
  arrowType,
  currentFont,
  fontSize = 1,
  onNavigate,
  onClick,
  isActive = false,
}: {
  label: string;
  sceneId: SceneId;
  isVisible: boolean;
  delay: number;
  arrowType: keyof typeof ArrowComponents;
  currentFont: string;
  fontSize?: number;
  onNavigate: (scene: SceneId) => void;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  const ArrowComponent = ArrowComponents[arrowType];

  // Stagger delays for mixed animation style
  const labelDelay = delay;
  const arrowDelay = delay + 150;
  const buttonDelay = delay;

  // Use unravel hook for spring-responsive arrow animation
  const { hasCompletedInitialAnimation, transform, curveOffset } = useArrowUnravel({
    isVisible,
    delay: arrowDelay,
  });

  return (
    <div className="nav-item flex items-center gap-3">
      {/* Label - desktop only - fade + slide animation + spring sway */}
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

      {/* Unique arrow for each button - desktop only - draw-in animation */}
      <span className={clsx('desktop-arrow-only', 'hidden xl:block', 'relative z-10')}>
        <ArrowComponent
          isVisible={isVisible}
          delay={arrowDelay}
          springTransform={hasCompletedInitialAnimation ? transform : undefined}
          curveOffset={hasCompletedInitialAnimation ? curveOffset : undefined}
        />
      </span>

      {/* Circular Blueprint Button - pop-in animation + spring rotation */}
      <span
        style={{
          display: 'inline-block',
          transform: hasCompletedInitialAnimation
            ? `rotate(${(curveOffset?.x ?? 0) * 0.15}deg)`
            : undefined,
          transition: 'transform 0.1s ease-out',
        }}
      >
        <button
          type="button"
          className={clsx('nav-button-circle pointer-events-auto', isActive && 'nav-button-circle--active')}
          aria-label={`Open ${label.toLowerCase()}`}
          onClick={onClick ?? (() => onNavigate(sceneId))}
          style={{
            opacity: isVisible ? 1 : 0,
            // Only apply transform during pop-in animation, then let CSS handle hover
            transform: !isVisible ? 'scale(0)' : (hasCompletedInitialAnimation ? undefined : 'scale(1)'),
            transition: `opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${buttonDelay}ms, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${buttonDelay}ms`,
          }}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View {label.toLowerCase()}</span>
        </button>
      </span>
    </div>
  );
};

const MenuOverlay = ({
  onNavigate,
  skipDelay = false,
  isExiting = false,
  controlsStore,
  arrowControlsStore,
}: MenuOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const { isSmallLandscape } = useWindowWidth();
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

  // Responsive navigation controls organized in folders
  const layout = useControls({
    '🏠 Base.🖥️ Desktop/Landscape Nav': folder({
      'Desktop (1200px+)': folder({
        desktopTop: { value: 45, min: 0, max: 100, step: 1, label: 'Top (%)' },
        desktopRight: { value: 1.25, min: 0, max: 10, step: 0.25, label: 'Right (rem)' },
        desktopGap: { value: 1.25, min: 0, max: 3, step: 0.25, label: 'Gap (rem)' },
        desktopScale: { value: 1, min: 0.3, max: 1.5, step: 0.05, label: 'Scale' },
        desktopFontSize: { value: 3.6, min: 0.5, max: 10, step: 0.1, label: 'Text Size' },
      }, { collapsed: true }),
      'Small Landscape': folder({
        smallTop: { value: 30, min: 0, max: 100, step: 1, label: 'Top (%)' },
        smallRight: { value: 0.75, min: 0, max: 10, step: 0.25, label: 'Right (rem)' },
        smallGap: { value: 0.25, min: 0, max: 3, step: 0.25, label: 'Gap (rem)' },
        smallScale: { value: 0.7, min: 0.3, max: 1.5, step: 0.05, label: 'Scale' },
        smallFontSize: { value: 1.2, min: 0.5, max: 10, step: 0.1, label: 'Text Size' },
      }, { collapsed: true }),
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Select which position config to use based on screen width
  const navPos = isSmallLandscape
    ? { top: layout.smallTop, right: layout.smallRight, gap: layout.smallGap, scale: layout.smallScale, fontSize: layout.smallFontSize }
    : { top: layout.desktopTop, right: layout.desktopRight, gap: layout.desktopGap, scale: layout.desktopScale, fontSize: layout.desktopFontSize };

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
    }, ANIMATION_TIMING.MENU_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey, skipDelay, isExiting]);

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
        />
      </div>

      {/* ============================================
          DESKTOP NAVIGATION
          ============================================ */}
      <div className="nav-exit-desktop">
        <div
          className="desktop-nav-only"
          style={{
            top: `${navPos.top}%`,
            right: `${navPos.right}rem`,
            gap: `${navPos.gap}rem`,
            transform: `scale(${navPos.scale})`,
            transformOrigin: 'top right',
          }}
        >
          {navItems.map((item) => (
            <BlueprintButton
              key={item.id}
              label={item.label}
              sceneId={item.id as SceneId}
              isVisible={isVisible}
              delay={item.delay}
              arrowType={item.arrowType as keyof typeof ArrowComponents}
              currentFont={currentFont}
              fontSize={navPos.fontSize}
              onNavigate={onNavigate}
              onClick={item.id === 'contact' ? toggleContactOverlay : undefined}
              isActive={item.id === 'contact' && isContactOverlayOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuOverlay;
