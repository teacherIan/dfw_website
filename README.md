# DFW Furniture Website 🪑✨

A creative, interactive furniture website built with **React**, **Three.js**, **React Three Fiber (R3F)**, and **SparkJS** for rendering beautiful 3D Gaussian splat scenes.

## Features

- 🎨 **Interactive 3D Scene** - Explore furniture pieces using Gaussian splatting technology
- 🌅 **Beautiful Lighting** - Sunset environment with dynamic lighting effects
- 🎯 **Camera Controls** - Drag and zoom to view from any angle
- ✨ **Smooth Animations** - Gentle rotation and floating effects
- 📱 **Responsive Design** - Works beautifully on all screen sizes
- 🎭 **Creative UI** - Modern, elegant interface with Tailwind CSS

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Three.js** - 3D graphics library
- **React Three Fiber (R3F)** - React renderer for Three.js
- **SparkJS** - Gaussian splatting renderer
- **@react-three/drei** - Useful helpers for R3F
- **Tailwind CSS** - Utility-first styling

## Project Structure

```
dfw_website/
├── src/
│   ├── components/
│   │   └── spark/
│   │       ├── SparkRenderer.tsx  # Extended SparkRenderer component
│   │       └── SplatMesh.tsx      # Extended SplatMesh component
│   ├── App.tsx                     # Main application and scene
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Global styles
│   └── vite-env.d.ts              # Vite type definitions
├── public/
│   └── assets/
│       ├── full_scene.spz         # 3D Gaussian splat file
│       └── dfw_logo_3d.png        # Company logo
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── vite.config.ts                 # Vite configuration
└── tsconfig.json                  # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5173/
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## How It Works

### SparkJS Integration

This project uses SparkJS to render 3D Gaussian splats in the browser. The key integration points are:

1. **Extending SparkJS Components** - We use React Three Fiber's `extend` function to make SparkJS components work with R3F's declarative JSX syntax:

```tsx
// src/components/spark/SparkRenderer.tsx
import { extend } from "@react-three/fiber";
import { SparkRenderer as SparkSparkRenderer } from "@sparkjsdev/spark";

export const SparkRenderer = extend(SparkSparkRenderer);
```

```tsx
// src/components/spark/SplatMesh.tsx
import { extend } from "@react-three/fiber";
import { SplatMesh as SparkSplatMesh } from "@sparkjsdev/spark";

export const SplatMesh = extend(SparkSplatMesh);
```

2. **Using in the Scene** - The extended components can now be used declaratively:

```tsx
<SparkRenderer args={[sparkRendererArgs]}>
  <SplatMesh ref={meshRef} args={[splatMeshArgs]} />
</SparkRenderer>
```

### Interactive Features

- **Camera Controls** - Drag to rotate, scroll to zoom
- **Hover Effects** - Splat rotates faster when hovered
- **Animations** - Gentle floating and rotation effects
- **Lighting** - Multiple light sources create depth and atmosphere

## Customization

### Changing the 3D Model

Replace `/public/assets/full_scene.spz` with your own Gaussian splat file. Update the URL in `App.tsx`:

```tsx
const splatMeshArgs = useMemo(
  () => ({
    url: "/assets/your-custom-scene.spz",
  }) as const,
  [],
);
```

### Adjusting Animations

Modify the `useFrame` hook in `App.tsx`:

```tsx
useFrame((state) => {
  if (meshRef.current) {
    const time = state.clock.getElapsedTime();
    meshRef.current.rotation.y += 0.003; // Adjust rotation speed
    meshRef.current.position.y = Math.sin(time * 0.5) * 0.1; // Adjust float height
  }
});
```

### Styling

The project uses Tailwind CSS. Modify classes in `App.tsx` or add custom styles to `index.css`.

## Resources

- [SparkJS Documentation](https://sparkjs.dev/docs/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [Three.js](https://threejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## License

MIT

---

**Built with ❤️ for DFW Furniture**
