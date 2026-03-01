import { memo, useLayoutEffect, useRef, useState, type MutableRefObject, type Ref } from 'react';
import { useControls, folder } from 'leva';
import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import NavLabel from './NavLabel';
import type { ArrowEffectsConfig } from './ArrowFilters';
import { createFadeSlideStyle, createPopInStyle, createPopInCenteredStyle } from '../../utils/styles';
import { MOBILE_NAV_DELAYS } from '../../constants/animation';
import type { SceneId } from '../../constants';
import { useArrowUnravel } from '../../hooks';
import { useAnimationStore, useIsContactOverlayOpen } from '../../stores/animationStore';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Breakpoint configuration for button positions, label positions, and button sizes
// Triangular layout: Ethos (bottom-left), Gallery (bottom-right), Contact (center-top apex)
// All positions use LEFT edge for consistency (galleryLeft: 92 = 8% from right edge)
// Buttons must be BELOW the "Doug's Found Wood" title
const BREAKPOINT_CONFIGS = {
  small: {
    name: 'Small (<400px)',
    buttons: { ethosLeft: 14, ethosBottom: 3, contactLeft: 45, contactBottom: 8, galleryLeft: 82, galleryBottom: 10 },
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
    sizes: { buttonSize: 70 },
  },
  mid: {
    name: 'Mid (400-699px)',
    buttons: { ethosLeft: 14, ethosBottom: 3, contactLeft: 45, contactBottom: 8, galleryLeft: 82, galleryBottom: 10 },
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
    sizes: { buttonSize: 70 },
  },
  tablet: {
    name: 'Tablet (700-999px)',
    buttons: { ethosLeft: 7, ethosBottom: 3, contactLeft: 44, contactBottom: 5, galleryLeft: 87, galleryBottom: 9 },
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
    sizes: { buttonSize: 100 },
  },
  ipadPro: {
    name: 'iPad Pro (1000-1199px)',
    buttons: { ethosLeft: 14, ethosBottom: 3, contactLeft: 45, contactBottom: 8, galleryLeft: 82, galleryBottom: 10 },
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
    sizes: { buttonSize: 110 },
  },
} as const;

type BreakpointKey = keyof typeof BREAKPOINT_CONFIGS;

// Position defaults type (all breakpoints have the same shape)
type PositionDefaults = {
  ethosLeft: number;
  ethosBottom: number;
  contactLeft: number;
  contactBottom: number;
  galleryLeft: number;
  galleryBottom: number;
};

// Generate Leva control schema for position controls
const createPositionControls = (defaults: PositionDefaults) => ({
  ethosLeft: { value: defaults.ethosLeft, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
  ethosBottom: { value: defaults.ethosBottom, min: -20, max: 100, step: 1, label: 'Ethos Bottom (svh)' },
  contactLeft: { value: defaults.contactLeft, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
  contactBottom: { value: defaults.contactBottom, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (svh)' },
  galleryLeft: { value: defaults.galleryLeft, min: 0, max: 150, step: 1, label: 'Gallery Left (%)' },
  galleryBottom: { value: defaults.galleryBottom, min: -20, max: 100, step: 1, label: 'Gallery Bottom (svh)' },
});

// Hook to get all position controls for a breakpoint
const useBreakpointControls = (
  breakpoint: BreakpointKey,
  type: 'buttons' | 'labels',
  mobileNavStore?: LevaStore
) => {
  const config = BREAKPOINT_CONFIGS[breakpoint];
  const prefix = type === 'buttons' ? '📍 Button Positions' : '🏷️ Label Positions';

  return useControls({
    [`${prefix}.${config.name}`]: folder(
      createPositionControls(config[type]),
      { collapsed: true }
    ),
  }, { store: mobileNavStore });
};

// Hook to get button size controls for a breakpoint
const useSizeControls = (
  breakpoint: BreakpointKey,
  mobileNavStore?: LevaStore
) => {
  const config = BREAKPOINT_CONFIGS[breakpoint];

  return useControls({
    [`📏 Button Sizes.${config.name}`]: folder({
      buttonSize: { value: config.sizes.buttonSize, min: 40, max: 200, step: 5, label: 'Size (px)' },
    }, { collapsed: true }),
  }, { store: mobileNavStore });
};

interface MobileNavLayoutProps {
  font: string;
  isVisible: boolean;
  onNavigate: (scene: SceneId) => void;
  controlsStore?: LevaStore;
  arrowControlsStore?: LevaStore;
  mobileNavStore?: LevaStore;
  arrowEffectsConfig?: ArrowEffectsConfig;
}

// Mobile button with spring rotation
interface MobileButtonProps {
  scene: SceneId;
  label: string;
  springRotation?: number;
  hasCompletedAnimation: boolean;
  className?: string;
  buttonRef?: Ref<HTMLButtonElement>;
  onNavigate: (scene: SceneId) => void;
  onClick?: () => void;
  isActive?: boolean;
  size?: number;
}

const MobileButton = ({
  scene,
  label,
  springRotation = 0,
  hasCompletedAnimation,
  className = '',
  buttonRef,
  onNavigate,
  onClick,
  isActive = false,
  size,
}: MobileButtonProps) => (
  <span
    style={{
      display: 'inline-block',
      transform: hasCompletedAnimation ? `rotate(${springRotation * 0.12}deg)` : undefined,
      transition: 'transform 0.1s ease-out',
    }}
  >
    <button
      type="button"
      className={`nav-button-circle nav-button-circle--mobile-large pointer-events-auto ${className} ${isActive ? 'nav-button-circle--active' : ''}`}
      aria-label={`Open ${label}`}
      onClick={onClick ?? (() => onNavigate(scene))}
      ref={buttonRef}
      style={size ? { width: `${size}px`, height: `${size}px` } : undefined}
    >
      <BlueprintButtonSVG />
      <span className="sr-only">View {label}</span>
    </button>
  </span>
);

// Mobile label with spring sway
interface MobileLabelProps {
  text: string;
  font: string;
  springOffset?: number;
  hasCompletedAnimation: boolean;
  labelRef?: Ref<HTMLSpanElement>;
}

const MobileLabel = ({
  text,
  font,
  springOffset = 0,
  hasCompletedAnimation,
  labelRef,
}: MobileLabelProps) => (
  <span
    ref={labelRef}
    style={{
      display: 'inline-block',
      transform: hasCompletedAnimation
        ? `translateX(${springOffset * 0.05}px) rotate(${springOffset * 0.04}deg)`
        : undefined,
      transition: 'transform 0.1s ease-out',
    }}
  >
    <NavLabel text={text} font={font} />
  </span>
);

const findVisibleElement = <T extends HTMLElement>(elements: Array<T | null>) => {
  for (const element of elements) {
    if (!element) {
      continue;
    }

    // Check if element has non-zero dimensions (most reliable for CSS-hidden elements)
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return element;
    }
  }

  return null;
};

const useVisibleElement = <T extends HTMLElement>(elementsRef: MutableRefObject<Array<T | null>>) => {
  // Counter to force re-renders on resize/orientation change
  const [, setCounter] = useState(0);

  useLayoutEffect(() => {
    const update = () => setCounter((c) => c + 1);

    // Force initial updates to catch late-mounting elements
    update();
    const frame = requestAnimationFrame(update);
    const timeout = setTimeout(update, 100);

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []); // Empty deps - only need to set up listeners once

  // Compute visible element on every render - more reliable than storing in state
  return findVisibleElement(elementsRef.current);
};

const MobileNavLayout = ({
  font,
  isVisible,
  onNavigate,
  arrowControlsStore,
  mobileNavStore,
  arrowEffectsConfig,
}: MobileNavLayoutProps) => {
  // Contact toggle state
  const toggleContactOverlay = useAnimationStore((state) => state.toggleContactOverlay);
  const isContactOverlayOpen = useIsContactOverlayOpen();

  // Arrow unravel hooks for spring-responsive animation
  const ethosUnravel = useArrowUnravel({
    isVisible,
    delay: MOBILE_NAV_DELAYS.ETHOS_ARROW,
  });
  const contactUnravel = useArrowUnravel({
    isVisible,
    delay: MOBILE_NAV_DELAYS.CONTACT_ARROW,
  });
  const galleryUnravel = useArrowUnravel({
    isVisible,
    delay: MOBILE_NAV_DELAYS.GALLERY_ARROW,
  });

  // Use state for container to trigger re-render when mounted
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const ethosButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const contactButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const galleryButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const ethosLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const contactLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const galleryLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const ethosButtonElement = useVisibleElement(ethosButtonRefs);
  const contactButtonElement = useVisibleElement(contactButtonRefs);
  const galleryButtonElement = useVisibleElement(galleryButtonRefs);
  const ethosLabelElement = useVisibleElement(ethosLabelRefs);
  const contactLabelElement = useVisibleElement(contactLabelRefs);
  const galleryLabelElement = useVisibleElement(galleryLabelRefs);

  // Button positions for each breakpoint
  const btnPositionsSmall = useBreakpointControls('small', 'buttons', mobileNavStore);
  const btnPositionsMid = useBreakpointControls('mid', 'buttons', mobileNavStore);
  const btnPositionsTablet = useBreakpointControls('tablet', 'buttons', mobileNavStore);
  const btnPositionsIpadPro = useBreakpointControls('ipadPro', 'buttons', mobileNavStore);

  // Label positions for each breakpoint
  const labelPositionsSmall = useBreakpointControls('small', 'labels', mobileNavStore);
  const labelPositionsMid = useBreakpointControls('mid', 'labels', mobileNavStore);
  const labelPositionsTablet = useBreakpointControls('tablet', 'labels', mobileNavStore);
  const labelPositionsIpadPro = useBreakpointControls('ipadPro', 'labels', mobileNavStore);

  // Button sizes for each breakpoint
  const sizeSmall = useSizeControls('small', mobileNavStore);
  const sizeMid = useSizeControls('mid', mobileNavStore);
  const sizeTablet = useSizeControls('tablet', mobileNavStore);
  const sizeIpadPro = useSizeControls('ipadPro', mobileNavStore);

  return (
    <div className="mobile-nav-only" ref={setContainerElement}>
      {/* ============================================
          ETHOS - Bottom Left Corner
          ============================================ */}

      {/* Ethos Button - Small (<400px) */}
      <div
        className="nav-mobile-ethos-btn hidden max-[399px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsSmall.ethosLeft}%`,
          bottom: `calc(${btnPositionsSmall.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="ethos"
          label="ethos"
          springRotation={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          className="-ml-14 md:-ml-[55px]"
          buttonRef={(element) => {
            ethosButtonRefs.current[0] = element;
          }}
          onNavigate={onNavigate}
          size={sizeSmall.buttonSize}
        />
      </div>

      {/* Ethos Button - Mid (400-699px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsMid.ethosLeft}%`,
          bottom: `calc(${btnPositionsMid.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="ethos"
          label="ethos"
          springRotation={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          className="-ml-14 md:-ml-[55px]"
          buttonRef={(element) => {
            ethosButtonRefs.current[1] = element;
          }}
          onNavigate={onNavigate}
          size={sizeMid.buttonSize}
        />
      </div>

      {/* Ethos Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsTablet.ethosLeft}%`,
          bottom: `calc(${btnPositionsTablet.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="ethos"
          label="ethos"
          springRotation={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          className="-ml-14 md:-ml-[55px]"
          buttonRef={(element) => {
            ethosButtonRefs.current[2] = element;
          }}
          onNavigate={onNavigate}
          size={sizeTablet.buttonSize}
        />
      </div>

      {/* Ethos Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsIpadPro.ethosLeft}%`,
          bottom: `calc(${btnPositionsIpadPro.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="ethos"
          label="ethos"
          springRotation={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          className="-ml-14 md:-ml-[55px]"
          buttonRef={(element) => {
            ethosButtonRefs.current[3] = element;
          }}
          onNavigate={onNavigate}
          size={sizeIpadPro.buttonSize}
        />
      </div>

      {/* Ethos Label - Small (<400px) */}
      <div
        className="nav-mobile-ethos-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsSmall.ethosLeft}%`,
          bottom: `calc(${labelPositionsSmall.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Ethos"
          font={font}
          springOffset={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            ethosLabelRefs.current[0] = element;
          }}
        />
      </div>

      {/* Ethos Label - Mid (400-699px) */}
      <div
        className="nav-mobile-ethos-label hidden min-[400px]:max-[699px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsMid.ethosLeft}%`,
          bottom: `calc(${labelPositionsMid.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Ethos"
          font={font}
          springOffset={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            ethosLabelRefs.current[1] = element;
          }}
        />
      </div>

      {/* Ethos Label - Tablet (700-999px) */}
      <div
        className="nav-mobile-ethos-label hidden min-[700px]:max-[999px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsTablet.ethosLeft}%`,
          bottom: `calc(${labelPositionsTablet.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Ethos"
          font={font}
          springOffset={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            ethosLabelRefs.current[2] = element;
          }}
        />
      </div>

      {/* Ethos Label - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-ethos-label hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsIpadPro.ethosLeft}%`,
          bottom: `calc(${labelPositionsIpadPro.ethosBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Ethos"
          font={font}
          springOffset={ethosUnravel.curveOffset.x}
          hasCompletedAnimation={ethosUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            ethosLabelRefs.current[3] = element;
          }}
        />
      </div>

      {/* Ethos Arrow */}
      <EthosArrow
        isVisible={isVisible}
        delay={MOBILE_NAV_DELAYS.ETHOS_ARROW}
        springTransform={ethosUnravel.hasCompletedInitialAnimation ? ethosUnravel.transform : undefined}
        curveOffset={ethosUnravel.hasCompletedInitialAnimation ? ethosUnravel.curveOffset : undefined}
        controlsStore={arrowControlsStore}
        labelElement={ethosLabelElement}
        buttonElement={ethosButtonElement}
        containerElement={containerElement}
        effectsConfig={arrowEffectsConfig}
      />

      {/* ============================================
          CONTACT - Center Bottom
          ============================================ */}

      {/* Contact Button - Small (<400px) */}
      <div
        className="nav-mobile-contact-btn hidden max-[399px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsSmall.contactLeft}%`,
          bottom: `calc(${btnPositionsSmall.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="contact"
          label="contact"
          springRotation={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          className="-mb-14 md:-mb-[55px]"
          buttonRef={(element) => {
            contactButtonRefs.current[0] = element;
          }}
          onNavigate={onNavigate}
          onClick={toggleContactOverlay}
          isActive={isContactOverlayOpen}
          size={sizeSmall.buttonSize}
        />
      </div>

      {/* Contact Button - Mid (400-699px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsMid.contactLeft}%`,
          bottom: `calc(${btnPositionsMid.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="contact"
          label="contact"
          springRotation={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          className="-mb-14 md:-mb-[55px]"
          buttonRef={(element) => {
            contactButtonRefs.current[1] = element;
          }}
          onNavigate={onNavigate}
          onClick={toggleContactOverlay}
          isActive={isContactOverlayOpen}
          size={sizeMid.buttonSize}
        />
      </div>

      {/* Contact Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsTablet.contactLeft}%`,
          bottom: `calc(${btnPositionsTablet.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="contact"
          label="contact"
          springRotation={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          className="-mb-14 md:-mb-[55px]"
          buttonRef={(element) => {
            contactButtonRefs.current[2] = element;
          }}
          onNavigate={onNavigate}
          onClick={toggleContactOverlay}
          isActive={isContactOverlayOpen}
          size={sizeTablet.buttonSize}
        />
      </div>

      {/* Contact Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsIpadPro.contactLeft}%`,
          bottom: `calc(${btnPositionsIpadPro.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="contact"
          label="contact"
          springRotation={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          className="-mb-14 md:-mb-[55px]"
          buttonRef={(element) => {
            contactButtonRefs.current[3] = element;
          }}
          onNavigate={onNavigate}
          onClick={toggleContactOverlay}
          isActive={isContactOverlayOpen}
          size={sizeIpadPro.buttonSize}
        />
      </div>

      {/* Contact Label - Small (<400px) */}
      <div
        className="nav-mobile-contact-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsSmall.contactLeft}%`,
          bottom: `calc(${labelPositionsSmall.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Contact"
          font={font}
          springOffset={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            contactLabelRefs.current[0] = element;
          }}
        />
      </div>

      {/* Contact Label - Mid (400-699px) */}
      <div
        className="nav-mobile-contact-label hidden min-[400px]:max-[699px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsMid.contactLeft}%`,
          bottom: `calc(${labelPositionsMid.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Contact"
          font={font}
          springOffset={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            contactLabelRefs.current[1] = element;
          }}
        />
      </div>

      {/* Contact Label - Tablet (700-999px) */}
      <div
        className="nav-mobile-contact-label hidden min-[700px]:max-[999px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsTablet.contactLeft}%`,
          bottom: `calc(${labelPositionsTablet.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Contact"
          font={font}
          springOffset={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            contactLabelRefs.current[2] = element;
          }}
        />
      </div>

      {/* Contact Label - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-contact-label hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsIpadPro.contactLeft}%`,
          bottom: `calc(${labelPositionsIpadPro.contactBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Contact"
          font={font}
          springOffset={contactUnravel.curveOffset.x}
          hasCompletedAnimation={contactUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            contactLabelRefs.current[3] = element;
          }}
        />
      </div>

      {/* Contact Arrow */}
      <ContactArrow
        isVisible={isVisible}
        delay={MOBILE_NAV_DELAYS.CONTACT_ARROW}
        springTransform={contactUnravel.hasCompletedInitialAnimation ? contactUnravel.transform : undefined}
        curveOffset={contactUnravel.hasCompletedInitialAnimation ? contactUnravel.curveOffset : undefined}
        controlsStore={arrowControlsStore}
        labelElement={contactLabelElement}
        buttonElement={contactButtonElement}
        containerElement={containerElement}
        effectsConfig={arrowEffectsConfig}
      />

      {/* ============================================
          GALLERY - Bottom Right Corner
          ============================================ */}

      {/* Gallery Button - Small (<400px) */}
      <div
        className="nav-mobile-gallery-btn hidden max-[399px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          left: `${btnPositionsSmall.galleryLeft}%`,
          bottom: `calc(${btnPositionsSmall.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="gallery"
          label="gallery"
          springRotation={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          className="-mr-14 md:-mr-[55px]"
          buttonRef={(element) => {
            galleryButtonRefs.current[0] = element;
          }}
          onNavigate={onNavigate}
          size={sizeSmall.buttonSize}
        />
      </div>

      {/* Gallery Button - Mid (400-699px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          left: `${btnPositionsMid.galleryLeft}%`,
          bottom: `calc(${btnPositionsMid.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="gallery"
          label="gallery"
          springRotation={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          className="-mr-14 md:-mr-[55px]"
          buttonRef={(element) => {
            galleryButtonRefs.current[1] = element;
          }}
          onNavigate={onNavigate}
          size={sizeMid.buttonSize}
        />
      </div>

      {/* Gallery Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          left: `${btnPositionsTablet.galleryLeft}%`,
          bottom: `calc(${btnPositionsTablet.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="gallery"
          label="gallery"
          springRotation={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          className="-mr-14 md:-mr-[55px]"
          buttonRef={(element) => {
            galleryButtonRefs.current[2] = element;
          }}
          onNavigate={onNavigate}
          size={sizeTablet.buttonSize}
        />
      </div>

      {/* Gallery Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          left: `${btnPositionsIpadPro.galleryLeft}%`,
          bottom: `calc(${btnPositionsIpadPro.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileButton
          scene="gallery"
          label="gallery"
          springRotation={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          className="-mr-14 md:-mr-[55px]"
          buttonRef={(element) => {
            galleryButtonRefs.current[3] = element;
          }}
          onNavigate={onNavigate}
          size={sizeIpadPro.buttonSize}
        />
      </div>

      {/* Gallery Label - Small (<400px) */}
      <div
        className="nav-mobile-gallery-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          left: `${labelPositionsSmall.galleryLeft}%`,
          bottom: `calc(${labelPositionsSmall.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Gallery"
          font={font}
          springOffset={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            galleryLabelRefs.current[0] = element;
          }}
        />
      </div>

      {/* Gallery Label - Mid (400-699px) */}
      <div
        className="nav-mobile-gallery-label hidden min-[400px]:max-[699px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          left: `${labelPositionsMid.galleryLeft}%`,
          bottom: `calc(${labelPositionsMid.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Gallery"
          font={font}
          springOffset={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            galleryLabelRefs.current[1] = element;
          }}
        />
      </div>

      {/* Gallery Label - Tablet (700-999px) */}
      <div
        className="nav-mobile-gallery-label hidden min-[700px]:max-[999px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          left: `${labelPositionsTablet.galleryLeft}%`,
          bottom: `calc(${labelPositionsTablet.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Gallery"
          font={font}
          springOffset={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            galleryLabelRefs.current[2] = element;
          }}
        />
      </div>

      {/* Gallery Label - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-gallery-label hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          left: `${labelPositionsIpadPro.galleryLeft}%`,
          bottom: `calc(${labelPositionsIpadPro.galleryBottom}svh + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MobileLabel
          text="Gallery"
          font={font}
          springOffset={galleryUnravel.curveOffset.x}
          hasCompletedAnimation={galleryUnravel.hasCompletedInitialAnimation}
          labelRef={(element) => {
            galleryLabelRefs.current[3] = element;
          }}
        />
      </div>

      {/* Gallery Arrow */}
      <GalleryArrow
        isVisible={isVisible}
        delay={MOBILE_NAV_DELAYS.GALLERY_ARROW}
        springTransform={galleryUnravel.hasCompletedInitialAnimation ? galleryUnravel.transform : undefined}
        curveOffset={galleryUnravel.hasCompletedInitialAnimation ? galleryUnravel.curveOffset : undefined}
        controlsStore={arrowControlsStore}
        labelElement={galleryLabelElement}
        buttonElement={galleryButtonElement}
        containerElement={containerElement}
        effectsConfig={arrowEffectsConfig}
      />
    </div>
  );
};

export default memo(MobileNavLayout);
