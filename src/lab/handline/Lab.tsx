import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Leva, button, useControls } from 'leva';
import {
  DFW_PATHS,
  GESTURES,
  Handline,
  HandlineArt,
  HandlineLayer,
  PENS,
  follow,
  type Drawing,
  type GestureName,
  type GestureSpec,
  type HeadKind,
  type PenName,
  type TailKind,
} from '../../lib/handline';
import { measure } from '../../lib/handline/geom';
import { LoopArrow, SpiralArrow, WaveArrow } from '../../components/navigation/DesktopArrows';

const GESTURE_NAMES = Object.keys(GESTURES) as GestureName[];
const PEN_NAMES = Object.keys(PENS) as PenName[];
const HEADS: HeadKind[] = ['chevron', 'open', 'harpoon', 'triangle', 'tick', 'dot', 'none'];
const TAILS: TailKind[] = ['dot', 'ring', 'hook', 'tick', 'none'];

export default function Lab() {
  return (
    <main className="lab">
      <Leva collapsed titleBar={{ title: 'Playground controls' }} />
      <Hero />
      <Section
        title="Playground"
        lede="Drag either end. The line follows without drawing again; Replay draws it on. Every control is in the panel."
      >
        <Playground />
      </Section>
      <Section
        title="Gestures"
        lede="The shape between two points. Generated at the real distance, so a loop is the same size on a short line and a long one. Click a card to draw it again."
      >
        <div className="grid">
          {GESTURE_NAMES.map((g) => (
            <Card key={g} name={g}>
              {(k) => (
                <Handline
                  key={k}
                  from={{ x: 30, y: 108 }}
                  to={{ x: 210, y: 64 }}
                  gesture={g}
                  pen="ink"
                  head="chevron"
                  tail="dot"
                  seed={g}
                  play="in-view"
                />
              )}
            </Card>
          ))}
        </div>
      </Section>
      <Section
        title="Pens"
        lede="Width, taper, pressure, wander and grain. All geometry, no filters: the weight really changes, and nothing re-renders per frame."
      >
        <div className="grid">
          {PEN_NAMES.flatMap((p) => [
            <Card key={p} name={p}>
              {(k) => (
                <Handline
                  key={k}
                  from={{ x: 26, y: 100 }}
                  to={{ x: 214, y: 70 }}
                  gesture="loops"
                  pen={p}
                  head="chevron"
                  seed="pens"
                  play="in-view"
                />
              )}
            </Card>,
            <Card key={`${p}-dark`} name={`${p} · white`} dark>
              {(k) => (
                <Handline
                  key={k}
                  from={{ x: 26, y: 100 }}
                  to={{ x: 214, y: 70 }}
                  gesture="loop"
                  pen={p}
                  head="harpoon"
                  seed="pens-dark"
                  color="white"
                  play="in-view"
                />
              )}
            </Card>,
          ])}
        </div>
      </Section>
      <Section
        title="Ends"
        lede="Heads are flicks of the same pen, drawn after the line arrives. Tails are where the pen lands."
      >
        <div className="grid">
          {HEADS.map((h) => (
            <Card key={h} name={`head · ${h}`}>
              {(k) => (
                <Handline
                  key={k}
                  from={{ x: 30, y: 100 }}
                  to={{ x: 200, y: 66 }}
                  gesture="arc"
                  pen="ink"
                  head={h}
                  seed={`h-${h}`}
                  play="in-view"
                />
              )}
            </Card>
          ))}
          {TAILS.map((t) => (
            <Card key={t} name={`tail · ${t}`}>
              {(k) => (
                <Handline
                  key={k}
                  from={{ x: 40, y: 100 }}
                  to={{ x: 210, y: 66 }}
                  gesture="arc"
                  pen="ink"
                  tail={t}
                  seed={`t-${t}`}
                  play="in-view"
                />
              )}
            </Card>
          ))}
        </div>
      </Section>
      <Section
        title="Marks"
        lede="The old woodworker's marks, rebuilt on the arc-length sampler, so they now ride loops too. Each lands just after the pen passes."
      >
        <Marks />
      </Section>
      <Section
        title="In the garden"
        lede="The desktop menu's three arrows. Top: as shipped. Middle: the same hand-drawn paths through the new pen. Bottom: live lines from each label to its button, loops included."
      >
        <Garden />
      </Section>
      <Section
        title="On graph paper"
        lede="A 4YP mock with invented content: the Hand's “you are here”, and a counselor's margin note joined to its course."
      >
        <GraphPaper />
      </Section>
      <Section title="Stress" lede="Sixty lines drawing at once.">
        <Stress />
      </Section>
    </main>
  );
}

function Section({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <p className="lede">{lede}</p>
      {children}
    </section>
  );
}

function Card({
  name,
  dark,
  children,
}: {
  name: string;
  dark?: boolean;
  children: (k: number) => ReactNode;
}) {
  const [k, setK] = useState(0);
  return (
    <div className={`card${dark ? 'dark' : ''}`} onClick={() => setK((n) => n + 1)}>
      <span className="card-name">{name}</span>
      <HandlineLayer>{children(k)}</HandlineLayer>
    </div>
  );
}

function Hero() {
  const word = useRef<HTMLHeadingElement>(null);
  const target = useRef<HTMLSpanElement>(null);
  const [k, setK] = useState(0);
  return (
    <div className="hero" onClick={() => setK((n) => n + 1)}>
      <h1 className="hero-word" ref={word}>
        Handline
      </h1>
      <span className="hero-target" ref={target}>
        a line, drawn by hand
      </span>
      <HandlineLayer>
        <Handline
          key={k}
          from={{ target: word, at: [1, 0.72], offset: [12, 0] }}
          to={target}
          gesture={{ kind: 'loops', count: 2, size: 18 }}
          pen="pencil"
          head="none"
          tail="hook"
          ring
          gap={10}
          seed="hero"
          side={-1}
          delay={300}
        />
      </HandlineLayer>
    </div>
  );
}

// --- Playground -------------------------------------------------------------------

type P = { x: number; y: number };

function useDrag(pos: P, set: (p: P) => void) {
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { px: e.clientX, py: e.clientY, ...pos };
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s) return;
      set({ x: s.x + e.clientX - s.px, y: s.y + e.clientY - s.py });
      follow(120);
    },
    onPointerUp() {
      start.current = null;
    },
  };
}

function Playground() {
  const [a, setA] = useState<P>({ x: 120, y: 330 });
  const [b, setB] = useState<P>({ x: 760, y: 130 });
  const ra = useRef<HTMLDivElement>(null);
  const rb = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  const [built, setBuilt] = useState<Drawing | null>(null);

  const line = useControls('Line', {
    gesture: { value: 'loops' as GestureName, options: GESTURE_NAMES },
    loopSize: { value: 18, min: 4, max: 44, step: 1 },
    loopCount: { value: 2, min: 1, max: 6, step: 1 },
    side: { value: 'auto', options: ['auto', 'left', 'right'] },
    bow: { value: 0, min: -0.4, max: 0.4, step: 0.01 },
    gap: { value: 8, min: 0, max: 30, step: 1 },
    land: { value: 0, min: 0, max: 1, step: 0.05, label: 'land (0 edge, 1 aim)' },
    aimX: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'aim x' },
    aimY: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'aim y' },
    seed: 'playground',
  });
  const [pen, setPen] = useControls('Pen', () => ({
    preset: { value: 'pencil' as PenName, options: PEN_NAMES },
    width: { value: PENS.pencil.width, min: 0.5, max: 8, step: 0.1 },
    jitter: { value: PENS.pencil.jitter, min: 0, max: 4, step: 0.05 },
    pressure: { value: PENS.pencil.pressure, min: 0, max: 1, step: 0.01 },
    curveInk: { value: PENS.pencil.curveInk, min: 0, max: 1, step: 0.01 },
    passes: { value: PENS.pencil.passes, min: 1, max: 3, step: 1 },
    grain: { value: PENS.pencil.grain, min: 0, max: 1, step: 0.01 },
    speed: { value: PENS.pencil.speed, min: 0.05, max: 2, step: 0.01 },
    curveSlow: { value: PENS.pencil.curveSlow, min: 0, max: 2, step: 0.05 },
  }));
  useEffect(() => {
    const p = PENS[pen.preset];
    setPen({
      width: p.width,
      jitter: p.jitter,
      pressure: p.pressure,
      curveInk: p.curveInk,
      passes: p.passes,
      grain: p.grain,
      speed: p.speed,
      curveSlow: p.curveSlow,
    });
  }, [pen.preset, setPen]);
  const ends = useControls('Ends & marks', {
    head: { value: 'chevron' as HeadKind, options: HEADS },
    tail: { value: 'dot' as TailKind, options: TAILS },
    ring: false,
    ticks: false,
    scribe: false,
    dimension: false,
  });
  useControls('Play', { replay: button(() => setReplay((n) => n + 1)) });

  const gesture: GestureSpec | GestureName =
    line.gesture === 'loop'
      ? { kind: 'loop', size: line.loopSize }
      : line.gesture === 'loops'
        ? { kind: 'loops', count: line.loopCount, size: line.loopSize }
        : line.gesture === 'spring'
          ? { kind: 'spring', size: Math.max(3, line.loopSize / 3) }
          : line.gesture;

  const dragA = useDrag(a, setA);
  const dragB = useDrag(b, setB);
  const len = built ? Math.round(measure(built.centerline).length) : 0;

  return (
    <div className="paper play">
      <div
        ref={ra}
        className="chip"
        style={{ left: a.x, top: a.y, transform: 'translate(-50%, -50%)' }}
        {...dragA}
      >
        Gallery
      </div>
      <div
        ref={rb}
        className="dot-target"
        style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)' }}
        {...dragB}
      />
      <HandlineLayer>
        <Handline
          key={replay}
          from={ra}
          to={{ target: rb, at: [line.aimX, line.aimY], shape: 'auto' }}
          gesture={gesture}
          side={line.side === 'auto' ? 'auto' : line.side === 'left' ? 1 : -1}
          bow={line.bow}
          gap={line.gap}
          land={line.land}
          seed={line.seed}
          pen={{
            base: pen.preset,
            width: pen.width,
            jitter: pen.jitter,
            pressure: pen.pressure,
            curveInk: pen.curveInk,
            passes: pen.passes,
            grain: pen.grain,
            speed: pen.speed,
            curveSlow: pen.curveSlow,
          }}
          head={ends.head}
          tail={ends.tail}
          ring={ends.ring}
          marks={
            ends.ticks || ends.scribe || ends.dimension
              ? {
                  ticks: ends.ticks ? { count: 6 } : undefined,
                  scribe: ends.scribe ? {} : undefined,
                  dimension: ends.dimension ? {} : undefined,
                }
              : undefined
          }
          onBuild={setBuilt}
        />
      </HandlineLayer>
      <div className="stats">
        {built && (
          <>
            {len} px · {built.strokes.length} strokes · {Math.round(built.duration)} ms to draw
          </>
        )}
      </div>
    </div>
  );
}

// --- Marks ----------------------------------------------------------------------------

function Marks() {
  const word = useRef<HTMLSpanElement>(null);
  return (
    <div className="grid">
      <Card name="ticks (witness marks)">
        {(k) => (
          <Handline
            key={k}
            from={{ x: 24, y: 100 }}
            to={{ x: 216, y: 70 }}
            gesture="loop"
            pen="ink"
            marks={{ ticks: { count: 7 } }}
            seed="ticks"
            play="in-view"
          />
        )}
      </Card>
      <Card name="scribe">
        {(k) => (
          <Handline
            key={k}
            from={{ x: 24, y: 104 }}
            to={{ x: 216, y: 66 }}
            gesture="arc"
            pen="ink"
            marks={{ scribe: { offset: 5 } }}
            seed="scribe"
            play="in-view"
          />
        )}
      </Card>
      <Card name="dimension">
        {(k) => (
          <Handline
            key={k}
            from={{ x: 30, y: 92 }}
            to={{ x: 210, y: 92 }}
            gesture="straight"
            pen="fineliner"
            head="open"
            tail="none"
            marks={{ dimension: { length: 16 } }}
            seed="dim"
            play="in-view"
          />
        )}
      </Card>
      <Card name="ring it">
        {(k) => (
          <>
            <span
              ref={word}
              style={{ position: 'absolute', left: 150, top: 46, font: '600 24px Caveat' }}
            >
              this one
            </span>
            <Handline
              key={k}
              from={{ x: 24, y: 120 }}
              to={word}
              gesture="arc"
              side={-1}
              pen="pencil"
              head="none"
              ring
              gap={12}
              seed="ring"
              play="in-view"
            />
          </>
        )}
      </Card>
    </div>
  );
}

// --- dfw ------------------------------------------------------------------------------

// Live rows keep each path at its desktop size (~110 px across); longer
// distances become a straight run into the button.
const ROWS = [
  {
    label: 'Gallery',
    path: DFW_PATHS.loop,
    Old: LoopArrow,
    gesture: { kind: 'path', d: DFW_PATHS.loop, size: 116 } as GestureSpec,
  },
  {
    label: 'Ethos',
    path: DFW_PATHS.spiral,
    Old: SpiralArrow,
    gesture: { kind: 'path', d: DFW_PATHS.spiral, size: 112 } as GestureSpec,
  },
  {
    label: 'Contact',
    path: DFW_PATHS.wave,
    Old: WaveArrow,
    gesture: { kind: 'path', d: DFW_PATHS.wave, size: 112 } as GestureSpec,
  },
];

function Garden() {
  const [k, setK] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <button onClick={() => setK((n) => n + 1)} style={{ justifySelf: 'start' }}>
        Replay all three
      </button>
      <GardenPanel tag="As shipped (framer-motion, uniform stroke)" k={k}>
        {(row, i) => (
          <span className="garden-arrow">
            <row.Old className="nav-arrow-lab" isVisible delay={i * 150} />
          </span>
        )}
      </GardenPanel>
      <GardenPanel tag="Same paths, new pen" k={k}>
        {(row, i) => (
          <HandlineArt
            className="garden-arrow"
            viewBox="0 0 70 50"
            d={row.path}
            pen={{ base: 'ink', width: 1.4, jitter: 0.15, taperIn: 0.3, taperOut: 0.7 }}
            head={{ kind: 'chevron', size: 6 }}
            color="white"
            delay={i * 150}
            seed={row.label}
          />
        )}
      </GardenPanel>
      <AnchoredGarden k={k} />
    </div>
  );
}

function GardenPanel({
  tag,
  k,
  children,
}: {
  tag: string;
  k: number;
  children: (row: (typeof ROWS)[number], i: number) => ReactNode;
}) {
  return (
    <div className="garden" style={{ height: 300 }}>
      <span className="garden-tag">{tag}</span>
      {ROWS.map((row, i) => (
        <div key={`${row.label}-${k}`} className="garden-row" style={{ top: 30 + i * 90 }}>
          <span className="garden-label">{row.label}</span>
          {children(row, i)}
          <span className="garden-button" />
        </div>
      ))}
    </div>
  );
}

function AnchoredGarden({ k }: { k: number }) {
  const labels = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];
  const buttons = [
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
    useRef<HTMLSpanElement>(null),
  ];
  return (
    <div className="garden" style={{ height: 300 }}>
      <span className="garden-tag">
        Live: the same hand-drawn paths, label → button at any distance
      </span>
      {ROWS.map((row, i) => (
        <div key={row.label} className="garden-row" style={{ top: 30 + i * 90, gap: 90 + i * 60 }}>
          <span className="garden-label" ref={labels[i]}>
            {row.label}
          </span>
          <span className="garden-button" ref={buttons[i]} />
        </div>
      ))}
      <HandlineLayer style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.6))' }}>
        {ROWS.map((row, i) => (
          <Handline
            key={`${row.label}-${k}`}
            from={{ target: labels[i], at: [1, 0.55], offset: [10, 0] }}
            to={buttons[i]}
            land={1}
            gesture={row.gesture}
            side={1}
            gap={7}
            pen={{ base: 'ink', width: 1.5, jitter: 0.2, taperIn: 0.3, taperOut: 0.7 }}
            head={{ kind: 'chevron', size: 7 }}
            color="white"
            delay={i * 150}
            seed={`live-${row.label}`}
            play="in-view"
          />
        ))}
      </HandlineLayer>
    </div>
  );
}

// --- 4YP ------------------------------------------------------------------------------

/** The 4YP's current "you are here" arrow, copied for comparison. */
function HereArrowNow() {
  return (
    <svg
      viewBox="0 0 22 18"
      width={22}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ marginTop: -10 }}
    >
      <path d="M3 16 C6 12, 9 8, 15 4" />
      <path d="M10 3.6 L15.2 3.8 L14 8.6" />
    </svg>
  );
}

function GraphPaper() {
  const [k, setK] = useState(0);
  const [mode, setMode] = useState<'new' | 'now'>('new');
  const here = useRef<HTMLSpanElement>(null);
  const cell = useRef<HTMLDivElement>(null);
  const note = useRef<HTMLSpanElement>(null);
  const course = useRef<HTMLSpanElement>(null);
  return (
    <>
      <div className="legend" style={{ margin: '0 0 10px' }}>
        <button onClick={() => setMode(mode === 'new' ? 'now' : 'new')}>
          Showing: {mode === 'new' ? 'Handline' : 'the arrow today'}
        </button>
        <button onClick={() => setK((n) => n + 1)}>Replay</button>
      </div>
      <div className="graph">
        <div className="years">
          <div className="year">
            Grade 9<small>Record · 2025-26</small>
          </div>
          <div className="year now" ref={cell}>
            Grade 10<small>This year</small>
          </div>
          <div className="year">Grade 11</div>
          <div className="year">Grade 12</div>
        </div>
        {mode === 'now' ? (
          <span
            className="hand"
            style={{
              left: 'calc(25% + 24px)',
              top: 156,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              transform: 'rotate(-2deg)',
            }}
          >
            <HereArrowNow />
            you are here
          </span>
        ) : (
          <span
            className="hand"
            ref={here}
            style={{ left: 'calc(25% + 96px)', top: 196, transform: 'rotate(-2deg)' }}
          >
            you are here
          </span>
        )}
        <span className="course" ref={course} style={{ left: 60, top: 300 }}>
          Chemistry
        </span>
        <span className="hand" ref={note} style={{ left: 330, top: 330, color: 'hsl(45 74% 28%)' }}>
          ask about Honors?
        </span>
        <HandlineLayer>
          {mode === 'new' && (
            <Handline
              key={`here-${k}`}
              from={{ target: here, at: [0, 0.2], offset: [-5, -2] }}
              to={{ target: cell, at: [0.3, 0.72], shape: 'auto' }}
              land={0.3}
              gesture={{ kind: 'loop', size: 7, at: 0.45, bow: 0.12 }}
              side={1}
              pen={{ base: 'ink', width: 1.5, jitter: 0.2 }}
              head={{ kind: 'chevron', size: 7, angle: 30 }}
              tail="none"
              color="hsl(160 100% 15% / 0.8)"
              seed="you-are-here"
              delay={400}
              play="in-view"
            />
          )}
          <Handline
            key={`note-${k}`}
            from={{ target: note, at: [0, 0.55], offset: [-8, 0] }}
            to={course}
            gesture={{ kind: 'arc', bow: 0.12 }}
            side={1}
            gap={8}
            pen={{ base: 'pencil', width: 1.3, passes: 1, grain: 0.25 }}
            head="none"
            ring
            color="hsl(45 74% 28%)"
            seed="margin-note"
            delay={900}
            play="in-view"
          />
        </HandlineLayer>
      </div>
    </>
  );
}

// --- Stress ---------------------------------------------------------------------------

function Stress() {
  const [k, setK] = useState(0);
  const [fps, setFps] = useState<string>('');
  const lines = useMemo(() => {
    let s = 7 + k;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    return Array.from({ length: 60 }, (_, i) => ({
      from: { x: 20 + rnd() * 1000, y: 20 + rnd() * 320 },
      to: { x: 20 + rnd() * 1000, y: 20 + rnd() * 320 },
      gesture: GESTURE_NAMES[i % GESTURE_NAMES.length],
      pen: PEN_NAMES[i % PEN_NAMES.length],
    }));
  }, [k]);

  const run = () => {
    setK((n) => n + 1);
    const times: number[] = [];
    let last = performance.now();
    const t0 = last;
    const tick = (now: number) => {
      times.push(now - last);
      last = now;
      if (now - t0 < 1800) requestAnimationFrame(tick);
      else {
        const sorted = [...times].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        setFps(
          `avg ${avg.toFixed(1)} ms/frame · p95 ${p95.toFixed(1)} ms · ${times.length} frames`
        );
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <>
      <div className="legend" style={{ margin: '0 0 10px' }}>
        <button onClick={run}>Draw sixty</button>
        <span>{fps}</span>
      </div>
      <div className="paper stress">
        {k > 0 && (
          <HandlineLayer>
            {lines.map((l, i) => (
              <Handline key={`${k}-${i}`} {...l} head="chevron" seed={`${k}-${i}`} />
            ))}
          </HandlineLayer>
        )}
      </div>
    </>
  );
}
