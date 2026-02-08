import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type GalleryViewState = 'picker' | 'viewing';

interface GalleryState {
  viewState: GalleryViewState;
  selectedCategory: string | null;
  hoveredCategory: string | null;
}

interface GalleryContextValue extends GalleryState {
  setViewState: (state: GalleryViewState) => void;
  setSelectedCategory: (cat: string | null) => void;
  setHoveredCategory: (cat: string | null) => void;
  resetGallery: () => void;
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

interface GalleryProviderProps {
  children: ReactNode;
  visible?: boolean;
}

export const GalleryProvider = ({ children, visible = true }: GalleryProviderProps) => {
  const [viewState, setViewState] = useState<GalleryViewState>('picker');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const resetGallery = useCallback(() => {
    setViewState('picker');
    setSelectedCategory(null);
    setHoveredCategory(null);
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
        setViewState,
        setSelectedCategory,
        setHoveredCategory,
        resetGallery,
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
