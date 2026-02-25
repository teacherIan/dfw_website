import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './EthosOverlay.module.css';

// Import images from newspaper folder
import houseExterior from '../../newspaper/house_upscaled Large.jpeg';
import houseInterior from '../../newspaper/inside.jpg';
import latchDetail from '../../newspaper/latch_fixed Medium.jpeg';

interface EthosOverlayProps {
  isEntering?: boolean;  // True when splat is animating out toward ethos
  isReturning?: boolean; // True when returning home from ethos
  exitDuration?: number; // Duration of exit animation in seconds (for timing fade-in)
  returnDuration?: number; // Duration of return animation in seconds
  onFadeInComplete?: () => void; // Callback when fade-in animation completes
}

// Fade-in animation duration
const FADE_IN_DURATION = 0.8;

/**
 * EthosOverlay - Recreation of the Bangor Daily News article
 * "THE HOUSE THAT DOUG BUILT" - Living Section, April 15-16, 2006
 * By Sharon Kiley Mack - Complete article (both pages)
 */
const EthosOverlay = ({ isEntering = false, isReturning = false, exitDuration = 5.9, returnDuration = 2.6, onFadeInComplete }: EthosOverlayProps) => {
  // Delay fade-in to start 0.5s before exit animation finishes (overlap for smoother transition)
  // fadeDelay = exitDuration - fadeDuration - overlap
  const fadeDelay = isEntering ? Math.max(0, exitDuration - FADE_IN_DURATION - 0.5) : 0;
  const controls = useAnimation();
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);

  useEffect(() => {
    // Handle entrance animation
    if (!isReturning) {
      controls.start({
        opacity: 1,
        backgroundColor: '#f8f5ef',
        transition: { duration: FADE_IN_DURATION, delay: fadeDelay, ease: 'easeOut' }
      }).then(() => {
        setHasAnimatedIn(true);
        onFadeInComplete?.();
      });
    }
  }, [isReturning, fadeDelay, controls, onFadeInComplete]);

  useEffect(() => {
    // Handle exit animation when returning home
    // Fade out over the full return duration so overlay fades as splat reforms
    if (isReturning && hasAnimatedIn) {
      controls.start({
        opacity: 0,
        backgroundColor: '#ffffff',
        transition: { duration: returnDuration, ease: 'easeInOut' }
      });
    }
  }, [isReturning, hasAnimatedIn, controls, returnDuration]);

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0, backgroundColor: '#f8f5ef' }}
      animate={controls}
    >
      <div className={styles.newspaper}>
        {/* Newspaper masthead */}
        <header className={styles.masthead}>
          <div className={styles.mastheadRow}>
            <h1 className={styles.sectionTitle}>Living</h1>
            <div className={styles.mastheadRight}>
              <span>Reeser Manley <strong>S2</strong></span>
              <span>Emmet Meara <strong>S6</strong></span>
              <span>Taste Buds <strong>S6</strong></span>
            </div>
          </div>
          <div className={styles.mastheadSub}>
            <span className={styles.dateLine}>Saturday/Sunday, April 15-16, 2006</span>
            <span className={styles.sectionLetter}>Section S</span>
          </div>
        </header>

        {/* Main content area */}
        <article className={styles.article}>
          {/* House image floated left with caption */}
          <figure className={styles.houseImageFloat}>
            <figcaption className={styles.sideCaption}>
              Doug Malloy's Athens home started as a simple log cabin and has slowly expanded over the years.
            </figcaption>
            <img src={houseExterior} alt="Doug Malloy's Athens home" />
          </figure>

          {/* Headline */}
          <div className={styles.headlineArea}>
            <h2 className={styles.headline}>
              <span className={styles.headlineSmall}>THE HOUSE THAT</span>
              <span className={styles.headlineLarge}>DOUG</span>
              <span className={styles.headlineMedium}>BUILT</span>
            </h2>
          </div>

          {/* Byline */}
          <p className={styles.byline}>
            <strong>By SHARON KILEY MACK</strong><br />
            OF THE NEWS STAFF
          </p>

          {/* Subtitle floated right */}
          <aside className={styles.subtitleFloat}>
            <p className={styles.subtitle}>
              <em>Athens man's<br />
              magical structure<br />
              created from<br />
              the land's wood<br />
              and stone</em>
            </p>
          </aside>

          {/* Article text with inline images */}
          <div className={styles.articleBody}>
            <p>
              <span className={styles.dropCap}>I</span>
              turned where the driveway sign said "No Way" and began winding past little vignettes of Maine — an overgrown field, a stone wall, a gnarled tree in a clearing, a large stand of pines. The drive curled in an "s," and waiting at the end of the road was Doug Malloy with a cup of coffee in his hand.
            </p>

            <p>
              An April breeze ruffling his white hair, he smiled at my reaction upon first seeing the magical, whimsical house he built in the Somerset County town of Athens.
            </p>

            <p>
              When I caught my breath, I could only ask, "How did you do this?"
            </p>

            <p>
              Visiting his home was not a construction tour but a purely emotional experience.
            </p>

            <p>
              The house, built over the past 40 years — by hand and by himself — seems to visually grow up from the ground and out through the forest. The exterior is a patchwork of cedar shakes and logs, curved walls, swooping roof lines, scrollwork edging, stained-glass windows and fieldstone chimneys, all bound together with wild imagination.
            </p>

            <p>
              You almost expect a hobbit to walk through the arched, 6-inch-thick front door — or Snow White and the seven dwarfs, at the very least.
            </p>

            {/* Interior image floated left */}
            <figure className={styles.interiorImageFloat}>
              <img src={houseInterior} alt="Doug Malloy walks around his Athens home" />
              <figcaption>Doug Malloy walks around his Athens home recently. He built the four-story house — everything from the door latches to stained-glass windows — starting in the 1960s.</figcaption>
            </figure>

            <p>
              A mural of cedar shakes decorates the side of one outbuilding. The roofline of the woodshed emulates a Japanese teahouse. An enormous tamarack root, arching gracefully and aged to a lustrous silver, holds up the roof of a third-floor porch. Every door is arched, every window frame rounded, every latch a work of art.
            </p>

            {/* Latch image floated right */}
            <figure className={styles.latchImageFloat}>
              <span className={styles.photoCredit}>BANGOR DAILY NEWS PHOTOS<br />BY GABOR DEGRE</span>
              <img src={latchDetail} alt="Hand-crafted wooden door latch" />
              <figcaption>This window shutter designed and built by Doug Malloy features a latch with a double-cam mechanism.</figcaption>
            </figure>

            <p>
              Inside, from the soft curves of the kitchen cupboards to the china closet made of elm in the living room to the cedar bathtub — which hasn't leaked in 30 years — he built them all.
            </p>

            <p>
              There is not a hard edge or a squared corner to be found. Visitors can't help caressing the rounded doorways or the silky soft banisters. This is a house that begs to be touched, not just seen.
            </p>

            <p>
              Doug laughed at that, saying he began by just eyeballing all measurements. "I never used a tape measure. In one room, the wall on one side is a full foot longer than the one on the other," he said.
            </p>

            <p>
              He was also quick to explain that he didn't really know what he was doing when he began building his home in the late 1960s. Doug was a chemical engineer, working in plastics in Michigan. But after taking a leave of absence from his engineering job, he visited Maine and never went back.
            </p>

            <p>
              "I didn't know a thing about construction," he said. He is, however, a smart guy and a quick learner. He confidently started constructing a small cedar log cabin, using only materials from his 70 acres.
            </p>

            <p>
              He quickly discovered he wasn't really alone in his woods. Doug had a squatter, a middle-aged man who was a bit down on his luck and took up residence at the head of the driveway.
            </p>

            <p>
              "Old John would show up each year and tell me, 'I haven't really gotten it together, Doug. Can I spend the winter here?' and he lived in the old trailer down by the road," Doug said. Old John would come back and say the same thing each year and every year Doug would invite him to stay. He ended up sharing the land for 25 years. "He was my gatekeeper," Doug said.
            </p>

            <p>
              The two men forged an easy, quiet friendship.
            </p>

            <p>
              Old John would sit and mostly just watch Doug work. Every so often, though, the squatter would make a comment such as "If a man wanted to, he could…," followed by a bit of construction advice.
            </p>

            <p>
              "Of course, his way was the right way," Doug admitted. In this gentle manner, Old John imparted his knowledge to the rookie woodsman until he passed away five years ago.
            </p>

            <p>
              Over the past four decades, Doug imagined and dreamed, built and built, swooped and swirled until the home now stands four stories and includes a sunken greenhouse, three outbuildings, a workshop, a sap house, and — a tranquil walk through the woods reveals — a summer house on a hand-built pond, complete with sauna and dock for swimming.
            </p>

            <p>
              He shares the home with his son, Ian, 22, who attends Thomas College and recently spent his spring break nailing shakes on one of the house's roofs.
            </p>

            <p>
              "This is my little art form. If I kept track of the hours that it takes me, I wouldn't want to do it," Doug admitted. "The nice thing about this little log and stone house is that I have spent lots and lots of time in its creation but relatively little money."
            </p>

            <p>
              When asked if his construction is rooted in environmentalism or is because he is a cheap Scotsman, he laughed. "Hmmm," he said. "That's a good question."
            </p>

            <p>
              "I do believe in treading lightly on the earth," he said. "I practice that in the way that I harvest. I have become so attached to these trees in the past 30 years that it sometimes becomes too hard to cut them down. It is a very good thing when one falls or is blown down." He carefully manages his forest, saying, "When I leave this place, I will leave the good wood for somebody else."
            </p>

            <p>
              "The rest of the world has passed this by," he said of the way he has turned scrap wood, leftovers and others' discards into his artistic home. "I feel good when I can use wood such as old telephone poles for wood shakes. The whole house comes from the land."
            </p>

            <p>
              "The nice thing about wood is that it naturally grows into shapes," Doug said. "I always build, whether it is the house or my furniture, by following what the wood suggests. It tells me by its shape if it is a chair, a window, whatever. Cedar is the best. It curves and sweeps and it's rugged."
            </p>

            <p>
              Making his one-of-a-kind door latches has become almost a game. Some are simple cherry wood burls while others are a foot tall and complicated. "I take this little joy each morning in operating one of the latches," he said.
            </p>

            <p>
              "People really take pleasure in seeing how things work," Doug said. "As more and more of the ability to fix things ourselves is taken away from us, we lose something as a culture, as a society."
            </p>

            <p>
              Semiretired these days, he works half-time as a science teacher at Madison High School and spends the rest of his time in his workshop creating custom furniture from branches, burls, roots and slabs. "Many people come to Maine with a vision of the Maine wilderness and my furniture fits that vision perfectly," he said.
            </p>

            <p>
              But mostly, he continues to work on the house. His latest venture is to create a slow, gentle curve of the roof of the main, original cabin. Sweeping his hand through the air to illustrate, Doug said, "It will be lovely."
            </p>
          </div>
        </article>
      </div>
    </motion.div>
  );
};

export default EthosOverlay;
