import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useControls, folder } from 'leva';
import { LETTER_PATHS, LETTER_COUNT } from '../../constants/letterPaths';
import { useWindowWidth } from '../../hooks';

interface HandDrawnTextProps {
  show: boolean;
}

// ============================================================================
// Animation Philosophy:
//
// Each letter goes through three graceful phases:
// 1. EMERGE: Letter fades in and settles (like being pressed onto paper)
// 2. DRAW: Stroke traces the letter outline
// 3. FILL: Color floods in, stroke fades to let fill shine
//
// The phases overlap slightly for fluid, continuous motion.
// ============================================================================

// Overall timing
const TOTAL_DURATION = 3.2; // Total time for all letters to complete
const STAGGER_DELAY = TOTAL_DURATION / (LETTER_COUNT + 2); // +2 for breathing room

// Phase durations (in seconds)
const EMERGE_DURATION = 0.35; // Settling onto the page
const STROKE_DURATION = 0.45; // Drawing the outline
const FILL_DURATION = 0.3; // Fill flooding in

// Emerge effect settings
const EMERGE_SCALE_START = 1.15; // Start larger (pressing toward viewer)
// NOTE: translateY doesn't seem to work on SVG <g> elements in Framer Motion.
// The Y movement effect is not visible, but the scale animation works fine.
// Keeping this value in case a future fix makes it work.
const EMERGE_Y_START = -20; // Start well above (currently not working)

// Custom easing curves
const SETTLE_EASE = [0.22, 1.8, 0.36, 1] as const; // Very springy overshoot for settling
const DRAW_EASE = [0.45, 0, 0.55, 1] as const; // Smooth ease-in-out for drawing
const FILL_EASE = [0.22, 1, 0.36, 1] as const; // Quick start, gentle finish

/**
 * HandDrawnText component for displaying the "Doug's Found Wood" title
 * with an elegant hand-drawn animation effect.
 *
 * Each letter emerges, gets drawn, then fills - creating the feeling
 * of watching someone hand-letter the title in real-time.
 */
const HandDrawnText = ({ show }: HandDrawnTextProps) => {
  const { isPortrait, isSmallLandscape, isTablet, isIpadPro } = useWindowWidth();

  // Title size controls organized in folders
  const layout = useControls('📐 Layout', {
    '🖥️ Desktop Title': folder({
      desktopTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
    }, { collapsed: true }),
    '📱 iPad Pro Title (1000-1199px)': folder({
      ipadProTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
    }, { collapsed: true }),
    '📱 Tablet Title (700-999px)': folder({
      tabletTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
    }, { collapsed: true }),
    '📱 Small Landscape Title (400-699px)': folder({
      smallTitleScale: { value: 1.1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
    }, { collapsed: true }),
    '📱 Portrait Title (<400px)': folder({
      portraitTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
    }, { collapsed: true }),
  }, { collapsed: true });

  const titleScale = isPortrait
    ? layout.portraitTitleScale
    : isSmallLandscape
      ? layout.smallTitleScale
      : isTablet
        ? layout.tabletTitleScale
        : isIpadPro
          ? layout.ipadProTitleScale
          : layout.desktopTitleScale;

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
      <div className="px-4 pb-4 lg:pb-8 pt-2">
        <svg
          viewBox="0 0 646.076 89.889"
          className={clsx(
            'w-[85vw] sm:w-[500px] md:w-[600px] lg:w-[650px] xl:w-[700px]',
            'h-auto'
          )}
          style={{
            filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))',
            transform: `scale(${titleScale})`,
            transformOrigin: 'center top',
          }}
        >
          {LETTER_PATHS.map((letter, index) => {
            // Calculate when this letter's animation begins
            const startDelay = index * STAGGER_DELAY;

            // Phase timing (with overlaps for fluid motion)
            const emergeStart = startDelay;
            const strokeStart = startDelay + EMERGE_DURATION * 0.4; // Start drawing as emerge settles
            const fillStart = startDelay + EMERGE_DURATION + STROKE_DURATION * 0.5; // Fill as stroke finishes

            // Calculate center point for transform origin
            const centerX = letter.startX + 12;
            const centerY = letter.startY;

            return (
              <motion.g
                key={index}
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: 1
                }}
                transition={{
                  opacity: {
                    delay: emergeStart,
                    duration: EMERGE_DURATION * 0.6,
                    ease: 'easeOut',
                  },
                }}
              >
                {/* Inner g for scale + translate transforms */}
                <motion.g
                  initial={{
                    scale: EMERGE_SCALE_START,
                    translateY: EMERGE_Y_START
                  }}
                  animate={{
                    scale: 1,
                    translateY: 0
                  }}
                  style={{
                    originX: `${centerX}px`,
                    originY: `${centerY}px`
                  }}
                  transition={{
                    scale: {
                      delay: emergeStart,
                      duration: EMERGE_DURATION,
                      ease: SETTLE_EASE,
                    },
                    translateY: {
                      delay: emergeStart,
                      duration: EMERGE_DURATION,
                      ease: SETTLE_EASE,
                    },
                  }}
                >
                <motion.path
                  d={letter.d}
                  fill="white"
                  fillRule="evenodd"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{
                    pathLength: 0,
                    fillOpacity: 0,
                    strokeOpacity: 0.9
                  }}
                  animate={{
                    pathLength: 1,
                    fillOpacity: 1,
                    strokeOpacity: 0.2 // Stroke fades as fill takes over
                  }}
                  transition={{
                    pathLength: {
                      delay: strokeStart,
                      duration: STROKE_DURATION,
                      ease: DRAW_EASE,
                    },
                    fillOpacity: {
                      delay: fillStart,
                      duration: FILL_DURATION,
                      ease: FILL_EASE,
                    },
                    strokeOpacity: {
                      delay: fillStart + FILL_DURATION * 0.3,
                      duration: FILL_DURATION * 0.7,
                      ease: 'easeOut',
                    },
                  }}
                />
                </motion.g>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default HandDrawnText;
