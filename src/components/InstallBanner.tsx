import { useState, useEffect } from 'react';
import { useStandaloneMode } from '../hooks';

/**
 * Banner prompting users to install the PWA for the best experience.
 * Only shows on mobile devices, not already installed, and not dismissed.
 */
export function InstallBanner() {
  const isStandalone = useStandaloneMode();
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only show on mobile devices
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show if already installed, dismissed, or not mobile
  if (isStandalone || dismissed || !isMobile) return null;

  return (
    <div className="pointer-events-auto fixed bottom-20 left-4 right-4 z-50 rounded-xl bg-white/95 p-4 shadow-xl backdrop-blur-sm">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        ✕
      </button>
      <p className="pr-6 text-sm text-gray-700">
        <strong>Tip:</strong> Add to Home Screen for fullscreen experience
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Tap Share → Add to Home Screen
      </p>
    </div>
  );
}

export default InstallBanner;
