import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGallery } from '../../contexts/GalleryContext';
import { getImagesForCategory, type ProductImage } from './image_info';
import BlueprintButtonSVG from '../navigation/BlueprintButtonSVG';
import { fontFamilyMap } from '../../constants';
import styles from './BlueprintPhotoViewer.module.css';

interface ImageInfoPanelProps {
  image: ProductImage | null;
  isVisible: boolean;
}

const ImageInfoPanel = ({ image, isVisible }: ImageInfoPanelProps) => {
  if (!image) return null;

  return (
    <motion.div
      className={styles.info}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <h3
        className={styles.infoName}
        style={{ fontFamily: fontFamilyMap['Caveat'] }}
      >
        {image.name}
      </h3>
      <p className={styles.infoDescription}>
        {image.description}
      </p>
    </motion.div>
  );
};

const SWIPE_THRESHOLD = 50;

export const BlueprintPhotoViewer = () => {
  const {
    selectedCategory,
    selectedImageIndex,
    isViewerOpen,
    closeViewer,
    setSelectedImageIndex,
  } = useGallery();

  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const images = selectedCategory ? getImagesForCategory(selectedCategory) : [];
  const currentImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isViewerOpen) return;

    if (e.key === 'Escape') {
      if (isZoomed) {
        setIsZoomed(false);
      } else {
        closeViewer();
      }
    } else if (e.key === 'ArrowRight' && selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % images.length;
      setSelectedImageIndex(nextIndex);
    } else if (e.key === 'ArrowLeft' && selectedImageIndex !== null) {
      const prevIndex = (selectedImageIndex - 1 + images.length) % images.length;
      setSelectedImageIndex(prevIndex);
    }
  }, [isViewerOpen, isZoomed, selectedImageIndex, images.length, closeViewer, setSelectedImageIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Lock body scroll when viewer is open
  useEffect(() => {
    if (isViewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isViewerOpen]);

  const handlePrev = useCallback(() => {
    if (selectedImageIndex !== null) {
      const prevIndex = (selectedImageIndex - 1 + images.length) % images.length;
      setSelectedImageIndex(prevIndex);
    }
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const handleNext = useCallback(() => {
    if (selectedImageIndex !== null) {
      const nextIndex = (selectedImageIndex + 1) % images.length;
      setSelectedImageIndex(nextIndex);
    }
  }, [selectedImageIndex, images.length, setSelectedImageIndex]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeViewer();
    }
  }, [closeViewer]);

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  }, [handleNext, handlePrev]);

  if (!isViewerOpen || selectedImageIndex === null || images.length === 0) {
    return null;
  }

  const navButtonStyle = {
    position: 'absolute' as const,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(13, 40, 71, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    width: 'clamp(40px, 10vw, 56px)',
    height: 'clamp(40px, 10vw, 56px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 'clamp(20px, 5vw, 28px)',
    zIndex: 5,
    transition: 'background 0.2s, transform 0.2s',
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.viewer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleBackdropClick}
        style={{
          background: 'rgba(10, 21, 37, 0.95)',
        }}
      >
        {/* Custom toolbar */}
        <div className={styles.toolbar}>
          <button
            type="button"
            className={styles.close}
            onClick={closeViewer}
            aria-label="Close viewer"
          >
            <BlueprintButtonSVG />
          </button>
          <span className={styles.counter}>
            {selectedImageIndex + 1} / {images.length}
          </span>
        </div>

        {/* Main image with swipe support */}
        <motion.div
          style={{
            position: 'absolute',
            inset: '60px 0 140px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          key={selectedImageIndex}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentImage?.img}
            alt={currentImage?.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '2px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              userSelect: 'none',
            }}
            draggable={false}
          />
        </motion.div>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              style={{ ...navButtonStyle, left: '20px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(26, 58, 92, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(13, 40, 71, 0.8)';
              }}
            >
              &#8249;
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              style={{ ...navButtonStyle, right: '20px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(26, 58, 92, 0.9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(13, 40, 71, 0.8)';
              }}
            >
              &#8250;
            </button>
          </>
        )}

        {/* Info panel */}
        <ImageInfoPanel image={currentImage} isVisible={isViewerOpen} />
      </motion.div>
    </AnimatePresence>
  );
};

export default BlueprintPhotoViewer;
