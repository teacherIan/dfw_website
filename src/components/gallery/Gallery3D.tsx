import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Image, Text, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { getGalleryImages, GalleryImage } from '../../utils/gallery';

interface GalleryItemProps {
  image: GalleryImage;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  index: number;
  hovered: number | null;
  setHovered: (index: number | null) => void;
  clicked: number | null;
  setClicked: (index: number | null) => void;
}

 type GalleryImageMesh = THREE.Mesh<
   THREE.BufferGeometry,
   THREE.ShaderMaterial & { color: THREE.Color }
 >;

const damp3 = (target: THREE.Vector3, to: [number, number, number], step: number, delta: number) => {
  const t = new THREE.Vector3(to[0], to[1], to[2]);
  target.lerp(t, 1 - Math.exp(-step * delta));
};

const dampC = (target: THREE.Color, to: THREE.Color, step: number, delta: number) => {
  target.lerp(to, 1 - Math.exp(-step * delta));
};

const GalleryItem = ({ image, position, rotation, scale, index, hovered, setHovered, clicked, setClicked }: GalleryItemProps) => {
  const ref = useRef<THREE.Group>(null);
  const imageRef = useRef<GalleryImageMesh>(null);
  
  // Animate hover state
  useFrame((state, delta) => {
    if (!ref.current) return;
    
    const isHovered = hovered === index;
    const isClicked = clicked === index;
    
    // Scale up slightly on hover, more on click
    const baseScale = new THREE.Vector3(scale[0], scale[1], scale[2]);
    const targetScaleMultiplier = isClicked ? 1.5 : (isHovered ? 1.15 : 1);
    const targetScale: [number, number, number] = [
      baseScale.x * targetScaleMultiplier,
      baseScale.y * targetScaleMultiplier,
      baseScale.z * targetScaleMultiplier
    ];
    
    damp3(ref.current.scale, targetScale, 4, delta);
    
    // Add subtle floating motion when not clicked
    if (!isClicked) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + index * 0.5) * 0.1;
    }
    
    // Brighten/Desaturate effect
    if (imageRef.current) {
      const targetColor = new THREE.Color(isHovered || isClicked ? '#ffffff' : '#a0a0a0');
      dampC(imageRef.current.material.color, targetColor, 4, delta);
      
      // Reduce opacity of non-focused items if one is clicked
      const targetOpacity = clicked !== null && !isClicked ? 0.1 : 1;
      imageRef.current.material.opacity = THREE.MathUtils.lerp(imageRef.current.material.opacity, targetOpacity, 1 - Math.exp(-4 * delta));
      imageRef.current.material.transparent = true;
    }
  });

  return (
    <group 
      ref={ref} 
      position={position} 
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        setClicked(clicked === index ? null : index);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(index);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = 'auto';
      }}
    >
      <Image ref={imageRef} url={image.src} scale={[1, 1]} transparent />
      {/* Category Label showing on hover */}
      <Text
        position={[0, -0.6, 0.05]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="top"
        fillOpacity={hovered === index || clicked === index ? 1 : 0}
      >
        {image.name}
      </Text>
    </group>
  );
};

const GalleryInner = ({ images }: { images: GalleryImage[] }) => {
  const { gl } = useThree();
  const [hovered, setHovered] = useState<number | null>(null);
  const [clicked, setClicked] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const movementAccRef = useRef(0);
  const rigRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate spiral positions
  const categoryImages = useMemo(() => {
    const byCategory: Record<string, GalleryImage[]> = {};
    for (const img of images) {
      byCategory[img.category] = byCategory[img.category] || [];
      byCategory[img.category].push(img);
    }

    const categories = Object.keys(byCategory);
    const category = categories.includes('chairs') ? 'chairs' : (categories[0] || 'misc');
    return byCategory[category] || images;
  }, [images]);

  const displayedImages = useMemo(() => categoryImages.slice(0, 12), [categoryImages]);

  const items = useMemo(() => {
    const radius = 3.5;
    const count = displayedImages.length;
    const angleStep = count > 0 ? (Math.PI * 2) / count : 0;

    return displayedImages.map((img, i) => {
      const angle = i * angleStep;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const y = 0;

      return {
        image: img,
        position: [x, y, z] as [number, number, number],
        rotation: [0, angle, 0] as [number, number, number],
        scale: [3, 2, 1] as [number, number, number],
      };
    });
  }, [displayedImages]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    const count = items.length;
    if (count <= 1) return;

    const thresholdPx = 70;
    const el = gl.domElement;

    let isPointerDown = false;
    let activePointerId: number | null = null;
    let lastClientX: number | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      activePointerId = e.pointerId;
      lastClientX = e.clientX;
      movementAccRef.current = 0;

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // no-op
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      if (lastClientX === null) {
        lastClientX = e.clientX;
        return;
      }

      const deltaX = e.clientX - lastClientX;
      lastClientX = e.clientX;
      movementAccRef.current += deltaX;

      let steps = 0;
      while (movementAccRef.current > thresholdPx) {
        movementAccRef.current -= thresholdPx;
        steps += 1;
      }
      while (movementAccRef.current < -thresholdPx) {
        movementAccRef.current += thresholdPx;
        steps -= 1;
      }

      if (steps !== 0) {
        setActiveIndex((prev) => {
          const next = (prev - steps) % count;
          return next < 0 ? next + count : next;
        });
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      isPointerDown = false;
      activePointerId = null;
      lastClientX = null;
      movementAccRef.current = 0;

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // no-op
      }
    };

    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointercancel', handlePointerUp);
    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [gl, items.length]);

  useFrame((state, delta) => {
    if (rigRef.current) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
      const distanceFromCamera = 10;
      rigRef.current.position.copy(state.camera.position).add(forward.multiplyScalar(distanceFromCamera));
      rigRef.current.quaternion.copy(state.camera.quaternion);
    }

    if (!groupRef.current) return;

    const count = items.length;
    if (count <= 1) return;

    const angleStep = (Math.PI * 2) / count;
    const targetRotY = -activeIndex * angleStep;

    const currentRotY = groupRef.current.rotation.y;
    const shortestDelta =
      THREE.MathUtils.euclideanModulo(targetRotY - currentRotY + Math.PI, Math.PI * 2) - Math.PI;

    groupRef.current.rotation.y = currentRotY + shortestDelta * (1 - Math.exp(-4 * delta));
  });

  return (
    <>
      <group ref={rigRef}>
        <group ref={groupRef}>
          {items.map((item, i) => (
            <GalleryItem
              key={item.image.src + i}
              index={i}
              {...item}
              hovered={hovered}
              setHovered={setHovered}
              clicked={clicked}
              setClicked={setClicked}
            />
          ))}
        </group>
      </group>
      
      {/* Cosmic atmosphere */}
      <Stars radius={50} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={300} scale={20} size={3} speed={0.4} opacity={0.5} color="#4fd1c5" />
    </>
  );
};

export const Gallery3D = ({ visible }: { visible: boolean }) => {
  const images = useMemo(() => getGalleryImages(), []);
  
  if (!visible) return null;

  return (
    <GalleryInner images={images} />
  );
};

export default Gallery3D;
