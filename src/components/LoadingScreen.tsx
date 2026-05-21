import { useState, useEffect, useRef, useMemo } from 'react';
import { fontFamilyMap } from '../constants';

const DEFAULT_MIN_DISPLAY_TIME = 6000;

// Warm, heartfelt lines shown while the splat loads. Kept short so they sit
// on one line on all but the narrowest screens; the container reserves room
// for two lines either way so rotation never shifts the layout.
const SAYINGS = [
  'Great furniture is worth the wait.',
  'Good things are built slowly.',
  "Handmade can't be hurried.",
  'Shaped by hand, one piece at a time.',
  'Built by hand in Athens, Maine.',
  'Crafted to last a lifetime.',
] as const;

// Fisher–Yates shuffle so the sayings don't always open on the same line.
function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LoadingScreenProps {
  isReady: boolean;
  onComplete?: () => void;
  minDisplayTime?: number;
  /** Real splat download progress, 0–1, when the network reports it. */
  progress?: number;
}

export default function LoadingScreen({ isReady, onComplete, minDisplayTime = DEFAULT_MIN_DISPLAY_TIME, progress = 0 }: LoadingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // The progress line is animated directly via a ref (no per-frame React
  // re-render). Latest props are mirrored into refs so the animation loop
  // can read them without being torn down on every change.
  const lineRef = useRef<HTMLDivElement>(null);
  const isReadyRef = useRef(isReady);
  const progressRef = useRef(progress);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  // Rotating saying — shuffled once per mount, crossfaded on a timer.
  const sayings = useMemo(() => shuffled(SAYINGS), []);
  const [sayingIndex, setSayingIndex] = useState(0);
  const [sayingShown, setSayingShown] = useState(true);

  // Minimum display time
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), minDisplayTime);
    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  // Cycle the saying: fade the current line out, swap, fade the next in.
  useEffect(() => {
    const ROTATE_MS = 3600;
    const FADE_MS = 500;
    let swapTimer = 0;
    const interval = window.setInterval(() => {
      setSayingShown(false);
      swapTimer = window.setTimeout(() => {
        setSayingIndex((i) => (i + 1) % sayings.length);
        setSayingShown(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(swapTimer);
    };
  }, [sayings.length]);

  // Animate the progress line. The bar always advances on a time curve so
  // the wait reads as honest motion even when the splat loads instantly;
  // real download progress pulls it ahead when the network reports it; and
  // it holds below 100% until the splat has actually finished loading.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let current = 0.03;
    const tick = () => {
      const elapsed = performance.now() - start;
      // Asymptotic estimate — approaches ~0.86 by 10s, never reaches 1.
      const timed = 1 - Math.exp(-elapsed / 5000);
      const target = isReadyRef.current
        ? 1
        : Math.min(0.92, Math.max(progressRef.current, timed));
      current += (target - current) * (isReadyRef.current ? 0.16 : 0.07);
      if (current > 0.999) current = 1;
      const el = lineRef.current;
      if (el) el.style.transform = `scaleX(${Math.max(0.03, current)})`;
      if (current < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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

  const isFast = minDisplayTime < DEFAULT_MIN_DISPLAY_TIME;

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
          Doug&apos;s Found Wood
        </h1>

        {/* Splat load progress line */}
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
            ref={lineRef}
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #a89279 10%, #8b7355 50%, #a89279 90%, transparent)',
              transformOrigin: 'left center',
              transform: 'scaleX(0.03)',
            }}
          />
        </div>

        {/* Loading status + rotating saying */}
        <div
          className="mt-5 flex flex-col items-center"
          style={{
            animation: `loadingFadeIn 1s ease-out ${isFast ? '0.5s' : '1.4s'} forwards`,
            opacity: 0,
          }}
        >
          <div
            role="status"
            className="flex items-center text-xs uppercase text-[#b6a489]"
            style={{ fontFamily: fontFamilyMap['Patrick Hand'], letterSpacing: '0.22em' }}
          >
            <span>Loading</span>
            <span className="loading-dots" aria-hidden="true">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </div>
          <div className="mt-2 flex min-h-[2.6em] items-center px-2">
            <p
              aria-hidden="true"
              className="loading-saying text-lg md:text-xl text-[#8b7355]"
              style={{
                fontFamily: fontFamilyMap['Caveat'],
                opacity: sayingShown ? 1 : 0,
                transform: sayingShown ? 'translateY(0)' : 'translateY(5px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}
            >
              {sayings[sayingIndex]}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loadingFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadingDot {
          0%, 70%, 100% { opacity: 0.25; }
          35% { opacity: 1; }
        }
        .loading-dots {
          margin-left: 0.18em;
          letter-spacing: 0.1em;
        }
        .loading-dots span {
          animation: loadingDot 1.4s ease-in-out infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.18s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.36s; }
        @media (prefers-reduced-motion: reduce) {
          @keyframes loadingFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .loading-dots span { animation: none; opacity: 0.6; }
          .loading-saying { transition: opacity 0.5s ease !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
