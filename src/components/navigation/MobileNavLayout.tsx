import { memo, useLayoutEffect, useRef, useState, type MutableRefObject, type Ref } from 'react';
import { useControls, folder } from 'leva';
import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';
import NavLabel from './NavLabel';
import type { ArrowEffectsConfig } from './ArrowFilters';
import { createFadeSlideStyle } from '../../utils/styles';
import { MOBILE_NAV_DELAYS } from '../../constants/animation';
import { useArrowUnravel } from '../../hooks';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Breakpoint configuration for label positions.
// The buttons themselves now live in NavButtonLayer (positioned from
// navLayouts.ts); MobileNavLayout only renders the labels + arrows.
// Triangular layout: Ethos (bottom-left), Gallery (bottom-right), Contact (center).
const BREAKPOINT_CONFIGS = {
  small: {
    name: 'Small (<400px)',
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
  },
  mid: {
    name: 'Mid (400-699px)',
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
  },
  tablet: {
    name: 'Tablet (700-999px)',
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
  },
  ipadPro: {
    name: 'iPad Pro (1000-1199px)',
    labels: { ethosLeft: 20, ethosBottom: 14, contactLeft: 44, contactBottom: 15, galleryLeft: 67, galleryBottom: 1 },
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

// Hook to get label position controls for a breakpoint
const useBreakpointControls = (
  breakpoint: BreakpointKey,
  mobileNavStore?: LevaStore
) => {
  const config = BREAKPOINT_CONFIGS[breakpoint];

  return useControls({
    [`🏷️ Label Positions.${config.name}`]: folder(
      createPositionControls(config.labels),
      { collapsed: true }
    ),
  }, { store: mobileNavStore });
};

interface MobileNavLayoutProps {
  font: string;
  isVisible: boolean;
  controlsStore?: LevaStore;
  arrowControlsStore?: LevaStore;
  mobileNavStore?: LevaStore;
  arrowEffectsConfig?: ArrowEffectsConfig;
}

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
  const [visible, setVisible] = useState<T | null>(null);

  // Counter to force re-renders on resize/orientation change
  const [, setCounter] = useState(0);

  useLayoutEffect(() => {
    const update = () => setCounter((c) => c + 1);

    // Force initial updates to catch late-mounting elements
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

  // Recompute after every render — refs are populated post-render, and reading
  // layout (getBoundingClientRect) is only safe outside of render. Intentionally
  // dep-less so element mount/unmount is picked up; setState bails out when the
  // result is unchanged, so this cannot loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    setVisible(findVisibleElement(elementsRef.current));
  });

  return visible;
};

const MobileNavLayout = ({
  font,
  isVisible,
  arrowControlsStore,
  mobileNavStore,
  arrowEffectsConfig,
}: MobileNavLayoutProps) => {
  // Arrow unravel hooks for spring-responsive animation (drives both the
  // label sway and the arrow's spring transform).
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
  const ethosLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const contactLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const galleryLabelRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const ethosLabelElement = useVisibleElement(ethosLabelRefs);
  const contactLabelElement = useVisibleElement(contactLabelRefs);
  const galleryLabelElement = useVisibleElement(galleryLabelRefs);

  // Label positions for each breakpoint
  const labelPositionsSmall = useBreakpointControls('small', mobileNavStore);
  const labelPositionsMid = useBreakpointControls('mid', mobileNavStore);
  const labelPositionsTablet = useBreakpointControls('tablet', mobileNavStore);
  const labelPositionsIpadPro = useBreakpointControls('ipadPro', mobileNavStore);

  return (
    <div className="mobile-nav-only" ref={setContainerElement}>
      {/* ============================================
          ETHOS - Bottom Left Corner
          ============================================ */}

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

      {/* Ethos Arrow.
          curveOffset is passed unconditionally (not gated on
          hasCompletedInitialAnimation): gating it makes the bezier control
          point snap ~20px the instant the entrance completes — very visible
          now that the arrow's endpoint is a static config value. Passing it
          throughout keeps the curve continuous. */}
      <EthosArrow
        isVisible={isVisible}
        delay={MOBILE_NAV_DELAYS.ETHOS_ARROW}
        springTransform={ethosUnravel.hasCompletedInitialAnimation ? ethosUnravel.transform : undefined}
        curveOffset={ethosUnravel.curveOffset}
        controlsStore={arrowControlsStore}
        labelElement={ethosLabelElement}
        containerElement={containerElement}
        effectsConfig={arrowEffectsConfig}
      />

      {/* ============================================
          CONTACT - Center Bottom
          ============================================ */}

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
        curveOffset={contactUnravel.curveOffset}
        controlsStore={arrowControlsStore}
        labelElement={contactLabelElement}
        containerElement={containerElement}
        effectsConfig={arrowEffectsConfig}
      />

      {/* ============================================
          GALLERY - Bottom Right Corner
          ============================================ */}

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
        curveOffset={galleryUnravel.curveOffset}
        controlsStore={arrowControlsStore}
        labelElement={galleryLabelElement}
        containerElement={containerElement}
        effectsConfig={arrowEffectsConfig}
      />
    </div>
  );
};

export default memo(MobileNavLayout);
