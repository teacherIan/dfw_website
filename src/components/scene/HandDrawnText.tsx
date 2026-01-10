import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HandDrawnTextProps {
  show: boolean;
}

const HandDrawnText = ({ show }: HandDrawnTextProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsAnimating(true);
    }
  }, [show]);

  if (!show) return null;

  // TODO: Replace this placeholder path with actual SVG path data from text-to-svg conversion
  // This is a simple placeholder - you'll paste the real path data here
  const textPath = "M 10 80 Q 95 10 180 80";

  // Animation variants for the path drawing effect
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          duration: 3,
          ease: "easeInOut",
        },
        opacity: {
          duration: 0.3,
        },
      },
    },
  };

  // Fill animation happens after stroke is drawn
  const fillVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 2.5, // Start filling near the end of stroke animation
        duration: 0.8,
        ease: "easeIn",
      },
    },
  };

  return (
    <div
      className="title-overlay absolute left-0 right-0 z-40 flex w-full justify-center pointer-events-none select-none"
    >
      <svg
        viewBox="0 0 800 200"
        className="w-full max-w-4xl px-4 pb-4 lg:pb-8 pt-2"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
        }}
      >
        {/* Stroke animation layer */}
        <motion.path
          d={textPath}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          variants={pathVariants}
          initial="hidden"
          animate={isAnimating ? "visible" : "hidden"}
        />
        
        {/* Fill layer that appears after stroke */}
        <motion.path
          d={textPath}
          fill="white"
          stroke="rgba(0, 0, 0, 0.8)"
          strokeWidth="1"
          variants={fillVariants}
          initial="hidden"
          animate={isAnimating ? "visible" : "hidden"}
        />
      </svg>
    </div>
  );
};

export default HandDrawnText;
