/**
 * How the nav arrows are drawn, as handline styles.
 *
 * The "✏️ Arrow Effects" Leva panel keeps its switches; they now drive the
 * handline pen and marks instead of the old SVG filters (which wobbled the
 * line but couldn't change its weight, and re-rendered every frame of the draw).
 */
import type { HeadSpec, LineStyle, MarksSpec, PenInput, Reach } from 'handline';

export interface ArrowEffectsConfig {
  // Master toggle
  enabled: boolean;

  // Pencil/Graphite texture
  pencilEnabled: boolean;
  pencilGrain: number;
  pencilOctaves: number;
  pencilDisplace: number;

  // Line weight variance (pressure)
  pressureEnabled: boolean;
  pressureFreq: number;
  pressureScale: number;

  // Chalk-like edges
  chalkEnabled: boolean;
  chalkFreq: number;
  chalkBlur: number;

  // Hash/Witness marks
  hashEnabled: boolean;
  hashDensity: number;
  hashLength: number;
  hashSpacing: 'even' | 'random';
  hashOpacity: number;

  // Scribe marks
  scribeEnabled: boolean;
  scribeOffset: number;
  scribeWidth: number;
  scribeDash: string;
  scribeOpacity: number;

  // Arrowhead style
  arrowheadStyle: 'standard' | 'layout' | 'simple';
}

export const defaultArrowEffectsConfig: ArrowEffectsConfig = {
  enabled: false,
  pencilEnabled: true,
  pencilGrain: 0.06,
  pencilOctaves: 3,
  pencilDisplace: 2.0,
  pressureEnabled: true,
  pressureFreq: 0.03,
  pressureScale: 1.5,
  chalkEnabled: true,
  chalkFreq: 0.1,
  chalkBlur: 0.5,
  hashEnabled: true,
  hashDensity: 6,
  hashLength: 8,
  hashSpacing: 'random',
  hashOpacity: 0.6,
  scribeEnabled: true,
  scribeOffset: 4,
  scribeWidth: 0.5,
  scribeDash: '6 4',
  scribeOpacity: 0.5,
  arrowheadStyle: 'standard',
};

export type ArrowSize = 'art' | 'desktop' | 'mobile';

/**
 * 'art' arrows are drawn in their 70 × 50 viewBox (about 1.6 px a unit at
 * their CSS width); the live desktop and mobile arrows in px. Widths and
 * sizes are in those units.
 */
const BASE: Record<ArrowSize, { width: number; jitter: number; head: number }> = {
  art: { width: 1.05, jitter: 0.12, head: 6.5 },
  // Closer to the weight of the Caveat labels they join (whose strokes run
  // ~3.5 px at 60 px); the old 1.5 px read as a different, thinner pen.
  desktop: { width: 2.2, jitter: 0.2, head: 11 },
  mobile: { width: 2.5, jitter: 0.3, head: 10 },
};

/**
 * How far into its button a nav arrow goes (Ian, 10-26: the arrows read
 * better landing on the button than stopping at its edge).
 */
export const NAV_ARROW_REACH: Reach = 'center';

const HEADS: Record<ArrowEffectsConfig['arrowheadStyle'], HeadSpec['kind']> = {
  standard: 'chevron',
  layout: 'open',
  simple: 'tick',
};

export function arrowStyle(
  config: ArrowEffectsConfig | undefined,
  size: ArrowSize
): Pick<LineStyle, 'pen' | 'head' | 'marks' | 'timing'> {
  const c = config ?? defaultArrowEffectsConfig;
  const b = BASE[size];
  const head: HeadSpec = {
    kind: HEADS[c.arrowheadStyle],
    size: c.arrowheadStyle === 'layout' ? b.head * 0.8 : b.head,
  };
  // The menu's choreography expects each arrow to take about 0.6 s.
  const timing = { min: 520, max: 760 };

  if (!c.enabled) {
    const pen: PenInput = {
      base: 'ink',
      width: b.width,
      jitter: b.jitter,
      taperIn: 0.35,
      taperOut: 0.7,
      pressure: 0.12,
    };
    return { pen, head, timing };
  }

  const pen: PenInput = {
    base: 'pencil',
    width: b.width * 1.1,
    jitter: c.pencilEnabled ? b.jitter + c.pencilDisplace * 0.18 : b.jitter,
    pressure: c.pressureEnabled ? Math.min(1, c.pressureScale / 3) : 0.05,
    grain: c.pencilEnabled ? Math.min(1, c.pencilGrain * 8) : 0,
    passes: c.chalkEnabled ? 2 : 1,
  };
  const dash = c.scribeDash.split(/[\s,]+/).map(Number);
  const marks: MarksSpec | undefined =
    c.hashEnabled || c.scribeEnabled
      ? {
          ticks: c.hashEnabled
            ? { count: c.hashDensity, length: c.hashLength, spacing: c.hashSpacing }
            : undefined,
          scribe: c.scribeEnabled
            ? {
                offset: c.scribeOffset,
                width: c.scribeWidth,
                dash: dash.length === 2 && dash.every((n) => n > 0) ? [dash[0], dash[1]] : [6, 4],
              }
            : undefined,
        }
      : undefined;
  return { pen, head, marks, timing };
}
