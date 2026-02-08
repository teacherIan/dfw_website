import { memo } from 'react';
import { useControls, folder } from 'leva';
import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import NavLabel from './NavLabel';
import { createFadeSlideStyle, createPopInStyle, createPopInCenteredStyle } from '../../utils/styles';
import { MOBILE_NAV_DELAYS } from '../../constants/animation';
import type { SceneId } from '../../constants';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Breakpoint configuration for button and label positions
const BREAKPOINT_CONFIGS = {
  small: {
    name: 'Small (<400px)',
    buttons: { ethosLeft: 14, ethosBottom: 26, contactLeft: 45, contactBottom: 7, galleryRight: 17, galleryBottom: 8 },
    labels: { ethosLeft: 8, ethosBottom: 7, contactLeft: 40, contactBottom: 15, galleryRight: 10, galleryBottom: 2 },
  },
  mid: {
    name: 'Mid (400-699px)',
    buttons: { ethosLeft: 14, ethosBottom: 26, contactLeft: 45, contactBottom: 7.0, galleryRight: 17, galleryBottom: 8 },
    labels: { ethosLeft: 8, ethosBottom: 7, contactLeft: 40, contactBottom: 15, galleryRight: 10, galleryBottom: 2 },
  },
  tablet: {
    name: 'Tablet (700-999px)',
    buttons: { ethosLeft: 11, ethosBottom: 29, contactLeft: 40, contactBottom: 5.0, galleryRight: 8, galleryBottom: 8 },
    labels: { ethosLeft: 8, ethosBottom: 7, contactLeft: 51, contactBottom: 13, galleryRight: 21, galleryBottom: 2 },
  },
  ipadPro: {
    name: 'iPad Pro (1000-1199px)',
    buttons: { ethosLeft: 11, ethosBottom: 29, contactLeft: 40, contactBottom: 5.0, galleryRight: 8, galleryBottom: 8 },
    labels: { ethosLeft: 8, ethosBottom: 7, contactLeft: 51, contactBottom: 13, galleryRight: 21, galleryBottom: 2 },
  },
} as const;

type BreakpointKey = keyof typeof BREAKPOINT_CONFIGS;

// Generate Leva control schema for position controls
const createPositionControls = (defaults: typeof BREAKPOINT_CONFIGS.small.buttons) => ({
  ethosLeft: { value: defaults.ethosLeft, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
  ethosBottom: { value: defaults.ethosBottom, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
  contactLeft: { value: defaults.contactLeft, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
  contactBottom: { value: defaults.contactBottom, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
  galleryRight: { value: defaults.galleryRight, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
  galleryBottom: { value: defaults.galleryBottom, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
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
}

const MobileNavLayout = ({
  font,
  isVisible,
  onNavigate,
  controlsStore,
}: MobileNavLayoutProps) => {
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
    <div className="mobile-nav-only">
      {/* ============================================
          ETHOS - Bottom Left Corner
          ============================================ */}

      {/* Ethos Button - Small (<400px) */}
      <div
        className="nav-mobile-ethos-btn hidden max-[399px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsSmall.ethosLeft}%`,
          bottom: `${btnPositionsSmall.ethosBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -ml-14 md:-ml-[55px]"
          aria-label="Open ethos"
          onClick={() => onNavigate('ethos')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View ethos</span>
        </button>
      </div>

      {/* Ethos Button - Mid (400-699px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsMid.ethosLeft}%`,
          bottom: `${btnPositionsMid.ethosBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -ml-14 md:-ml-[55px]"
          aria-label="Open ethos"
          onClick={() => onNavigate('ethos')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View ethos</span>
        </button>
      </div>

      {/* Ethos Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsTablet.ethosLeft}%`,
          bottom: `${btnPositionsTablet.ethosBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -ml-14 md:-ml-[55px]"
          aria-label="Open ethos"
          onClick={() => onNavigate('ethos')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View ethos</span>
        </button>
      </div>

      {/* Ethos Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-ethos-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositionsIpadPro.ethosLeft}%`,
          bottom: `${btnPositionsIpadPro.ethosBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -ml-14 md:-ml-[55px]"
          aria-label="Open ethos"
          onClick={() => onNavigate('ethos')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View ethos</span>
        </button>
      </div>

      {/* Ethos Label - Small (<400px) */}
      <div
        className="nav-mobile-ethos-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsSmall.ethosLeft}%`,
          bottom: `${labelPositionsSmall.ethosBottom}vh`,
        }}
      >
        <NavLabel text="Ethos" font={font} />
      </div>

      {/* Ethos Label - Mid (400-699px) */}
      <div
        className="nav-mobile-ethos-label hidden min-[400px]:max-[699px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsMid.ethosLeft}%`,
          bottom: `${labelPositionsMid.ethosBottom}vh`,
        }}
      >
        <NavLabel text="Ethos" font={font} />
      </div>

      {/* Ethos Label - Tablet (700-999px) */}
      <div
        className="nav-mobile-ethos-label hidden min-[700px]:max-[999px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsTablet.ethosLeft}%`,
          bottom: `${labelPositionsTablet.ethosBottom}vh`,
        }}
      >
        <NavLabel text="Ethos" font={font} />
      </div>

      {/* Ethos Label - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-ethos-label hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsIpadPro.ethosLeft}%`,
          bottom: `${labelPositionsIpadPro.ethosBottom}vh`,
        }}
      >
        <NavLabel text="Ethos" font={font} />
      </div>

      {/* Ethos Arrow */}
      <EthosArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.ETHOS_ARROW} controlsStore={controlsStore} />

      {/* ============================================
          CONTACT - Center Bottom
          ============================================ */}

      {/* Contact Button - Small (<400px) */}
      <div
        className="nav-mobile-contact-btn hidden max-[399px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsSmall.contactLeft}%`,
          bottom: `${btnPositionsSmall.contactBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mb-14 md:-mb-[55px]"
          aria-label="Open contact"
          onClick={() => onNavigate('contact')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View contact</span>
        </button>
      </div>

      {/* Contact Button - Mid (400-699px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsMid.contactLeft}%`,
          bottom: `${btnPositionsMid.contactBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mb-14 md:-mb-[55px]"
          aria-label="Open contact"
          onClick={() => onNavigate('contact')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View contact</span>
        </button>
      </div>

      {/* Contact Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsTablet.contactLeft}%`,
          bottom: `${btnPositionsTablet.contactBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mb-14 md:-mb-[55px]"
          aria-label="Open contact"
          onClick={() => onNavigate('contact')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View contact</span>
        </button>
      </div>

      {/* Contact Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-contact-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInCenteredStyle(isVisible, MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositionsIpadPro.contactLeft}%`,
          bottom: `${btnPositionsIpadPro.contactBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mb-14 md:-mb-[55px]"
          aria-label="Open contact"
          onClick={() => onNavigate('contact')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View contact</span>
        </button>
      </div>

      {/* Contact Label - Small (<400px) */}
      <div
        className="nav-mobile-contact-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsSmall.contactLeft}%`,
          bottom: `${labelPositionsSmall.contactBottom}vh`,
        }}
      >
        <NavLabel text="Contact" font={font} />
      </div>

      {/* Contact Label - Mid (400-699px) */}
      <div
        className="nav-mobile-contact-label hidden min-[400px]:max-[699px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsMid.contactLeft}%`,
          bottom: `${labelPositionsMid.contactBottom}vh`,
        }}
      >
        <NavLabel text="Contact" font={font} />
      </div>

      {/* Contact Label - Tablet (700-999px) */}
      <div
        className="nav-mobile-contact-label hidden min-[700px]:max-[999px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsTablet.contactLeft}%`,
          bottom: `${labelPositionsTablet.contactBottom}vh`,
        }}
      >
        <NavLabel text="Contact" font={font} />
      </div>

      {/* Contact Label - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-contact-label hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsIpadPro.contactLeft}%`,
          bottom: `${labelPositionsIpadPro.contactBottom}vh`,
        }}
      >
        <NavLabel text="Contact" font={font} />
      </div>

      {/* Contact Arrow */}
      <ContactArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.CONTACT_ARROW} controlsStore={controlsStore} />

      {/* ============================================
          GALLERY - Bottom Right Corner
          ============================================ */}

      {/* Gallery Button - Small (<400px) */}
      <div
        className="nav-mobile-gallery-btn hidden max-[399px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsSmall.galleryRight}%`,
          bottom: `${btnPositionsSmall.galleryBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mr-14 md:-mr-[55px]"
          aria-label="Open gallery"
          onClick={() => onNavigate('gallery')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View gallery</span>
        </button>
      </div>

      {/* Gallery Button - Mid (400-699px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[400px]:max-[699px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsMid.galleryRight}%`,
          bottom: `${btnPositionsMid.galleryBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mr-14 md:-mr-[55px]"
          aria-label="Open gallery"
          onClick={() => onNavigate('gallery')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View gallery</span>
        </button>
      </div>

      {/* Gallery Button - Tablet (700-999px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[700px]:max-[999px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsTablet.galleryRight}%`,
          bottom: `${btnPositionsTablet.galleryBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mr-14 md:-mr-[55px]"
          aria-label="Open gallery"
          onClick={() => onNavigate('gallery')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View gallery</span>
        </button>
      </div>

      {/* Gallery Button - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-gallery-btn hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createPopInStyle(isVisible, MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositionsIpadPro.galleryRight}%`,
          bottom: `${btnPositionsIpadPro.galleryBottom}vh`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mr-14 md:-mr-[55px]"
          aria-label="Open gallery"
          onClick={() => onNavigate('gallery')}
        >
          <BlueprintButtonSVG />
          <span className="sr-only">View gallery</span>
        </button>
      </div>

      {/* Gallery Label - Small (<400px) */}
      <div
        className="nav-mobile-gallery-label hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositionsSmall.galleryRight}%`,
          bottom: `${labelPositionsSmall.galleryBottom}vh`,
        }}
      >
        <NavLabel text="Gallery" font={font} />
      </div>

      {/* Gallery Label - Mid (400-699px) */}
      <div
        className="nav-mobile-gallery-label hidden min-[400px]:max-[699px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositionsMid.galleryRight}%`,
          bottom: `${labelPositionsMid.galleryBottom}vh`,
        }}
      >
        <NavLabel text="Gallery" font={font} />
      </div>

      {/* Gallery Label - Tablet (700-999px) */}
      <div
        className="nav-mobile-gallery-label hidden min-[700px]:max-[999px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositionsTablet.galleryRight}%`,
          bottom: `${labelPositionsTablet.galleryBottom}vh`,
        }}
      >
        <NavLabel text="Gallery" font={font} />
      </div>

      {/* Gallery Label - iPad Pro (1000-1199px) */}
      <div
        className="nav-mobile-gallery-label hidden min-[1000px]:max-[1199px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositionsIpadPro.galleryRight}%`,
          bottom: `${labelPositionsIpadPro.galleryBottom}vh`,
        }}
      >
        <NavLabel text="Gallery" font={font} />
      </div>

      {/* Gallery Arrow */}
      <GalleryArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.GALLERY_ARROW} controlsStore={controlsStore} />
    </div>
  );
};

export default memo(MobileNavLayout);
