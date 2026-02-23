import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CategoryKey } from '../components/gallery/image_info';

export type GalleryViewState = 'picker' | 'grid' | 'viewing';

interface GalleryState {
  viewState: GalleryViewState;
  selectedCategory: CategoryKey | null;
  hoveredCategory: string | null;
  selectedImageIndex: number | null;
  isViewerOpen: boolean;
}

interface GalleryContextValue extends GalleryState {
  setViewState: (state: GalleryViewState) => void;
  setSelectedCategory: (cat: CategoryKey | null) => void;
  setHoveredCategory: (cat: string | null) => void;
  resetGallery: () => void;
  // New actions for photo viewer
  goToCategory: (category: CategoryKey) => void;
  backToPicker: () => void;
  openViewer: (index: number) => void;
  closeViewer: () => void;
  setSelectedImageIndex: (index: number | null) => void;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

interface GalleryProviderProps {
  children: ReactNode;
  visible?: boolean;
}

export const GalleryProvider = ({ children, visible = true }: GalleryProviderProps) => {
  const [viewState, setViewState] = useState<GalleryViewState>('picker');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const resetGallery = useCallback(() => {
    setViewState('picker');
    setSelectedCategory(null);
    setHoveredCategory(null);
    setSelectedImageIndex(null);
    setIsViewerOpen(false);
  }, []);

  const goToCategory = useCallback((category: CategoryKey) => {
    setSelectedCategory(category);
    setViewState('grid');
  }, []);

  const backToPicker = useCallback(() => {
    setViewState('picker');
    setSelectedCategory(null);
    setSelectedImageIndex(null);
    setIsViewerOpen(false);
  }, []);

  const openViewer = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsViewerOpen(true);
    setViewState('viewing');
  }, []);

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setSelectedImageIndex(null);
    setViewState('grid');
  }, []);

  // Reset to picker when gallery becomes invisible
  useEffect(() => {
    if (!visible) {
      resetGallery();
    }
  }, [visible, resetGallery]);

  return (
    <GalleryContext.Provider
      value={{
        viewState,
        selectedCategory,
        hoveredCategory,
        selectedImageIndex,
        isViewerOpen,
        setViewState,
        setSelectedCategory,
        setHoveredCategory,
        resetGallery,
        goToCategory,
        backToPicker,
        openViewer,
        closeViewer,
        setSelectedImageIndex,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = (): GalleryContextValue => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error('useGallery must be used within a GalleryProvider');
  }
  return context;
};
