import { useEffect, useState } from "react";
import { ANIMATION_TIMING } from "./Scene";
import { useControls } from "leva";
import MobileNavLayout from "./MobileNavLayout";
import { LoopArrow, SpiralArrow, WaveArrow } from "./DesktopArrows";

// Navigation items configuration - easily extendable
const navItems = [
  { id: "gallery", label: "Gallery", delay: 0, arrowType: "loop" },
  { id: "ethos", label: "Ethos", delay: 150, arrowType: "spiral" },
  { id: "contact", label: "Contact", delay: 300, arrowType: "wave" },
];

// Arrow component mapping for desktop navigation
const ArrowComponents = {
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
  currentFont
}: { 
  label: string; 
  isVisible: boolean; 
  delay: number;
  arrowType: keyof typeof ArrowComponents;
  currentFont: string;
}) => {
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
        className="nav-label desktop-label-only hidden xl:block text-3xl sm:text-4xl xl:text-5xl 2xl:text-6xl text-white/95"
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
      <span className="desktop-arrow-only hidden xl:block relative z-10">
        {(() => {
          const ArrowComponent = ArrowComponents[arrowType];
          return <ArrowComponent />;
        })()}
      </span>

      {/* Circular Blueprint Button */}
      <button
        type="button"
        className="nav-button-circle pointer-events-auto"
        aria-label={`Open ${label.toLowerCase()}`}
      >
        {/* Blueprint grid pattern */}
        <span className="nav-circle__grid" aria-hidden="true" />
        
        {/* Outer ring */}
        <svg className="nav-circle__ring" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="46" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeDasharray="4 3"
            fill="none" 
            opacity="0.6" 
          />
          <circle 
            cx="50" cy="50" r="40" 
            stroke="currentColor" 
            strokeWidth="1" 
            fill="none" 
            opacity="0.4" 
          />
        </svg>

        {/* Center crosshair */}
        <svg className="nav-circle__crosshair" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="6" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
          <line x1="50" y1="28" x2="50" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="50" y1="58" x2="50" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="28" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="58" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
        </svg>

        {/* Compass arc marks */}
        <svg className="nav-circle__arcs" viewBox="0 0 100 100">
          <path 
            d="M28 68 A28 28 0 0 1 36 36" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeDasharray="2 2"
            fill="none" 
            opacity="0.45" 
          />
          <path 
            d="M72 32 A28 28 0 0 1 64 64" 
            stroke="currentColor" 
            strokeWidth="1" 
            strokeDasharray="2 2"
            fill="none" 
            opacity="0.45" 
          />
        </svg>

        <span className="sr-only">View {label.toLowerCase()}</span>
      </button>
    </div>
  );
};

const MenuOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Leva controls for menu font selection
  const { menuFont } = useControls('Menu Style', {
    menuFont: {
      value: 'Caveat',
      options: [
        'Architects Daughter',
        'Caveat',
        'Patrick Hand',
        'Indie Flower',
        'Permanent Marker',
        'Shadows Into Light'
      ]
    }
  });

  // Mobile Layout Position Controls
  const mobilePositions = useControls('Mobile Layout', {
    // Button positions
    ethosButtonLeft: { value: 0, min: -100, max: 100, step: 1, label: 'Ethos Btn Left (%)' },
    ethosButtonBottom: { value: 26, min: 0, max: 100, step: 1, label: 'Ethos Btn Bottom (vh)' },
    contactButtonLeft: { value: 56, min: 0, max: 100, step: 1, label: 'Contact Btn Left (%)' },
    contactButtonBottom: { value: -0.8, min: -50, max: 100, step: 0.1, label: 'Contact Btn Bottom (vh)' },
    galleryButtonRight: { value: 0, min: -100, max: 100, step: 1, label: 'Gallery Btn Right (%)' },
    galleryButtonBottom: { value: 9, min: 0, max: 100, step: 1, label: 'Gallery Btn Bottom (vh)' },
    // Label positions
    ethosLabelLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Label Left (%)' },
    ethosLabelBottom: { value: 7, min: 0, max: 100, step: 1, label: 'Ethos Label Bottom (vh)' },
    contactLabelLeft: { value: 45, min: 0, max: 100, step: 1, label: 'Contact Label Left (%)' },
    contactLabelBottom: { value: 12, min: 0, max: 100, step: 1, label: 'Contact Label Bottom (vh)' },
    galleryLabelRight: { value: 10, min: 0, max: 100, step: 1, label: 'Gallery Label Right (%)' },
    galleryLabelBottom: { value: 2, min: 0, max: 100, step: 1, label: 'Gallery Label Bottom (vh)' },
  });

  // Map font names to CSS font families
  const fontFamilyMap: Record<string, string> = {
    'Architects Daughter': '"Architects Daughter", cursive',
    'Caveat': '"Caveat", cursive',
    'Patrick Hand': '"Patrick Hand", cursive',
    'Indie Flower': '"Indie Flower", cursive',
    'Permanent Marker': '"Permanent Marker", cursive',
    'Shadows Into Light': '"Shadows Into Light", cursive'
  };

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
      setAnimationKey(prev => prev + 1);
    };
    window.addEventListener('resetAnimation', handleReset);
    return () => window.removeEventListener('resetAnimation', handleReset);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* ============================================
          MOBILE NAVIGATION
          ============================================ */}
      <MobileNavLayout 
        positions={mobilePositions}
        font={currentFont}
        isVisible={isVisible}
      />

      {/* ============================================
          DESKTOP NAVIGATION
          ============================================ */}
      {/* Desktop: Buttons with labels and arrows - positioned on right side */}
      <div className="gallery-nav desktop-nav-only hidden xl:flex absolute xl:left-auto xl:right-4 xl:top-[60%] xl:-translate-y-1/2 flex-col items-end gap-4">
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
