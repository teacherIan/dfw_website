import { useControls, folder } from 'leva';
import type { ArrowEffectsConfig } from '../components/navigation/ArrowFilters';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

/**
 * Leva controls for woodworker-style arrow effects
 * All effects are toggleable and have adjustable parameters
 */
export const useArrowEffectsControls = (controlsStore?: LevaStore): ArrowEffectsConfig => {
  // Master toggle
  const master = useControls({
    '✏️ Arrow Effects': folder({
      enabled: { value: false, label: 'Enable Effects' },
    }, { collapsed: false }),
  }, { store: controlsStore });

  // Pencil/Graphite texture
  const pencil = useControls({
    '✏️ Arrow Effects.Pencil Texture': folder({
      pencilEnabled: { value: true, label: 'Enabled' },
      pencilGrain: {
        value: 0.06,
        min: 0.01,
        max: 0.15,
        step: 0.005,
        label: 'Grain',
      },
      pencilOctaves: {
        value: 3,
        min: 1,
        max: 5,
        step: 1,
        label: 'Detail',
      },
      pencilDisplace: {
        value: 2.0,
        min: 0.2,
        max: 5.0,
        step: 0.2,
        label: 'Roughness',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Line weight variance (pressure)
  const pressure = useControls({
    '✏️ Arrow Effects.Line Weight Variance': folder({
      pressureEnabled: { value: true, label: 'Enabled' },
      pressureFreq: {
        value: 0.03,
        min: 0.005,
        max: 0.08,
        step: 0.005,
        label: 'Frequency',
      },
      pressureScale: {
        value: 1.5,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Intensity',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Chalk-like edges
  const chalk = useControls({
    '✏️ Arrow Effects.Chalk Edges': folder({
      chalkEnabled: { value: true, label: 'Enabled' },
      chalkFreq: {
        value: 0.1,
        min: 0.02,
        max: 0.2,
        step: 0.01,
        label: 'Dustiness',
      },
      chalkBlur: {
        value: 0.5,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        label: 'Softness',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Hash/Witness marks
  const hash = useControls({
    '✏️ Arrow Effects.Hash/Witness Marks': folder({
      hashEnabled: { value: true, label: 'Enabled' },
      hashDensity: {
        value: 6,
        min: 3,
        max: 20,
        step: 1,
        label: 'Count',
      },
      hashLength: {
        value: 8,
        min: 2,
        max: 15,
        step: 0.5,
        label: 'Length (px)',
      },
      hashSpacing: {
        value: 'random' as const,
        options: ['even', 'random'] as const,
        label: 'Spacing',
      },
      hashOpacity: {
        value: 0.6,
        min: 0.1,
        max: 1.0,
        step: 0.05,
        label: 'Opacity',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Scribe marks
  const scribe = useControls({
    '✏️ Arrow Effects.Scribe Marks': folder({
      scribeEnabled: { value: true, label: 'Enabled' },
      scribeOffset: {
        value: 4,
        min: 1,
        max: 10,
        step: 0.5,
        label: 'Offset (px)',
      },
      scribeWidth: {
        value: 0.5,
        min: 0.2,
        max: 1.0,
        step: 0.1,
        label: 'Width',
      },
      scribeDash: {
        value: '6 4',
        label: 'Dash Pattern',
      },
      scribeOpacity: {
        value: 0.5,
        min: 0.1,
        max: 0.8,
        step: 0.05,
        label: 'Opacity',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  // Arrowhead style
  const arrowhead = useControls({
    '✏️ Arrow Effects.Arrowhead Style': folder({
      arrowheadStyle: {
        value: 'standard' as const,
        options: ['standard', 'layout', 'simple'] as const,
        label: 'Style',
      },
    }, { collapsed: true }),
  }, { store: controlsStore });

  return {
    enabled: master.enabled,
    pencilEnabled: pencil.pencilEnabled,
    pencilGrain: pencil.pencilGrain,
    pencilOctaves: pencil.pencilOctaves,
    pencilDisplace: pencil.pencilDisplace,
    pressureEnabled: pressure.pressureEnabled,
    pressureFreq: pressure.pressureFreq,
    pressureScale: pressure.pressureScale,
    chalkEnabled: chalk.chalkEnabled,
    chalkFreq: chalk.chalkFreq,
    chalkBlur: chalk.chalkBlur,
    hashEnabled: hash.hashEnabled,
    hashDensity: hash.hashDensity,
    hashLength: hash.hashLength,
    hashSpacing: hash.hashSpacing,
    hashOpacity: hash.hashOpacity,
    scribeEnabled: scribe.scribeEnabled,
    scribeOffset: scribe.scribeOffset,
    scribeWidth: scribe.scribeWidth,
    scribeDash: scribe.scribeDash,
    scribeOpacity: scribe.scribeOpacity,
    arrowheadStyle: arrowhead.arrowheadStyle,
  };
};
