/**
 * SVG Filter definitions for woodworker-style arrow effects
 * Renders once at app root and referenced by ID in arrow components
 */

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

interface ArrowFilterDefsProps {
  config: ArrowEffectsConfig;
}

/**
 * SVG filter definitions component
 * Renders invisible SVG with <defs> containing all filter effects
 * Must be rendered once at app root level
 */
export const ArrowFilterDefs = ({ config }: ArrowFilterDefsProps) => {
  // Generate unique seed for each filter instance
  const pencilSeed = 42;
  const pressureSeed = 137;
  const chalkSeed = 256;

  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        {/* Pencil/Graphite Texture Filter */}
        <filter
          id="arrow-pencil-texture"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={config.pencilGrain}
            numOctaves={config.pencilOctaves}
            seed={pencilSeed}
            result="pencilNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="pencilNoise"
            scale={config.pencilDisplace}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Line Weight Variance (Pressure) Filter */}
        <filter
          id="arrow-pressure-variance"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="turbulence"
            baseFrequency={config.pressureFreq}
            numOctaves={1}
            seed={pressureSeed}
            result="pressureNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="pressureNoise"
            scale={config.pressureScale}
            xChannelSelector="R"
            yChannelSelector="R"
          />
        </filter>

        {/* Chalk-like Edges Filter */}
        <filter
          id="arrow-chalk-edges"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={config.chalkFreq}
            numOctaves={2}
            seed={chalkSeed}
            result="chalkNoise"
          />
          <feComposite
            in="SourceGraphic"
            in2="chalkNoise"
            operator="in"
            result="chalkBase"
          />
          <feGaussianBlur in="chalkBase" stdDeviation={config.chalkBlur} />
        </filter>

        {/* Combined Woodworker Effect (Performance Optimized) */}
        <filter
          id="arrow-woodworker"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
          filterUnits="objectBoundingBox"
        >
          {/* Layer 1: Pencil grain texture */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency={config.pencilGrain}
            numOctaves={config.pencilOctaves}
            seed={pencilSeed}
            result="grain"
          />

          {/* Layer 2: Pressure variance */}
          <feTurbulence
            type="turbulence"
            baseFrequency={config.pressureFreq}
            numOctaves={1}
            seed={pressureSeed}
            result="pressure"
          />

          {/* Apply pencil grain displacement */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={config.pencilEnabled ? config.pencilDisplace : 0}
            xChannelSelector="R"
            yChannelSelector="G"
            result="grained"
          />

          {/* Apply pressure variance displacement */}
          <feDisplacementMap
            in="grained"
            in2="pressure"
            scale={config.pressureEnabled ? config.pressureScale : 0}
            xChannelSelector="R"
            yChannelSelector="R"
            result="pressured"
          />

          {/* Apply chalk-like softening */}
          <feGaussianBlur
            in="pressured"
            stdDeviation={config.chalkEnabled ? config.chalkBlur * 0.5 : 0}
          />
        </filter>

        {/* Subtle pencil-only filter for lighter effect */}
        <filter
          id="arrow-pencil-light"
          x="-15%"
          y="-15%"
          width="130%"
          height="130%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency={config.pencilGrain * 0.7}
            numOctaves={2}
            seed={pencilSeed}
            result="lightGrain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="lightGrain"
            scale={config.pencilDisplace * 0.5}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};

/**
 * Get the appropriate filter URL based on config
 */
export const getArrowFilterUrl = (config: ArrowEffectsConfig): string => {
  if (!config.enabled) {
    return 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))';
  }

  // Use combined filter for full effect
  if (config.pencilEnabled || config.pressureEnabled || config.chalkEnabled) {
    return 'url(#arrow-woodworker)';
  }

  // Fallback to drop shadow
  return 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))';
};

export default ArrowFilterDefs;
