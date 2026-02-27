import { useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useControls, folder } from 'leva';
import { AnimatedArrowhead, AnimatedDot } from './ArrowComponents';
import { useEthosArrowControls, useContactArrowControls, useGalleryArrowControls } from '../../hooks/useMobileArrowControls';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Detect Safari/iOS for browser-specific Y offset
// WebKit renders strokeLinecap="round" differently, requiring a different offset
const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent);
const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const defaultCenterYOffset = isIOS || isSafari ? -3 : -5;

// Shared Leva control for arrow targeting offset
const useArrowTargetingControls = (controlsStore?: LevaStore) => {
  return useControls({
    '🎯 Arrow Targeting': folder({
      centerYOffset: { value: defaultCenterYOffset, min: -50, max: 50, step: 1, label: 'Y Offset (px)' },
    }, { collapsed: false }),
  }, { store: controlsStore });
};

interface ViewportSize {
  width: number;
  height: number;
}

const useViewportSize = (): ViewportSize => {
  const [size, setSize] = useState<ViewportSize>({ width: 0, height: 0 });

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
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (!element) {
      return;
    }

    const update = () => {
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        return;
      }

      let x = rect.left + rect.width * anchor.x + (anchor.offsetX ?? 0);
      let y = rect.top + rect.height * anchor.y + (anchor.offsetY ?? 0);

      if (originElement) {
        const originRect = originElement.getBoundingClientRect();
        x -= originRect.left;
        y -= originRect.top;
      }
      setPoint((prev) => (prev && prev.x === x && prev.y === y ? prev : { x, y }));
    };

    update();
    const frame = requestAnimationFrame(update);

    const handleViewportChange = () => update();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    window.addEventListener('orientationchange', handleViewportChange);

    const viewport = window.visualViewport;
    viewport?.addEventListener('resize', handleViewportChange);
    viewport?.addEventListener('scroll', handleViewportChange);

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    resizeObserver?.observe(element);
    if (originElement) {
      resizeObserver?.observe(originElement);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.removeEventListener('orientationchange', handleViewportChange);
      viewport?.removeEventListener('resize', handleViewportChange);
      viewport?.removeEventListener('scroll', handleViewportChange);
      resizeObserver?.disconnect();
    };
  }, [element, anchor.x, anchor.y, anchor.offsetX, anchor.offsetY, originElement]);

  return point;
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
export const EthosArrow = ({ isVisible, delay = 300, curveOffset, controlsStore, labelElement, buttonElement, containerElement }: ArrowProps) => {
  const controls = useEthosArrowControls(controlsStore);
  const { centerYOffset } = useArrowTargetingControls(controlsStore);
  const viewport = useViewportSize();
  const containerRect = useElementRect(containerElement);
  const breakpoint = getBreakpoint(viewport.width);
  const template = controls[breakpoint] as ArrowTemplate;

  const startPoint = useElementPoint(labelElement, { x: 1, y: 0.5, offsetX: 6 }, containerElement);
  const endPoint = useElementPoint(buttonElement, { x: 0.5, y: 0.5, offsetY: centerYOffset }, containerElement);
  const width = containerRect?.width ?? viewport.width;
  const height = containerRect?.height ?? viewport.height;

  if (!startPoint || !endPoint || width === 0 || height === 0) {
    return null;
  }

  const pathData = buildMappedPath(template, startPoint, endPoint, curveOffset);
  const pathDelaySeconds = delay / 1000;
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

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
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: pathDelaySeconds }}
      />
      <AnimatedDot x={pathData.start.x} y={pathData.start.y} isVisible={isVisible} delay={dotDelay} />
      <AnimatedArrowhead
        size="mobile"
        x={pathData.end.x}
        y={pathData.end.y}
        angle={getArrowAngle(pathData.ctrl.x, pathData.ctrl.y, pathData.end.x, pathData.end.y) + pathData.angleOffset}
        isVisible={isVisible}
        delay={arrowheadDelay}
      />
    </svg>
  );
};

// =============================================================================
// CONTACT ARROW - Center, spirals down toward button below
// ViewBox: 80×120, starts near top (label area), ends pointing down at button
// =============================================================================
export const ContactArrow = ({ isVisible, delay = 400, curveOffset, controlsStore, labelElement, buttonElement, containerElement }: ArrowProps) => {
  const controls = useContactArrowControls(controlsStore);
  const { centerYOffset } = useArrowTargetingControls(controlsStore);
  const viewport = useViewportSize();
  const containerRect = useElementRect(containerElement);
  const breakpoint = getBreakpoint(viewport.width);
  const template = controls[breakpoint] as ArrowTemplate;

  const startPoint = useElementPoint(labelElement, { x: 0.5, y: 1, offsetY: 6 }, containerElement);
  const endPoint = useElementPoint(buttonElement, { x: 0.5, y: 0.5, offsetY: centerYOffset }, containerElement);
  const width = containerRect?.width ?? viewport.width;
  const height = containerRect?.height ?? viewport.height;

  if (!startPoint || !endPoint || width === 0 || height === 0) {
    return null;
  }

  const pathData = buildMappedPath(template, startPoint, endPoint, curveOffset);
  const pathDelaySeconds = delay / 1000;
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

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
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: pathDelaySeconds }}
      />
      <AnimatedDot x={pathData.start.x} y={pathData.start.y} isVisible={isVisible} delay={dotDelay} />
      <AnimatedArrowhead
        size="mobile"
        x={pathData.end.x}
        y={pathData.end.y}
        angle={getArrowAngle(pathData.ctrl.x, pathData.ctrl.y, pathData.end.x, pathData.end.y) + pathData.angleOffset}
        isVisible={isVisible}
        delay={arrowheadDelay}
      />
    </svg>
  );
};

// =============================================================================
// GALLERY ARROW - Right side, waves right toward button
// ViewBox: 180×110, starts left, loops/waves, ends pointing right at button
// =============================================================================
export const GalleryArrow = ({ isVisible, delay = 500, curveOffset, controlsStore, labelElement, buttonElement, containerElement }: ArrowProps) => {
  const controls = useGalleryArrowControls(controlsStore);
  const { centerYOffset } = useArrowTargetingControls(controlsStore);
  const viewport = useViewportSize();
  const containerRect = useElementRect(containerElement);
  const breakpoint = getBreakpoint(viewport.width);
  const template = controls[breakpoint] as ArrowTemplate;

  const startPoint = useElementPoint(labelElement, { x: 0, y: 0.5, offsetX: -6 }, containerElement);
  const endPoint = useElementPoint(buttonElement, { x: 0.5, y: 0.5, offsetY: centerYOffset }, containerElement);
  const width = containerRect?.width ?? viewport.width;
  const height = containerRect?.height ?? viewport.height;

  if (!startPoint || !endPoint || width === 0 || height === 0) {
    return null;
  }

  const pathData = buildMappedPath(template, startPoint, endPoint, curveOffset);
  const pathDelaySeconds = delay / 1000;
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

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
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: pathDelaySeconds }}
      />
      <AnimatedDot x={pathData.start.x} y={pathData.start.y} isVisible={isVisible} delay={dotDelay} />
      <AnimatedArrowhead
        size="mobile"
        x={pathData.end.x}
        y={pathData.end.y}
        angle={getArrowAngle(pathData.ctrl.x, pathData.ctrl.y, pathData.end.x, pathData.end.y) + pathData.angleOffset}
        isVisible={isVisible}
        delay={arrowheadDelay}
      />
    </svg>
  );
};
