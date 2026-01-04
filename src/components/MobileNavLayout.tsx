import { EthosArrow, ContactArrow, GalleryArrow } from './MobileArrows';

interface MobilePositions {
  ethosButtonLeft: number;
  ethosButtonBottom: number;
  contactButtonLeft: number;
  contactButtonBottom: number;
  galleryButtonRight: number;
  galleryButtonBottom: number;
  ethosLabelLeft: number;
  ethosLabelBottom: number;
  contactLabelLeft: number;
  contactLabelBottom: number;
  galleryLabelRight: number;
  galleryLabelBottom: number;
}

interface MobileNavLayoutProps {
  positions: MobilePositions;
  font: string;
  isVisible: boolean;
}

const MobileNavLayout = ({ positions, font, isVisible }: MobileNavLayoutProps) => {
  return (
    <div className="md:hidden">
      {/* ============================================
          ETHOS - Bottom Left Corner
          ============================================ */}
      
      {/* Ethos Button - Half-off left side */}
      <div
        className="absolute"
        style={{
          left: `${positions.ethosButtonLeft}%`,
          bottom: `${positions.ethosButtonBottom}vh`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(-30px)',
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -ml-14"
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

      {/* Ethos Label */}
      <div
        className="absolute"
        style={{
          left: `${positions.ethosLabelLeft}%`,
          bottom: `${positions.ethosLabelBottom}vh`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms`,
        }}
      >
        <span
          className="text-4xl text-white/95"
          style={{
            fontFamily: font,
            textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.85)',
            paintOrder: 'stroke fill',
          }}
        >
          Ethos
        </span>
      </div>

      {/* Ethos Arrow */}
      <EthosArrow isVisible={isVisible} delay={300} />

      {/* ============================================
          CONTACT - Center Bottom
          ============================================ */}

      {/* Contact Button - Half-off bottom, positioned right of center */}
      <div
        className="absolute -translate-x-1/2"
        style={{
          left: `${positions.contactButtonLeft}%`,
          bottom: `${positions.contactButtonBottom}vh`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mb-14"
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

      {/* Contact Label */}
      <div
        className="absolute"
        style={{
          left: `${positions.contactLabelLeft}%`,
          bottom: `${positions.contactLabelBottom}vh`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms`,
        }}
      >
        <span
          className="text-4xl text-white/95"
          style={{
            fontFamily: font,
            textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.85)',
            paintOrder: 'stroke fill',
          }}
        >
          Contact
        </span>
      </div>

      {/* Contact Arrow */}
      <ContactArrow isVisible={isVisible} delay={400} />

      {/* ============================================
          GALLERY - Bottom Right Corner
          ============================================ */}

      {/* Gallery Button - Half-off right side */}
      <div
        className="absolute flex items-center gap-0"
        style={{
          right: `${positions.galleryButtonRight}%`,
          bottom: `${positions.galleryButtonBottom}vh`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(30px)',
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms`,
        }}
      >
        <button
          type="button"
          className="nav-button-circle nav-button-circle--mobile-large pointer-events-auto -mr-14"
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
      </div>

      {/* Gallery Label */}
      <div
        className="absolute"
        style={{
          right: `${positions.galleryLabelRight}%`,
          bottom: `${positions.galleryLabelBottom}vh`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: `all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms`,
        }}
      >
        <span
          className="text-4xl text-white/95"
          style={{
            fontFamily: font,
            textShadow: '0 3px 10px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.85)',
            paintOrder: 'stroke fill',
          }}
        >
          Gallery
        </span>
      </div>

      {/* Gallery Arrow */}
      <GalleryArrow isVisible={isVisible} delay={500} />
    </div>
  );
};

export default MobileNavLayout;
