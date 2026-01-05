# DFW Furniture Website - Repository Documentation

## Overview

An interactive 3D furniture website showcasing Doug's Found Wood (DFW) furniture using cutting-edge 3D Gaussian Splatting technology. The site features cinematic entrance animations, smooth camera movements, responsive design for mobile and desktop, and a modern blueprint-inspired UI.

**Live Experience**: Built with React, Three.js, and SparkJS for real-time 3D rendering in the browser.

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
│       ├── full_scene_remove_blue_two_splat.spz (24.53 MB)
│       ├── full_scene.spz (23.91 MB)
│       ├── trial_build.spz (26.58 MB)
│       └── v_one_final.spz           # Current active scene
├── src/
│   ├── components/
│   │   ├── spark/
│   │   │   ├── SparkRenderer.tsx    # Extended SparkJS renderer
│   │   │   ├── SplatMesh.tsx        # Extended SparkJS splat mesh
│   │   │   └── index.ts             # Barrel exports
│   │   ├── Scene.tsx                # Main 3D scene with animations
│   │   ├── MenuOverlay.tsx          # Responsive navigation UI orchestrator
│   │   ├── TextOverlay.tsx          # Animated title overlay
│   │   ├── DesktopArrows.tsx        # Desktop navigation arrows (Loop, Spiral, Wave)
│   │   ├── MobileNavLayout.tsx      # Mobile navigation layout
│   │   └── MobileArrows.tsx         # Mobile navigation arrows (Ethos, Contact, Gallery)
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
Root application component that orchestrates the entire experience.

**Responsibilities:**
- Canvas setup with camera configuration
- Animation state management
- Overlay timing coordination
- Animation reset event handling
- UI control for hiding overlays (screenshots mode)

**Key Features:**
- 13-second delay before showing text overlay
- 14-second delay before showing menu overlay
- Event-driven animation reset system
- Layered z-index management for overlays
- Leva control to hide overlays for clean screenshots

**UI Controls:**
- `showOverlays` - Toggle to hide/show text and menu overlays (useful for screenshots)

### Scene.tsx (Main 3D Scene)
The heart of the 3D experience. Handles all 3D rendering, animations, and visual effects.

**Current Asset:** `/assets/v_one_final.spz`

**Responsibilities:**
- 3D Gaussian Splat rendering via SparkJS
- Cinematic entrance animation with particle assembly
- Camera movement and controls
- Visual effect modifiers (color, opacity, positioning)
- Extensive Leva debug controls for fine-tuning
- Responsive camera positioning (mobile vs desktop)

**Camera System:**
- **Desktop Defaults:** [0, 1.6, 3.1]
- **Mobile Defaults:** [0, 2.5, 4.0]
- Initial position: [startX, startY, startZ] (configurable: -1.0, 15.0, 20.0)
- Animation: 20-second smooth camera animation with ease-out cubic easing
- Optional: Disable animation for instant positioning
- Real-time position monitoring via Leva controls

**Entrance Animation:**
- **Duration:** ~13 seconds
- **Particle Behavior:**
  - Assemble from scattered positions with swirl effect
  - Depth-based staggering: far particles appear first
  - Size-based timing: smaller particles before larger ones
  - Color-based timing: dark/grayscale objects first, then colorful
  - Vertical staging: smaller particles rise from below, larger descend from above
- **Configurable via Leva:**
  - Depth offset (default: 10.5)
  - Animation speed multiplier (default: 1.5)
  - Reset button to restart animation

**Visual Effects (Shader Modifiers):**
1. **Graceful Assembly** - Particles swirl into place from scattered positions
2. **Grass Darkening** - Darkens grass areas for better text legibility (default: 2.35)
3. **Bottom Left/Right Scaling** - Adjusts particle scale in specific regions (0.55)
4. **Hole Filling** - Option to fill gaps in the splat (default: 0.0)
5. **Synthetic Region Blending** - Adjusts brightness/saturation/opacity for spatial regions
   - Brightness: 1.0
   - Saturation: 0.55
   - Opacity: 1.0
   - Z range: -5.0 to 2.0
   - Y range: -10.0 to 5.0

**Splat Mesh Configuration:**
- Streaming enabled for progressive loading
- Rotation: [-1.6, 0, 0] (tilted view)

### MenuOverlay.tsx
Responsive navigation orchestrator that manages desktop and mobile layouts.

**Architecture:**
- Renders `MobileNavLayout` for mobile devices (< 768px)
- Renders desktop navigation for larger screens
- Shares animation timing and font controls

**Navigation Items:**
- **Gallery** - Loop arrow design (delay: 0ms)
- **Ethos** - Spiral arrow design (delay: 150ms)
- **Contact** - Wave arrow design (delay: 300ms)

**Desktop Layout:**
- Right-side vertical stack
- Buttons with labels and decorative arrows
- Blueprint circular buttons with grid pattern

**Mobile Layout:**
- Corner positioning strategy:
  - **Ethos:** Bottom-left corner (half-off left edge)
  - **Contact:** Bottom-center (half-off bottom edge)
  - **Gallery:** Bottom-right corner (half-off right edge)
- Labels positioned above/near each button
- Arrows connect labels to buttons

**Font Selection:**
- Configurable via Leva (`menuFont`)
- Options: Caveat (default), Architects Daughter, Patrick Hand, Indie Flower, Permanent Marker, Shadows Into Light
- Applies to both desktop and mobile

**Mobile Position Controls (Leva):**
All positions configurable for fine-tuning:
- Button positions (Left %, Right %, Bottom vh)
- Label positions (Left %, Right %, Bottom vh)
- Default values optimized for most screen sizes

**Animation:**
- Fades in at 14 seconds (after text overlay)
- Staggered entrance (Gallery→Ethos→Contact: 0ms, 100ms, 200-300ms)
- Smooth cubic-bezier easing: (0.34, 1.56, 0.64, 1)
- Combines opacity and translate transforms
- Resets on `resetAnimation` event

### DesktopArrows.tsx
Three unique SVG arrow designs for desktop navigation buttons.

**Arrow Types:**
1. **LoopArrow** - Curved path with loop (Gallery)
2. **SpiralArrow** - Inward spiral design (Ethos)
3. **WaveArrow** - Gentle wave pattern (Contact)

**Features:**
- Dashed stroke pattern (strokeDasharray)
- White color with drop shadow
- Arrow markers at endpoint
- Responsive to hover states
- All paths end horizontally aligned

### MobileNavLayout.tsx
Complete mobile navigation layout with buttons, labels, and positioning.

**Button Design:**
- Large blueprint circular buttons
- Half-off viewport edges for dramatic effect
- Blueprint grid pattern background
- Concentric rings with dashed strokes
- Center crosshair design
- Compass arc marks

**Layout Strategy:**
- Three-corner approach maximizes space
- Labels positioned for readability
- Arrows guide eye from label to button
- All positions configurable via props (Leva controls)

### MobileArrows.tsx
Three custom SVG arrows for mobile navigation.

**Arrow Types:**
1. **EthosArrow** - Left bracket style curve
2. **ContactArrow** - Downward curve from label to button
3. **GalleryArrow** - Right bracket style curve

**Features:**
- Start markers: white dots
- End markers: white arrows
- Dashed stroke patterns
- Drop shadows for depth
- Positioned absolutely via inline styles
- Configurable animation delays

### TextOverlay.tsx
Animated title display for "Doug's Found Wood".

**Features:**
- Centered at bottom of screen
- Writing animation effect (CSS)
- Cursive font (Caveat)
- Responsive sizing: `text-[12vw]` on mobile, up to `text-8xl` on desktop
- Heavy text shadow for legibility over 3D scene
- Black text stroke for definition
- Whitespace nowrap to prevent wrapping

**Responsive Positioning:**
- Mobile: 19vh from bottom (above mobile nav)
- Desktop: 10vh from bottom
- Configurable via Leva controls

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
0s      - Scene loads, camera at starting position [startX, startY, startZ]
0-20s   - Camera smoothly moves to target position (ease-out cubic)
0-13s   - Splat particles assemble with swirling entrance effect
13s     - Text overlay fades in ("Doug's Found Wood")
14s     - Menu overlay animates in (staggered: Gallery→Ethos→Contact)
```

**Reset Functionality:**
- Reset button in Leva controls (Entrance Animation panel)
- Resets camera, animation time, and all overlays
- Dispatches `resetAnimation` custom event
- Triggers mesh update for immediate visual refresh
- All components listen for reset event

## Leva Controls Reference

### UI Controls
- **Show Overlays** - Hide text and menu for clean screenshots

### Camera
- **cameraX, cameraY, cameraZ** - Target camera position
- Automatically adjusts defaults for mobile vs desktop

### Camera Animation
- **Animate on Start** - Enable/disable entrance camera movement
- **Duration (s)** - Animation duration (1-30s, default: 20s)
- **Start X/Y/Z** - Initial camera position (-1.0, 15.0, 20.0)

### Entrance Animation
- **Depth Offset** - Controls particle appearance staggering (0-30, default: 10.5)
- **Animation Speed** - Speed multiplier (0.1-3.0, default: 1.5)
- **Reset Animation** - Button to restart entire animation

### Visual Adjustments
- **Grass Darken** - Darkening amount for grass areas (0-5, default: 2.35)
- **Bottom Left Scale** - Scale multiplier for bottom-left region (0-2.0, default: 0.55)
- **Bottom Right Scale** - Scale multiplier for bottom-right region (0-2.0, default: 0.55)
- **Hole Fill Scale** - Option to fill gaps in splat (0-3.0, default: 0.0)
- **Hole X/Y/Z Min/Max** - Bounding box for hole fill effect

### Splat Rotation
- **rotationX, rotationY, rotationZ** - Mesh rotation angles

### Splat Blending
- **Brightness** - Synthetic region brightness (0.1-2.0, default: 1.0)
- **Saturation** - Color saturation adjustment (0.0-1.5, default: 0.55)
- **Opacity** - Region opacity (0.1-1.0, default: 1.0)
- **Z Min/Max** - Z-axis bounds for blending (-20 to 20)
- **Y Min/Max** - Y-axis bounds for blending (-20 to 20)

### Current Camera Position
- **x, y, z** - Read-only monitors showing real-time camera position

### Menu Style
- **menuFont** - Font selection for navigation labels
  - Options: Caveat, Architects Daughter, Patrick Hand, Indie Flower, Permanent Marker, Shadows Into Light

### Mobile Layout
12 controls for precise positioning:
- **Ethos/Contact/Gallery Button positions** (Left %, Right %, Bottom vh)
- **Ethos/Contact/Gallery Label positions** (Left %, Right %, Bottom vh)

### Title Position
- **Mobile Bottom (vh)** - Title bottom position on mobile (default: 19vh)
- **Desktop Bottom (vh)** - Title bottom position on desktop (default: 10vh)

## Styling & CSS

### index.css
Contains global styles, custom animations, and Tailwind utilities.

**Key Features:**
- Custom font imports (Caveat and 5 other cursive fonts)
- Navigation button styles with hover effects
- Blueprint grid patterns
- Arrow animation keyframes
- Writing animation for title text
- Responsive media queries
- Color scheme (whites, blues, grays)

**CSS Custom Properties:**
- Grid sizing and opacity
- Ring rotation speeds
- Transition durations

**Navigation Button Classes:**
- `.nav-button-circle` - Desktop blueprint buttons
- `.nav-button-circle--mobile-large` - Larger mobile buttons
- `.nav-circle__grid` - Blueprint grid background
- `.nav-circle__ring` - Rotating concentric rings
- `.nav-circle__crosshair` - Center crosshair
- `.nav-circle__arcs` - Compass arc decorations

**Animation Classes:**
- `.writing-animation` - Typewriter-style text reveal

## Responsive Design

### Breakpoints
- **Phone:** < 768px
- **Tablet:** 768px - 1023px (md breakpoint)
- **Desktop:** ≥ 1024px (lg breakpoint)

**Three-Tier Strategy:**
1. **Phones (< 768px):** Base mobile layout with 80px buttons, text-4xl labels
2. **Tablets (768px-1023px):** Scaled-up mobile layout:
   - Buttons: 110px (1.375x larger)
   - Labels: text-6xl
   - Arrows: 1.375x larger
   - Title: text-7xl
   - Same corner positioning, better proportions for iPad Mini, etc.
3. **Desktop (≥ 1024px):** Right-side vertical navigation layout

**Rationale:** iPad Mini portrait (768px) and other tablets need larger touch targets and text than phones, but the right-side desktop layout is too cramped until 1024px+ screens.

### Phone & Tablet Features (< 1024px)
- Different camera positioning (higher and farther back)
- Corner-based navigation layout:
  - Ethos: Bottom-left (half-off left edge)
  - Contact: Bottom-center (half-off bottom edge)
  - Gallery: Bottom-right (half-off right edge)
- Touch-friendly blueprint circular buttons
- Labels positioned above/near buttons
- Custom curved arrows connecting labels to buttons
- Higher title position (19vh from bottom)
- Tablet tier scales everything 1.375x larger than phone

### Desktop Features (≥ 1024px)
- Right-side vertical navigation stack
- Labels inline with buttons (left of button)
- Horizontal decorative arrows between labels and buttons
- Tighter spacing for cleaner look
- Lower title position (10vh from bottom)
- Standard camera positioning (closer to scene)

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
6. Use "Show Overlays" toggle to hide UI for screenshots

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
- Current file: `v_one_final.spz`

### Rendering
- WebGL-based (requires GPU)
- Anti-aliasing disabled for performance
- Shader calculations per-particle
- Optimized with Three.js frustum culling
- PresentationControls for smooth interactions

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
- White cursive writing in the bottom left of "DFW" for enhanced branding

## Assets

### 3D Splat Files (.spz)
- **v_one_final.spz** - Currently active scene
- **full_scene_remove_blue_two_splat.spz** - Previous main scene (24.53 MB)
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
- Extensive Leva panels for live parameter tuning
- React DevTools compatible
- Three.js devtools extension supported
- Console logging for animation timing
- "Show Overlays" toggle for clean screenshots

### Code Organization
- Component separation by concern (Desktop vs Mobile)
- Shared timing constants exported from Scene
- Responsive detection via window resize listeners
- Event-driven architecture for reset functionality

## License

MIT

---

**Built for Doug's Found Wood (DFW) Furniture**  
Interactive 3D experience showcasing handcrafted furniture through Gaussian Splatting technology.
