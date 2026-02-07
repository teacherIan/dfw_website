// Utility to load all gallery images
// Uses Vite's import.meta.glob to load images from the gallery directory

export interface GalleryImage {
  src: string;
  category: string;
  name: string;
  width?: number;
  height?: number;
}

// Get all images from the gallery folder and subfolders
// We exclude the "cropped" folder as those might be processed assets, unless specified otherwise
// We also exclude the "other" folder if it's not meant for the main show
const imageModules = import.meta.glob('/src/gallery/**/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});

export const getGalleryImages = (): GalleryImage[] => {
  const images: GalleryImage[] = [];

  for (const path in imageModules) {
    // Skip if it's in the cropped folder or other excluded folders if needed
    if (path.includes('/cropped/')) continue;
    
    // Extract category from folder name
    const parts = path.split('/');
    // path structure: /src/gallery/[category]/[filename] or /src/gallery/[filename]
    // parts: ['', 'src', 'gallery', 'category', 'filename'] or ['', 'src', 'gallery', 'filename']
    
    let category = 'misc';
    let filename = '';
    
    if (parts.length >= 5) {
      category = parts[3];
      filename = parts[4];
    } else {
      filename = parts[3];
    }
    
    // Clean up filename for display
    const name = filename.split('.')[0].replace(/[_-]/g, ' ');

    images.push({
      src: imageModules[path] as string,
      category,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    });
  }

  return images;
};
