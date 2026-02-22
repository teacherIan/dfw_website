import { useState, useEffect } from 'react';
import { fontFamilyMap } from '../constants';

const MIN_DISPLAY_TIME = 6000; // Minimum time to show loading screen (ms)

interface LoadingScreenProps {
  isReady: boolean;
  onComplete?: () => void;
}

export default function LoadingScreen({ isReady, onComplete }: LoadingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Minimum display time
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, []);

  // Fade out when ready and minimum time elapsed
  useEffect(() => {
    if (isReady && minTimeElapsed && !isFadingOut) {
      setIsFadingOut(true);
      // Signal animation can start now
      onComplete?.();
      // Hide completely after fade animation
      const timer = setTimeout(() => setIsHidden(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isReady, minTimeElapsed, isFadingOut, onComplete]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
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
