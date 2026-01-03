import { useEffect, useState } from "react";
import { ANIMATION_TIMING } from "./Scene";
import { useControls } from "leva";

// Navigation items configuration - easily extendable
const navItems = [
  { id: "gallery", label: "Gallery", delay: 0, arrowType: "loop" },
  { id: "ethos", label: "Ethos", delay: 150, arrowType: "spiral" },
  { id: "contact", label: "Contact", delay: 300, arrowType: "wave" },
];

// Different arrow designs for each button
// All arrows have a straight "approach" segment before the arrowhead for cleaner look
const ArrowDesigns = {
  // Playful looping arrow for Gallery
  loop: (
    <svg
      className="nav-arrow"
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 25
           C 10 25, 14 15, 20 12
           C 26 9, 30 18, 27 24
           C 24 30, 18 27, 21 21
           C 24 15, 34 12, 44 16
           C 54 20, 60 25, 66 25"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <path
        d="M66 25 L72 25 L68 21 M72 25 L68 29"
        stroke="white"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
    </svg>
  ),
  // Spiral arrow for Ethos
  spiral: (
    <svg
      className="nav-arrow"
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 25
           C 12 35, 22 38, 30 32
           C 38 26, 35 18, 28 18
           C 21 18, 20 25, 26 28
           C 32 31, 42 28, 50 25
           C 58 22, 64 24, 68 25"
        stroke="white"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <path
        d="M68 25 L74 25 L70 21 M74 25 L70 29"
        stroke="white"
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
    </svg>
  ),
  // Wavy arrow for Contact
  wave: (
    <svg
      className="nav-arrow"
      viewBox="0 0 80 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 25
           C 15 15, 25 35, 35 25
           C 45 15, 55 35, 66 25"
        stroke="white"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 3"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <path
        d="M66 25 L72 25 L68 21 M72 25 L68 29"
        stroke="white"
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
    </svg>
  ),
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
  arrowType: keyof typeof ArrowDesigns;
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
        className="nav-label hidden md:block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white/95"
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
      <span className="hidden md:block">
        {ArrowDesigns[arrowType]}
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
      value: 'Architects Daughter',
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
      {/* Mobile: Woodworker marks layout - Gallery on LEFT edge, Contact on RIGHT edge, Ethos at BOTTOM center */}
      <div className="md:hidden">
        {/* GALLERY - Left side, half off the left edge */}
        <div
          className="absolute left-0 bottom-[18vh] flex items-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms`,
          }}
        >
          {/* Button - half off left edge */}
          <button
            type="button"
            className="nav-button-circle nav-button-circle--mobile-large nav-button-circle--left-edge pointer-events-auto"
            aria-label="Open gallery"
          >
            <span className="nav-circle__grid" aria-hidden="true" />
            <svg className="nav-circle__ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.6" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
            </svg>
            <svg className="nav-circle__crosshair" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="6" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
              <line x1="50" y1="28" x2="50" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="50" y1="58" x2="50" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="28" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="58" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            <svg className="nav-circle__arcs" viewBox="0 0 100 100">
              <path d="M28 68 A28 28 0 0 1 36 36" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.45" />
              <path d="M72 32 A28 28 0 0 1 64 64" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.45" />
            </svg>
            <span className="sr-only">View gallery</span>
          </button>
          
          {/* Large decorative arrow curving from label to button */}
          <svg viewBox="0 0 80 60" className="w-20 h-14 -ml-2" fill="none">
            {/* Ornate looping path like a woodworker's flourish */}
            <path
              d="M75 8 C 65 8, 55 5, 45 12 C 35 19, 40 32, 30 35 C 20 38, 15 30, 20 25 C 25 20, 35 25, 28 35 C 21 45, 8 42, 5 50"
              stroke="white"
              strokeWidth="1.8"
              strokeDasharray="5 4"
              opacity="0.95"
              filter="drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8))"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path d="M2 44 L5 52 L12 48" stroke="white" strokeWidth="2" fill="none" opacity="0.95" filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          {/* Label */}
          <span
            className="text-4xl text-white/95"
            style={{
              fontFamily: currentFont,
              textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
              WebkitTextStroke: '1.2px rgba(0, 0, 0, 0.85)',
              paintOrder: 'stroke fill',
            }}
          >
            Gallery
          </span>
        </div>

        {/* CONTACT - Right side, half off the right edge */}
        <div
          className="absolute right-0 bottom-[18vh] flex items-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms`,
          }}
        >
          {/* Label */}
          <span
            className="text-4xl text-white/95"
            style={{
              fontFamily: currentFont,
              textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
              WebkitTextStroke: '1.2px rgba(0, 0, 0, 0.85)',
              paintOrder: 'stroke fill',
            }}
          >
            Contact
          </span>
          
          {/* Large decorative arrow curving from label to button */}
          <svg viewBox="0 0 80 60" className="w-20 h-14 -mr-2" fill="none">
            {/* Ornate wavy path like a woodworker's flourish */}
            <path
              d="M5 8 C 15 8, 25 5, 35 12 C 45 19, 40 32, 50 35 C 60 38, 65 30, 60 25 C 55 20, 45 25, 52 35 C 59 45, 72 42, 75 50"
              stroke="white"
              strokeWidth="1.8"
              strokeDasharray="5 4"
              opacity="0.95"
              filter="drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8))"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path d="M68 48 L75 52 L78 44" stroke="white" strokeWidth="2" fill="none" opacity="0.95" filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          {/* Button - half off right edge */}
          <button
            type="button"
            className="nav-button-circle nav-button-circle--mobile-large nav-button-circle--right-edge pointer-events-auto"
            aria-label="Open contact"
          >
            <span className="nav-circle__grid" aria-hidden="true" />
            <svg className="nav-circle__ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.6" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
            </svg>
            <svg className="nav-circle__crosshair" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="6" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
              <line x1="50" y1="28" x2="50" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="50" y1="58" x2="50" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="28" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="58" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            <svg className="nav-circle__arcs" viewBox="0 0 100 100">
              <path d="M28 68 A28 28 0 0 1 36 36" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.45" />
              <path d="M72 32 A28 28 0 0 1 64 64" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.45" />
            </svg>
            <span className="sr-only">View contact</span>
          </button>
        </div>

        {/* ETHOS - Bottom center, half off the bottom edge */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(30px)',
            transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms`,
          }}
        >
          {/* Label */}
          <span
            className="text-4xl text-white/95 mb-1"
            style={{
              fontFamily: currentFont,
              textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
              WebkitTextStroke: '1.2px rgba(0, 0, 0, 0.85)',
              paintOrder: 'stroke fill',
            }}
          >
            Ethos
          </span>
          
          {/* Decorative spiral arrow pointing down */}
          <svg viewBox="0 0 50 45" className="w-12 h-10 -mb-1" fill="none">
            {/* Spiral flourish going down */}
            <path
              d="M25 2 C 18 5, 12 8, 15 15 C 18 22, 28 18, 30 12 C 32 6, 22 8, 20 16 C 18 24, 25 28, 25 38"
              stroke="white"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              opacity="0.95"
              filter="drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8))"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead */}
            <path d="M20 34 L25 42 L30 34" stroke="white" strokeWidth="2" fill="none" opacity="0.95" filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          {/* Button - half off bottom edge */}
          <button
            type="button"
            className="nav-button-circle nav-button-circle--mobile-large nav-button-circle--bottom-edge pointer-events-auto"
            aria-label="Open ethos"
          >
            <span className="nav-circle__grid" aria-hidden="true" />
            <svg className="nav-circle__ring" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" fill="none" opacity="0.6" />
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
            </svg>
            <svg className="nav-circle__crosshair" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="6" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.6" />
              <line x1="50" y1="28" x2="50" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="50" y1="58" x2="50" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="28" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
              <line x1="58" y1="50" x2="72" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            </svg>
            <svg className="nav-circle__arcs" viewBox="0 0 100 100">
              <path d="M28 68 A28 28 0 0 1 36 36" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.45" />
              <path d="M72 32 A28 28 0 0 1 64 64" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" fill="none" opacity="0.45" />
            </svg>
            <span className="sr-only">View ethos</span>
          </button>
        </div>
      </div>

      {/* Desktop: Buttons with labels and arrows */}
      <div className="gallery-nav hidden md:flex absolute md:left-auto md:right-4 md:bottom-20 md:translate-x-0 flex-col items-end gap-4">
        {navItems.map((item) => (
          <BlueprintButton
            key={item.id}
            label={item.label}
            isVisible={isVisible}
            delay={item.delay}
            arrowType={item.arrowType as keyof typeof ArrowDesigns}
            currentFont={currentFont}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuOverlay;
