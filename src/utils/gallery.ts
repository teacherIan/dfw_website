// Utility to load all gallery images
// Uses Vite's import.meta.glob to load images from the gallery directory

import type { CategoryKey } from '../components/gallery/image_info';

export interface GalleryImage {
  src: string;
  category: string;
  name: string;
  /** Original source path from the glob, e.g. /src/gallery/chairs/chair_w_stool.png. */
  path: string;
  width?: number;
  height?: number;
}

// Curated preview image per category, by source filename. The picker shows
// this image as the category's cover instead of whichever file happens to
// sort first. Falls back to the first image if the named file isn't found.
const CATEGORY_PREVIEW: Partial<Record<CategoryKey, string>> = {
  chairs: 'chair_w_stool.png', // "Adirondack Chair with Ottoman"
  small_tables: 'coffee_table_side.jpeg', // same coffee table as the studio shot, better 3/4 angle (high-res copy of the grid's .png)
  large_tables: 'table_snow_fixed.png', // snow photoshopped out (replaces the old snowy adult_picnic_table.jpg)
};

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
      path,
    });
  }

  return images;
};

// Get images filtered by category
export const getImagesByCategory = (category: string): GalleryImage[] => {
  return getGalleryImages().filter((img) => img.category === category);
};

// Get unique categories with their first image as preview
export const getCategoriesWithPreview = (): { category: CategoryKey; label: string; preview: GalleryImage }[] => {
  const images = getGalleryImages();
  const categoryMap: Record<string, GalleryImage[]> = {};

  for (const img of images) {
    if (!categoryMap[img.category]) {
      categoryMap[img.category] = [];
    }
    categoryMap[img.category].push(img);
  }

  // Define display order and labels - keys match CategoryKey type
  const categoryConfig: Record<CategoryKey, string> = {
    chairs: 'Chairs',
    large_tables: 'Large Tables',
    small_tables: 'Small Tables',
    structures: 'Structures',
  };

  return (Object.entries(categoryConfig) as [CategoryKey, string][])
    .filter(([key]) => categoryMap[key]?.length > 0)
    .map(([key, label]) => {
      const images = categoryMap[key];
      const preferred = CATEGORY_PREVIEW[key];
      const preview =
        (preferred && images.find((img) => img.path.endsWith(preferred))) || images[0];
      return { category: key, label, preview };
    });
};
