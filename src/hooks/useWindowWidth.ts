import { useEffect, useState } from 'react';

// Width breakpoints
export const PORTRAIT_BREAKPOINT = 400;
export const TABLET_BREAKPOINT = 700;
export const IPAD_PRO_BREAKPOINT = 1000;
export const DESKTOP_BREAKPOINT = 1200;

// Height breakpoints (for browser chrome handling)
export const SHORT_HEIGHT_BREAKPOINT = 750;      // Mobile with browser chrome
export const VERY_SHORT_HEIGHT_BREAKPOINT = 600; // With keyboard or very old phone

/**
 * Hook to track window width and provide responsive breakpoint detection.
 *
 * Breakpoints:
 * - Portrait: < 400px (small phones)
 * - Small Landscape: 400-699px (larger phones, small tablets in portrait)
 * - Tablet: 700-999px (iPad Mini, iPad Air)
 * - iPad Pro: 1000-1199px (iPad Pro)
 * - Desktop: >= 1200px
 *
 * @returns Object with windowWidth and breakpoint booleans
 */
export const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    windowWidth,
    isPortrait: windowWidth < PORTRAIT_BREAKPOINT,
    isSmallLandscape: windowWidth >= PORTRAIT_BREAKPOINT && windowWidth < TABLET_BREAKPOINT,
    isTablet: windowWidth >= TABLET_BREAKPOINT && windowWidth < IPAD_PRO_BREAKPOINT,
    isIpadPro: windowWidth >= IPAD_PRO_BREAKPOINT && windowWidth < DESKTOP_BREAKPOINT,
    isDesktop: windowWidth >= DESKTOP_BREAKPOINT,
  };
};

export default useWindowWidth;
