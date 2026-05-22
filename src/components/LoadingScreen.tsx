import { useState, useEffect, useRef, useMemo } from 'react';
import rough from 'roughjs';
import { fontFamilyMap } from '../constants';
import { WORDMARK } from './loading/wordmarkPath';

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

// Wordmark font size in px — mirrors the clamp the rough canvas replaces.
const wordmarkPx = (vw: number) => Math.max(44, Math.min(0.085 * vw, 76));

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
  const wordmarkCanvasRef = useRef<HTMLCanvasElement>(null);
  const barCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // RoughJS: the whole intro is one hand-drawn sketch. The wordmark is
  // rendered from baked glyph outlines so it shares the sketched character
  // of the corner marks and progress bar. Corner marks and the bar "boil" —
  // re-sketched ~9x/second so the lines gently breathe. The wordmark and the
  // underline beneath it share a slower, calmer cadence: the underline draws
  // on, then both re-sketch ~3x/second so the logo quietly breathes without
  // the jitter of a full boil.
  useEffect(() => {
    const cornerCanvas = cornerCanvasRef.current;
    const wordCanvas = wordmarkCanvasRef.current;
    const barCanvas = barCanvasRef.current;
    if (!cornerCanvas || !wordCanvas || !barCanvas) return;

    const cornerCtx = cornerCanvas.getContext('2d');
    const wordCtx = wordCanvas.getContext('2d');
    const barCtx = barCanvas.getContext('2d');
    if (!cornerCtx || !wordCtx || !barCtx) return;

    const rcCorner = rough.canvas(cornerCanvas);
    const rcWord = rough.canvas(wordCanvas);
    const rcBar = rough.canvas(barCanvas);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const refW = WORDMARK.bbox.x2 - WORDMARK.bbox.x1;
    const refH = WORDMARK.bbox.y2 - WORDMARK.bbox.y1;

    let dpr = 1;
    let cw = 0, ch = 0, bw = 0, bh = 0;
    let scale = 1, marginH = 0, marginV = 0, textW = 0, textH = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let textDrawable: any = null;
    let wordSeed = 1337;

    // (Re)generate the wordmark's rough sketch. Called on resize (the scale
    // changes) and on the slow re-seed cadence so the logo quietly breathes.
    const buildWordDrawable = (seed: number) => {
      textDrawable = rcWord.generator.path(WORDMARK.d, {
        fill: INK,
        fillStyle: 'solid',
        stroke: INK,
        strokeWidth: 1.0 / scale,
        roughness: 0.78 / scale,
        bowing: 0.6,
        seed,
      });
    };

    const setup = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Corner canvas — full viewport.
      cw = window.innerWidth;
      ch = window.innerHeight;
      cornerCanvas.width = Math.round(cw * dpr);
      cornerCanvas.height = Math.round(ch * dpr);
      cornerCanvas.style.width = `${cw}px`;
      cornerCanvas.style.height = `${ch}px`;

      // Bar canvas — sized by CSS, measured here.
      const barRect = barCanvas.getBoundingClientRect();
      bw = barRect.width;
      bh = barRect.height;
      barCanvas.width = Math.round(bw * dpr);
      barCanvas.height = Math.round(bh * dpr);
      barCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Wordmark canvas — sized to the scaled glyph outlines, with a margin
      // that also reserves the underline below (kept symmetric so the text
      // stays optically dead-centered).
      scale = wordmarkPx(cw) / WORDMARK.size;
      textW = refW * scale;
      textH = refH * scale;
      marginH = Math.max(20, textW * 0.05);
      marginV = textH * 0.34 + 14;
      const ww = textW + marginH * 2;
      const wh = textH + marginV * 2;
      wordCanvas.style.width = `${ww}px`;
      wordCanvas.style.height = `${wh}px`;
      wordCanvas.width = Math.round(ww * dpr);
      wordCanvas.height = Math.round(wh * dpr);

      // Generate the wordmark's rough sketch at the new scale; the loop
      // re-sketches it on the slow cadence so the logo quietly breathes.
      buildWordDrawable(wordSeed);
    };
    setup();
    window.addEventListener('resize', setup);

    const drawCorners = (seed: number) => {
      cornerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cornerCtx.clearRect(0, 0, cw, ch);
      const inset = Math.max(16, Math.min(cw, ch) * 0.045);
      const arm = inset * 0.82;
      const o = { stroke: CORNER_INK, strokeWidth: 1.5, roughness: 1.3, bowing: 1.5, seed };
      const corner = (x: number, y: number, dx: number, dy: number) => {
        rcCorner.line(x, y, x + dx * arm, y, o);
        rcCorner.line(x, y, x, y + dy * arm, o);
      };
      corner(inset, inset, 1, 1);
      corner(cw - inset, inset, -1, 1);
      corner(inset, ch - inset, 1, -1);
      corner(cw - inset, ch - inset, -1, -1);
    };

    const drawWordmark = (underlineSeed: number, underlineT: number) => {
      wordCtx.setTransform(1, 0, 0, 1, 0, 0);
      wordCtx.clearRect(0, 0, wordCanvas.width, wordCanvas.height);

      // Glyph outlines, drawn in reference units via a scaled transform.
      wordCtx.setTransform(
        scale * dpr,
        0,
        0,
        scale * dpr,
        (marginH - WORDMARK.bbox.x1 * scale) * dpr,
        (marginV - WORDMARK.bbox.y1 * scale) * dpr,
      );
      if (textDrawable) rcWord.draw(textDrawable);

      // Underline — drawn in CSS pixels, draws on left-to-right.
      if (underlineT > 0) {
        wordCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const over = Math.min(16, textW * 0.045);
        const x1 = marginH - over;
        const span = textW + over * 2;
        const y = marginV + textH + textH * 0.12;
        rcWord.line(x1, y, x1 + span * underlineT, y, {
          stroke: UNDERLINE,
          strokeWidth: 2.4,
          roughness: 1.2,
          bowing: 1.7,
          seed: underlineSeed,
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
    let lastUnderlineReseed = -1000;
    let seed = 1;
    let underlineSeed = 9;
    let lastUnderlineT = -1;
    let lastUnderlineSeed = -1;
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
        if (lastDrawn < 0) {
          drawCorners(7);
          drawWordmark(9, 1);
        }
        if (lastDrawn < 0 || Math.abs(current - lastDrawn) > 0.004) {
          drawBar(current, 7);
          lastDrawn = current;
        }
      } else {
        // Corner marks + bar boil briskly.
        if (now - lastBoil > 110) {
          lastBoil = now;
          seed = (seed % 99989) + 1;
          drawCorners(seed);
          drawBar(current, seed);
        }
        // Wordmark + underline drift together on a gentle cadence — re-seeded
        // ~3x a second so they have a perceptible life without the jitter of
        // a full boil.
        if (now - lastUnderlineReseed > 300) {
          lastUnderlineReseed = now;
          underlineSeed = (underlineSeed % 99989) + 1;
          wordSeed = (wordSeed % 99989) + 1;
          buildWordDrawable(wordSeed);
        }
        // Redraw the wordmark while the underline draws in or either re-seeds.
        if (underlineT !== lastUnderlineT || underlineSeed !== lastUnderlineSeed) {
          lastUnderlineT = underlineT;
          lastUnderlineSeed = underlineSeed;
          drawWordmark(underlineSeed, underlineT);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setup);
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

      {/* Rough-rendered wordmark — dead-centered, drawn from baked glyph outlines. */}
      <canvas
        ref={wordmarkCanvasRef}
        className="ls-mark"
        role="img"
        aria-label="Doug's Found Wood"
      />

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
          display: block;
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
