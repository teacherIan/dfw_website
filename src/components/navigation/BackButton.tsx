import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import './navigation.css';

interface BackButtonProps {
  onClick: () => void;
}

/**
 * Blueprint-style circular back button with Exit label and arrow
 * Appears when viewing Ethos, Contact, or Gallery scenes
 * On mobile: just the button. On desktop: button + arrow + Exit label
 * Uses portal to render directly to body for reliable fixed positioning on mobile
 */
const BackButton = ({ onClick }: BackButtonProps) => {
  return createPortal(
    <motion.div
      className="fixed top-6 left-6 z-[60] flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Circular Blueprint Button */}
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'nav-button-circle',
          'pointer-events-auto'
        )}
        style={{
          width: '60px',
          height: '60px',
        }}
        aria-label="Go back to home"
      >
        <BlueprintButtonSVG />
      </button>

      {/* Arrow pointing to button - hidden on mobile */}
      <svg
        className="hidden md:block"
        viewBox="0 0 50 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '50px',
          height: '30px',
          overflow: 'visible',
        }}
      >
        {/* Curved arrow line */}
        <path
          d="M48 15 C 35 15, 25 8, 15 10 C 8 12, 4 15, 2 15"
          stroke="#333"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        {/* Arrowhead pointing left */}
        <path
          d="M6 11 L2 15 L6 19"
          stroke="#333"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.8"
        />
      </svg>

      {/* Exit label - hidden on mobile */}
      <span
        className="hidden md:block"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.4rem',
          color: '#333',
        }}
      >
        Exit
      </span>
    </motion.div>,
    document.body
  );
};

export default BackButton;
