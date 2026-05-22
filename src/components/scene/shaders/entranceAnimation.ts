/**
 * GLSL entrance animation - particles assemble from a swirl
 *
 * Features:
 * - Far particles appear first, building the scene towards the camera
 * - Smaller particles appear before larger ones
 * - Dark/grayscale objects appear first (sketch-like), then colorful elements
 * - Mobile options: hide tiny, calm motion, skip animation, speed up small particles
 */

export const assembleFunction = `
// Graceful entrance effect: particles assemble from a swirl
// Far particles appear first, building the scene towards the camera
// Smaller particles appear before larger ones
// Dark/grayscale objects appear first (sketch-like), then colorful elements
// Mobile options: hide tiny, calm motion, skip animation, speed up small particles
vec4 assemble(vec3 pos, vec3 scale, vec3 color, float t, float depthOffset, float speed,
              float smallThreshold, float motionReduction, float skipSmall, float smallSpeed) {
  vec3 h = hash(pos);

  // Calculate particle size magnitude (average of scale components)
  float scaleMag = (scale.x + scale.y + scale.z) / 3.0;

  // Normalize scale to a reasonable range (0-1) for timing
  float normalizedScale = clamp(log(scaleMag + 1.0) * 0.5, 0.0, 1.0);

  // Option 1: Hide tiny particles (return early with -1 marker)
  if (normalizedScale < smallThreshold) {
    return vec4(pos, -1.0);
  }

  // Option 4: Speed up small particles (smaller = faster)
  float effectiveSpeed = speed;
  if (normalizedScale < 0.5 && smallSpeed > 1.0) {
    effectiveSpeed = speed * mix(smallSpeed, 1.0, normalizedScale * 2.0);
  }
  t = t * effectiveSpeed;

  // Option 3: Skip animation for small particles (just fade in)
  if (skipSmall > 0.5 && normalizedScale < 0.4) {
    float fadeIn = smoothstep(0.0, 3.0, t);
    return vec4(pos, fadeIn);
  }

  // Calculate start time based on depth, size, color
  float depthFactor = -pos.y * 2.5 + depthOffset;
  float dist = length(pos.xz);
  float brightness = (color.r + color.g + color.b) / 3.0;
  float saturation = max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
  float colorDelay = brightness * 4.0 + saturation * 6.0;
  float start = depthFactor + normalizedScale * 8.0 + colorDelay + dist * 0.2 + h.x * 1.5;

  float s = smoothstep(start, start + 5.0, t);

  // Option 2: Reduce motion for small particles
  float motionScale = 1.0;
  if (normalizedScale < 0.5 && motionReduction > 0.0) {
    motionScale = mix(1.0 - motionReduction, 1.0, normalizedScale * 2.0);
  }

  // Apply scatter with motion reduction
  float scatterAmount = (20.0 + normalizedScale * 15.0) * motionScale;
  vec3 scattered = pos + (h - 0.5) * scatterAmount * (1.0 - s);

  // Apply vertical offset with motion reduction
  float verticalOffset = mix(-12.0, 8.0, normalizedScale) * motionScale;
  scattered.y += verticalOffset * (1.0 - s);

  // Apply swirl with motion reduction
  float swirlIntensity = mix(5.0, 2.0, normalizedScale) * motionScale;
  float angle = (1.0 - s) * swirlIntensity;
  float cosA = cos(angle);
  float sinA = sin(angle);
  float x = scattered.x * cosA - scattered.z * sinA;
  float z = scattered.x * sinA + scattered.z * cosA;
  scattered.x = x;
  scattered.z = z;

  // Apply floating motion with motion reduction
  float floatPhase = h.y * 6.28318 + t * 1.0;
  float floatAmount = (1.0 - normalizedScale) * (1.0 - s) * 0.5 * motionScale;
  scattered.y += sin(floatPhase) * floatAmount;

  return vec4(scattered, s);
}
`;
