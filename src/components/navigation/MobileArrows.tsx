import { useLayoutEffect, useState } from 'react';
import { useControls, folder } from 'leva';
import { Handline, HandlineLayer, type GestureSpec } from '../../lib/handline';
import { arrowStyle, NAV_ARROW_LAND, type ArrowEffectsConfig } from './arrowStyle';
import {
  useEthosArrowControls,
  useContactArrowControls,
  useGalleryArrowControls,
} from '../../hooks/useMobileArrowControls';
import { mobileButtonCenter, mobileButtonSize, type NavButtonId } from '../../constants/navLayouts';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Arrow targeting controls for end point (button center)
const useArrowEndControls = (controlsStore?: LevaStore) => {
  return useControls(
    {
      '🎯 Arrow Targeting': folder(
        {
          'End Point': folder(
            {
              endYOffset: { value: 0, min: -50, max: 50, step: 1, label: 'Y Offset (px)' },
            },
            { collapsed: true }
          ),
        },
        { collapsed: false }
      ),
    },
    { store: controlsStore }
  );
};

// Arrow start controls for Ethos (bottom-right of label)
const useEthosStartControls = (controlsStore?: LevaStore) => {
  return useControls(
    {
      '🎯 Arrow Targeting': folder(
        {
          'Ethos Start': folder(
            {
              ethosStartX: { value: 0.4, min: 0, max: 1, step: 0.1, label: 'Anchor X (0-1)' },
              ethosStartY: { value: 1.0, min: 0, max: 1, step: 0.1, label: 'Anchor Y (0-1)' },
              ethosOffsetX: { value: 16, min: -50, max: 50, step: 1, label: 'Offset X (px)' },
              ethosOffsetY: { value: 11, min: -50, max: 50, step: 1, label: 'Offset Y (px)' },
            },
            { collapsed: true }
          ),
        },
        { collapsed: false }
      ),
    },
    { store: controlsStore }
  );
};

// Arrow start controls for Contact (bottom of label)
const useContactStartControls = (controlsStore?: LevaStore) => {
  return useControls(
    {
      '🎯 Arrow Targeting': folder(
        {
          'Contact Start': folder(
            {
              contactStartX: { value: 0.5, min: 0, max: 1, step: 0.1, label: 'Anchor X (0-1)' },
              contactStartY: { value: 1, min: 0, max: 1, step: 0.1, label: 'Anchor Y (0-1)' },
              contactOffsetX: { value: 0, min: -50, max: 50, step: 1, label: 'Offset X (px)' },
              contactOffsetY: { value: 6, min: -50, max: 50, step: 1, label: 'Offset Y (px)' },
            },
            { collapsed: true }
          ),
        },
        { collapsed: false }
      ),
    },
    { store: controlsStore }
  );
};

// Arrow start controls for Gallery (left side of label)
const useGalleryStartControls = (controlsStore?: LevaStore) => {
  return useControls(
    {
      '🎯 Arrow Targeting': folder(
        {
          'Gallery Start': folder(
            {
              galleryStartX: { value: 0, min: 0, max: 1, step: 0.1, label: 'Anchor X (0-1)' },
              galleryStartY: { value: 0.5, min: 0, max: 1, step: 0.1, label: 'Anchor Y (0-1)' },
              galleryOffsetX: { value: -6, min: -50, max: 50, step: 1, label: 'Offset X (px)' },
              galleryOffsetY: { value: 0, min: -50, max: 50, step: 1, label: 'Offset Y (px)' },
            },
            { collapsed: true }
          ),
        },
        { collapsed: false }
      ),
    },
    { store: controlsStore }
  );
};

interface ViewportSize {
  width: number;
  height: number;
}

const useViewportSize = (): ViewportSize => {
  // Initialize with actual viewport size to avoid 0x0 on first render
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window !== 'undefined' ? (window.visualViewport?.width ?? window.innerWidth) : 0,
    height:
      typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 0,
  }));

  useLayoutEffect(() => {
    const update = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    update();
    const frame = requestAnimationFrame(update);

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, []);

  return size;
};

interface CurveOffset {
  x: number;
  y: number;
}

interface ArrowProps {
  isVisible: boolean;
  delay?: number;
  /** Accepted for the layout's call sites; the arrows sway by `curveOffset`. */
  springTransform?: unknown;
  curveOffset?: CurveOffset;
  controlsStore?: LevaStore;
  // Label element — the arrow starts at a point on the label (its size is
  // text-dependent). The end is config-derived: the button's centre from
  // navLayouts; NAV_ARROW_LAND says how far into the button it goes.
  labelElement?: HTMLElement | null;
  /** No longer needed: the arrow's layer measures itself. */
  containerElement?: HTMLElement | null;
  effectsConfig?: ArrowEffectsConfig;
}

type BreakpointKey = 'small' | 'mid' | 'tablet' | 'ipadPro';

const getBreakpoint = (width: number): BreakpointKey => {
  if (width <= 0) return 'mid';
  if (width < 400) return 'small';
  if (width < 700) return 'mid';
  if (width < 1000) return 'tablet';
  return 'ipadPro';
};

interface ArrowTemplate {
  startX: number;
  startY: number;
  ctrlX: number;
  ctrlY: number;
  endX: number;
  endY: number;
}

/**
 * Each phone arrow keeps its tuned bend (the Leva template, stretched from the
 * label to the button) and carries the ornament of its desktop twin on it:
 * Gallery a loop, Ethos a double curl, Contact a wave.
 */
const ORNAMENTS: Record<NavButtonId, (along: string) => GestureSpec> = {
  gallery: (along) => ({ kind: 'loop', size: 10, at: 0.4, along }),
  ethos: (along) => ({ kind: 'loops', count: 2, size: 7, at: 0.45, along, flip: true }),
  contact: (along) => ({ kind: 'wave', waves: 2, amp: 5, along }),
};

interface MobileArrowProps extends ArrowProps {
  id: NavButtonId;
  template: ArrowTemplate;
  start: { x: number; y: number; ox: number; oy: number };
}

function MobileArrow({
  id,
  template: t,
  start,
  isVisible,
  delay = 0,
  curveOffset,
  controlsStore,
  labelElement,
  effectsConfig,
}: MobileArrowProps) {
  const { endYOffset } = useArrowEndControls(controlsStore);
  const viewport = useViewportSize();
  const breakpoint = getBreakpoint(viewport.width);
  const ready = !!labelElement && viewport.width > 0 && viewport.height > 0;
  const center = ready ? mobileButtonCenter(id, breakpoint, viewport) : null;

  return (
    <HandlineLayer
      className={`nav-mobile-${id}-arrow`}
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))' }}
    >
      {center && labelElement && (
        <Handline
          from={{ target: labelElement, at: [start.x, start.y], offset: [start.ox, start.oy] }}
          to={{
            target: { x: center.x, y: center.y + endYOffset },
            space: 'viewport',
            radius: mobileButtonSize(id, breakpoint) / 2,
          }}
          gesture={ORNAMENTS[id](
            `M ${t.startX} ${t.startY} Q ${t.ctrlX} ${t.ctrlY}, ${t.endX} ${t.endY}`
          )}
          side={1}
          land={NAV_ARROW_LAND}
          gap={5}
          tail="dot"
          color="white"
          seed={`mobile-${id}`}
          play={isVisible}
          delay={delay}
          // The label slides in by CSS transition, which fires no event.
          follow={1500}
          // Sways with the scene drag: a push on the line's middle, ends fixed.
          nudge={curveOffset ? { x: curveOffset.x * 0.6, y: curveOffset.y * 0.6 } : undefined}
          {...arrowStyle(effectsConfig, 'mobile')}
        />
      )}
    </HandlineLayer>
  );
}

// =============================================================================
// ETHOS ARROW - Left side, loops up-left toward button
// =============================================================================
export const EthosArrow = (props: ArrowProps) => {
  const controls = useEthosArrowControls(props.controlsStore);
  const { ethosStartX, ethosStartY, ethosOffsetX, ethosOffsetY } = useEthosStartControls(
    props.controlsStore
  );
  const viewport = useViewportSize();
  return (
    <MobileArrow
      id="ethos"
      template={controls[getBreakpoint(viewport.width)] as ArrowTemplate}
      start={{ x: ethosStartX, y: ethosStartY, ox: ethosOffsetX, oy: ethosOffsetY }}
      delay={300}
      {...props}
    />
  );
};

// =============================================================================
// CONTACT ARROW - Center, curves down toward button below
// =============================================================================
export const ContactArrow = (props: ArrowProps) => {
  const controls = useContactArrowControls(props.controlsStore);
  const { contactStartX, contactStartY, contactOffsetX, contactOffsetY } = useContactStartControls(
    props.controlsStore
  );
  const viewport = useViewportSize();
  return (
    <MobileArrow
      id="contact"
      template={controls[getBreakpoint(viewport.width)] as ArrowTemplate}
      start={{ x: contactStartX, y: contactStartY, ox: contactOffsetX, oy: contactOffsetY }}
      delay={400}
      {...props}
    />
  );
};

// =============================================================================
// GALLERY ARROW - Right side, sweeps right toward button
// =============================================================================
export const GalleryArrow = (props: ArrowProps) => {
  const controls = useGalleryArrowControls(props.controlsStore);
  const { galleryStartX, galleryStartY, galleryOffsetX, galleryOffsetY } = useGalleryStartControls(
    props.controlsStore
  );
  const viewport = useViewportSize();
  return (
    <MobileArrow
      id="gallery"
      template={controls[getBreakpoint(viewport.width)] as ArrowTemplate}
      start={{ x: galleryStartX, y: galleryStartY, ox: galleryOffsetX, oy: galleryOffsetY }}
      delay={500}
      {...props}
    />
  );
};
