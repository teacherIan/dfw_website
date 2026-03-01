import { useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useControls, folder } from 'leva';
import { AnimatedArrowhead, AnimatedDot } from './ArrowComponents';
import HashMarks from './HashMarks';
import ScribeMarks from './ScribeMarks';
import { getArrowFilterUrl, defaultArrowEffectsConfig } from './ArrowFilters';
import type { ArrowEffectsConfig } from './ArrowFilters';
import { useEthosArrowControls, useContactArrowControls, useGalleryArrowControls } from '../../hooks/useMobileArrowControls';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Arrow targeting controls for end point (button center)
const useArrowEndControls = (controlsStore?: LevaStore) => {
  return useControls({
    '🎯 Arrow Targeting': folder({
      'End Point': folder({
        endYOffset: { value: 0, min: -50, max: 50, step: 1, label: 'Y Offset (px)' },
      }, { collapsed: true }),
    }, { collapsed: false }),
  }, { store: controlsStore });
};

// Arrow start controls for Ethos (bottom-right of label)
const useEthosStartControls = (controlsStore?: LevaStore) => {
  return useControls({
    '🎯 Arrow Targeting': folder({
      'Ethos Start': folder({
        ethosStartX: { value: 0.4, min: 0, max: 1, step: 0.1, label: 'Anchor X (0-1)' },
        ethosStartY: { value: 1.0, min: 0, max: 1, step: 0.1, label: 'Anchor Y (0-1)' },
        ethosOffsetX: { value: 16, min: -50, max: 50, step: 1, label: 'Offset X (px)' },
        ethosOffsetY: { value: 11, min: -50, max: 50, step: 1, label: 'Offset Y (px)' },
      }, { collapsed: true }),
    }, { collapsed: false }),
  }, { store: controlsStore });
};

// Arrow start controls for Contact (bottom of label)
const useContactStartControls = (controlsStore?: LevaStore) => {
  return useControls({
    '🎯 Arrow Targeting': folder({
      'Contact Start': folder({
        contactStartX: { value: 0.5, min: 0, max: 1, step: 0.1, label: 'Anchor X (0-1)' },
        contactStartY: { value: 1, min: 0, max: 1, step: 0.1, label: 'Anchor Y (0-1)' },
        contactOffsetX: { value: 0, min: -50, max: 50, step: 1, label: 'Offset X (px)' },
        contactOffsetY: { value: 6, min: -50, max: 50, step: 1, label: 'Offset Y (px)' },
      }, { collapsed: true }),
    }, { collapsed: false }),
  }, { store: controlsStore });
};

// Arrow start controls for Gallery (left side of label)
const useGalleryStartControls = (controlsStore?: LevaStore) => {
  return useControls({
    '🎯 Arrow Targeting': folder({
      'Gallery Start': folder({
        galleryStartX: { value: 0, min: 0, max: 1, step: 0.1, label: 'Anchor X (0-1)' },
        galleryStartY: { value: 0.5, min: 0, max: 1, step: 0.1, label: 'Anchor Y (0-1)' },
        galleryOffsetX: { value: -6, min: -50, max: 50, step: 1, label: 'Offset X (px)' },
        galleryOffsetY: { value: 0, min: -50, max: 50, step: 1, label: 'Offset Y (px)' },
      }, { collapsed: true }),
    }, { collapsed: false }),
  }, { store: controlsStore });
};

interface ViewportSize {
  width: number;
  height: number;
}

const useViewportSize = (): ViewportSize => {
  // Initialize with actual viewport size to avoid 0x0 on first render
  const [size, setSize] = useState<ViewportSize>(() => ({
    width: typeof window !== 'undefined' ? (window.visualViewport?.width ?? window.innerWidth) : 0,
    height: typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 0,
  }));

  useLayoutEffect(() => {
    const update = () => {
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
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

interface AnchorPoint {
  x: number;
  y: number;
  offsetX?: number;
  offsetY?: number;
}

const useElementPoint = (
  element: HTMLElement | null | undefined,
  anchor: AnchorPoint,
  originElement?: HTMLElement | null
): { x: number; y: number } | null => {
  // Force re-render on viewport changes
  const [, setTick] = useState(0);

  useLayoutEffect(() => {
    const update = () => setTick((t) => t + 1);

    update();
    const frame = requestAnimationFrame(update);

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('orientationchange', update);

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (element) resizeObserver?.observe(element);
    if (originElement) resizeObserver?.observe(originElement);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('orientationchange', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      resizeObserver?.disconnect();
    };
  }, [element, originElement, anchor.x, anchor.y, anchor.offsetX, anchor.offsetY]);

  // Compute point directly during render - responds immediately to anchor changes
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  let x = rect.left + rect.width * anchor.x + (anchor.offsetX ?? 0);
  let y = rect.top + rect.height * anchor.y + (anchor.offsetY ?? 0);

  if (originElement) {
    const originRect = originElement.getBoundingClientRect();
    x -= originRect.left;
    y -= originRect.top;
  }

  return { x, y };
};

const useElementRect = (element: HTMLElement | null | undefined) => {
  const [rect, setRect] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }

    const update = () => {
      if (!element) {
        return;
      }
      const bounds = element.getBoundingClientRect();
      setRect((prev) => {
        if (prev && prev.width === bounds.width && prev.height === bounds.height) {
          return prev;
        }
        return { width: bounds.width, height: bounds.height };
      });
    };

    update();
    const frame = requestAnimationFrame(update);

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    resizeObserver?.observe(element);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      resizeObserver?.disconnect();
    };
  }, [element]);

  return rect;
};

interface SpringTransform {
  rotate: number;
  skewX: number;
  skewY: number;
  translateX: number;
  translateY: number;
  scale: number;
}

interface CurveOffset {
  x: number;
  y: number;
}

interface ArrowProps {
  isVisible: boolean;
  delay?: number;
  unravelOffset?: number;
  springTransform?: SpringTransform;
  curveOffset?: CurveOffset;
  controlsStore?: LevaStore;
  // Real elements for dynamic endpoint calculation
  labelElement?: HTMLElement | null;
  buttonElement?: HTMLElement | null;
  containerElement?: HTMLElement | null;
  // Woodworker-style effects configuration
  effectsConfig?: ArrowEffectsConfig;
}

/**
 * Calculate arrowhead angle from the last control point to the endpoint
 * For cubic bezier, use the second control point of the last C command
 */
const getArrowAngle = (lastControlX: number, lastControlY: number, endX: number, endY: number): number => {
  const dx = endX - lastControlX;
  const dy = endY - lastControlY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

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
  angleOffset: number;
}

interface MappedPath {
  d: string;
  start: { x: number; y: number };
  ctrl: { x: number; y: number };
  end: { x: number; y: number };
  angleOffset: number;
}

const buildMappedPath = (
  template: ArrowTemplate,
  start: { x: number; y: number },
  end: { x: number; y: number },
  curveOffset?: CurveOffset
): MappedPath => {
  const templateStart = { x: template.startX, y: template.startY };
  const templateEnd = { x: template.endX, y: template.endY };
  const templateCtrl = { x: template.ctrlX, y: template.ctrlY };

  const v0x = templateEnd.x - templateStart.x;
  const v0y = templateEnd.y - templateStart.y;
  const v1x = end.x - start.x;
  const v1y = end.y - start.y;
  const len0 = Math.hypot(v0x, v0y) || 1;
  const len1 = Math.hypot(v1x, v1y) || 1;
  const scale = len1 / len0;
  const angle0 = Math.atan2(v0y, v0x);
  const angle1 = Math.atan2(v1y, v1x);
  const rotation = angle1 - angle0;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const applyTransform = (point: { x: number; y: number }) => {
    const dx = (point.x - templateStart.x) * scale;
    const dy = (point.y - templateStart.y) * scale;
    return {
      x: start.x + dx * cos - dy * sin,
      y: start.y + dx * sin + dy * cos,
    };
  };

  const ctrl = applyTransform(templateCtrl);
  if (curveOffset) {
    ctrl.x += curveOffset.x * scale;
    ctrl.y += curveOffset.y * scale;
  }

  return {
    d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y}, ${end.x} ${end.y}`,
    start,
    ctrl,
    end,
    angleOffset: template.angleOffset,
  };
};

// =============================================================================
// ETHOS ARROW - Left side, loops up-left toward button
// ViewBox: 120×160, starts near label (bottom-right), ends pointing at button (upper-left)
// =============================================================================
export const EthosArrow = ({ isVisible, delay = 300, curveOffset, controlsStore, labelElement, buttonElement, containerElement, effectsConfig }: ArrowProps) => {
  const controls = useEthosArrowControls(controlsStore);
  const { endYOffset } = useArrowEndControls(controlsStore);
  const { ethosStartX, ethosStartY, ethosOffsetX, ethosOffsetY } = useEthosStartControls(controlsStore);
  const viewport = useViewportSize();
  const containerRect = useElementRect(containerElement);
  const breakpoint = getBreakpoint(viewport.width);
  const template = controls[breakpoint] as ArrowTemplate;

  const startPoint = useElementPoint(labelElement, { x: ethosStartX, y: ethosStartY, offsetX: ethosOffsetX, offsetY: ethosOffsetY }, containerElement);
  const endPoint = useElementPoint(buttonElement, { x: 0.5, y: 0.5, offsetY: endYOffset }, containerElement);
  // IMPORTANT: Use || not ?? here. Container may have height=0 before layout completes.
  // ?? only falls back on null/undefined, but || also falls back on 0.
  const width = containerRect?.width || viewport.width;
  const height = containerRect?.height || viewport.height;

  if (!startPoint || !endPoint || width === 0 || height === 0) {
    return null;
  }

  const pathData = buildMappedPath(template, startPoint, endPoint, curveOffset);
  const pathDelaySeconds = delay / 1000;
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;
  const config = effectsConfig ?? defaultArrowEffectsConfig;
  const filterUrl = getArrowFilterUrl(config);

  return (
    <svg
      className="nav-mobile-ethos-arrow"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <motion.path
        d={pathData.d}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={filterUrl}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: pathDelaySeconds }}
      />
      {/* Hash marks - small perpendicular lines */}
      {config.enabled && config.hashEnabled && (
        <HashMarks
          pathData={pathData.d}
          density={config.hashDensity}
          length={config.hashLength}
          spacing={config.hashSpacing}
          opacity={config.hashOpacity}
          isVisible={isVisible}
          delay={delay + 200}
          seed={42}
        />
      )}
      {/* Scribe marks - thin parallel lines */}
      {config.enabled && config.scribeEnabled && (
        <ScribeMarks
          pathData={pathData.d}
          offset={config.scribeOffset}
          strokeWidth={config.scribeWidth}
          dashPattern={config.scribeDash}
          opacity={config.scribeOpacity}
          isVisible={isVisible}
          delay={delay + 100}
        />
      )}
      <AnimatedDot x={pathData.start.x} y={pathData.start.y} isVisible={isVisible} delay={dotDelay} />
      <AnimatedArrowhead
        size="mobile"
        x={pathData.end.x}
        y={pathData.end.y}
        angle={getArrowAngle(pathData.ctrl.x, pathData.ctrl.y, pathData.end.x, pathData.end.y) + pathData.angleOffset}
        isVisible={isVisible}
        delay={arrowheadDelay}
        style={config.arrowheadStyle}
      />
    </svg>
  );
};

// =============================================================================
// CONTACT ARROW - Center, spirals down toward button below
// ViewBox: 80×120, starts near top (label area), ends pointing down at button
// =============================================================================
export const ContactArrow = ({ isVisible, delay = 400, curveOffset, controlsStore, labelElement, buttonElement, containerElement, effectsConfig }: ArrowProps) => {
  const controls = useContactArrowControls(controlsStore);
  const { endYOffset } = useArrowEndControls(controlsStore);
  const { contactStartX, contactStartY, contactOffsetX, contactOffsetY } = useContactStartControls(controlsStore);
  const viewport = useViewportSize();
  const containerRect = useElementRect(containerElement);
  const breakpoint = getBreakpoint(viewport.width);
  const template = controls[breakpoint] as ArrowTemplate;

  const startPoint = useElementPoint(labelElement, { x: contactStartX, y: contactStartY, offsetX: contactOffsetX, offsetY: contactOffsetY }, containerElement);
  const endPoint = useElementPoint(buttonElement, { x: 0.5, y: 0.5, offsetY: endYOffset }, containerElement);
  // IMPORTANT: Use || not ?? here. Container may have height=0 before layout completes.
  // ?? only falls back on null/undefined, but || also falls back on 0.
  const width = containerRect?.width || viewport.width;
  const height = containerRect?.height || viewport.height;

  if (!startPoint || !endPoint || width === 0 || height === 0) {
    return null;
  }

  const pathData = buildMappedPath(template, startPoint, endPoint, curveOffset);
  const pathDelaySeconds = delay / 1000;
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;
  const config = effectsConfig ?? defaultArrowEffectsConfig;
  const filterUrl = getArrowFilterUrl(config);

  return (
    <svg
      className="nav-mobile-contact-arrow"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <motion.path
        d={pathData.d}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={filterUrl}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: pathDelaySeconds }}
      />
      {/* Hash marks - small perpendicular lines */}
      {config.enabled && config.hashEnabled && (
        <HashMarks
          pathData={pathData.d}
          density={config.hashDensity}
          length={config.hashLength}
          spacing={config.hashSpacing}
          opacity={config.hashOpacity}
          isVisible={isVisible}
          delay={delay + 200}
          seed={84}
        />
      )}
      {/* Scribe marks - thin parallel lines */}
      {config.enabled && config.scribeEnabled && (
        <ScribeMarks
          pathData={pathData.d}
          offset={config.scribeOffset}
          strokeWidth={config.scribeWidth}
          dashPattern={config.scribeDash}
          opacity={config.scribeOpacity}
          isVisible={isVisible}
          delay={delay + 100}
        />
      )}
      <AnimatedDot x={pathData.start.x} y={pathData.start.y} isVisible={isVisible} delay={dotDelay} />
      <AnimatedArrowhead
        size="mobile"
        x={pathData.end.x}
        y={pathData.end.y}
        angle={getArrowAngle(pathData.ctrl.x, pathData.ctrl.y, pathData.end.x, pathData.end.y) + pathData.angleOffset}
        isVisible={isVisible}
        delay={arrowheadDelay}
        style={config.arrowheadStyle}
      />
    </svg>
  );
};

// =============================================================================
// GALLERY ARROW - Right side, waves right toward button
// ViewBox: 180×110, starts left, loops/waves, ends pointing right at button
// =============================================================================
export const GalleryArrow = ({ isVisible, delay = 500, curveOffset, controlsStore, labelElement, buttonElement, containerElement, effectsConfig }: ArrowProps) => {
  const controls = useGalleryArrowControls(controlsStore);
  const { endYOffset } = useArrowEndControls(controlsStore);
  const { galleryStartX, galleryStartY, galleryOffsetX, galleryOffsetY } = useGalleryStartControls(controlsStore);
  const viewport = useViewportSize();
  const containerRect = useElementRect(containerElement);
  const breakpoint = getBreakpoint(viewport.width);
  const template = controls[breakpoint] as ArrowTemplate;

  const startPoint = useElementPoint(labelElement, { x: galleryStartX, y: galleryStartY, offsetX: galleryOffsetX, offsetY: galleryOffsetY }, containerElement);
  const endPoint = useElementPoint(buttonElement, { x: 0.5, y: 0.5, offsetY: endYOffset }, containerElement);
  // IMPORTANT: Use || not ?? here. Container may have height=0 before layout completes.
  // ?? only falls back on null/undefined, but || also falls back on 0.
  const width = containerRect?.width || viewport.width;
  const height = containerRect?.height || viewport.height;

  if (!startPoint || !endPoint || width === 0 || height === 0) {
    return null;
  }

  const pathData = buildMappedPath(template, startPoint, endPoint, curveOffset);
  const pathDelaySeconds = delay / 1000;
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;
  const config = effectsConfig ?? defaultArrowEffectsConfig;
  const filterUrl = getArrowFilterUrl(config);

  return (
    <svg
      className="nav-mobile-gallery-arrow"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <motion.path
        d={pathData.d}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={filterUrl}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: pathDelaySeconds }}
      />
      {/* Hash marks - small perpendicular lines */}
      {config.enabled && config.hashEnabled && (
        <HashMarks
          pathData={pathData.d}
          density={config.hashDensity}
          length={config.hashLength}
          spacing={config.hashSpacing}
          opacity={config.hashOpacity}
          isVisible={isVisible}
          delay={delay + 200}
          seed={126}
        />
      )}
      {/* Scribe marks - thin parallel lines */}
      {config.enabled && config.scribeEnabled && (
        <ScribeMarks
          pathData={pathData.d}
          offset={config.scribeOffset}
          strokeWidth={config.scribeWidth}
          dashPattern={config.scribeDash}
          opacity={config.scribeOpacity}
          isVisible={isVisible}
          delay={delay + 100}
        />
      )}
      <AnimatedDot x={pathData.start.x} y={pathData.start.y} isVisible={isVisible} delay={dotDelay} />
      <AnimatedArrowhead
        size="mobile"
        x={pathData.end.x}
        y={pathData.end.y}
        angle={getArrowAngle(pathData.ctrl.x, pathData.ctrl.y, pathData.end.x, pathData.end.y) + pathData.angleOffset}
        isVisible={isVisible}
        delay={arrowheadDelay}
        style={config.arrowheadStyle}
      />
    </svg>
  );
};
