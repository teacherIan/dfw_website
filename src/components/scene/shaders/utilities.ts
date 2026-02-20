/**
 * GLSL utility functions for splat shaders
 */

/**
 * Hash function for pseudo-random values
 * Used by entrance and exit animations for particle variation
 */
export const hashFunction = `
// Hash function for pseudo-random values
vec3 hash(vec3 p) {
  p = fract(p * vec3(443.537, 537.247, 247.428));
  p += dot(p, p.yxz + 19.19);
  return fract((p.xxy + p.yxx) * p.zyx);
}
`;
