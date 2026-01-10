import { memo } from 'react';
import { useControls } from 'leva';
import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import NavLabel from './NavLabel';
import { createFadeSlideStyle, createFadeSlideXYStyle } from '../../utils/styles';
import { MOBILE_NAV_DELAYS } from '../../constants/animation';

interface MobileNavLayoutProps {
  font: string;
  isVisible: boolean;
}

const MobileNavLayout = ({ font, isVisible }: MobileNavLayoutProps) => {
  const btnPositions = useControls('📱 Mobile Button Positions', {
    ethosLeft: { value: 0, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 26, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 56, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: -0.8, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 0, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 9, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const btnPositionsSmall = useControls('📱 Mobile Button Positions Small (<400px)', {
    ethosLeft: { value: 14, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 26, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 45, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 5.0, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 17, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 8, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const btnPositionsMid = useControls('📱 Mobile Button Positions Mid (400-450px)', {
    ethosLeft: { value: 14, min: -50, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 26, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 45, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 7.0, min: -20, max: 100, step: 0.1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 17, min: -50, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 8, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const labelPositions = useControls('📱 Mobile Label Positions', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 45, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 12, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 10, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const labelPositionsSmall = useControls('📱 Mobile Label Positions Small (<400px)', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 40, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 15, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 10, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  const labelPositionsMid = useControls('📱 Mobile Label Positions Mid (400-450px)', {
    ethosLeft: { value: 8, min: 0, max: 100, step: 1, label: 'Ethos Left (%)' },
    ethosBottom: { value: 7, min: -20, max: 100, step: 1, label: 'Ethos Bottom (vh)' },
    contactLeft: { value: 40, min: 0, max: 100, step: 1, label: 'Contact Left (%)' },
    contactBottom: { value: 15, min: -20, max: 100, step: 1, label: 'Contact Bottom (vh)' },
    galleryRight: { value: 10, min: 0, max: 100, step: 1, label: 'Gallery Right (%)' },
    galleryBottom: { value: 2, min: -20, max: 100, step: 1, label: 'Gallery Bottom (vh)' },
  }, { collapsed: true });

  return (
    <div className="mobile-nav-only">
      {/* ============================================
          ETHOS - Bottom Left Corner
          ============================================ */}

      {/* Ethos Button - Half-off left side */}
      <div
        className="nav-mobile-ethos-btn max-[449px]:hidden"
        style={{
          ...createFadeSlideStyle(isVisible, 'x', '-30px', MOBILE_NAV_DELAYS.ETHOS_BUTTON),
          left: `${btnPositions.ethosLeft}%`,
          bottom: `${btnPositions.ethosBottom}vh`,
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

      <div
        className="nav-mobile-ethos-btn hidden min-[400px]:max-[449px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'x', '-30px', MOBILE_NAV_DELAYS.ETHOS_BUTTON),
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

      <div
        className="nav-mobile-ethos-btn hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'x', '-30px', MOBILE_NAV_DELAYS.ETHOS_BUTTON),
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

      {/* Ethos Label */}
      <div
        className="nav-mobile-ethos-label max-[449px]:hidden"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositions.ethosLeft}%`,
          bottom: `${labelPositions.ethosBottom}vh`,
        }}
      >
        <NavLabel text="Ethos" font={font} />
      </div>

      <div
        className="nav-mobile-ethos-label hidden min-[400px]:max-[449px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.ETHOS_LABEL),
          left: `${labelPositionsMid.ethosLeft}%`,
          bottom: `${labelPositionsMid.ethosBottom}vh`,
        }}
      >
        <NavLabel text="Ethos" font={font} />
      </div>

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

      {/* Ethos Arrow */}
      <EthosArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.ETHOS_ARROW} />

      {/* ============================================
          CONTACT - Center Bottom
          ============================================ */}

      {/* Contact Button - Half-off bottom, positioned right of center */}
      <div
        className="nav-mobile-contact-btn max-[449px]:hidden"
        style={{
          ...createFadeSlideXYStyle(isVisible, '-50%', '20px', MOBILE_NAV_DELAYS.CONTACT_BUTTON),
          left: `${btnPositions.contactLeft}%`,
          bottom: `${btnPositions.contactBottom}vh`,
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

      <div
        className="nav-mobile-contact-btn hidden min-[400px]:max-[449px]:block"
        style={{
          ...createFadeSlideXYStyle(isVisible, '-50%', '20px', MOBILE_NAV_DELAYS.CONTACT_BUTTON),
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

      <div
        className="nav-mobile-contact-btn hidden max-[399px]:block"
        style={{
          ...createFadeSlideXYStyle(isVisible, '-50%', '20px', MOBILE_NAV_DELAYS.CONTACT_BUTTON),
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

      {/* Contact Label */}
      <div
        className="nav-mobile-contact-label max-[449px]:hidden"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositions.contactLeft}%`,
          bottom: `${labelPositions.contactBottom}vh`,
        }}
      >
        <NavLabel text="Contact" font={font} />
      </div>

      <div
        className="nav-mobile-contact-label hidden min-[400px]:max-[449px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.CONTACT_LABEL),
          left: `${labelPositionsMid.contactLeft}%`,
          bottom: `${labelPositionsMid.contactBottom}vh`,
        }}
      >
        <NavLabel text="Contact" font={font} />
      </div>

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

      {/* Contact Arrow */}
      <ContactArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.CONTACT_ARROW} />

      {/* ============================================
          GALLERY - Bottom Right Corner
          ============================================ */}

      {/* Gallery Button - Half-off right side */}
      <div
        className="nav-mobile-gallery-btn max-[449px]:hidden"
        style={{
          ...createFadeSlideStyle(isVisible, 'x', '30px', MOBILE_NAV_DELAYS.GALLERY_BUTTON),
          right: `${btnPositions.galleryRight}%`,
          bottom: `${btnPositions.galleryBottom}vh`,
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

      <div
        className="nav-mobile-gallery-btn hidden min-[400px]:max-[449px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'x', '30px', MOBILE_NAV_DELAYS.GALLERY_BUTTON),
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

      <div
        className="nav-mobile-gallery-btn hidden max-[399px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'x', '30px', MOBILE_NAV_DELAYS.GALLERY_BUTTON),
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

      {/* Gallery Label */}
      <div
        className="nav-mobile-gallery-label max-[449px]:hidden"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositions.galleryRight}%`,
          bottom: `${labelPositions.galleryBottom}vh`,
        }}
      >
        <NavLabel text="Gallery" font={font} />
      </div>

      <div
        className="nav-mobile-gallery-label hidden min-[400px]:max-[449px]:block"
        style={{
          ...createFadeSlideStyle(isVisible, 'y', '20px', MOBILE_NAV_DELAYS.GALLERY_LABEL),
          right: `${labelPositionsMid.galleryRight}%`,
          bottom: `${labelPositionsMid.galleryBottom}vh`,
        }}
      >
        <NavLabel text="Gallery" font={font} />
      </div>

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

      {/* Gallery Arrow */}
      <GalleryArrow isVisible={isVisible} delay={MOBILE_NAV_DELAYS.GALLERY_ARROW} />
    </div>
  );
};

export default memo(MobileNavLayout);
