# DFW Furniture Website - Repository Documentation

## Overview

An interactive 3D furniture website showcasing Doug's Found Wood (DFW) furniture using cutting-edge 3D Gaussian Splatting technology. The site features cinematic entrance animations, smooth camera movements, responsive design for mobile and desktop, and a modern blueprint-inspired UI.

**Live Experience**: Built with React, Three.js, and SparkJS for real-time 3D rendering in the browser.

## Tech Stack

### Core Technologies
- **React 19.2.6** - Latest React with concurrent features
- **TypeScript 5.9.3** - Full type safety
- **Vite 7.3.3** - Lightning-fast build tool and dev server
- **Tailwind CSS 4.3.0** - Utility-first CSS framework

### 3D Graphics
- **Three.js 0.186.1** - WebGL 3D library
- **React Three Fiber 9.8.1** - React renderer for Three.js
- **@react-three/drei 10.7.9** - Useful R3F helpers (PresentationControls, etc.)
- **SparkJS (`@sparkjsdev/spark`) 2.2.0** - 3D Gaussian Splatting renderer

### Development Tools
- **Leva 0.10.1** - GUI controls for live parameter tuning
- **Vite Plugin React 5.2.0** - Fast refresh and JSX transform

## Project Architecture

```
dfw_website/
├── public/
│   └── assets/
│       ├── spritesheet/              # UI sprite assets
│       ├── dfw_logo.spz (3.58 MB)    # Logo splat (not referenced by the app)
│       ├── dfw_logo_3d.png (299.45 KB) # Favicon / social image
│       ├── v_one_final.opt.spz (14.48 MB) # Current active scene (optimized)
│       └── v_one_final.spz (27.02 MB)     # Untouched original (?splat=v_one_final.spz)
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

> The `src/` part of this tree predates the move to `src/components/{scene,navigation,…}`; check the source for the current layout. Splat tooling lives in `scripts/splat/` (see its README).

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

**Current Asset:** `/assets/v_one_final.opt.spz` — an optimized, cleaned-up build of the original capture `v_one_final.spz` (see `scripts/splat/README.md`). `?splat=v_one_final.spz` loads the untouched original.

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
- Animation: 20-second smooth camera animation with ease-out cubic easing (10 s on a reload in the same browser session — `dfw_visited` in `sessionStorage`)
- Optional: Disable animation for instant positioning
- Real-time position monitoring via Leva controls

**Entrance Animation:**
- **Duration:** ~18 seconds after the loading screen (back to front; the grass nearest the camera and the chair settle last)
- **Particle Behavior:**
  - Assemble from scattered positions with swirl effect
  - Depth-based staggering: far particles appear first
  - Size-based timing: smaller particles before larger ones
  - Color-based timing: dark/grayscale objects first, then colorful
  - Vertical staging: smaller particles rise from below, larger descend from above
- **Configurable via Leva:**
  - Depth offset (default: 14)
  - Animation speed multiplier (default: 1.5)
  - Reset button to restart animation

**Visual Effects (Shader Modifiers):**
1. **Graceful Assembly** - Particles swirl into place from scattered positions
2. **Grass Darkening** - Darkens grass areas for better text legibility (default: 2.35)
3. **Bottom Left/Right Scaling** - Adjusts particle scale in specific regions (0.55)
4. **Hole Filling** - Option to fill gaps in the splat (default: 0.0)
5. **Synthetic Region Blending** - Adjusts brightness/saturation/opacity for spatial regions
   - Brightness: 1.0
   - Saturation: 0.65
   - Opacity: 1.0
   - Z range: -5.0 to 2.0
   - Y range: -10.0 to 5.0

**Splat Mesh Configuration:**
- Loaded by URL in one piece (Spark 2 has no streaming flag); download progress feeds the loading-screen bar
- Position: [0, -0.5, 0], Rotation: [-1.6, 0, 0] (tilted view)

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
Loading - loading screen for at least 3.5 s and until the splat has downloaded;
          the times below count from when it fades
0-20s   - Camera cranes down from [startX, startY, startZ] to its target
          (ease-out cubic: ~60% of the way by 5 s, ~90% by 10 s)
0-2s    - Nothing on screen yet; the first particles appear at ~2 s
2-10s   - Particles swirl into place back to front: a small cloud mid-screen
          grows into the sky, trees and the DFW sculpture (readable by ~8 s)
10-14s  - The grass sweeps in towards the camera
13-17s  - Title writes itself in ("Doug's Found Wood")
14-18s  - The chair forms out of a cloud of wood-coloured particles
16.5s   - Menu animates in (staggered: Gallery→Ethos→Contact)
~18s    - Settled (the shader's entrance math switches off at ~21 s)
```

Timings observed in a frame-by-frame capture of the production build. On a reload in the same browser session the loading screen lasts at least 2 s, the camera takes 10 s, the title comes in at 10.5 s and the menu at 13 s (`FAST_ANIMATION_TIMING`); the particles still take ~18 s.

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
- Lower title position (10svh from bottom; 2svh on landscape screens up to 900px tall)
- Standard camera positioning (closer to scene)

### Landscape & Desktop Nav Stack
- **Where it's used:** any landscape screen, and anything ≥ 1280px wide (`NavButtonLayer`). Portrait phones and tablets use the corner layout.
- **Shared variables:** button size, gap and top are CSS variables in `src/styles/variables.css` (`--nav-btn`, `--nav-gap`, `--nav-stack-top`). The buttons (`navLayouts.ts`) and the label/arrow column (`MenuOverlay.tsx`) both read them, so each label stays level with its button.
- **Positioning:** the stack sits at 45% of the height unless that would run it into the title. On short screens it rises to end 1rem above the title box instead. The title box (`--title-block`) comes from the title's own `--title-bottom`, `--title-pad-bottom` and `--title-width`.
- **Sizing:** on short screens (phones held sideways, small windows) the buttons, label font and arrows shrink with the height, down to 44px buttons.
- **Checked sizes:** 667×375, 844×390, 915×412, 932×430, 800×450, 1024×600, 1280×720, 1366×768, 1536×864, 1440×900, 1920×1080, 1024×768 and 1180×820. On 1440×900 and larger the stack stays at 45%.

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
- Current file: `v_one_final.opt.spz`, 14.48 MB / ~1.03M splats (the 27.02 MB original with view-dependent colour (SH) dropped, faint, off-screen, hidden and over-dense splats removed, and scene edits applied). Built by `scripts/splat/optimize.mjs` — see `scripts/splat/README.md`
- Downloaded in one piece, starting once the lazy 3D chunk has loaded and the scene mounts (Spark 2 has no streaming flag)
- The splat is culled for the ±20° / ±13° orbit lock and the camera positions above — change either and it needs rebuilding

### Rendering
- WebGL-based (requires GPU)
- Anti-aliasing disabled for performance; splat canvas DPR capped at 2 (1.5 on phones/tablets)
- Shader calculations per-particle; the entrance math is skipped once every splat has settled (`entranceDone`)
- Spark depth-sorts the splats (on a worker) whenever the camera moves, so the ambient sway keeps it sorting while the page is idle
- PresentationControls for smooth interactions

### Bundle Size
- The 3D code (three, R3F, drei, Spark) is a lazy chunk, ~1.16 MB gzipped — Spark 2.2 embeds its WASM once (2.1 shipped it twice)
- Three.js is the largest dependency
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

### Intro
- **Let visitors skip or shorten the intro.** A first visit shows the loading screen (≥ 3.5 s), then waits 16.5 s for the menu. Options: a tap / click / drag that jumps to the settled scene; bringing the menu in earlier than the title; a shorter camera move than 20 s.
- **Remember returning visitors across visits.** `dfw_visited` lives in `sessionStorage`, so only a reload in the same tab gets the faster intro; `localStorage` (perhaps with a date) would give it to people who come back another day.
- **Fill the gap after the loading screen.** For ~2 s after it fades the page is blank, then a few specks appear mid-screen. Starting the particles a little earlier (a lower depth offset — these docs used to list 10.5; the code has 14, and each 1.5 less starts everything 1 s sooner) or overlapping them with the loading screen's fade would remove the dead air.
- **Give the chair its own moment.** The chair — the product — forms last (14–18 s), landing together with the title and the menu. Bringing it in earlier, right after the sculpture, would put the furniture first.
- **Speed up the particle assembly for returning visitors too.** The returning-visitor speed-up covers the camera (2×), the title and the menu, but not the particles, which still take ~18 s. The nearest grass keeps flying in after the camera has stopped.
- **Respect `prefers-reduced-motion` in the 3D intro** (the loading screen and drag hint already do): skip the crane and the swirl, fade the scene in.

### Splat and loading
- **Start the splat download earlier.** It begins only after the lazy 3D chunk has loaded and the scene has mounted. Fetching it from the start (e.g. in `main.tsx`, handing Spark the bytes) would shorten the loading screen on slow connections. A `<link rel="preload">` would have to match Spark's fetch exactly or the file downloads twice.
- **A lighter splat for phones**, e.g. ~8 MB with a stronger density cap, picked when `isMobileView`. `scripts/splat/optimize.mjs` can build it; check it with `node scripts/splat/render.mjs --views=mobile,mobile-right`.
- **Idle cost of the ambient sway.** The sway moves the camera every frame, which keeps Spark re-sorting even when nothing else changes. Worth measuring on a phone (battery, heat). If it shows, `SparkRenderer`'s `minSortIntervalMs` can throttle the sort.
- **Trim the font request.** Production only uses Caveat and Patrick Hand. Architects Daughter, Indie Flower, Permanent Marker and Shadows Into Light are menu-font options in the dev controls, and Pinyon Script (`--font-cursive`) isn't used. Loading only the two in production shortens the render-blocking CSS request.
- **Drop unused files from `public/`.** `dfw_logo.spz` isn't referenced anywhere, and `v_one_final.spz` is only for the `?splat=` comparison. Visitors never download them, but every deploy carries them.

### Open questions
- Can the back-right of the garden be photographed again? Real photos would replace the cloned trees that fill that gap. A new capture would also mean redoing the scene edits in `scripts/splat/edits.json`.
- Is the ±20° / ±13° orbit final? The optimized splat is culled and pruned for it, so a wider orbit means rebuilding it (`scripts/splat/README.md`).
- Should the `?splat=` switch (loading the untouched original) stay in production?
- Which devices matter most? That decides whether a phone-specific splat is worth making.
- Is the 20-second intro deliberate, or a candidate for a shorter / skippable version?

## Assets

### 3D Splat Files (.spz)
- **v_one_final.opt.spz** - Currently active scene (14.48 MB), generated from the original by `scripts/splat/optimize.mjs`
- **v_one_final.spz** - Untouched original capture (27.02 MB); only loaded via `?splat=v_one_final.spz`
- **dfw_logo.spz** - Logo splat (3.58 MB); not referenced by the app

### Images
- **dfw_logo_3d.png** - 3D logo render, used as favicon and social image (299.45 KB)

### Additional
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
