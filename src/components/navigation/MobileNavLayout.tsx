import { memo, useLayoutEffect, useRef, useState, type MutableRefObject, type Ref } from 'react';
import { useControls, folder } from 'leva';
import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import NavLabel from './NavLabel';
import { createFadeSlideStyle, createPopInStyle, createPopInCenteredStyle } from '../../utils/styles';
import { MOBILE_NAV_DELAYS } from '../../constants/animation';
import type { SceneId } from '../../constants';
import { useArrowUnravel } from '../../hooks';
import { useAnimationStore, useIsContactOverlayOpen } from '../../stores/animationStore';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Breakpoint configuration for button and label positions
// Triangular layout: Ethos (bottom-left), Gallery (bottom-right), Contact (center-top apex)
// Buttons must be BELOW the "Doug's Found Wood" title
const BREAKPOINT_CONFIGS = {
  small: {
    name: 'Small (<400px)',
    buttons: { ethosLeft: 8, ethosBottom: 6, contactLeft: 50, contactBottom: 28, galleryRight: 8, galleryBottom: 6 },
    labels: { ethosLeft: 3, ethosBottom: 14, contactLeft: 50, contactBottom: 36, galleryRight: 3, galleryBottom: 14 },
  },
  mid: {
    name: 'Mid (400-699px)',
    buttons: { ethosLeft: 10, ethosBottom: 6, contactLeft: 50, contactBottom: 28, galleryRight: 10, galleryBottom: 6 },
    labels: { ethosLeft: 5, ethosBottom: 14, contactLeft: 50, contactBottom: 36, galleryRight: 5, galleryBottom: 14 },
  },
  tablet: {
    name: 'Tablet (700-999px)',
    buttons: { ethosLeft: 12, ethosBottom: 7, contactLeft: 50, contactBottom: 30, galleryRight: 12, galleryBottom: 7 },
    labels: { ethosLeft: 6, ethosBottom: 16, contactLeft: 50, contactBottom: 38, galleryRight: 6, galleryBottom: 16 },
  },
  ipadPro: {
    name: 'iPad Pro (1000-1199px)',
    buttons: { ethosLeft: 14, ethosBottom: 7, contactLeft: 50, contactBottom: 30, galleryRight: 14, galleryBottom: 7 },
    labels: { ethosLeft: 8, ethosBottom: 16, contactLeft: 50, contactBottom: 38, galleryRight: 8, galleryBottom: 16 },
  },
} as const;

type BreakpointKey = keyof typeof BREAKPOINT_CONFIGS;

// Generate Leva control schema for position controls
const createPositionControls = (defaults: typeof BREAKPOINT_CONFIGS.small.buttons) => ({
  ethosLeft: { value: defaults.ethosLeft, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
  ethosBottom: { value: defaults.ethosBottom, min: -20, max: 100, step: 1, label: 'Ethos Bottom (svh)' },
  contactLeft: { value: defaults.contactLeft, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
  contactBottom: { value: defaults.contactBottom, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (svh)' },
  galleryRight: { value: defaults.galleryRight, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
  galleryBottom: { value: defaults.galleryBottom, min: -20, max: 100, step: 1, label: 'Gallery Bottom (svh)' },
});

// Hook to get all position controls for a breakpoint
const useBreakpointControls = (
  breakpoint: BreakpointKey,
  type: 'buttons' | 'labels',
  controlsStore?: LevaStore
) => {
  const config = BREAKPOINT_CONFIGS[breakpoint];
  const prefix = type === 'buttons' ? 'Mobile Buttons' : 'Mobile Labels';

  return useControls({
    [`🏠 Base.📱 ${prefix}.${config.name}`]: folder(
      createPositionControls(config[type]),
      { collapsed: true }
    ),
  }, { store: controlsStore });
};

interface MobileNavLayoutProps {
  font: string;
  isVisible: boolean;
  onNavigate: (scene: SceneId) => void;
  controlsStore?: LevaStore;
  arrowControlsStore?: LevaStore;
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
  }, [elementsRef]);

  // Compute visible element on every render - more reliable than storing in state
  return findVisibleElement(elementsRef.current);
};

const MobileNavLayout = ({
  font,
  isVisible,
  onNavigate,
  controlsStore,
  arrowControlsStore,
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
  const btnPositionsSmall = useBreakpointControls('small', 'buttons', controlsStore);
  const btnPositionsMid = useBreakpointControls('mid', 'buttons', controlsStore);
  const btnPositionsTablet = useBreakpointControls('tablet', 'buttons', controlsStore);
  const btnPositionsIpadPro = useBreakpointControls('ipadPro', 'buttons', controlsStore);

  // Label positions for each breakpoint
  const labelPositionsSmall = useBreakpointControls('small', 'labels', controlsStore);
  const labelPositionsMid = useBreakpointControls('mid', 'labels', controlsStore);
  const labelPositionsTablet = useBreakpointControls('tablet', 'labels', controlsStore);
  const labelPositionsIpadPro = useBreakpointControls('ipadPro', 'labels', controlsStore);

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
          bottom: `${btnPositionsSmall.ethosBottom}svh`,
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
        />
      </div>

      {/* Ethos Button - Mid (400-699px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsMid.ethosLeft}%`,
          bottom: `${btnPositionsMid.ethosBottom}svh`,
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
        />
      </div>

      {/* Ethos Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsTablet.ethosLeft}%`,
          bottom: `${btnPositionsTablet.ethosBottom}svh`,
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
        />
      </div>

      {/* Ethos Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsIpadPro.ethosLeft}%`,
          bottom: `${btnPositionsIpadPro.ethosBottom}svh`,
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
        />
      </div>

      {/* Ethos Label - Small (<400px) */}
      <div
        className="nav-mobile-ethos-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsSmall.ethosLeft}%`,
          bottom: `${labelPositionsSmall.ethosBottom}svh`,
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
          bottom: `${labelPositionsMid.ethosBottom}svh`,
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
          bottom: `${labelPositionsTablet.ethosBottom}svh`,
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
          bottom: `${labelPositionsIpadPro.ethosBottom}svh`,
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
          bottom: `${btnPositionsSmall.contactBottom}svh`,
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
        />
      </div>

      {/* Contact Button - Mid (400-699px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsMid.contactLeft}%`,
          bottom: `${btnPositionsMid.contactBottom}svh`,
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
        />
      </div>

      {/* Contact Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsTablet.contactLeft}%`,
          bottom: `${btnPositionsTablet.contactBottom}svh`,
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
        />
      </div>

      {/* Contact Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsIpadPro.contactLeft}%`,
          bottom: `${btnPositionsIpadPro.contactBottom}svh`,
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
        />
      </div>

      {/* Contact Label - Small (<400px) */}
      <div
        className="nav-mobile-contact-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsSmall.contactLeft}%`,
          bottom: `${labelPositionsSmall.contactBottom}svh`,
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
          bottom: `${labelPositionsMid.contactBottom}svh`,
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
          bottom: `${labelPositionsTablet.contactBottom}svh`,
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
          bottom: `${labelPositionsIpadPro.contactBottom}svh`,
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
      />

      {/* ============================================
          GALLERY - Bottom Right Corner
          ============================================ */}

      {/* Gallery Button - Small (<400px) */}
      <div
        className="nav-mobile-gallery-btn hidden max-[399px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsSmall.galleryRight}%`,
          bottom: `${btnPositionsSmall.galleryBottom}svh`,
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
        />
      </div>

      {/* Gallery Button - Mid (400-699px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsMid.galleryRight}%`,
          bottom: `${btnPositionsMid.galleryBottom}svh`,
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
        />
      </div>

      {/* Gallery Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsTablet.galleryRight}%`,
          bottom: `${btnPositionsTablet.galleryBottom}svh`,
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
        />
      </div>

      {/* Gallery Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsIpadPro.galleryRight}%`,
          bottom: `${btnPositionsIpadPro.galleryBottom}svh`,
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
        />
      </div>

      {/* Gallery Label - Small (<400px) */}
      <div
        className="nav-mobile-gallery-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositionsSmall.galleryRight}%`,
          bottom: `${labelPositionsSmall.galleryBottom}svh`,
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
          right: `${labelPositionsMid.galleryRight}%`,
          bottom: `${labelPositionsMid.galleryBottom}svh`,
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
          right: `${labelPositionsTablet.galleryRight}%`,
          bottom: `${labelPositionsTablet.galleryBottom}svh`,
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
          right: `${labelPositionsIpadPro.galleryRight}%`,
          bottom: `${labelPositionsIpadPro.galleryBottom}svh`,
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
      />
    </div>
  );
};

export default memo(MobileNavLayout);
