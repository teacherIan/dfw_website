import { memo } from 'react';
import { useControls } from 'leva';
import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import NavLabel from './NavLabel';
import { createFadeSlideStyle, createPopInStyle, createPopInCenteredStyle } from '../../utils/styles';
import { MOBILE_NAV_DELAYS } from '../../constants/animation';

interface MobileNavLayoutProps {
  font: string;
  isVisible: boolean;
}

const MobileNavLayout = ({ font, isVisible }: MobileNavLayoutProps) => {
  // Button positions for each breakpoint (nested under Mobile Buttons)
  const btnPositionsSmall = useControls('📱 Mobile Buttons.Small (<400px)', {
    ethosLeft: { value: 14, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 26, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 45, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 7, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 17, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 8, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const btnPositionsMid = useControls('📱 Mobile Buttons.Mid (400-699px)', {
    ethosLeft: { value: 14, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 26, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 45, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 7.0, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 17, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 8, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const btnPositionsTablet = useControls('📱 Mobile Buttons.Tablet (700-999px)', {
    ethosLeft: { value: 11, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 29, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 40, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 5.0, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 8, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 8, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const btnPositionsIpadPro = useControls('📱 Mobile Buttons.iPad Pro (1000-1199px)', {
    ethosLeft: { value: 11, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 29, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 40, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 5.0, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 8, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 8, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  // Label positions for each breakpoint (nested under Mobile Labels)
  const labelPositionsSmall = useControls('📱 Mobile Labels.Small (<400px)', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 40, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 15, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 10, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const labelPositionsMid = useControls('📱 Mobile Labels.Mid (400-699px)', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 40, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 15, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 10, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const labelPositionsTablet = useControls('📱 Mobile Labels.Tablet (700-999px)', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 51, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 13, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 21, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const labelPositionsIpadPro = useControls('📱 Mobile Labels.iPad Pro (1000-1199px)', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 51, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 13, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 21, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

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
      <EthosArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.ETHOS_ARROW} />

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
      <ContactArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.CONTACT_ARROW} />

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
      <GalleryArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.GALLERY_ARROW} />
    </div>
  );
};

export default memo(MobileNavLayout);
