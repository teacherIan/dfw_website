import clsx from 'clsx';

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
  if (!show) return null;

  return (
    <div
      className={clsx(
        'title-overlay',
        'absolute right-0 left-0 w-full',
        'flex justify-center',
        'pointer-events-none select-none',
        'z-40'
      )}
    >
      {/* Extra wrapper for text stroke/shadow rendering space */}
      <div>
        <h1
          className={clsx(
            'text-[12vw] sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl',
            'text-white',
            'writing-animation',
            'px-4',
            'pb-4 lg:pb-8',
            'pt-2',
            'leading-none md:leading-tight lg:leading-relaxed',
            'text-center',
            'whitespace-nowrap'
          )}
          style={{
            fontFamily: '"Caveat", cursive',
            textShadow: '0 4px 12px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5)',
            WebkitTextStroke: '1px rgba(0, 0, 0, 0.8)',
            paintOrder: 'stroke fill',
          }}
        >
          Doug&apos;s Found Wood
        </h1>
      </div>
    </div>
  );
};

export default TextOverlay;
