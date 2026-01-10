import clsx from 'clsx';
import { motion } from 'framer-motion';
import { LOGO_PATH } from '../../constants/logoPath';

interface TextOverlayProps {
  show: boolean;
}

/**
 * TextOverlay component for displaying the "Doug's Found Wood" title
 * Centered at the bottom of the screen with a hand-drawn animation using SVG path
 * Responsive design for mobile devices
 */
const TextOverlay = ({ show }: TextOverlayProps) => {
  if (!show) return null;

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0, fillOpacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      fillOpacity: 1,
      transition: {
        pathLength: { duration: 2.5, ease: "easeInOut" },
        opacity: { duration: 0.2 },
        fillOpacity: { delay: 2, duration: 0.8, ease: "easeOut" }
      }
    }
  };

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
      <div className="px-4 pb-4 lg:pb-8 pt-2">
        <svg
          viewBox="0 0 646.076 89.889"
          className={clsx(
            'w-[85vw] sm:w-[500px] md:w-[600px] lg:w-[650px] xl:w-[700px]',
            'h-auto',
            'drop-shadow-lg'
          )}
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))'
          }}
        >
          <motion.path
            d={LOGO_PATH}
            fill="white"
            stroke="white"
            strokeWidth="2"
            variants={pathVariants}
            initial="hidden"
            animate="visible"
          />
        </svg>
      </div>
    </div>
  );
};

export default TextOverlay;
