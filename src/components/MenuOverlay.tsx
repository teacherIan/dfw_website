import { useEffect, useState } from "react";

// Navigation items configuration - easily extendable
const navItems = [
  { id: "gallery", label: "Gallery", delay: 0, arrowType: "loop" },
  { id: "ethos", label: "Ethos", delay: 150, arrowType: "spiral" },
  { id: "contact", label: "Contact", delay: 300, arrowType: "wave" },
];

// Different arrow designs for each button
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
           C 54 20, 60 25, 68 25"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="3 4"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <path
        d="M62 21 L72 25 L62 29"
        stroke="white"
        strokeWidth="1.2"
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
           C 58 22, 64 24, 70 25"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <path
        d="M64 21 L74 25 L64 29"
        stroke="white"
        strokeWidth="1.2"
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
           C 45 15, 55 35, 68 25"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 3"
        opacity="0.95"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      />
      <path
        d="M62 21 L72 25 L62 29"
        stroke="white"
        strokeWidth="1.2"
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
  arrowType
}: { 
  label: string; 
  isVisible: boolean; 
  delay: number;
  arrowType: keyof typeof ArrowDesigns;
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
        className="nav-label hidden md:block font-cursive text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white/95"
        style={{
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

  useEffect(() => {
    // Animate in after the main content has loaded
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 14000); // Slightly after the text overlay appears
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
      {/* Mobile: Labels and arrows below title, flowing to buttons */}
      <div className="md:hidden absolute bottom-6 left-0 right-0 flex justify-center items-start px-4">
        <svg 
          viewBox="0 0 360 90" 
          className="w-full max-w-sm h-auto"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: `opacity 0.8s ease ${150}ms`,
          }}
        >
          {/* Gallery - left side with looping playful arrow */}
          <text 
            x="80" 
            y="15" 
            className="font-cursive text-[22px]"
            textAnchor="middle"
            fill="white"
            stroke="rgba(0, 0, 0, 0.7)"
            strokeWidth="1"
            paintOrder="stroke fill"
            filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
          >
            Gallery
          </text>
          {/* Playful looping arrow from Gallery to left button */}
          <path
            d="M 80 20 
               C 85 28, 95 32, 100 38
               C 105 44, 98 50, 90 50
               C 82 50, 78 44, 82 38
               C 86 32, 98 32, 105 38
               C 110 44, 108 50, 105 54
               L 105 68"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="4 3"
            opacity="0.95"
            filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
            strokeLinecap="round"
          />
          <path d="M 101 62 L 105 68 L 109 62" stroke="white" strokeWidth="1.3" fill="none" opacity="0.95" filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))" strokeLinecap="round" />

          {/* Ethos - center with spiral arrow */}
          <text 
            x="180" 
            y="12" 
            className="font-cursive text-[22px]"
            textAnchor="middle"
            fill="white"
            stroke="rgba(0, 0, 0, 0.7)"
            strokeWidth="1"
            paintOrder="stroke fill"
            filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
          >
            Ethos
          </text>
          {/* Spiral arrow from Ethos to center button */}
          <path
            d="M 180 17
               C 188 24, 196 30, 200 38
               C 204 46, 196 52, 188 52
               C 180 52, 176 45, 180 38
               C 184 32, 194 33, 196 40
               C 197 46, 192 50, 186 52
               L 180 68"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="3 4"
            opacity="0.95"
            filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
            strokeLinecap="round"
          />
          <path d="M 176 62 L 180 68 L 184 62" stroke="white" strokeWidth="1.3" fill="none" opacity="0.95" filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))" strokeLinecap="round" />

          {/* Contact - right side with wavy arrow */}
          <text 
            x="280" 
            y="15" 
            className="font-cursive text-[22px]"
            textAnchor="middle"
            fill="white"
            stroke="rgba(0, 0, 0, 0.7)"
            strokeWidth="1"
            paintOrder="stroke fill"
            filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
          >
            Contact
          </text>
          {/* Wavy arrow from Contact to right button */}
          <path
            d="M 280 20
               C 270 26, 260 32, 255 38
               C 250 44, 260 50, 268 50
               C 275 50, 273 44, 268 40
               C 263 36, 258 38, 258 44
               C 258 50, 262 54, 260 58
               L 255 68"
            stroke="white"
            strokeWidth="1.2"
            fill="none"
            strokeDasharray="5 3"
            opacity="0.95"
            filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
            strokeLinecap="round"
          />
          <path d="M 251 62 L 255 68 L 259 62" stroke="white" strokeWidth="1.3" fill="none" opacity="0.95" filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))" strokeLinecap="round" />
        </svg>
      </div>

      {/* Buttons - horizontal on mobile, vertical on desktop */}
      <div className="gallery-nav absolute bottom-2 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:bottom-20 md:translate-x-0 flex flex-row md:flex-col items-center md:items-end gap-8 md:gap-4">
        {navItems.map((item) => (
          <BlueprintButton
            key={item.id}
            label={item.label}
            isVisible={isVisible}
            delay={item.delay}
            arrowType={item.arrowType as keyof typeof ArrowDesigns}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuOverlay;
