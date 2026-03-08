export const types = {
  chairs: 'chairs',
  smallTable: 'smallTable',
  largeTable: 'largeTable',
  structure: 'structure',
  other: 'other',
} as const;

export type ProductType = (typeof types)[keyof typeof types];

export interface ProductImage {
  orderNumber: string;
  img: string;
  type: ProductType;
  name: string;
  description: string;
  price?: string;
}

export type CategoryKey = 'chairs' | 'large_tables' | 'small_tables' | 'structures';

export const categoryLabels: Record<CategoryKey, string> = {
  chairs: 'Chairs',
  large_tables: 'Large Tables',
  small_tables: 'Small Tables',
  structures: 'Structures',
};

export default types;
