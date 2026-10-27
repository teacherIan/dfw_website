import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
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
} from 'handline';
import { measure } from 'handline';
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
  outside,
  children,
}: {
  name: string;
  dark?: boolean;
  /** Real content (text a line points at): kept out of the aria-hidden layer. */
  outside?: ReactNode;
  children: (k: number) => ReactNode;
}) {
  const [k, setK] = useState(0);
  const again = () => setK((n) => n + 1);
  return (
    <div
      className={dark ? 'card dark' : 'card'}
      role="button"
      tabIndex={0}
      aria-label={`Draw ${name} again`}
      onClick={again}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          again();
        }
      }}
    >
      <span className="card-name">{name}</span>
      {outside}
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
          reach={-10}
          seed="hero"
          side="right"
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

/** Arrow keys move a draggable end 12 px. */
function nudgeKeys(pos: P, set: (p: P) => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    const d = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[
      e.key
    ];
    if (!d) return;
    e.preventDefault();
    set({ x: pos.x + d[0], y: pos.y + d[1] });
    follow(120);
  };
}

const TARGETS = ['circle', 'card', 'pill', 'text'] as const;
type TargetKind = (typeof TARGETS)[number];

function Target({ kind, label }: { kind: TargetKind; label?: string }) {
  if (kind === 'circle') return null;
  return <>{label}</>;
}

/** The playground's settings as JSX someone can paste. */
function toJSX(props: Record<string, unknown>): string {
  const attr = ([k, v]: [string, unknown]) =>
    v === true
      ? k
      : typeof v === 'string'
        ? `${k}="${v}"`
        : `${k}={${JSON.stringify(v)
            .replace(/"(\w+)":/g, '$1: ')
            .replace(/"/g, "'")}}`;
  const parts = Object.entries(props).filter(([, v]) => v !== undefined && v !== false);
  return `<Handline\n  from={label}\n  to={target}\n${parts.map((p) => `  ${attr(p)}`).join('\n')}\n/>`;
}

function Playground() {
  const [a, setA] = useState<P>({ x: 120, y: 330 });
  const [b, setB] = useState<P>({ x: 760, y: 130 });
  const ra = useRef<HTMLDivElement>(null);
  const rb = useRef<HTMLDivElement>(null);
  const [replay, setReplay] = useState(0);
  const [built, setBuilt] = useState<Drawing | null>(null);
  const [copied, setCopied] = useState('');

  const line = useControls('Line', {
    gesture: { value: 'loops' as GestureName, options: GESTURE_NAMES },
    loopSize: { value: 18, min: 4, max: 44, step: 1 },
    loopCount: { value: 2, min: 1, max: 6, step: 1 },
    side: { value: 'auto', options: ['auto', 'left', 'right'] },
    bow: { value: 0, min: -0.4, max: 0.4, step: 0.01 },
    seed: 'playground',
  });
  const land = useControls('Target & landing', {
    target: { value: 'circle' as TargetKind, options: [...TARGETS] },
    toCentre: { value: false, label: "reach 'center'" },
    reach: { value: -6, min: -30, max: 30, step: 1, label: 'reach (px)' },
    aimX: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'aim x' },
    aimY: { value: 0.5, min: 0, max: 1, step: 0.05, label: 'aim y' },
    overlay: { value: false, label: 'show centreline, aim, tip' },
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
    headSize: { value: 0, min: 0, max: 24, step: 1, label: 'head size (0 auto)' },
    tail: { value: 'dot' as TailKind, options: TAILS },
    ring: false,
    ticks: false,
    scribe: false,
    dimension: false,
  });
  const play = useControls('Play', {
    slow: { value: false, label: 'quarter speed' },
    replay: button(() => setReplay((n) => n + 1)),
  });

  const gesture: GestureSpec | GestureName =
    line.gesture === 'loop'
      ? { kind: 'loop', size: line.loopSize }
      : line.gesture === 'loops'
        ? { kind: 'loops', count: line.loopCount, size: line.loopSize }
        : line.gesture === 'spring'
          ? { kind: 'spring', size: Math.max(3, line.loopSize / 3) }
          : line.gesture;

  const style = {
    gesture,
    side: line.side as 'auto' | 'left' | 'right',
    bow: line.bow || undefined,
    reach: land.toCentre ? ('center' as const) : land.reach,
    seed: line.seed,
    pen: {
      base: pen.preset,
      width: pen.width,
      jitter: pen.jitter,
      pressure: pen.pressure,
      curveInk: pen.curveInk,
      passes: pen.passes,
      grain: pen.grain,
      speed: play.slow ? pen.speed / 4 : pen.speed,
      curveSlow: pen.curveSlow,
    },
    head: ends.headSize ? { kind: ends.head, size: ends.headSize } : ends.head,
    tail: ends.tail,
    ring: ends.ring,
    marks:
      ends.ticks || ends.scribe || ends.dimension
        ? {
            ticks: ends.ticks ? { count: 6 } : undefined,
            scribe: ends.scribe ? {} : undefined,
            dimension: ends.dimension ? {} : undefined,
          }
        : undefined,
    timing: play.slow ? { min: 1000, max: 8000 } : undefined,
  };

  const copy = () => {
    const { pen: p, ...rest } = style;
    const preset = PENS[p.base];
    const changed = Object.fromEntries(
      Object.entries(p).filter(([k, v]) => k === 'base' || preset[k as keyof typeof preset] !== v)
    );
    const jsx = toJSX({
      ...rest,
      to: undefined,
      pen: Object.keys(changed).length > 1 ? changed : p.base,
      timing: undefined,
    }).replace(
      'to={target}',
      land.aimX === 0.5 && land.aimY === 0.5
        ? 'to={target}'
        : `to={{ target, at: [${land.aimX}, ${land.aimY}] }}`
    );
    navigator.clipboard?.writeText(jsx).then(
      () => setCopied('Copied'),
      () => setCopied(jsx)
    );
  };

  const dragA = useDrag(a, setA);
  const dragB = useDrag(b, setB);
  const len = built ? Math.round(measure(built.centerline).length) : 0;
  const targetClass =
    land.target === 'circle'
      ? 'dot-target'
      : land.target === 'card'
        ? 'card-target'
        : land.target === 'pill'
          ? 'pill-target'
          : 'text-target';

  return (
    <>
      <div className="paper play">
        <div
          ref={ra}
          className="chip"
          tabIndex={0}
          aria-label="Line start: drag, or use the arrow keys"
          style={{ left: a.x, top: a.y, transform: 'translate(-50%, -50%)' }}
          onKeyDown={nudgeKeys(a, setA)}
          {...dragA}
        >
          Gallery
        </div>
        <div
          ref={rb}
          className={targetClass}
          tabIndex={0}
          aria-label="Line target: drag, or use the arrow keys"
          style={{ left: b.x, top: b.y, transform: 'translate(-50%, -50%)' }}
          onKeyDown={nudgeKeys(b, setB)}
          {...dragB}
        >
          <Target
            kind={land.target}
            label={
              land.target === 'card'
                ? 'Grade 10'
                : land.target === 'pill'
                  ? 'Chemistry'
                  : 'this one'
            }
          />
        </div>
        <HandlineLayer>
          <Handline
            key={`${replay}-${land.target}`}
            from={ra}
            to={{ target: rb, at: [land.aimX, land.aimY] }}
            {...style}
            onBuild={setBuilt}
          />
        </HandlineLayer>
        {land.overlay && built && <Overlay d={built} />}
        <div className="stats">
          {built && (
            <>
              {len} px · {built.strokes.length} strokes · {Math.round(built.duration)} ms to draw
            </>
          )}
        </div>
      </div>
      <div className="legend">
        <button onClick={copy}>Copy JSX</button>
        <button onClick={() => setReplay((n) => n + 1)}>Replay</button>
        {copied && <span>{copied === 'Copied' ? copied : 'Select and copy:'}</span>}
      </div>
      {copied && copied !== 'Copied' && <pre className="jsx">{copied}</pre>}
    </>
  );
}

/** The fitted centreline (dashed), where the line was aimed (+), and the tip (dot). */
function Overlay({ d }: { d: Drawing }) {
  const pts = d.centerline.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return (
    <svg className="overlay" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#2f7fb5" strokeWidth={1} strokeDasharray="4 3" />
      {d.aim && (
        <path
          d={`M${d.aim.x - 6} ${d.aim.y}H${d.aim.x + 6}M${d.aim.x} ${d.aim.y - 6}V${d.aim.y + 6}`}
          stroke="#c4472f"
          strokeWidth={1.5}
        />
      )}
      <circle cx={d.end.x} cy={d.end.y} r={2.5} fill="#c4472f" />
    </svg>
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
      <Card
        name="ring it"
        outside={
          <span
            ref={word}
            style={{ position: 'absolute', left: 150, top: 46, font: '600 24px Caveat' }}
          >
            this one
          </span>
        }
      >
        {(k) => (
          <Handline
            key={k}
            from={{ x: 24, y: 120 }}
            to={word}
            gesture="arc"
            side="right"
            pen="pencil"
            head="none"
            ring
            reach={-12}
            seed="ring"
            play="in-view"
          />
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
            reach="center"
            gesture={row.gesture}
            side={1}
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
          <div className="year now" ref={cell} aria-current="step">
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
              to={{ target: cell, at: [0.3, 0.9] }}
              reach={12}
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
            reach={-8}
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
