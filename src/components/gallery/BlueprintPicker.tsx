import { useMemo, useState, useEffect, useRef } from 'react';
import { useControls } from 'leva';
import { getCategoriesWithPreview } from '../../utils/gallery';
import BlueprintButtonSVG from '../navigation/BlueprintButtonSVG';
import { WaveArrow } from '../navigation/DesktopArrows';
import { fontFamilyMap, BLUEPRINT_PICKER_TIMING } from '../../constants';

// Default positions and settings for category images (desktop - 2x2 grid)
const CATEGORY_DEFAULTS_DESKTOP = {
  chairs: { x: 25, y: 30, size: 22, rotation: -3 },
  large_tables: { x: 75, y: 30, size: 22, rotation: 2 },
  small_tables: { x: 25, y: 70, size: 22, rotation: 1 },
  structures: { x: 75, y: 70, size: 22, rotation: -2 },
} as const;

// Mobile positions - staggered vertical layout with larger images
// Starts on right side to avoid exit button overlap
const CATEGORY_DEFAULTS_MOBILE = {
  chairs: { x: 72, y: 20, size: 32, rotation: 2 },
  large_tables: { x: 28, y: 38, size: 32, rotation: -3 },
  small_tables: { x: 72, y: 58, size: 32, rotation: -2 },
  structures: { x: 28, y: 78, size: 32, rotation: 1 },
} as const;

// Use mobile defaults on narrow screens
const MOBILE_BREAKPOINT = 768;

// Generate Leva control schema for category position
const createCategoryControlSchema = (defaults: typeof CATEGORY_DEFAULTS_DESKTOP.chairs) => ({
  x: { value: defaults.x, min: 5, max: 95, step: 1, label: 'X Position' },
  y: { value: defaults.y, min: 5, max: 95, step: 1, label: 'Y Position' },
  size: { value: defaults.size, min: 10, max: 40, step: 1, label: 'Size' },
  rotation: { value: defaults.rotation, min: -15, max: 15, step: 0.5, label: 'Rotation' },
});

interface CategoryImageProps {
  label: string;
  imageSrc: string;
  position: { x: number; y: number };
  size: number;
  rotation: number;
  onClick?: () => void;
  isVisible?: boolean;
  index?: number;
}

const CategoryImage = ({
  label,
  imageSrc,
  position,
  size,
  rotation,
  onClick,
  isVisible = true,
  index = 0,
}: CategoryImageProps) => {
  return (
    <div
      className={`blueprint-image ${isVisible ? 'blueprint-image--visible' : ''}`}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        width: `${size}%`,
        maxWidth: '300px',
        transitionDelay: `${index * 150}ms`,
      }}
    >
      {/* Image frame with blueprint styling */}
      <div className="blueprint-image__frame">
        <img
          src={imageSrc}
          alt={label}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            filter: 'grayscale(30%) contrast(1.1)',
            opacity: 0.9,
          }}
        />
        {/* Corner marks */}
        <div className="blueprint-image__corner blueprint-image__corner--tl" />
        <div className="blueprint-image__corner blueprint-image__corner--tr" />
        <div className="blueprint-image__corner blueprint-image__corner--bl" />
        <div className="blueprint-image__corner blueprint-image__corner--br" />
      </div>

      {/* Label below image */}
      <div
        className="blueprint-image__label"
        style={{ fontFamily: fontFamilyMap['Caveat'] }}
      >
        {label}
      </div>
    </div>
  );
};

interface BlueprintPickerProps {
  onSelectCategory?: (category: string) => void;
  onBack?: () => void;
  wallReady?: boolean;
}

export const BlueprintPicker = ({ onSelectCategory, onBack, wallReady = true }: BlueprintPickerProps) => {
  const categories = useMemo(() => getCategoriesWithPreview(), []);
  const [isRolledOut, setIsRolledOut] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isRollingUp, setIsRollingUp] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Use ref to track if we've been ready (doesn't cause re-renders)
  const hasBeenReadyRef = useRef(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Trigger roll-out animation when wall is ready
  useEffect(() => {
    console.log('[BlueprintPicker] wallReady:', wallReady, 'hasBeenReady:', hasBeenReadyRef.current);
    if (!wallReady) {
      // Only trigger exit animation if we were previously ready
      // This prevents exit animation on initial mount
      if (hasBeenReadyRef.current) {
        setShowContent(false);
        setIsRollingUp(true);
      }
      return;
    }

    // Wall is now ready - mark it and start entrance animation
    hasBeenReadyRef.current = true;

    // Small delay before starting roll animation (wall just finished forming)
    const rollTimer = setTimeout(() => setIsRolledOut(true), BLUEPRINT_PICKER_TIMING.ROLL_DELAY);
    // Show content after roll completes
    const contentTimer = setTimeout(() => setShowContent(true), BLUEPRINT_PICKER_TIMING.CONTENT_DELAY);
    return () => {
      clearTimeout(rollTimer);
      clearTimeout(contentTimer);
    };
  }, [wallReady]);

  // Handle back with roll-up animation
  const handleBack = () => {
    setIsRollingUp(true);
    setShowContent(false);
    // Wait for roll-up animation before triggering actual navigation
    setTimeout(() => {
      onBack?.();
    }, 800);
  };

  // Leva controls for each category image position (hidden in production, uses desktop defaults)
  const { hideImages } = useControls('Gallery Settings', { hideImages: { value: false, label: 'Hide Images (for screenshot)' } }, { hidden: !import.meta.env.DEV });
  const chairsControls = useControls('Chairs', createCategoryControlSchema(CATEGORY_DEFAULTS_DESKTOP.chairs), { hidden: !import.meta.env.DEV });
  const largeTablesControls = useControls('Large Tables', createCategoryControlSchema(CATEGORY_DEFAULTS_DESKTOP.large_tables), { hidden: !import.meta.env.DEV });
  const smallTablesControls = useControls('Small Tables', createCategoryControlSchema(CATEGORY_DEFAULTS_DESKTOP.small_tables), { hidden: !import.meta.env.DEV });
  const structuresControls = useControls('Structures', createCategoryControlSchema(CATEGORY_DEFAULTS_DESKTOP.structures), { hidden: !import.meta.env.DEV });

  // Select defaults based on screen size
  const defaults = isMobile ? CATEGORY_DEFAULTS_MOBILE : CATEGORY_DEFAULTS_DESKTOP;

  // Map controls to categories - use Leva controls in dev (desktop only), otherwise use responsive defaults
  const isDev = import.meta.env.DEV;
  const categoryControls: Record<string, { position: { x: number; y: number }; size: number; rotation: number }> = {
    chairs: isDev && !isMobile
      ? { position: { x: chairsControls.x, y: chairsControls.y }, size: chairsControls.size, rotation: chairsControls.rotation }
      : { position: { x: defaults.chairs.x, y: defaults.chairs.y }, size: defaults.chairs.size, rotation: defaults.chairs.rotation },
    large_tables: isDev && !isMobile
      ? { position: { x: largeTablesControls.x, y: largeTablesControls.y }, size: largeTablesControls.size, rotation: largeTablesControls.rotation }
      : { position: { x: defaults.large_tables.x, y: defaults.large_tables.y }, size: defaults.large_tables.size, rotation: defaults.large_tables.rotation },
    small_tables: isDev && !isMobile
      ? { position: { x: smallTablesControls.x, y: smallTablesControls.y }, size: smallTablesControls.size, rotation: smallTablesControls.rotation }
      : { position: { x: defaults.small_tables.x, y: defaults.small_tables.y }, size: defaults.small_tables.size, rotation: defaults.small_tables.rotation },
    structures: isDev && !isMobile
      ? { position: { x: structuresControls.x, y: structuresControls.y }, size: structuresControls.size, rotation: structuresControls.rotation }
      : { position: { x: defaults.structures.x, y: defaults.structures.y }, size: defaults.structures.size, rotation: defaults.structures.rotation },
  };

  return (
    <div className="blueprint-picker">
      {/* Blueprint paper background */}
      <div className={`blueprint-picker__paper ${isRolledOut ? 'blueprint-picker__paper--rolled-out' : ''} ${isRollingUp ? 'blueprint-picker__paper--rolling-up' : ''}`}>
        {/* Grid pattern overlay */}
        <div className="blueprint-picker__grid" />

        {/* Major grid lines */}
        <div className="blueprint-picker__major-grid" />

        {/* Compass rose / North arrow */}
        <div className={`blueprint-picker__compass ${showContent ? 'blueprint-picker__content--visible' : ''}`}>
          <svg viewBox="0 0 40 40" width="60" height="60">
            <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <circle cx="20" cy="20" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M20 4 L23 16 L20 14 L17 16 Z" fill="rgba(255,255,255,0.5)" />
            <path d="M20 36 L23 24 L20 26 L17 24 Z" fill="rgba(255,255,255,0.25)" />
            <text x="20" y="8" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="6" fontFamily="monospace">N</text>
          </svg>
        </div>

        {/* Dimension lines on edges */}
        <div className="blueprint-picker__dimension blueprint-picker__dimension--top">
          <svg width="100%" height="20" preserveAspectRatio="none">
            <line x1="5%" y1="15" x2="95%" y2="15" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="5%" y1="10" x2="5%" y2="20" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="95%" y1="10" x2="95%" y2="20" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="50%" y1="12" x2="50%" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </svg>
        </div>

        <div className="blueprint-picker__dimension blueprint-picker__dimension--left">
          <svg width="20" height="100%" preserveAspectRatio="none">
            <line x1="15" y1="5%" x2="15" y2="95%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="10" y1="5%" x2="20" y2="5%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
            <line x1="10" y1="95%" x2="20" y2="95%" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          </svg>
        </div>

        {/* Category images */}
        {!hideImages && categories.map((cat, index) => {
          const controls = categoryControls[cat.category];
          if (!controls) return null;

          return (
            <CategoryImage
              key={cat.category}
              label={cat.label}
              imageSrc={cat.preview.src}
              position={controls.position}
              size={controls.size}
              rotation={controls.rotation}
              onClick={() => onSelectCategory?.(cat.category)}
              isVisible={showContent}
              index={index}
            />
          );
        })}

        {/* Center crosshair */}
        <div className="blueprint-picker__crosshair">
          <svg viewBox="0 0 40 40" width="40" height="40">
            <circle cx="20" cy="20" r="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="20" y1="5" x2="20" y2="15" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="20" y1="25" x2="20" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="5" y1="20" x2="15" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <line x1="25" y1="20" x2="35" y2="20" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          </svg>
        </div>

        {/* Paper edge / fold marks */}
        <div className="blueprint-picker__fold-mark blueprint-picker__fold-mark--top" />
        <div className="blueprint-picker__fold-mark blueprint-picker__fold-mark--bottom" />

        {/* Exit button with arrow and label - button on left, arrow and text on right */}
        <div
          className={`blueprint-picker__exit ${showContent ? 'blueprint-picker__content--visible' : ''}`}
          style={{ transitionDelay: '600ms' }}
        >
          {/* Blueprint button */}
          <button
            type="button"
            className="nav-button-circle blueprint-picker__exit-button"
            aria-label="Exit gallery"
            onClick={handleBack}
          >
            <BlueprintButtonSVG />
          </button>

          {/* Animated arrow pointing toward button (reversed) */}
          <span className="blueprint-picker__exit-arrow">
            <WaveArrow isVisible={showContent} delay={800} />
          </span>

          {/* Exit label */}
          <span
            className="blueprint-picker__exit-label"
            style={{ fontFamily: fontFamilyMap['Caveat'] }}
          >
            Exit
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlueprintPicker;
