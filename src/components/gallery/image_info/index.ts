import chairs from './chairs';
import largeTables from './largeTable';
import smallTables from './smallTables';
import structures from './structures';
import { type ProductImage, type CategoryKey, categoryLabels } from './types';

export type { ProductImage, CategoryKey };
export { categoryLabels };

export const imagesByCategory: Record<CategoryKey, ProductImage[]> = {
  chairs: chairs as ProductImage[],
  large_tables: largeTables as ProductImage[],
  small_tables: smallTables as ProductImage[],
  structures: structures as ProductImage[],
};

export const getImagesForCategory = (category: CategoryKey): ProductImage[] => {
  return imagesByCategory[category] || [];
};

export const getAllImages = (): ProductImage[] => {
  return Object.values(imagesByCategory).flat();
};

export const getCategoryFromType = (type: string): CategoryKey | null => {
  switch (type) {
    case 'chairs':
      return 'chairs';
    case 'largeTable':
      return 'large_tables';
    case 'smallTable':
      return 'small_tables';
    case 'structure':
      return 'structures';
    default:
      return null;
  }
};
