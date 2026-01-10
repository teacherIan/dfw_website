export const fontOptions = [
  'Architects Daughter',
  'Caveat',
  'Patrick Hand',
  'Indie Flower',
  'Permanent Marker',
  'Shadows Into Light',
] as const;

export const fontFamilyMap: Record<string, string> = {
  'Architects Daughter': '"Architects Daughter", cursive',
  Caveat: '"Caveat", cursive',
  'Patrick Hand': '"Patrick Hand", cursive',
  'Indie Flower': '"Indie Flower", cursive',
  'Permanent Marker': '"Permanent Marker", cursive',
  'Shadows Into Light': '"Shadows Into Light", cursive',
};

export type FontOption = (typeof fontOptions)[number];
