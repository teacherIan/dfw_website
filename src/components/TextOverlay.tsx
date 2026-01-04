import { useControls } from "leva";

interface TextOverlayProps {
  show: boolean;
}

/**
 * TextOverlay component for displaying the "Doug's Found Wood" title
 * Centered at the bottom of the screen with a writing animation
 * Responsive design for mobile devices
 * 
 * Mobile: Full width, text can wrap if needed, positioned above nav
 * Desktop: Single line, centered at bottom
 */
const TextOverlay = ({ show }: TextOverlayProps) => {
  const titlePosition = useControls('Title Position', {
    mobileBottom: { value: 19, min: 0, max: 100, step: 1, label: 'Mobile Bottom (vh)' },
    desktopBottom: { value: 10, min: 0, max: 100, step: 1, label: 'Desktop Bottom (vh)' },
  });

  if (!show) return null;

  return (
    <div 
      className="absolute left-0 right-0 w-full flex justify-center pointer-events-none select-none z-40"
      style={{
        bottom: window.innerWidth < 768 ? `${titlePosition.mobileBottom}vh` : `${titlePosition.desktopBottom}vh`
      }}
    >
      {/* Extra wrapper with padding to prevent text stroke/shadow clipping */}
      <div className="pl-[2vw]">
        <h1
          className="
            text-[12vw] sm:text-6xl md:text-7xl lg:text-8xl
            text-white
            writing-animation
            px-4
            pb-4 md:pb-8
            pt-2
            leading-none md:leading-relaxed
            text-center
            whitespace-nowrap
          "
          style={{
            fontFamily: '"Caveat", cursive',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
            paintOrder: 'stroke fill',
          }}
        >
          Doug's Found Wood
        </h1>
      </div>
    </div>
  );
};

export default TextOverlay;
