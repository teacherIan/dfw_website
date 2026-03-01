import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../contexts/GalleryContext';
import { getImagesForCategory, categoryLabels } from './image_info';
import BlueprintButtonSVG from '../navigation/BlueprintButtonSVG';
import { WaveArrow } from '../navigation/DesktopArrows';
import { fontFamilyMap } from '../../constants';
import styles from './BlueprintGalleryGrid.module.css';

// Chevron SVG for scroll arrows
const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={direction === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'} />
  </svg>
);

export const BlueprintGalleryGrid = () => {
  const { selectedCategory, backToPicker } = useGallery();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const images = selectedCategory ? getImagesForCategory(selectedCategory) : [];
  const categoryLabel = selectedCategory ? categoryLabels[selectedCategory] : '';
  const activeImage = images[activeIndex] || null;

  // Update scroll state - now checking the container, not the row
  const updateScrollState = useCallback(() => {
    const container = thumbnailContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const threshold = 5;

    // Check if scrolling is needed at all
    const scrollNeeded = scrollWidth > clientWidth + threshold;
    setNeedsScroll(scrollNeeded);

    setCanScrollLeft(scrollLeft > threshold);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - threshold);
  }, []);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Setup scroll state listeners
  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (!container) return;

    // Delay initial check to ensure thumbnails are rendered
    const initialCheckTimer = requestAnimationFrame(() => {
      updateScrollState();
    });
    // Backup check after a short delay (for images loading)
    const backupTimer = setTimeout(updateScrollState, 200);

    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);

    return () => {
      cancelAnimationFrame(initialCheckTimer);
      clearTimeout(backupTimer);
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState, images.length, isVisible]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // If expanded, only handle Escape
    if (isExpanded) {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
      return;
    }

    // Arrow keys navigate thumbnails
    if (e.key === 'ArrowRight') {
      const nextIndex = (activeIndex + 1) % images.length;
      setActiveIndex(nextIndex);
      scrollThumbnailIntoView(nextIndex);
    } else if (e.key === 'ArrowLeft') {
      const prevIndex = (activeIndex - 1 + images.length) % images.length;
      setActiveIndex(prevIndex);
      scrollThumbnailIntoView(prevIndex);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(true);
    } else if (e.key === 'Escape') {
      handleBack();
    }
  }, [isExpanded, activeIndex, images.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll thumbnail into view
  const scrollThumbnailIntoView = (index: number) => {
    const container = thumbnailContainerRef.current;
    const row = container?.querySelector(`.${styles.thumbnailRow}`);
    const thumbnail = row?.children[index] as HTMLElement;
    if (thumbnail) {
      thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleBack = () => {
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      backToPicker();
    }, 400);
  };

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleScrollLeft = () => {
    const container = thumbnailContainerRef.current;
    if (!container) return;
    container.scrollTo({
      left: container.scrollLeft - 200,
      behavior: 'smooth',
    });
  };

  const handleScrollRight = () => {
    const container = thumbnailContainerRef.current;
    if (!container) return;
    container.scrollTo({
      left: container.scrollLeft + 200,
      behavior: 'smooth',
    });
  };

  const handleImageClick = () => {
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  return (
    <div className={styles.grid}>
      <motion.div
        className={styles.paper}
        initial={{ opacity: 0.3 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className={styles.gridPattern} />

        {/* Header with circular exit button and title */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isVisible && !isExpanded ? 1 : 0, y: isVisible ? 0 : -20 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          <button
            type="button"
            className={`nav-button-circle nav-button-circle--size-sm ${styles.exitButton}`}
            onClick={handleBack}
            aria-label="Back to categories"
          >
            <BlueprintButtonSVG />
          </button>
          <span className={styles.backArrow}>
            <WaveArrow isVisible={isVisible} delay={200} />
          </span>
          <h2
            className={styles.title}
            style={{ fontFamily: fontFamilyMap['Caveat'] }}
          >
            {categoryLabel}
          </h2>
        </motion.div>

        {/* Thumbnail container with scroll arrows */}
        <motion.div
          ref={thumbnailContainerRef}
          className={styles.thumbnailContainer}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isVisible && !isExpanded ? 1 : 0, y: isVisible ? 0 : -10 }}
          transition={{ duration: 0.5, delay: 0.25, ease: 'easeOut' }}
        >
          {/* Left scroll arrow - only show when scrolling is needed */}
          {needsScroll && (
            <button
              type="button"
              className={styles.scrollArrow}
              onClick={handleScrollLeft}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
            >
              <ChevronIcon direction="left" />
            </button>
          )}

          {/* Thumbnail row */}
          <div className={styles.thumbnailRow}>
            {images.map((image, index) => (
              <motion.div
                key={image.orderNumber}
                className={`${styles.item} ${index === activeIndex ? styles.itemActive : ''}`}
                onClick={() => handleThumbnailClick(index)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: isVisible ? 1 : 0,
                  scale: isVisible ? 1 : 0.9,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  delay: isVisible ? index * 0.03 : 0,
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { type: 'spring', stiffness: 300, damping: 15 },
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={styles.frame}>
                  <img
                    src={image.img}
                    alt={image.name}
                    className={styles.image}
                    loading="lazy"
                  />
                  {/* Corner marks */}
                  <div className={`${styles.corner} ${styles.cornerTl}`} />
                  <div className={`${styles.corner} ${styles.cornerTr}`} />
                  <div className={`${styles.corner} ${styles.cornerBl}`} />
                  <div className={`${styles.corner} ${styles.cornerBr}`} />
                </div>
                <div
                  className={styles.label}
                  style={{ fontFamily: fontFamilyMap['Caveat'] }}
                >
                  {image.name}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right scroll arrow - only show when scrolling is needed */}
          {needsScroll && (
            <button
              type="button"
              className={styles.scrollArrow}
              onClick={handleScrollRight}
              disabled={!canScrollRight}
              aria-label="Scroll right"
            >
              <ChevronIcon direction="right" />
            </button>
          )}
        </motion.div>

        {/* Centered active image */}
        {activeImage && (
          <motion.div
            className={styles.main}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible && !isExpanded ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' }}
          >
            <motion.div
              className={styles.mainFrame}
              layoutId={`gallery-image-${activeIndex}`}
              onClick={handleImageClick}
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={activeImage.img}
                alt={activeImage.name}
                className={styles.mainImg}
              />
              {/* Corner marks */}
              <div className={`${styles.corner} ${styles.cornerTl}`} />
              <div className={`${styles.corner} ${styles.cornerTr}`} />
              <div className={`${styles.corner} ${styles.cornerBl}`} />
              <div className={`${styles.corner} ${styles.cornerBr}`} />
            </motion.div>

            {/* Product info below image */}
            <motion.div
              className={styles.info}
              key={`info-${activeIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h3
                className={styles.infoName}
                style={{ fontFamily: fontFamilyMap['Caveat'] }}
              >
                {activeImage.name}
              </h3>
              <p className={styles.infoDescription}>
                {activeImage.description}
              </p>
              <div className={styles.infoPrice}>
                {activeImage.price}
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Expanded image overlay */}
      <AnimatePresence>
        {isExpanded && activeImage && (
          <>
            {/* Backdrop */}
            <motion.div
              className={styles.expandBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleCloseExpanded}
            />

            {/* Expanded image wrapper - handles centering */}
            <div className={styles.expandedWrapper} onClick={handleCloseExpanded}>
              <motion.div
                className={styles.expandedFrame}
                layoutId={`gallery-image-${activeIndex}`}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <img
                  src={activeImage.img}
                  alt={activeImage.name}
                />
                {/* Corner marks */}
                <div className={`${styles.corner} ${styles.cornerTl}`} />
                <div className={`${styles.corner} ${styles.cornerTr}`} />
                <div className={`${styles.corner} ${styles.cornerBl}`} />
                <div className={`${styles.corner} ${styles.cornerBr}`} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlueprintGalleryGrid;
