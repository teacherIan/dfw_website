import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import BlueprintButtonSVG from './BlueprintButtonSVG';
import { HandlineArt } from 'handline';
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
        className={clsx('nav-button-circle', 'nav-button-circle--size-sm', 'pointer-events-auto')}
        aria-label="Go back to home"
      >
        <BlueprintButtonSVG />
      </button>

      {/* Arrow pointing to button - hidden on mobile */}
      <HandlineArt
        className="hidden md:block"
        viewBox="0 0 50 30"
        d="M48 15 C 35 15, 25 8, 15 10 C 8 12, 4 15, 2 15"
        seed="back-button"
        color="#333"
        pen={{ base: 'ink', width: 1.1, jitter: 0.1, taperIn: 0.4, taperOut: 0.75 }}
        head={{ kind: 'chevron', size: 5.5, angle: 40 }}
        delay={250}
        timing={{ min: 380, max: 480 }}
        style={{ width: '50px', height: '30px', opacity: 0.8 }}
      />

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
