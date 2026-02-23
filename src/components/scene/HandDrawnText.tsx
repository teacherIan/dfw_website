import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useControls } from 'leva';
import { LETTER_PATHS, LETTER_COUNT } from '../../constants/letterPaths';
import { useWindowWidth } from '../../hooks';

 type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

interface HandDrawnTextProps {
  show: boolean;
  isExiting?: boolean;
  controlsStore?: LevaStore;
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

// Exit animation - reverse of entrance (unfill, then undraw)
const EXIT_STAGGER_DELAY = 0.04; // Stagger between letters
const EXIT_EASE = [0.25, 0.8, 0.25, 1] as const; // Smooth easing

// Emerge effect settings
const EMERGE_SCALE_START = 1.15; // Start larger (pressing toward viewer)
// NOTE: Using Framer Motion's `y` property instead of `translateY` for SVG transforms.
// The `y` property works reliably on SVG <g> elements.
const EMERGE_Y_START = -20; // Start above, settle down into place

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
const HandDrawnText = ({ show, isExiting = false, controlsStore }: HandDrawnTextProps) => {
  const { isPortrait, isSmallLandscape, isTablet, isIpadPro } = useWindowWidth();

  // Title size controls organized by breakpoint
  const titleDesktop = useControls('🏠 Base.✏️ Title.Desktop (1200px+)', {
    desktopTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
  }, { collapsed: true }, { store: controlsStore });

  const titleIpadPro = useControls('🏠 Base.✏️ Title.iPad Pro (1000-1199px)', {
    ipadProTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
  }, { collapsed: true }, { store: controlsStore });

  const titleTablet = useControls('🏠 Base.✏️ Title.Tablet (700-999px)', {
    tabletTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
  }, { collapsed: true }, { store: controlsStore });

  const titleSmall = useControls('🏠 Base.✏️ Title.Small Landscape (400-699px)', {
    smallTitleScale: { value: 1.1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
  }, { collapsed: true }, { store: controlsStore });

  const titlePortrait = useControls('🏠 Base.✏️ Title.Portrait (<400px)', {
    portraitTitleScale: { value: 1, min: 0.5, max: 2, step: 0.05, label: 'Scale' },
  }, { collapsed: true }, { store: controlsStore });

  const titleScale = isPortrait
    ? titlePortrait.portraitTitleScale
    : isSmallLandscape
      ? titleSmall.smallTitleScale
      : isTablet
        ? titleTablet.tabletTitleScale
        : isIpadPro
          ? titleIpadPro.ipadProTitleScale
          : titleDesktop.desktopTitleScale;

  // Keep mounted during exit animation so we can animate out
  if (!show && !isExiting) return null;

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

            // Exit timing - reverse order (last letter exits first), simple slide down
            const reverseIndex = LETTER_COUNT - 1 - index;
            const exitDelay = reverseIndex * EXIT_STAGGER_DELAY;

            // Calculate center point for transform origin
            const centerX = letter.startX + 12;
            const centerY = letter.startY;

            return (
              <motion.g
                key={index}
                initial={{ opacity: 0, y: EMERGE_Y_START }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  opacity: { delay: emergeStart, duration: EMERGE_DURATION * 0.6, ease: 'easeOut' },
                  y: { delay: emergeStart, duration: EMERGE_DURATION, ease: SETTLE_EASE },
                }}
              >
                {/* Inner g for scale transform */}
                <motion.g
                  initial={{ scale: EMERGE_SCALE_START }}
                  animate={{ scale: isExiting ? 0 : 1 }}
                  style={{
                    originX: `${centerX}px`,
                    originY: `${centerY}px`,
                  }}
                  transition={{
                    scale: isExiting
                      ? { delay: exitDelay + FILL_DURATION * 0.8 + STROKE_DURATION * 1.2, duration: STROKE_DURATION * 0.5, ease: EXIT_EASE }
                      : { delay: emergeStart, duration: EMERGE_DURATION, ease: SETTLE_EASE },
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
                    initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 0.9 }}
                    animate={{
                      pathLength: isExiting ? 0 : 1,  // Undraw on exit (reverse of entrance)
                      fillOpacity: isExiting ? 0 : 1,  // Unfill on exit
                      strokeOpacity: isExiting ? 0.9 : 0.2,  // Stroke appears as fill drains
                    }}
                    transition={
                      isExiting
                        ? {
                            // Reverse of entrance: unfill first, then undraw (slower for elegance)
                            fillOpacity: { delay: exitDelay, duration: FILL_DURATION * 1.5, ease: FILL_EASE },
                            strokeOpacity: { delay: exitDelay, duration: FILL_DURATION * 0.8, ease: 'easeOut' },
                            pathLength: { delay: exitDelay + FILL_DURATION * 0.8, duration: STROKE_DURATION * 1.5, ease: DRAW_EASE },
                          }
                        : {
                            pathLength: { delay: strokeStart, duration: STROKE_DURATION, ease: DRAW_EASE },
                            fillOpacity: { delay: fillStart, duration: FILL_DURATION, ease: FILL_EASE },
                            strokeOpacity: { delay: fillStart + FILL_DURATION * 0.3, duration: FILL_DURATION * 0.7, ease: 'easeOut' },
                          }
                    }
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
