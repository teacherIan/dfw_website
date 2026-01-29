import { useEffect, useState } from 'react';
import { useControls, folder } from 'leva';
import clsx from 'clsx';
import MobileNavLayout from './MobileNavLayout';
import { LoopArrow, SpiralArrow, WaveArrow } from './DesktopArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import { ANIMATION_TIMING, navItems, fontOptions, fontFamilyMap } from '../../constants';
import type { ArrowType } from '../../constants';
import { useWindowWidth } from '../../hooks';

// Arrow component mapping for desktop navigation
const ArrowComponents: Record<ArrowType, typeof LoopArrow> = {
  loop: LoopArrow,
  spiral: SpiralArrow,
  wave: WaveArrow,
};

// Small circular blueprint button component
const BlueprintButton = ({
  label,
  isVisible,
  delay,
  arrowType,
  currentFont,
  fontSize = 1,
}: {
  label: string;
  isVisible: boolean;
  delay: number;
  arrowType: keyof typeof ArrowComponents;
  currentFont: string;
  fontSize?: number;
}) => {
  const ArrowComponent = ArrowComponents[arrowType];

  // Stagger delays for mixed animation style
  const labelDelay = delay;
  const arrowDelay = delay + 150;
  const buttonDelay = delay;

  return (
    <div className="nav-item flex items-center gap-3">
      {/* Label - desktop only - fade + slide animation */}
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
          transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
          transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${labelDelay}ms, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${labelDelay}ms`,
        }}
      >
        {label}
      </span>

      {/* Unique arrow for each button - desktop only - draw-in animation */}
      <span className={clsx('desktop-arrow-only', 'hidden xl:block', 'relative z-10')}>
        <ArrowComponent isVisible={isVisible} delay={arrowDelay} />
      </span>

      {/* Circular Blueprint Button - pop-in animation */}
      <button
        type="button"
        className="nav-button-circle pointer-events-auto"
        aria-label={`Open ${label.toLowerCase()}`}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0)',
          transition: `opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${buttonDelay}ms, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${buttonDelay}ms`,
        }}
      >
        <BlueprintButtonSVG />
        <span className="sr-only">View {label.toLowerCase()}</span>
      </button>
    </div>
  );
};

const MenuOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const { isSmallLandscape } = useWindowWidth();

  const { menuFont } = useControls('🎨 Menu Style', {
    menuFont: {
      value: 'Caveat',
      options: [...fontOptions],
      label: 'Font Family',
    },
  }, { collapsed: true });

  const currentFont = fontFamilyMap[menuFont];

  // Responsive navigation controls organized in folders
  const layout = useControls('🖥️ Desktop/Landscape Nav', {
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
  }, { collapsed: true });

  // Select which position config to use based on screen width
  const navPos = isSmallLandscape
    ? { top: layout.smallTop, right: layout.smallRight, gap: layout.smallGap, scale: layout.smallScale, fontSize: layout.smallFontSize }
    : { top: layout.desktopTop, right: layout.desktopRight, gap: layout.desktopGap, scale: layout.desktopScale, fontSize: layout.desktopFontSize };

  useEffect(() => {
    // Animate in after the main content has loaded
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, ANIMATION_TIMING.MENU_APPEAR);
    return () => clearTimeout(timer);
  }, [animationKey]);

  useEffect(() => {
    const handleReset = () => {
      setIsVisible(false);
      setAnimationKey((prev) => prev + 1);
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* ============================================
          MOBILE NAVIGATION
          ============================================ */}
      <MobileNavLayout font={currentFont} isVisible={isVisible} />

      {/* ============================================
          DESKTOP NAVIGATION
          ============================================ */}
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
            isVisible={isVisible}
            delay={item.delay}
            arrowType={item.arrowType as keyof typeof ArrowComponents}
            currentFont={currentFont}
            fontSize={navPos.fontSize}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuOverlay;
