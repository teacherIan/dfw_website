export const navItems = [
  { id: 'gallery', label: 'Gallery', delay: 0, arrowType: 'loop' as const },
  { id: 'ethos', label: 'Ethos', delay: 150, arrowType: 'spiral' as const },
  { id: 'contact', label: 'Contact', delay: 300, arrowType: 'wave' as const },
];

export type ArrowType = 'loop' | 'spiral' | 'wave';
