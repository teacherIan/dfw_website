/**
 * GLSL Shader Functions
 *
 * This module exports all GLSL shader code used by the splat visualizer.
 * The shaders are organized into three categories:
 * - utilities: Hash and helper functions
 * - entranceAnimation: Particle assembly effect
 * - exitAnimations: All 16 exit transition effects
 */

export { hashFunction } from './utilities';
export { assembleFunction } from './entranceAnimation';
export {
  exitGust,
  exitSonic,
  exitCosmic,
  exitPond,
  exitExploded,
  exitSawdust,
  exitExplosion,
  exitAsh,
  exitShatter,
  exitGlitch,
  exitBlackHole,
  exitPollen,
  exitFreeze,
  exitSand,
  exitTeleport,
  exitBlueprintWall,
  applyExitAnimation,
  allExitAnimations,
} from './exitAnimations';

/**
 * Combines all shader globals into a single GLSL code block
 */
export { hashFunction as hashGLSL } from './utilities';
export { assembleFunction as assembleGLSL } from './entranceAnimation';
export { allExitAnimations as exitAnimationsGLSL } from './exitAnimations';
