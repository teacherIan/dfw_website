import { useState, useEffect } from 'react';
import { fontFamilyMap } from '../constants';

const DEFAULT_MIN_DISPLAY_TIME = 6000;

interface LoadingScreenProps {
  isReady: boolean;
  onComplete?: () => void;
  minDisplayTime?: number;
  /** Splat download progress, 0–1. Drives the progress line. */
  progress?: number;
}

export default function LoadingScreen({ isReady, onComplete, minDisplayTime = DEFAULT_MIN_DISPLAY_TIME, progress = 0 }: LoadingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Minimum display time
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minDisplayTime);
    return () => clearTimeout(timer);
  }, [minDisplayTime]);

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

  const isFast = minDisplayTime < DEFAULT_MIN_DISPLAY_TIME;
  // Keep a small floor so the line reads as "starting" rather than empty.
  const displayProgress = Math.min(1, Math.max(0.03, progress));

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#f8f5ef] transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center flex flex-col items-center px-6">
        {/* Brand name */}
        <h1
          className="text-4xl md:text-5xl text-[#6b5e4f] overflow-visible"
          style={{
            fontFamily: fontFamilyMap['Caveat'],
            animation: `loadingFadeIn ${isFast ? '0.6s' : '1.5s'} ease-out forwards`,
            opacity: 0,
            padding: '0 0.15em',
          }}
        >
          Doug's Found Wood
        </h1>

        {/* Splat download progress line */}
        <div
          className="mt-6 overflow-hidden"
          style={{
            width: 'clamp(200px, 40vw, 320px)',
            height: '2px',
            animation: `loadingFadeIn 0.8s ease-out ${isFast ? '0.3s' : '0.8s'} forwards`,
            opacity: 0,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #a89279 10%, #8b7355 50%, #a89279 90%, transparent)',
              transformOrigin: 'left center',
              transform: `scaleX(${displayProgress})`,
              transition: 'transform 0.4s ease-out',
            }}
          />
        </div>

        {/* Tagline - skip for returning visitors */}
        {!isFast && (
          <p
            className="mt-4 text-sm tracking-widest uppercase text-[#a89279]"
            style={{
              fontFamily: fontFamilyMap['Patrick Hand'],
              letterSpacing: '0.15em',
              animation: 'loadingFadeIn 1.2s ease-out 2.5s forwards',
              opacity: 0,
            }}
          >
            Handcrafted in Athens, Maine
          </p>
        )}
      </div>

      <style>{`
        @keyframes loadingFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes loadingFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}
