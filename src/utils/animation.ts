export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};
