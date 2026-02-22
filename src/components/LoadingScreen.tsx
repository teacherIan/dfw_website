import { useState, useEffect } from 'react';
import { fontFamilyMap } from '../constants';

const STORAGE_KEY = 'dfw_has_visited';
const MIN_DISPLAY_TIME = 6000; // Minimum time to show loading screen (ms)

interface LoadingScreenProps {
  isReady: boolean;
}

export default function LoadingScreen({ isReady }: LoadingScreenProps) {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Check if first visit on mount
  useEffect(() => {
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (hasVisited) {
      setIsFirstVisit(false);
      setIsHidden(true);
    } else {
      // Mark as visited for next time
      localStorage.setItem(STORAGE_KEY, 'true');
    }

    // Minimum display time
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, []);

  // Fade out when ready and minimum time elapsed
  useEffect(() => {
    if (isReady && minTimeElapsed && !isFadingOut && isFirstVisit) {
      setIsFadingOut(true);
      // Hide completely after fade animation
      const timer = setTimeout(() => setIsHidden(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isReady, minTimeElapsed, isFadingOut, isFirstVisit]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        <p
          className="text-2xl text-gray-500 animate-pulse"
          style={{ fontFamily: fontFamilyMap['Caveat'] }}
        >
          Loading...
        </p>
      </div>
    </div>
  );
}
