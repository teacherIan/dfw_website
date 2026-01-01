# DFW Furniture Website - Repository Documentation

## Overview

An interactive 3D furniture website showcasing DFW Furniture's products using cutting-edge 3D Gaussian Splatting technology. The site features cinematic entrance animations, smooth camera movements, and a modern blueprint-inspired UI design.

**Live Demo**: Built with React, Three.js, and SparkJS for real-time 3D rendering in the browser.

## Tech Stack

### Core Technologies
- **React 19.2.3** - Latest React with concurrent features
- **TypeScript 5.9.3** - Full type safety
- **Vite 7.3.0** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.1.18** - Utility-first CSS framework

### 3D Graphics
- **Three.js 0.182.0** - WebGL 3D library
- **React Three Fiber 9.4.2** - React renderer for Three.js
- **@react-three/drei 10.7.7** - Useful R3F helpers (PresentationControls, etc.)
- **SparkJS 0.1.10** - 3D Gaussian Splatting renderer

### Development Tools
- **Leva 0.10.1** - GUI controls for live parameter tuning
- **Vite Plugin React 5.1.2** - Fast refresh and JSX transform

## Project Architecture

```
dfw_website/
├── public/
│   └── assets/
│       ├── letters_as_splats/        # Letter splat files
│       ├── spritesheet/              # UI sprite assets
│       ├── dfw_logo_2_fixed_together.spz (25.76 MB)
│       ├── dfw_logo_3d.png (299.45 KB)
│       ├── dfw_logo_new.spz (3.89 MB)
│       ├── full_scene_remove_blue_two_splat.spz (24.53 MB) # Current scene
│       ├── full_scene.spz (23.91 MB)
│       └── trial_build.spz (26.58 MB)
├── src/
│   ├── components/
│   │   ├── spark/
│   │   │   ├── SparkRenderer.tsx    # Extended SparkJS renderer
│   │   │   ├── SplatMesh.tsx        # Extended SparkJS splat mesh
│   │   │   └── index.ts             # Barrel exports
│   │   ├── Scene.tsx                # Main 3D scene with animations
│   │   ├── MenuOverlay.tsx          # Blueprint-style navigation UI
│   │   └── TextOverlay.tsx          # Animated text overlay
│   ├── types/
│   │   └── r3f.d.ts                 # R3F type extensions
│   ├── App.tsx                      # Root component & layout
│   ├── main.tsx                     # Entry point
│   ├── index.css                    # Global styles & animations
│   └── vite-env.d.ts                # Vite environment types
├── .zencoder/                       # AI coding assistant config
├── index.html                       # HTML template
├── package.json                     # Dependencies & scripts
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript config (base)
├── tsconfig.app.json                # App-specific TS config
├── tsconfig.node.json               # Node-specific TS config
└── README.md                        # User-facing documentation
```

## Key Components

### App.tsx
- Root application component
- Manages animation state and timing
- Coordinates overlays with 3D scene
- Handles animation reset events
- Canvas setup with camera configuration

**Key Features:**
- 13-second delay before showing text overlay
- Event-driven animation reset system
- Layered z-index management for overlays

### Scene.tsx (Main 3D Scene)
The heart of the 3D experience. Handles all 3D rendering, animations, and visual effects.

**Responsibilities:**
- 3D Gaussian Splat rendering via SparkJS
- Cinematic entrance animation
- Camera movement and controls
- Visual effect modifiers (color, opacity, positioning)
- Leva debug controls for fine-tuning

**Camera System:**
- Initial position: [startX, startY, startZ] (configurable: 2, 4, 8)
- Target position: [cameraX, cameraY, cameraZ] (configurable: 0, 1.6, 3.1)
- 8-second smooth camera animation with ease-out cubic easing
- Optional: Disable animation for instant positioning
- Real-time position monitoring via Leva controls

**Entrance Animation:**
- Particles "assemble" from scattered positions
- Depth-based staggering: far particles appear first
- Size-based timing: smaller particles before larger ones
- Swirl effect with varying intensity
- Duration: ~13 seconds total
- Configurable depth offset (default: 15.0)

**Visual Effects (Shader Modifiers):**
1. **Graceful Assembly** - Particles swirl into place from scattered positions
2. **Grass Darkening** - Improves text legibility over green areas (0.5 factor)
3. **Foreground Darkening** - Darkens area under text for better contrast
4. **Synthetic Region Blending** - Adjusts brightness/saturation/opacity for specific spatial regions
   - Z range: -5.0 to 2.0
   - Y range: -10.0 to 5.0

**Splat Mesh Configuration:**
- Asset: `/assets/full_scene_remove_blue_two_splat.spz`
- Streaming enabled for progressive loading
- Rotation: [-1.6, 0, 0] (tilted view)

### MenuOverlay.tsx
Blueprint-inspired navigation with three circular buttons.

**Navigation Items:**
- **Gallery** - Loop arrow design (delay: 0ms)
- **Ethos** - Spiral arrow design (delay: 150ms)
- **Contact** - Wave arrow design (delay: 300ms)

**Button Design:**
- Circular blueprint aesthetic
- Blueprint grid pattern background
- Concentric rings with dashed strokes
- Center crosshair
- Compass arc marks
- Custom animated arrows for each button

**Animation:**
- Fades in at 14 seconds (after text overlay)
- Staggered entrance with 150ms delays
- Smooth cubic-bezier easing: (0.34, 1.56, 0.64, 1)
- Combines opacity and translateX transforms

**Positioning:**
- Right edge of viewport
- Bottom-aligned
- Responsive spacing (mobile: 3, desktop: 4)

### TextOverlay.tsx
Simple text overlay component that displays after the entrance animation completes.

**Timing:**
- Appears at 13 seconds (after splat animation)
- Supports animation reset via key prop

### SparkJS Integration

#### SparkRenderer.tsx & SplatMesh.tsx
These components extend SparkJS classes to work with React Three Fiber's declarative API.

```typescript
// Extending SparkJS for R3F compatibility
import { extend } from "@react-three/fiber";
import { SparkRenderer as SparkSparkRenderer } from "@sparkjsdev/spark";
import { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";

extend({ SparkRenderer: SparkSparkRenderer });
extend({ SplatMesh: SparkSplatMesh });
```

**Usage in Scene:**
```tsx
<sparkRenderer args={[sparkRendererArgs]}>
  <splatMesh ref={meshRef} args={[splatMeshArgs]} />
</sparkRenderer>
```

#### Dynamic Shader System (Dyno)
SparkJS's Dyno system enables real-time shader modifications without recompilation.

**Key Features:**
- Define custom shader logic in JavaScript
- Pass reactive parameters (dynoFloat)
- Modify splat properties per-particle
- Hot-reload visual effects

**Implementation Pattern:**
1. Create dyno refs for parameters
2. Define shader globals and statements
3. Apply modifier to mesh via `objectModifier`
4. Update parameters in animation loop

## Animation Timeline

```
0s    - Scene loads, camera at starting position
0-8s  - Camera smoothly moves to target position (ease-out cubic)
0-13s - Splat particles assemble with swirling entrance effect
13s   - Text overlay fades in
14s   - Menu overlay animates in (staggered)
```

**Reset Functionality:**
- Reset button in Leva controls
- Resets camera, animation time, and all overlays
- Dispatches `resetAnimation` custom event
- Triggers mesh update for immediate visual refresh

## Configuration & Controls

### Leva Debug Panel
Live parameter tuning during development:

**Camera Controls:**
- Target position (X, Y, Z)
- Current position monitoring (read-only)

**Camera Animation:**
- Enable/disable animation
- Animation duration (1-20s, default 8s)
- Starting position (X, Y, Z)

**Entrance Animation:**
- Depth offset (0-30, default 15.0)
- Reset button

**Visual Adjustments:**
- Grass darken amount (0-2, default 0.5)

**Splat Rotation:**
- X, Y, Z rotation controls

**Splat Blending:**
- Synthetic region brightness (0.1-2.0)
- Saturation (0.0-1.5)
- Opacity (0.1-1.0)
- Z range (min/max)
- Y range (min/max)

## Styling & CSS

### index.css
Contains global styles, custom animations, and Tailwind utilities.

**Key Features:**
- Custom cursive font import
- Navigation button styles with hover effects
- Blueprint grid patterns
- Arrow animation keyframes
- Responsive media queries
- Color scheme (whites, blues, grays)

**CSS Custom Properties:**
- Grid sizing and opacity
- Ring rotation speeds
- Transition durations

## Build & Development

### Scripts
```json
{
  "dev": "vite",           // Dev server on localhost:5173
  "build": "vite build",   // Production build to dist/
  "preview": "vite preview" // Preview production build
}
```

### Development Workflow
1. Run `npm install` to install dependencies
2. Run `npm run dev` to start dev server
3. Open http://localhost:5173
4. Leva controls appear in top-right for live tuning
5. Edit files - Vite hot-reloads instantly

### Production Build
1. Run `npm run build`
2. Output in `dist/` directory
3. Optimized and minified
4. Preview with `npm run preview`

## Performance Considerations

### Gaussian Splat Files
- Large file sizes (20-26 MB)
- Streaming enabled for progressive loading
- Consider CDN hosting for production

### Rendering
- WebGL-based (requires GPU)
- Anti-aliasing disabled for performance
- Shader calculations per-particle
- Optimized with Three.js frustum culling

### Bundle Size
- React Three Fiber adds ~400KB
- Three.js is the largest dependency
- SparkJS includes WASM for splat decoding
- Vite code-splitting for optimal loading

## Browser Compatibility

**Requirements:**
- Modern browser with WebGL 2 support
- Desktop: Chrome 56+, Firefox 51+, Safari 15+, Edge 79+
- Mobile: iOS Safari 15+, Chrome Mobile 100+

**Recommended:**
- Desktop with discrete GPU for best experience
- Chrome/Edge for optimal WebGL performance

## Future Ideas

From `ideas.txt`:
- White cursive writing in bottom left of "DFW" for enhanced branding

## Assets

### 3D Splat Files (.spz)
- **full_scene_remove_blue_two_splat.spz** - Currently active scene (24.53 MB)
- **full_scene.spz** - Original full scene (23.91 MB)
- **dfw_logo_2_fixed_together.spz** - Logo splat variant (25.76 MB)
- **dfw_logo_new.spz** - Logo splat (3.89 MB)
- **trial_build.spz** - Test build (26.58 MB)

### Images
- **dfw_logo_3d.png** - 3D logo render (299.45 KB)

### Additional
- **letters_as_splats/** - Individual letter splat files
- **spritesheet/** - UI sprite assets

## Development Notes

### Type Safety
- Full TypeScript coverage
- R3F type extensions in `types/r3f.d.ts`
- Three.js type definitions included
- SparkJS types from package

### Hot Module Replacement
- Vite HMR for instant feedback
- React Fast Refresh preserves state
- Shader modifications require manual refresh

### Debugging
- Leva panel for live parameter tuning
- React DevTools compatible
- Three.js devtools extension supported
- Console logging for animation timing

## License

MIT

---

**Built for DFW Furniture**  
Interactive 3D experience showcasing furniture through Gaussian Splatting technology.
