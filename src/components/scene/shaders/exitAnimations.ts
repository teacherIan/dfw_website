/**
 * GLSL Exit Animation Functions
 *
 * All 16 exit animations for splat transitions:
 * 1=Gust, 2=Sonic, 3=Cosmic, 4=Pond, 5=Exploded, 6=Sawdust, 7=Explosion
 * 8=Ash, 9=Shatter, 10=Glitch, 11=BlackHole, 12=Pollen, 13=Freeze, 14=Sand, 15=Teleport, 16=BlueprintUnroll
 */

// 1. Gust of Wind (Ethos)
export const exitGust = `
// 1. Gust of Wind (Ethos) - Toned down
vec4 exitGust(vec3 pos, vec3 scale, float progress, vec3 h) {
  vec3 windDir = normalize(vec3(1.0, 0.4, -0.2));
  float weight = mix(0.7, 1.3, h.x);
  float xDelay = (pos.x + 8.0) / 16.0;
  float effectiveProgress = smoothstep(xDelay * 0.3, 1.0, progress);
  float movement = pow(effectiveProgress, 2.0) * 15.0 / weight;
  vec3 newPos = pos + windDir * movement;
  float turbulence = sin(effectiveProgress * 10.0 + h.y * 6.28) * effectiveProgress * 0.8;
  newPos.y += turbulence;
  newPos.z += cos(effectiveProgress * 8.0 + h.z * 6.28) * effectiveProgress * 0.6;
  float scaleMult = 1.0 - effectiveProgress * 0.7;
  float opacity = 1.0 - effectiveProgress;
  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 2. Sonic Boom (Contact)
export const exitSonic = `
// 2. Sonic Boom (Contact) - Toned down
vec4 exitSonic(vec3 pos, vec3 scale, float progress, vec3 h) {
  vec3 origin = vec3(0.0, -1.5, 3.0);
  vec3 diff = pos - origin;
  float dist = length(diff);
  vec3 dir = normalize(diff + vec3(0.001));
  float radius = progress * 35.0;
  float width = 3.0;
  float shock = 1.0 - smoothstep(0.0, width, abs(dist - radius));
  vec3 newPos = pos;
  newPos += dir * shock * 1.5;
  if (dist < radius) {
     float jitter = (1.0 - progress) * 0.5;
     newPos += (h - 0.5) * jitter * 1.0;
     newPos += dir * progress * 4.0;
  }
  float scaleMult = 1.0;
  if (dist < radius) {
     scaleMult = 1.0 - (progress * 0.9);
     scaleMult *= (0.8 + 0.4 * sin(progress * 15.0 + h.x * 10.0));
  } else {
     scaleMult = 1.0 + shock * 0.3;
  }
  float opacity = 1.0;
  if (dist < radius) opacity = 1.0 - progress;
  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 3. Cosmic Vortex (Gallery)
export const exitCosmic = `
// 3. Cosmic Vortex (Gallery) - Toned down
vec4 exitCosmic(vec3 pos, vec3 scale, float progress, vec3 h) {
  vec3 center = vec3(0.0, 2.0, 0.0);
  vec3 offset = pos - center;
  float dist = length(offset);
  float suction = progress * progress * 12.0;
  float newDist = max(0.0, dist - suction);
  float suckedFactor = 1.0 - (newDist / (dist + 0.001));
  float rotation = progress * 2.0 + suckedFactor * 4.0;
  float cosA = cos(rotation);
  float sinA = sin(rotation);
  float rotX = offset.x * cosA - offset.z * sinA;
  float rotZ = offset.x * sinA + offset.z * cosA;
  vec3 newPos = center + vec3(rotX, offset.y, rotZ) * (newDist / (dist + 0.001));
  newPos.y += suckedFactor * 4.0 * (h.y + 0.2);
  float scaleMult = 1.0 - suckedFactor;
  float opacity = 1.0 - suckedFactor;
  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 4. Pond Ripple (Gentle)
export const exitPond = `
// 4. Pond Ripple (Gentle)
vec4 exitPond(vec3 pos, vec3 scale, float progress, vec3 h, float speed, float freq, float amp, float waveCount) {
  vec3 origin = vec3(0.0, 0.0, 0.0);
  float dist = length(pos.xz - origin.xz);

  // Wave parameters from uniforms
  float wavefront = progress * speed * 2.5;
  float phase = dist * freq - progress * speed;

  float distFromFront = wavefront - dist;

  // Before wave hits: stay in place, fully visible
  if (distFromFront < 0.0) return vec4(pos, 1000.0 + 0.999);

  // Ripple envelope - how much this particle is affected
  float rippleWidth = waveCount / freq;
  float envelope = (1.0 - smoothstep(0.0, rippleWidth, distFromFront)) * smoothstep(0.0, 2.0, distFromFront);

  // Gentle wave displacement
  float rippleY = sin(phase) * amp * envelope * 0.5;

  vec3 newPos = pos;
  newPos.y += rippleY;

  // Subtle horizontal ripple
  vec2 dir = normalize(pos.xz - origin.xz + vec2(0.001));
  float rippleH = cos(phase) * amp * 0.15 * envelope;
  newPos.x += dir.x * rippleH;
  newPos.z += dir.y * rippleH;

  // Fade calculation - ensure BOTH scale and opacity reach 0
  float fadeStart = rippleWidth * 0.3;
  float fadeEnd = rippleWidth * 0.95;
  float fadeProgress = smoothstep(fadeStart, fadeEnd, distFromFront);

  // Critical: Both scale AND opacity must go to 0 to avoid white artifacts
  float scaleMult = max(0.0, 1.0 - fadeProgress);
  float opacity = max(0.0, 1.0 - fadeProgress);

  // If fully faded, ensure complete invisibility
  if (fadeProgress > 0.99) {
    scaleMult = 0.0;
    opacity = 0.0;
  }

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 5. Exploded View (Gentle)
export const exitExploded = `
// 5. Exploded View (Gentle)
vec4 exitExploded(vec3 pos, vec3 scale, float progress, vec3 h, float expansionStrength, float rotationSpeed, float fadeStart, float fadeEnd) {
  vec3 center = vec3(0.0, 2.0, 0.0);
  vec3 offset = pos - center;

  // Use uniform for expansion strength
  float expansion = 1.0 + smoothstep(0.0, 1.0, progress) * expansionStrength;
  vec3 newPos = center + offset * expansion;

  // Use uniform for rotation speed
  float rotAngle = progress * rotationSpeed * (h.y + 0.5);
  float cosA = cos(rotAngle);
  float sinA = sin(rotAngle);
  vec3 relPos = newPos - center;
  float rotX = relPos.x * cosA - relPos.z * sinA;
  float rotZ = relPos.x * sinA + relPos.z * cosA;
  newPos = center + vec3(rotX, relPos.y, rotZ);

  // Use uniforms for fade timing (guarded for ordering/degenerate ranges)
  float fadeMin = min(fadeStart, fadeEnd);
  float fadeRange = max(0.0001, abs(fadeEnd - fadeStart));
  float fadeMax = fadeMin + fadeRange;
  float scaleFadeEnd = fadeMin + fadeRange * 0.95;
  float opacity = 1.0 - smoothstep(fadeMin, fadeMax, progress);

  // Scale down completely to 0 to ensure tiny particles disappear (sync with opacity fade)
  // Use a slightly more aggressive scale down to prevent single-pixel flickering
  // The smoothstep end point should be slightly BEFORE the fade end to ensure
  // they are scaled to 0 before they are fully transparent but still technically rendering
  float scaleMult = 1.0 - smoothstep(fadeMin, scaleFadeEnd, progress);

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 6. Sawdust Drift (Gentle falling particles like sawdust)
export const exitSawdust = `
// 6. Sawdust Drift (Gentle falling particles like sawdust)
vec4 exitSawdust(vec3 pos, vec3 scale, float progress, vec3 h,
                 float fallSpeed, float windStrength, float turbulence, float dissolveSpeed) {
  // Coordinate Space: Mesh has -90 deg X rotation
  // Local -Z = World Down, Local +Y = World Away from camera

  // All particles participate - use progress directly with per-particle delay
  float particleDelay = h.x * 0.4; // Stagger start times
  float adjustedProgress = max(0.0, (progress - particleDelay) / (1.0 - particleDelay));

  // Smooth easing for graceful motion
  float t = adjustedProgress * adjustedProgress * 2.0;

  // Per-particle fall speed variation
  float particleFallSpeed = fallSpeed * (0.7 + h.y * 0.6);

  vec3 newPos = pos;

  // Gravity: fall down (Local -Z = World -Y)
  newPos.z -= particleFallSpeed * t;

  // Wind: drift away from camera (Local +Y = World -Z)
  newPos.y += windStrength * t * (0.5 + h.z * 0.5);

  // Gentle lateral drift
  newPos.x += (h.x - 0.5) * windStrength * 0.3 * t;

  // Soft turbulence oscillation
  float turbTime = adjustedProgress * 4.0;
  newPos.x += sin(turbTime * 2.0 + h.z * 6.28) * turbulence * 0.3 * adjustedProgress;
  newPos.y += cos(turbTime * 1.5 + h.x * 6.28) * turbulence * 0.2 * adjustedProgress;
  newPos.z += sin(turbTime * 1.0 + h.y * 6.28) * turbulence * 0.1 * adjustedProgress;

  // Graceful fade - both scale AND opacity go to 0 (dissolveSpeed controls fade rate)
  float dissolveProgress = clamp(adjustedProgress * dissolveSpeed, 0.0, 1.0);
  float fadeProgress = smoothstep(0.3, 1.0, dissolveProgress);
  float scaleMult = 1.0 - fadeProgress;
  float opacity = 1.0 - fadeProgress;

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 7. Physics Explosion (Radial burst with gravity AND ground bounce!)
export const exitExplosion = `
// 7. Physics Explosion (Radial burst with gravity AND ground bounce!)
vec4 exitExplosion(vec3 pos, vec3 scale, float progress, vec3 h,
                   float strength, float gravity, float friction, float tumbleSpeed) {
  float t = progress * 2.5; // Slightly longer time scale for bounces
  if (t <= 0.0) return vec4(pos, 1000.0 + 0.999);
  float safeGravity = max(gravity, 0.001);

  // Ground plane in local space (Local -Z = World Down)
  // Position it below the scene
  float groundZ = -4.0;
  float bounceDamping = 0.55; // Energy retained after bounce (0.55 = decent bounce)

  // Explosion center in local space
  vec3 center = vec3(0.0, 0.0, 0.0);
  vec3 dir = pos - center;
  float dist = length(dir);
  vec3 normDir = normalize(dir + vec3(0.001));

  // Initial radial velocity - explode outward
  vec3 velocity = normDir * strength * (0.5 + h.x * 0.5);

  // Add random scatter
  velocity += (h - 0.5) * strength * 0.4;

  // Bias toward going away from camera (Local +Y = World -Z)
  velocity.y += strength * 0.3;

  // Slight upward initial velocity so particles arc before falling
  velocity.z += strength * 0.15 * (0.5 + h.z * 0.5);

  // Simulate position with bouncing
  vec3 newPos = pos;
  float remainingTime = t;
  vec2 xy = pos.xy;
  vec2 velXY = velocity.xy;
  float currentZ = pos.z;
  float currentVelZ = velocity.z;

  // Simulate up to 4 bounces
  for (int bounce = 0; bounce < 4; bounce++) {
    // Calculate time to hit ground: z + vz*t - 0.5*g*t^2 = groundZ
    // Solving quadratic: -0.5*g*t^2 + vz*t + (z - groundZ) = 0
    // t = (vz + sqrt(vz^2 + 2*g*(z - groundZ))) / g

    float heightAboveGround = currentZ - groundZ;

    // If already below ground or no time left, stop
    if (heightAboveGround < 0.0 || remainingTime <= 0.0) break;

    // Quadratic formula for time to impact
    float a = 0.5 * safeGravity;
    float b = -currentVelZ;
    float c = -heightAboveGround;
    float discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0.0) {
      // No impact - particle stays in air
      // Just apply normal physics for remaining time
      float segmentFriction = exp(-friction * 0.5 * remainingTime);
      xy += velXY * remainingTime * segmentFriction;
      newPos.z = currentZ + currentVelZ * remainingTime - 0.5 * safeGravity * remainingTime * remainingTime;
      break;
    }

    float sqrtDisc = sqrt(discriminant);
    float t1 = (-b - sqrtDisc) / (2.0 * a);
    float t2 = (-b + sqrtDisc) / (2.0 * a);

    // We want the smallest positive time
    float timeToImpact = t1 > 0.001 ? t1 : t2;

    if (timeToImpact > remainingTime || timeToImpact < 0.001) {
      // No impact within remaining time
      float segmentFriction = exp(-friction * 0.5 * remainingTime);
      xy += velXY * remainingTime * segmentFriction;
      newPos.z = currentZ + currentVelZ * remainingTime - 0.5 * safeGravity * remainingTime * remainingTime;
      break;
    }

    // Move to impact point
    float segmentFriction = exp(-friction * 0.5 * timeToImpact);
    xy += velXY * timeToImpact * segmentFriction;
    newPos.z = groundZ;

    // Velocity at impact (v = v0 - g*t)
    float impactVelZ = currentVelZ - safeGravity * timeToImpact;

    // Bounce! Reflect and dampen Z velocity
    currentVelZ = -impactVelZ * bounceDamping;
    currentZ = groundZ + 0.01; // Slightly above ground

    // Also dampen horizontal velocity on ground contact (use friction)
    velXY *= 0.85 * segmentFriction;

    remainingTime -= timeToImpact;

    // If bounce velocity is very small, just settle on ground
    if (abs(currentVelZ) < 0.5) {
      newPos.z = groundZ;
      break;
    }

    // Continue simulation from bounce point
    if (remainingTime > 0.0) {
      newPos.z = currentZ + currentVelZ * remainingTime - 0.5 * safeGravity * remainingTime * remainingTime;
      // Clamp to ground
      newPos.z = max(newPos.z, groundZ);
    }
  }

  newPos.x = xy.x;
  newPos.y = xy.y;

  // Final ground clamp (safety)
  newPos.z = max(newPos.z, groundZ);

  // Tumble effect - more intense during flight, settles after bouncing
  float flightPhase = 1.0 - smoothstep(0.5, 1.0, progress);
  float tumblePhase = t * tumbleSpeed;
  vec3 tumble = vec3(
    sin(tumblePhase * 5.0 + h.x * 20.0),
    cos(tumblePhase * 4.0 + h.y * 20.0),
    sin(tumblePhase * 6.0 + h.z * 20.0)
  ) * 0.12 * flightPhase;
  newPos += tumble;

  // Final ground clamp again after tumble
  newPos.z = max(newPos.z, groundZ);

  // Fade and shrink - delayed to let bounces be visible
  float scaleMult = 1.0 - smoothstep(0.5, 1.0, progress);
  float opacity = 1.0 - smoothstep(0.6, 1.0, progress);

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 8. Disintegration/Ash (Burn away with rising embers)
export const exitAsh = `
// 8. Disintegration/Ash (Burn away with rising embers)
vec4 exitAsh(vec3 pos, vec3 scale, float progress, vec3 h,
             float riseSpeed, float spreadRadius, float emberGlow, float burnSpeed) {
  // All particles participate with staggered timing based on distance from center
  vec3 center = vec3(0.0, 0.0, 0.0);
  float distFromCenter = length(pos.xz - center.xz);
  float maxDist = 8.0;
  float normDist = clamp(distFromCenter / maxDist, 0.0, 1.0);

  // Edges burn first - particle delay based on distance (outer = earlier)
  float particleDelay = (1.0 - normDist) * 0.5 + h.x * 0.2;
  float adjustedProgress = max(0.0, (progress * burnSpeed - particleDelay) / (1.0 - particleDelay * 0.5));
  adjustedProgress = min(adjustedProgress, 1.0);

  // Smooth easing
  float t = adjustedProgress * 2.0;

  vec3 newPos = pos;

  // Rise up like embers (Local +Z = World +Y) - graceful upward motion
  float riseAmount = riseSpeed * t * t * (0.5 + h.y * 0.5);
  newPos.z += riseAmount;

  // Gentle spread outward
  vec2 spreadDir = normalize(pos.xz - center.xz + vec2(0.001));
  float spreadAmount = spreadRadius * t * (0.3 + h.z * 0.4);
  newPos.x += spreadDir.x * spreadAmount;
  newPos.y += spreadDir.y * spreadAmount * 0.5;

  // Subtle ember flicker (not jarring)
  float flickerPhase = t * 8.0 + h.x * 6.28;
  float flicker = sin(flickerPhase) * cos(flickerPhase * 0.7) * 0.5 + 0.5;
  newPos.x += (flicker - 0.5) * 0.05 * adjustedProgress;

  // Graceful fade out - scale and opacity both go to 0
  float fadeProgress = smoothstep(0.2, 1.0, adjustedProgress);
  float scaleMult = (1.0 - fadeProgress) * (0.9 + emberGlow * 0.2 * flicker);
  float opacity = 1.0 - fadeProgress;

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 9. Shatter/Glass Break (Crack, burst, then fall)
export const exitShatter = `
// 9. Shatter/Glass Break (Crack, burst, then fall)
vec4 exitShatter(vec3 pos, vec3 scale, float progress, vec3 h,
                 float force, float grav, float spread, float rotation) {
  float crackPhase = smoothstep(0.0, 0.18, progress);
  float burstPhase = smoothstep(0.1, 0.35, progress);
  float fallPhase = smoothstep(0.25, 1.0, progress);

  vec3 newPos = pos;
  vec3 center = vec3(0.0, 1.0, 0.0);
  vec3 fromCenter = normalize(pos - center + (h - 0.5) * spread + vec3(0.001));

  // Subtle crack jitter
  newPos += (h - 0.5) * 0.06 * crackPhase;

  // Shards separate outward
  float burstStrength = force * (0.12 + h.x * 0.08);
  newPos += fromCenter * burstStrength * burstPhase;
  newPos += (h - 0.5) * spread * 0.25 * burstPhase;

  // Gravity fall (Local -Z = World Down)
  float fallAmount = grav * 0.7 * fallPhase * fallPhase;
  newPos.z -= fallAmount;

  // Gentle swirl while falling
  float rotPhase = progress * rotation * 0.25;
  newPos.x += sin(rotPhase + h.y * 6.28) * 0.15 * fallPhase;
  newPos.y += cos(rotPhase * 1.1 + h.x * 6.28) * 0.15 * fallPhase;

  // Fade out with fall
  float fadeProgress = smoothstep(0.35, 1.0, progress);
  float scaleMult = 1.0 - fadeProgress;
  float opacity = 1.0 - fadeProgress;

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 10. Pixelate/Glitch (Digital dissolution)
export const exitGlitch = `
// 10. Pixelate/Glitch (Digital dissolution)
vec4 exitGlitch(vec3 pos, vec3 scale, float progress, vec3 h,
                float intensity, float blockSize, float speed, float chroma) {
  float t = progress;

  // Snap to grid blocks
  vec3 blockPos = floor(pos / blockSize) * blockSize;
  float blockHash = fract(sin(dot(blockPos.xy, vec2(12.9898, 78.233))) * 43758.5453);

  // Glitch timing - different blocks glitch at different times
  float glitchStart = blockHash * 0.5;
  float glitchEnd = glitchStart + 0.25;
  if (t < glitchStart) return vec4(pos, 1000.0 + 0.999);

  float glitchPhase = smoothstep(glitchStart, glitchEnd, t);
  float fallEnd = min(glitchEnd + 0.6, 1.0);
  float fallPhase = smoothstep(glitchEnd, fallEnd, t);

  vec3 newPos = pos;

  // Random block displacement
  float glitchStep = floor(t * speed + blockHash * 10.0);
  float displacement = fract(sin(glitchStep * 12.9898 + blockHash * 78.233) * 43758.5453);

  // Horizontal glitch bands
  newPos.x += (displacement - 0.5) * intensity * 2.0 * glitchPhase;

  // Vertical jitter
  newPos.z += (fract(displacement * 7.0) - 0.5) * intensity * 0.5 * glitchPhase;

  // Chromatic aberration offset (position shift simulates color separation)
  float chromaOffset = chroma * sin(t * speed * 2.0 + blockHash * 20.0) * glitchPhase;
  newPos.x += chromaOffset * h.x;

  // After glitching, blocks drift down and fade
  float fallDistance = (3.5 + intensity * 2.0) * (0.6 + h.y * 0.4);
  newPos.z -= fallDistance * fallPhase * fallPhase;
  newPos.x += (h.x - 0.5) * intensity * 0.4 * fallPhase;
  newPos.y += (h.z - 0.5) * intensity * 0.3 * fallPhase;

  // Scale pulsing
  float scalePulse = 1.0 + sin(t * speed * 3.0 + blockHash * 30.0) * 0.2 * glitchPhase;
  float scaleMult = scalePulse * (1.0 - fallPhase * 0.85);
  float opacity = 1.0 - fallPhase;

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 11. Black Hole (Spiral into singularity)
export const exitBlackHole = `
// 11. Black Hole (Spiral into singularity)
vec4 exitBlackHole(vec3 pos, vec3 scale, float progress, vec3 h,
                   float strength, float spinSpeed, float radius, float stretch) {
  vec3 center = vec3(0.0, 2.0, 0.0);
  vec3 offset = pos - center;
  float dist = length(offset);

  // Gravitational pull increases with progress
  float pullStrength = progress * progress * strength;
  float newDist = max(radius * 0.1, dist - pullStrength);
  float pullFactor = 1.0 - (newDist / (dist + 0.001));

  // Spiral rotation
  float angle = pullFactor * spinSpeed * 10.0 + h.x * 6.28;
  float cosA = cos(angle);
  float sinA = sin(angle);

  vec3 newPos = center;
  float rotX = offset.x * cosA - offset.y * sinA;
  float rotY = offset.x * sinA + offset.y * cosA;
  newPos.x += rotX * (newDist / (dist + 0.001));
  newPos.y += rotY * (newDist / (dist + 0.001));
  newPos.z += offset.z * (newDist / (dist + 0.001));

  // Spaghettification - stretch toward center
  vec3 stretchDir = normalize(center - pos + vec3(0.001));
  newPos += stretchDir * pullFactor * stretch;

  // Particles compress as they approach event horizon
  float horizonDist = newDist / radius;
  float scaleMult = smoothstep(0.0, 1.0, horizonDist) * (1.0 - pullFactor * 0.9);
  float opacity = smoothstep(0.0, 0.5, horizonDist);

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 12. Bloom/Pollen (Gentle outward drift like dandelion seeds)
export const exitPollen = `
// 12. Bloom/Pollen (Gentle outward drift like dandelion seeds)
vec4 exitPollen(vec3 pos, vec3 scale, float progress, vec3 h,
                float driftSpeed, float spread, float waveStrength, float riseSpeed) {
  float t = progress * 2.0;

  // Gentle radial expansion
  vec3 center = vec3(0.0, 0.0, 0.0);
  vec3 dir = normalize(pos - center + vec3(0.001));

  vec3 newPos = pos;

  // Drift outward
  newPos += dir * driftSpeed * t * (0.5 + h.x * 0.5);

  // Random spread
  newPos += (h - 0.5) * spread * t;

  // Gentle rise (Local +Z = World Up)
  newPos.z += riseSpeed * t * (0.3 + h.y * 0.7);

  // Floating wave motion
  float wavePhase = t * 2.0 + h.z * 10.0;
  newPos.x += sin(wavePhase) * waveStrength * 0.3;
  newPos.y += cos(wavePhase * 0.7) * waveStrength * 0.2;
  newPos.z += sin(wavePhase * 0.5 + 1.0) * waveStrength * 0.15;

  // Slow fade
  float scaleMult = 1.0 - smoothstep(0.3, 1.0, progress) * 0.7;
  float opacity = 1.0 - smoothstep(0.4, 1.0, progress);

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 13. Freeze/Shatter (Ice crystallization then break apart)
export const exitFreeze = `
// 13. Freeze/Shatter (Ice crystallization then break apart)
vec4 exitFreeze(vec3 pos, vec3 scale, float progress, vec3 h,
                float freezeSpd, float crackDensity, float shatterDelay, float shardSpeed) {
  // Phase 1: Freeze (0 to shatterDelay)
  // Phase 2: Shatter (shatterDelay to 1)

  float adjustedProgress = clamp(progress * freezeSpd, 0.0, 1.0);
  float freezeProgress = smoothstep(0.0, shatterDelay, adjustedProgress);
  float shatterProgress = smoothstep(shatterDelay, 1.0, adjustedProgress);

  vec3 newPos = pos;

  // Freeze phase: slight contraction and jitter
  if (adjustedProgress < shatterDelay) {
    // Crystallization jitter
    float jitter = sin(adjustedProgress * crackDensity * 50.0 + h.x * 100.0) * 0.02 * freezeProgress;
    newPos += vec3(jitter, jitter * 0.5, jitter * 0.7);

    // Slight pull toward center (ice forming)
    vec3 center = vec3(0.0, 0.0, 0.0);
    vec3 toCenter = normalize(center - pos + vec3(0.001));
    newPos += toCenter * freezeProgress * 0.1;

    return vec4(newPos, 1000.0 + 0.999);
  }

  // Shatter phase
  float t = shatterProgress;

  // Create ice shard groups
  vec3 shardCenter = floor(pos * crackDensity) / crackDensity;
  vec3 shardDir = normalize(shardCenter + vec3(0.001));

  // Burst outward
  vec3 velocity = shardDir * shardSpeed * (0.5 + h.y * 0.5);
  velocity += (h - 0.5) * shardSpeed * 0.3;

  newPos += velocity * t;

  // Ice falls down
  newPos.z -= 8.0 * t * t;

  // Spin
  float spin = t * 5.0 * (h.x - 0.5);
  newPos.x += sin(spin) * 0.1;

  float scaleMult = 1.0 - smoothstep(0.5, 1.0, shatterProgress);
  float opacity = 1.0 - smoothstep(0.6, 1.0, shatterProgress);

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 14. Sand/Hourglass (Smooth flowing sand through a point)
export const exitSand = `
// 14. Sand/Hourglass (Smooth flowing sand through a point)
vec4 exitSand(vec3 pos, vec3 scale, float progress, vec3 h,
              float fallSpd, float funnelWidth, float spread, float grainSize,
              vec3 viewRight, vec3 viewUp, vec3 cameraPos) {
  vec3 rightDir = normalize(viewRight);
  vec3 upDir = normalize(viewUp);
  vec3 forwardDir = normalize(cross(rightDir, upDir));

  // Funnel center point
  vec3 funnel = vec3(0.0, 1.0, 0.0);

  // Distance from funnel axis (view-aligned plane)
  vec3 relPos = pos - cameraPos;
  vec3 relFunnel = funnel - cameraPos;
  vec2 posPlane = vec2(dot(relPos, rightDir), dot(relPos, forwardDir));
  vec2 funnelPlane = vec2(dot(relFunnel, rightDir), dot(relFunnel, forwardDir));
  float distFromAxis = length(posPlane - funnelPlane);

  // Smooth staggered start - center particles move first, then outward
  float particleDelay = distFromAxis * 0.08 + h.y * 0.15;
  float clampedDelay = min(particleDelay, 0.95);
  float adjustedProgress = (progress - clampedDelay) / max(0.001, 1.0 - clampedDelay);
  adjustedProgress = clamp(adjustedProgress, 0.0, 1.0);

  // Smooth easing for graceful motion
  float t = adjustedProgress * adjustedProgress;

  vec3 newPos = pos;

  // Gentle pull toward funnel axis
  vec2 toAxis = funnelPlane - posPlane;
  float pullStrength = 1.0 - smoothstep(0.0, funnelWidth * 3.0, distFromAxis);
  newPos += rightDir * toAxis.x * pullStrength * t * 0.4;
  newPos += forwardDir * toAxis.y * pullStrength * t * 0.4;

  // Smooth gravity fall (view-aligned down)
  float fallAmount = fallSpd * t * t * (0.6 + h.x * 0.4);
  float fallBoost = 1.0 + smoothstep(0.65, 1.0, progress) * 1.2;
  newPos += -upDir * fallAmount * fallBoost;

  // Gentle spread after falling past funnel
  float height = dot(newPos - funnel, upDir);
  float belowFunnel = 1.0 - smoothstep(-4.0, 0.0, height);
  newPos += rightDir * (h.x - 0.5) * spread * belowFunnel * 0.5;
  newPos += forwardDir * (h.z - 0.5) * spread * belowFunnel * 0.3;

  // Very subtle grain tumble (not jarring)
  float tumble = sin(adjustedProgress * 4.0 + h.y * 6.28) * 0.03 * adjustedProgress;
  newPos += rightDir * tumble;

  // Graceful fade - both scale and opacity
  float fadeProgress = smoothstep(0.5, 1.0, adjustedProgress);
  float scaleMult = grainSize * (1.0 - fadeProgress);
  float opacity = 1.0 - fadeProgress;

  float endFade = smoothstep(0.85, 1.0, progress);
  scaleMult *= (1.0 - endFade);
  opacity *= (1.0 - endFade);

  return vec4(newPos, floor(scaleMult * 1000.0) + min(opacity, 0.999));
}
`;

// 15. Teleport/Beam (Star Trek-style vertical dissolve)
export const exitTeleport = `
// 15. Teleport/Beam (Star Trek-style vertical dissolve)
vec4 exitTeleport(vec3 pos, vec3 scale, float progress, vec3 h,
                  float speed, float sparkle, float bandWidth, float direction) {
  // Dissolve band moves vertically
  // direction: >= 0.0 = up
  float dir = direction >= 0.0 ? 1.0 : -1.0;
  float bandCenter = mix(-12.0, 12.0, progress);
  float signedDist = (pos.z - bandCenter) * dir;
  float distFromBand = abs(signedDist);

  // Particles dissolve when band passes
  float inBand = 1.0 - smoothstep(0.0, bandWidth, distFromBand);
  float trail = bandWidth * 2.5;
  float dissolved = 1.0 - smoothstep(-trail, 0.0, signedDist);

  if (dissolved > 0.99) return vec4(pos, 0.0 + 0.0);

  vec3 newPos = pos;

  // Sparkle effect at the band edge
  float sparkleIntensity = inBand * sparkle;
  float sparklePhase = progress * speed * 20.0 + h.x * 100.0;

  // Horizontal scatter at band
  newPos.x += sin(sparklePhase) * sparkleIntensity * 0.3;
  newPos.y += cos(sparklePhase * 1.3) * sparkleIntensity * 0.3;

  // Vertical stretch toward band
  newPos.z += (bandCenter - pos.z) * inBand * 0.2;

  // Scale pulsing at band edge (sparkle effect)
  float scalePulse = 1.0 + sin(sparklePhase * 2.0) * sparkleIntensity * 0.5;
  float scaleMult = scalePulse * (1.0 - dissolved);
  float opacity = (1.0 - dissolved) * (1.0 + sparkleIntensity * 0.3);

  return vec4(newPos, floor(max(0.001, scaleMult) * 1000.0) + min(opacity, 0.999));
}
`;

// 16. Blueprint Unroll - Scene rolls up like a scroll
export const exitBlueprintWall = `
// 16. Gallery Transition - Two-stage gust exit + screen fill
// Stage 1 (0-50%): Particles blow away like gust animation
// Stage 2 (50-100%): Particles return, transform to blue, fill the screen
vec4 exitBlueprintWall(vec3 pos, vec3 scale, float progress, vec3 h, float motionReduction,
                       float wallPlaneY, float screenCoverage, float gustStrength) {
  vec3 newPos = pos;
  float scaleMult = 1.0;
  float opacity = 1.0;

  // Stage 1: Gust Exit (0-50% progress)
  if (progress < 0.5) {
    float exitProgress = progress / 0.5;  // 0 to 1 within stage 1
    float easedExit = exitProgress * exitProgress;  // Ease in

    // Wind direction - blow particles away from camera (Local +Y = World -Z = away)
    vec3 windDir = normalize(vec3(0.8, 0.6, 0.3));  // Local: +X right, +Y away from camera, +Z up

    // Stagger particles by position for wave effect
    float xDelay = (pos.x + 8.0) / 16.0;
    float zDelay = (pos.z + 4.0) / 12.0;
    float particleDelay = xDelay * 0.2 + zDelay * 0.15 + h.x * 0.15;
    float effectiveProgress = smoothstep(particleDelay * 0.4, 1.0, exitProgress);

    // Movement with wind
    float weight = mix(0.7, 1.3, h.y);  // Vary by particle
    float movement = pow(effectiveProgress, 1.5) * gustStrength / weight;
    newPos += windDir * movement;

    // Turbulence for organic feel
    float turbulence = sin(effectiveProgress * 12.0 + h.y * 6.28) * effectiveProgress * 1.2;
    newPos.z += turbulence;
    newPos.x += cos(effectiveProgress * 8.0 + h.z * 6.28) * effectiveProgress * 0.8;

    // Scale down and fade out
    scaleMult = 1.0 - effectiveProgress * 0.8;
    opacity = 1.0 - effectiveProgress;

    // Mobile: reduce turbulence
    if (motionReduction > 0.5) {
      newPos = pos + windDir * movement * 0.7;
      scaleMult = 1.0 - effectiveProgress * 0.9;
    }
  }
  // Stage 2: Screen Fill (50-100% progress)
  else {
    float fillProgress = (progress - 0.5) / 0.5;  // 0 to 1 within stage 2
    float easedFill = 1.0 - pow(1.0 - fillProgress, 2.0);  // Ease out

    // Calculate where particles ended up after gust (at progress = 0.5)
    vec3 windDir = normalize(vec3(0.8, 0.6, 0.3));  // Same as stage 1
    float xDelay = (pos.x + 8.0) / 16.0;
    float zDelay = (pos.z + 4.0) / 12.0;
    float particleDelay = xDelay * 0.2 + zDelay * 0.15 + h.x * 0.15;
    float effectiveExitProgress = smoothstep(particleDelay * 0.4, 1.0, 1.0);
    float weight = mix(0.7, 1.3, h.y);
    float exitMovement = pow(effectiveExitProgress, 1.5) * gustStrength / weight;
    vec3 exitPos = pos + windDir * exitMovement;
    exitPos.z += sin(1.0 * 12.0 + h.y * 6.28) * 1.0 * 1.2;
    exitPos.x += cos(1.0 * 8.0 + h.z * 6.28) * 1.0 * 0.8;

    // Target position: wall filling the screen
    // Use hash to distribute particles evenly across screen
    float screenX = (h.x * 2.0 - 1.0) * 12.0;  // Spread across X
    float screenZ = (h.z * 2.0 - 1.0) * 8.0;   // Spread across Z (world Y)
    vec3 targetPos = vec3(screenX, wallPlaneY, screenZ);

    // Interpolate from exit position to target wall position
    newPos = mix(exitPos, targetPos, easedFill);

    // Add subtle wave during return for organic feel
    float wave = sin(fillProgress * 3.14159 + h.x * 4.0) * (1.0 - fillProgress) * 0.3;
    newPos.z += wave;

    // Scale up dramatically for screen coverage
    float targetScale = screenCoverage;
    scaleMult = mix(0.2, targetScale, easedFill);

    // Fade back in
    opacity = easedFill;

    // Mobile: simpler interpolation
    if (motionReduction > 0.5) {
      newPos = mix(exitPos * 0.7, targetPos, easedFill);
      scaleMult = mix(0.1, targetScale * 0.9, easedFill);
    }
  }

  return vec4(newPos, floor(max(0.001, scaleMult) * 1000.0) + min(opacity, 0.999));
}
`;

// Router function that calls the appropriate exit animation
export const applyExitAnimation = `
// Apply exit animation based on type
// 1=Gust, 2=Sonic, 3=Cosmic, 4=Pond, 5=Exploded, 6=Sawdust, 7=Explosion
// 8=Ash, 9=Shatter, 10=Glitch, 11=BlackHole, 12=Pollen, 13=Freeze, 14=Sand, 15=Teleport, 16=BlueprintWall
vec4 applyExitAnimation(vec3 pos, vec3 scale, float exitType, float exitProgress, vec3 h,
                       float expStrength, float expRotSpeed, float expFadeStart, float expFadeEnd,
                       float pondSpeed, float pondFreq, float pondAmp, float pondCount,
                       float physStrength, float physGravity, float physFriction, float physTumble,
                       float sawFall, float sawWind, float sawTurb, float sawDissolve,
                       float ashRise, float ashSpread, float ashEmber, float ashBurn,
                       float shatterForce, float shatterGrav, float shatterSpread, float shatterRot,
                       float glitchInt, float glitchBlock, float glitchSpd, float glitchChroma,
                       float bhStrength, float bhSpin, float bhRadius, float bhStretch,
                       float pollenDrift, float pollenSpread, float pollenWave, float pollenRise,
                       float freezeSpd, float freezeCrack, float freezeDelay, float freezeShard,
                       float sandFall, float sandFunnel, float sandSpread, float sandGrain,
                       vec3 sandViewRight, vec3 sandViewUp, vec3 sandCameraPos,
                       float teleSpd, float teleSparkle, float teleBand, float teleDir,
                       float motionReduction,
                       float wallPlaneY, float screenCoverage, float gustStrength) {
  if (exitProgress <= 0.001 || exitType < 0.5) {
    return vec4(pos, 1000.0 + 0.999);
  }

  if (exitType < 1.5) return exitGust(pos, scale, exitProgress, h);
  if (exitType < 2.5) return exitSonic(pos, scale, exitProgress, h);
  if (exitType < 3.5) return exitCosmic(pos, scale, exitProgress, h);
  if (exitType < 4.5) return exitPond(pos, scale, exitProgress, h, pondSpeed, pondFreq, pondAmp, pondCount);
  if (exitType < 5.5) return exitExploded(pos, scale, exitProgress, h, expStrength, expRotSpeed, expFadeStart, expFadeEnd);
  if (exitType < 6.5) return exitSawdust(pos, scale, exitProgress, h, sawFall, sawWind, sawTurb, sawDissolve);
  if (exitType < 7.5) return exitExplosion(pos, scale, exitProgress, h, physStrength, physGravity, physFriction, physTumble);
  if (exitType < 8.5) return exitAsh(pos, scale, exitProgress, h, ashRise, ashSpread, ashEmber, ashBurn);
  if (exitType < 9.5) return exitShatter(pos, scale, exitProgress, h, shatterForce, shatterGrav, shatterSpread, shatterRot);
  if (exitType < 10.5) return exitGlitch(pos, scale, exitProgress, h, glitchInt, glitchBlock, glitchSpd, glitchChroma);
  if (exitType < 11.5) return exitBlackHole(pos, scale, exitProgress, h, bhStrength, bhSpin, bhRadius, bhStretch);
  if (exitType < 12.5) return exitPollen(pos, scale, exitProgress, h, pollenDrift, pollenSpread, pollenWave, pollenRise);
  if (exitType < 13.5) return exitFreeze(pos, scale, exitProgress, h, freezeSpd, freezeCrack, freezeDelay, freezeShard);
  if (exitType < 14.5) return exitSand(pos, scale, exitProgress, h, sandFall, sandFunnel, sandSpread, sandGrain,
                                      sandViewRight, sandViewUp, sandCameraPos);
  if (exitType < 15.5) return exitTeleport(pos, scale, exitProgress, h, teleSpd, teleSparkle, teleBand, teleDir);
  return exitBlueprintWall(pos, scale, exitProgress, h, motionReduction, wallPlaneY, screenCoverage, gustStrength);
}
`;

/**
 * Combines all exit animation GLSL code into a single string
 */
export const allExitAnimations = [
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
].join('\n');
