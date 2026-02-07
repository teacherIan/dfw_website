import { useEffect, useState } from 'react';

export type GalleryViewState = 'picker' | 'viewing';

// Shared state for Gallery3D and BlueprintPicker communication
let galleryStateListeners: ((state: {
  viewState: GalleryViewState;
  selectedCategory: string | null;
  hoveredCategory: string | null;
}) => void)[] = [];

export const subscribeToGalleryState = (
  listener: (state: {
    viewState: GalleryViewState;
    selectedCategory: string | null;
    hoveredCategory: string | null;
  }) => void
) => {
  galleryStateListeners.push(listener);
  return () => {
    galleryStateListeners = galleryStateListeners.filter((l) => l !== listener);
  };
};

const notifyGalleryStateListeners = (state: {
  viewState: GalleryViewState;
  selectedCategory: string | null;
  hoveredCategory: string | null;
}) => {
  galleryStateListeners.forEach((l) => l(state));
};

// Global setters for BlueprintPicker to call
let globalSetHoveredCategory: ((cat: string | null) => void) | null = null;
let globalSetSelectedCategory: ((cat: string) => void) | null = null;

export const setGalleryHoveredCategory = (cat: string | null) => {
  globalSetHoveredCategory?.(cat);
};

export const setGallerySelectedCategory = (cat: string) => {
  globalSetSelectedCategory?.(cat);
};

/**
 * Gallery3D - State manager for gallery view
 * Currently only manages picker state - 3D gallery modes have been removed
 * The BlueprintPicker (2D DOM) handles the actual category selection UI
 */
export const Gallery3D = ({ visible }: { visible: boolean }) => {
  const [viewState, setViewState] = useState<GalleryViewState>('picker');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Expose setters globally
  useEffect(() => {
    globalSetHoveredCategory = setHoveredCategory;
    globalSetSelectedCategory = (cat: string) => {
      setSelectedCategory(cat);
      // For now, just log the selection - gallery viewing will be added later
      console.log('Selected category:', cat);
      // Don't change viewState to 'viewing' since we don't have gallery modes yet
      // setViewState('viewing');
    };
    return () => {
      globalSetHoveredCategory = null;
      globalSetSelectedCategory = null;
    };
  }, []);

  // Notify listeners when state changes
  useEffect(() => {
    notifyGalleryStateListeners({ viewState, selectedCategory, hoveredCategory });
  }, [viewState, selectedCategory, hoveredCategory]);

  // Reset to picker when gallery becomes invisible
  useEffect(() => {
    if (!visible) {
      setViewState('picker');
      setSelectedCategory(null);
      setHoveredCategory(null);
    }
  }, [visible]);

  // Currently returns null - BlueprintPicker (2D DOM) handles the UI
  // Gallery viewing modes will be added later
  return null;
};

export default Gallery3D;
