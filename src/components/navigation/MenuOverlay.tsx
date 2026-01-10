import { useEffect, useState } from 'react';
import { useControls } from 'leva';
import clsx from 'clsx';
import MobileNavLayout from './MobileNavLayout';
import { LoopArrow, SpiralArrow, WaveArrow } from './DesktopArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import { ANIMATION_TIMING, navItems, fontOptions, fontFamilyMap } from '../../constants';
import type { ArrowType } from '../../constants';

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
}: {
  label: string;
  isVisible: boolean;
  delay: number;
  arrowType: keyof typeof ArrowComponents;
  currentFont: string;
}) => {
  const ArrowComponent = ArrowComponents[arrowType];
  
  return (
    <div
      className="nav-item flex items-center gap-3"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
    >
      {/* Label - desktop only */}
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
        }}
      >
        {label}
      </span>

      {/* Unique arrow for each button - desktop only */}
      <span className={clsx('desktop-arrow-only', 'hidden xl:block', 'relative z-10')}>
        <ArrowComponent />
      </span>

      {/* Circular Blueprint Button */}
      <button
        type="button"
        className="nav-button-circle pointer-events-auto"
        aria-label={`Open ${label.toLowerCase()}`}
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

  const { menuFont } = useControls('🎨 Menu Style', {
    menuFont: {
      value: 'Caveat',
      options: [...fontOptions],
      label: 'Font Family',
    },
  }, { collapsed: true });

  const currentFont = fontFamilyMap[menuFont];

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
      <div className="desktop-nav-only">
        {navItems.map((item) => (
          <BlueprintButton
            key={item.id}
            label={item.label}
            isVisible={isVisible}
            delay={item.delay}
            arrowType={item.arrowType as keyof typeof ArrowComponents}
            currentFont={currentFont}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuOverlay;
