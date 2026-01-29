# Hand-Drawn Text Animation TODO

## Current State
- SVG paths extracted from logo, split into individual letters
- Basic pathLength animation with fill fade-in
- Letters animate left-to-right sequentially

---

## Phase 1: Improve Current Animation

### Entry Animation Options
- [ ] **Drop-in effect**: Add subtle translateY (e.g., -10px to 0) as each letter appears
- [ ] **Scale pop**: Start at scale 0.8-0.9, animate to 1.0 with slight overshoot (spring)
- [ ] **Rotation wiggle**: Tiny rotation (-2deg to 0) for organic feel
- [ ] **Combination**: translateY + scale + slight rotation for "settling" effect

### Fix Fill Animation
The current approach (pathLength + fillOpacity) doesn't look great because:
- The stroke draws, but fill just fades in separately
- No connection between stroke progress and fill reveal

**Better approaches:**
- [ ] **Clip-path mask**: Use animated clip-path that follows stroke progress
- [ ] **Delayed fill**: Only start fill after stroke is ~80% complete
- [ ] **Stroke-only first**: Draw stroke first, then "flood fill" effect
- [ ] **Use stroke as mask**: The stroke itself masks/reveals the fill beneath

### Timing Refinements
- [ ] Add easing variety (not all letters same easing)
- [ ] Slight randomization in timing (±50ms) for organic feel
- [ ] Consider ease-out for stroke, ease-in-out for fill

---

## Phase 2: True Hand-Drawn Effect

### Path Preparation
- [ ] **Roughen paths**: Add subtle noise/jitter to path coordinates
  - Libraries: rough.js, or manual SVG filter
  - Or regenerate paths with hand-drawn tool (Procreate, etc.)
- [ ] **Variable stroke width**: Simulate pen pressure
  - Use stroke-dasharray patterns or multiple overlapping paths
- [ ] **Imperfect endings**: Paths shouldn't end too cleanly

### Drawing Simulation
- [ ] **Pen simulation**:
  - Animate a "pen tip" indicator following the path
  - Add slight wobble to the animation path
- [ ] **Ink spread effect**: Subtle blur/spread as "ink" settles
- [ ] **Connection points**: Where strokes meet, add slight overlap/bleed

### Advanced Techniques
- [ ] **SVG filters**:
  - `feTurbulence` for paper texture
  - `feDisplacementMap` for organic distortion
  - `feGaussianBlur` for ink bleed
- [ ] **Multiple passes**: Draw outline, then fill with hatching/cross-hatching
- [ ] **Canvas alternative**: Use canvas for more control over drawing simulation

---

## Phase 3: Polish & Performance

### Performance
- [ ] Ensure animations are GPU-accelerated (transform, opacity)
- [ ] Test on mobile devices
- [ ] Consider reducing motion for `prefers-reduced-motion`

### Accessibility
- [ ] Add screen reader text alternative
- [ ] Ensure text remains readable after animation

### Fine-tuning
- [ ] A/B test different animation styles
- [ ] Match animation feel to overall site aesthetic
- [ ] Consider user scroll position (only animate when visible)

---

## Resources & References

### Libraries
- **Framer Motion**: Current library, good for orchestration
- **rough.js**: Hand-drawn/sketchy graphics
- **anime.js**: Alternative animation library with good path support
- **GSAP DrawSVG**: Professional SVG stroke animation (paid)

### Techniques to Research
- SVG stroke-dasharray/stroke-dashoffset animation
- CSS clip-path animations
- SVG SMIL animations (though deprecated in some browsers)
- Canvas-based text drawing with requestAnimationFrame

### Inspiration
- Squarespace logo animations
- Airbnb loading animations
- Hand-lettering artists on Dribbble/Behance
