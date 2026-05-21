import { useState, useEffect, useRef, useMemo } from 'react';
import rough from 'roughjs';
import { fontFamilyMap } from '../constants';

const DEFAULT_MIN_DISPLAY_TIME = 6000;

// Warm, heartfelt lines shown while the splat loads.
const SAYINGS = [
  'Great furniture is worth the wait.',
  'Good things are built slowly.',
  "Handmade can't be hurried.",
  'Shaped by hand, one piece at a time.',
  'Built by hand in Athens, Maine.',
  'Crafted to last a lifetime.',
] as const;

// Palette — warm workshop tones.
const INK = '#5c4f3f';
const CORNER_INK = '#c0b39c';
const TRACK_INK = '#a89878';
const WOOD = '#9c7c4c';
const UNDERLINE = '#8c6f49';

// Underline draw-on timing.
const U_DELAY = 360;
const U_DURATION = 820;
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

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

  const cornerCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLHeadingElement>(null);

  // Latest props mirrored into refs for the animation loop.
  const isReadyRef = useRef(isReady);
  const progressRef = useRef(progress);
  const fadingRef = useRef(false);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { fadingRef.current = isFadingOut; }, [isFadingOut]);

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
    let swapTimer = 0;
    const interval = window.setInterval(() => {
      setSayingShown(false);
      swapTimer = window.setTimeout(() => {
        setSayingIndex((i) => (i + 1) % sayings.length);
        setSayingShown(true);
      }, 500);
    }, 3600);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(swapTimer);
    };
  }, [sayings.length]);

  // RoughJS: hand-sketched corner marks, an underline that draws itself in
  // beneath the wordmark, and a progress bar — all of which "boil": they're
  // re-sketched ~9x/second with a fresh seed so every line gently breathes,
  // like watching a pencil at work. The bar's hatching fills in with
  // progress; the fill advances on a time curve so the wait always shows
  // honest motion and only completes once the splat has actually loaded.
  useEffect(() => {
    const cornerCanvas = cornerCanvasRef.current;
    const barCanvas = barCanvasRef.current;
    if (!cornerCanvas || !barCanvas) return;

    const cornerCtx = cornerCanvas.getContext('2d');
    const barCtx = barCanvas.getContext('2d');
    if (!cornerCtx || !barCtx) return;

    const rcCorner = rough.canvas(cornerCanvas);
    const rcBar = rough.canvas(barCanvas);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cw = 0, ch = 0, bw = 0, bh = 0;
    const sizeCanvases = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = window.innerWidth;
      ch = window.innerHeight;
      cornerCanvas.width = Math.round(cw * dpr);
      cornerCanvas.height = Math.round(ch * dpr);
      cornerCanvas.style.width = `${cw}px`;
      cornerCanvas.style.height = `${ch}px`;
      cornerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rect = barCanvas.getBoundingClientRect();
      bw = rect.width;
      bh = rect.height;
      barCanvas.width = Math.round(bw * dpr);
      barCanvas.height = Math.round(bh * dpr);
      barCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    sizeCanvases();
    window.addEventListener('resize', sizeCanvases);

    // Corner marks + the wordmark underline share the full-viewport canvas.
    const drawFrame = (seed: number, underlineT: number) => {
      cornerCtx.clearRect(0, 0, cw, ch);

      const inset = Math.max(16, Math.min(cw, ch) * 0.045);
      const arm = inset * 0.82;
      const co = { stroke: CORNER_INK, strokeWidth: 1.5, roughness: 1.3, bowing: 1.5, seed };
      const corner = (x: number, y: number, dx: number, dy: number) => {
        rcCorner.line(x, y, x + dx * arm, y, co);
        rcCorner.line(x, y, x, y + dy * arm, co);
      };
      corner(inset, inset, 1, 1);
      corner(cw - inset, inset, -1, 1);
      corner(inset, ch - inset, 1, -1);
      corner(cw - inset, ch - inset, -1, -1);

      // Underline beneath the wordmark — drawn left-to-right, then it boils.
      const mark = markRef.current;
      if (mark && underlineT > 0) {
        const r = mark.getBoundingClientRect();
        const overshoot = Math.min(14, r.width * 0.04);
        const x1 = r.left - overshoot;
        const span = r.width + overshoot * 2;
        const y = r.bottom - r.height * 0.04;
        rcCorner.line(x1, y, x1 + span * underlineT, y, {
          stroke: UNDERLINE,
          strokeWidth: 2.4,
          roughness: 1.5,
          bowing: 2.6,
          seed,
        });
      }
    };

    const drawBar = (p: number, seed: number) => {
      barCtx.clearRect(0, 0, bw, bh);
      const pad = 5;
      const w = bw - pad * 2;
      const h = bh - pad * 2;
      const fillW = w * Math.min(1, Math.max(0, p));
      if (fillW > 2) {
        rcBar.rectangle(pad, pad, fillW, h, {
          fill: WOOD,
          fillStyle: 'hachure',
          hachureGap: 5,
          hachureAngle: -41,
          fillWeight: 1.5,
          stroke: 'none',
          roughness: 1.1,
          seed,
        });
      }
      rcBar.rectangle(pad, pad, w, h, {
        stroke: TRACK_INK,
        strokeWidth: 1.6,
        roughness: 1.15,
        bowing: 1,
        seed,
      });
    };

    let raf = 0;
    let lastBoil = -1000;
    let seed = 1;
    let current = 0.03;
    let lastDrawn = -1;
    const start = performance.now();

    const loop = (now: number) => {
      if (fadingRef.current) return; // freeze the sketch once we start leaving
      const elapsed = now - start;
      // Asymptotic time estimate — approaches ~0.86 by 10s, never reaches 1.
      const timed = 1 - Math.exp(-elapsed / 5000);
      const target = isReadyRef.current
        ? 1
        : Math.min(0.92, Math.max(progressRef.current, timed));
      current += (target - current) * (isReadyRef.current ? 0.16 : 0.07);
      if (current > 0.999) current = 1;
      const underlineT = easeOutCubic(
        Math.min(1, Math.max(0, (elapsed - U_DELAY) / U_DURATION)),
      );

      if (reduce) {
        // No boil — draw the frame once, redraw the bar only as it fills.
        if (lastDrawn < 0) drawFrame(7, 1);
        if (lastDrawn < 0 || Math.abs(current - lastDrawn) > 0.004) {
          drawBar(current, 7);
          lastDrawn = current;
        }
      } else if (now - lastBoil > 110) {
        lastBoil = now;
        seed = (seed % 99989) + 1;
        drawFrame(seed, underlineT);
        drawBar(current, seed);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', sizeCanvases);
    };
  }, []);

  // Fade out when ready and minimum time elapsed
  useEffect(() => {
    if (isReady && minTimeElapsed && !isFadingOut) {
      setIsFadingOut(true);
      onComplete?.();
      const timer = setTimeout(() => setIsHidden(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isReady, minTimeElapsed, isFadingOut, onComplete]);

  if (isHidden) return null;

  const isFast = minDisplayTime < DEFAULT_MIN_DISPLAY_TIME;

  return (
    <div
      className="ls-root"
      style={{
        opacity: isFadingOut ? 0 : 1,
        pointerEvents: isFadingOut ? 'none' : 'auto',
      }}
    >
      <canvas ref={cornerCanvasRef} className="ls-corners" aria-hidden="true" />

      {/* Instant wordmark — matches the static boot screen exactly, dead-centered. */}
      <h1 ref={markRef} className="ls-mark" style={{ fontFamily: fontFamilyMap['Caveat'] }}>
        Doug&apos;s Found Wood
      </h1>

      <div className="ls-support" style={{ animationDelay: isFast ? '0.15s' : '0.3s' }}>
        <canvas ref={barCanvasRef} className="ls-bar" aria-hidden="true" />
        <div
          role="status"
          className="ls-caption"
          style={{ fontFamily: fontFamilyMap['Patrick Hand'] }}
        >
          Loading
          <span className="ls-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
        <div className="ls-saying-box">
          <p
            aria-hidden="true"
            className="ls-saying"
            data-shown={sayingShown}
            style={{ fontFamily: fontFamilyMap['Caveat'] }}
          >
            {sayings[sayingIndex]}
          </p>
        </div>
      </div>

      <style>{`
        .ls-root {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: #f8f5ef;
          transition: opacity 0.7s ease;
        }
        .ls-corners {
          position: absolute;
          inset: 0;
          pointer-events: none;
          animation: lsFade 0.55s ease-out 0.1s both;
        }
        .ls-mark {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          margin: 0;
          padding: 0 0.15em;
          font-weight: 400;
          line-height: 1;
          white-space: nowrap;
          font-size: clamp(2.75rem, 8.5vw, 4.75rem);
          color: ${INK};
        }
        .ls-support {
          position: absolute;
          left: 50%;
          top: 50%;
          width: min(30rem, 90vw);
          margin-top: clamp(4rem, 3.4rem + 4.4vh, 6rem);
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: lsRise 0.85s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .ls-bar {
          display: block;
          width: clamp(220px, 62vw, 300px);
          height: 26px;
        }
        .ls-caption {
          margin-top: 1.2rem;
          display: flex;
          align-items: center;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.24em;
          color: #a3927a;
        }
        .ls-dots {
          margin-left: 0.18em;
          letter-spacing: 0.12em;
        }
        .ls-dots span {
          animation: lsDot 1.4s ease-in-out infinite;
        }
        .ls-dots span:nth-child(2) { animation-delay: 0.18s; }
        .ls-dots span:nth-child(3) { animation-delay: 0.36s; }
        .ls-saying-box {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          min-height: 2.6em;
          padding: 0 1rem;
        }
        .ls-saying {
          margin: 0;
          font-size: clamp(1.05rem, 1rem + 0.85vw, 1.45rem);
          color: #8b7355;
          opacity: 0;
          transform: translateY(5px);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .ls-saying[data-shown='true'] {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes lsFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lsRise {
          from { opacity: 0; transform: translateX(-50%) translateY(14px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes lsDot {
          0%, 70%, 100% { opacity: 0.25; }
          35% { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes lsRise {
            from { opacity: 0; transform: translateX(-50%); }
            to { opacity: 1; transform: translateX(-50%); }
          }
          .ls-dots span { animation: none; opacity: 0.6; }
          .ls-saying { transition: opacity 0.5s ease !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
