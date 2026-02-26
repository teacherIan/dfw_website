import { useRef, useState, useEffect, useCallback } from 'react';
import { useControls, folder } from 'leva';
import { AnimatedArrowhead, AnimatedDot } from './ArrowComponents';
import { useEthosArrowControls, useContactArrowControls, useGalleryArrowControls } from '../../hooks/useMobileArrowControls';

type LevaStore = ReturnType<typeof import('leva').useCreateStore>;

// Detect Safari/iOS for browser-specific Y offset
// Safari renders strokeLinecap="round" differently, requiring a different offset
const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const defaultCenterYOffset = isSafari ? -3 : -5;

// Shared Leva control for arrow targeting offset
const useArrowTargetingControls = (controlsStore?: LevaStore) => {
  return useControls({
    '🎯 Arrow Targeting': folder({
      centerYOffset: { value: defaultCenterYOffset, min: -50, max: 50, step: 1, label: 'Y Offset (px)' },
    }, { collapsed: false }),
  }, { store: controlsStore });
};

// Button position in CSS units (passed from MobileNavLayout)
interface ButtonPosition {
  left?: number;  // percentage of viewport width
  right?: number; // percentage of viewport width (for gallery)
  bottom: number; // vh units
  isCentered?: boolean; // true for contact (has translateX(-50%))
}

/**
 * Hook to calculate arrow endpoint from known CSS positions
 * No DOM queries needed - uses viewport dimensions + CSS values
 */
const useCalculatedEndpoint = (
  svgRef: React.RefObject<SVGSVGElement | null>,
  buttonPos: ButtonPosition,
  viewBox: { width: number; height: number },
  buttonSize: number, // pixels
  marginX: number, // horizontal margin offset in pixels
  marginY: number = 0, // vertical margin offset in pixels (for contact)
  centerYOffset: number = 0 // visual adjustment for crosshair targeting
) => {
  const [endpoint, setEndpoint] = useState<{ x: number; y: number } | null>(null);

  // Extract primitives to avoid object reference issues in dependencies
  const buttonLeft = buttonPos.left;
  const buttonRight = buttonPos.right;
  const buttonBottom = buttonPos.bottom;
  const isCentered = buttonPos.isCentered ?? false;
  const viewBoxWidth = viewBox.width;
  const viewBoxHeight = viewBox.height;

  useEffect(() => {
    const calculate = () => {
      const svg = svgRef.current;
      if (!svg) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const svgRect = svg.getBoundingClientRect();

      if (svgRect.width === 0 || svgRect.height === 0) return;

      // Calculate button center in screen coords (from top-left)
      let buttonCenterX: number;
      if (buttonLeft !== undefined) {
        if (isCentered) {
          // Contact: left% with translateX(-50%), so center is at exactly left%
          buttonCenterX = (buttonLeft / 100) * vw;
        } else {
          // Ethos: left% + negative margin shifts left
          buttonCenterX = (buttonLeft / 100) * vw + marginX + buttonSize / 2;
        }
      } else {
        // Gallery: right% + negative margin-right shifts RIGHT (adds to X)
        // right: 17% means right edge at 83% of vw, then margin pushes it further right
        const rightEdge = vw - (buttonRight! / 100) * vw;
        buttonCenterX = rightEdge + Math.abs(marginX) - buttonSize / 2;
      }

      // Button Y: bottom in vh, with optional margin-bottom offset
      // marginY is negative for margin-bottom (shifts down = higher screen Y), so we SUBTRACT it
      // centerYOffset allows fine-tuning to point at crosshair center
      const buttonCenterY = vh - (buttonBottom / 100) * vh - marginY - buttonSize / 2 + centerYOffset;

      // Convert to viewBox coordinates relative to SVG position
      const scaleX = viewBoxWidth / svgRect.width;
      const scaleY = viewBoxHeight / svgRect.height;

      setEndpoint({
        x: (buttonCenterX - svgRect.left) * scaleX,
        y: (buttonCenterY - svgRect.top) * scaleY,
      });
    };

    // Calculate immediately and on resize
    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [svgRef, buttonLeft, buttonRight, buttonBottom, isCentered, viewBoxWidth, viewBoxHeight, buttonSize, marginX, marginY, centerYOffset]);

  return endpoint;
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
  // Button position for dynamic endpoint calculation
  buttonPosition?: ButtonPosition;
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

// =============================================================================
// ETHOS ARROW - Left side, loops up-left toward button
// ViewBox: 120×160, starts near label (bottom-right), ends pointing at button (upper-left)
// =============================================================================
export const EthosArrow = ({ isVisible, delay = 300, springTransform, curveOffset, controlsStore, buttonPosition }: ArrowProps) => {
  // Leva controls for live editing
  const controls = useEthosArrowControls(controlsStore);
  const { centerYOffset } = useArrowTargetingControls(controlsStore);

  // Ref for dynamic endpoint calculation
  const svgRef = useRef<SVGSVGElement>(null);
  const viewBox = { width: 120, height: 160 };

  // Calculate endpoint from button position (no DOM queries)
  // Ethos: left-positioned with margin-left: -56px
  const dynamicEndpoint = useCalculatedEndpoint(
    svgRef,
    buttonPosition ?? { left: 14, bottom: 26 },
    viewBox,
    80,  // button size in pixels
    -56, // marginX: -ml-14 shifts left
    0,   // marginY: none
    centerYOffset // visual adjustment for crosshair targeting
  );

  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

  // Curve offset for spring animation
  const ox = curveOffset?.x ?? 0;
  const oy = curveOffset?.y ?? 0;

  const svgTransform = springTransform || curveOffset
    ? `translate(${(springTransform?.translateX ?? 0) + ox * 0.05}px, ${(springTransform?.translateY ?? 0) + oy * 0.08}px) rotate(${(springTransform?.rotate ?? 0) + ox * 0.1}deg) skewY(${oy * 0.15}deg)`
    : undefined;

  // For Mid breakpoint, use dynamic endpoint if available
  const midEndX = dynamicEndpoint?.x ?? controls.mid.endX;
  const midEndY = dynamicEndpoint?.y ?? controls.mid.endY;
  // Calculate control point to make arrow point at button: ctrl = 2*end - button
  // Since end IS the button, we use the original control point direction
  const midCtrlX = controls.mid.ctrlX;
  const midCtrlY = controls.mid.ctrlY;

  // Use Leva controls for path data (Mid uses dynamic endpoint)
  const pathData = {
    small: {
      d: `M ${controls.small.startX} ${controls.small.startY} Q ${controls.small.ctrlX} ${controls.small.ctrlY}, ${controls.small.endX} ${controls.small.endY}`,
      startX: controls.small.startX, startY: controls.small.startY,
      lastCtrlX: controls.small.ctrlX, lastCtrlY: controls.small.ctrlY,
      endX: controls.small.endX, endY: controls.small.endY,
      angleOffset: controls.small.angleOffset,
    },
    mid: {
      d: `M ${controls.mid.startX} ${controls.mid.startY} Q ${midCtrlX} ${midCtrlY}, ${midEndX} ${midEndY}`,
      startX: controls.mid.startX, startY: controls.mid.startY,
      lastCtrlX: midCtrlX, lastCtrlY: midCtrlY,
      endX: midEndX, endY: midEndY,
      angleOffset: controls.mid.angleOffset,
    },
    tablet: {
      d: `M ${controls.tablet.startX} ${controls.tablet.startY} Q ${controls.tablet.ctrlX} ${controls.tablet.ctrlY}, ${controls.tablet.endX} ${controls.tablet.endY}`,
      startX: controls.tablet.startX, startY: controls.tablet.startY,
      lastCtrlX: controls.tablet.ctrlX, lastCtrlY: controls.tablet.ctrlY,
      endX: controls.tablet.endX, endY: controls.tablet.endY,
      angleOffset: controls.tablet.angleOffset,
    },
    ipadPro: {
      d: `M ${controls.ipadPro.startX} ${controls.ipadPro.startY} Q ${controls.ipadPro.ctrlX} ${controls.ipadPro.ctrlY}, ${controls.ipadPro.endX} ${controls.ipadPro.endY}`,
      startX: controls.ipadPro.startX, startY: controls.ipadPro.startY,
      lastCtrlX: controls.ipadPro.ctrlX, lastCtrlY: controls.ipadPro.ctrlY,
      endX: controls.ipadPro.endX, endY: controls.ipadPro.endY,
      angleOffset: controls.ipadPro.angleOffset,
    },
  };

  return (
    <svg
      ref={svgRef}
      className="nav-mobile-ethos-arrow h-[160px] w-[120px] md:h-[220px] md:w-[165px]"
      style={{
        transform: svgTransform,
        transformOrigin: 'bottom left',
        overflow: 'visible',
      }}
      viewBox="0 0 120 160"
      fill="none"
    >
      {/* iPad Pro (1000-1199px) */}
      <g className="hidden min-[1000px]:max-[1199px]:block">
        <path
          d={pathData.ipadPro.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.ipadPro.startX} y={pathData.ipadPro.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.ipadPro.endX}
          y={pathData.ipadPro.endY}
          angle={getArrowAngle(pathData.ipadPro.lastCtrlX, pathData.ipadPro.lastCtrlY, pathData.ipadPro.endX, pathData.ipadPro.endY) + pathData.ipadPro.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Tablet (700-999px) */}
      <g className="hidden min-[700px]:max-[999px]:block">
        <path
          d={pathData.tablet.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.tablet.startX} y={pathData.tablet.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.tablet.endX}
          y={pathData.tablet.endY}
          angle={getArrowAngle(pathData.tablet.lastCtrlX, pathData.tablet.lastCtrlY, pathData.tablet.endX, pathData.tablet.endY) + pathData.tablet.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Mid (400-699px) */}
      <g className="hidden min-[400px]:max-[699px]:block">
        <path
          d={pathData.mid.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.mid.startX} y={pathData.mid.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.mid.endX}
          y={pathData.mid.endY}
          angle={getArrowAngle(pathData.mid.lastCtrlX, pathData.mid.lastCtrlY, pathData.mid.endX, pathData.mid.endY) + pathData.mid.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Small (<400px) */}
      <g className="hidden max-[399px]:block">
        <path
          d={pathData.small.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.small.startX} y={pathData.small.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.small.endX}
          y={pathData.small.endY}
          angle={getArrowAngle(pathData.small.lastCtrlX, pathData.small.lastCtrlY, pathData.small.endX, pathData.small.endY) + pathData.small.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>
    </svg>
  );
};

// =============================================================================
// CONTACT ARROW - Center, spirals down toward button below
// ViewBox: 80×120, starts near top (label area), ends pointing down at button
// =============================================================================
export const ContactArrow = ({ isVisible, delay = 400, springTransform, curveOffset, controlsStore, buttonPosition }: ArrowProps) => {
  // Leva controls for live editing
  const controls = useContactArrowControls(controlsStore);
  const { centerYOffset } = useArrowTargetingControls(controlsStore);

  // Ref for dynamic endpoint calculation
  const svgRef = useRef<SVGSVGElement>(null);
  const viewBox = { width: 80, height: 120 };

  // Calculate endpoint from button position (no DOM queries)
  // Contact: centered with translateX(-50%) and margin-bottom: -56px
  const dynamicEndpoint = useCalculatedEndpoint(
    svgRef,
    buttonPosition ?? { left: 45, bottom: 7, isCentered: true },
    viewBox,
    80, // button size in pixels
    0,  // marginX: none (centered)
    -56, // marginY: -mb-14 shifts down
    centerYOffset // visual adjustment for crosshair targeting
  );

  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

  const ox = curveOffset?.x ?? 0;
  const oy = curveOffset?.y ?? 0;

  const svgTransform = springTransform || curveOffset
    ? `translate(${(springTransform?.translateX ?? 0) + ox * 0.06}px, ${(springTransform?.translateY ?? 0) + oy * 0.05}px) rotate(${(springTransform?.rotate ?? 0) - ox * 0.12}deg) skewX(${ox * 0.18}deg)`
    : undefined;

  // For Mid breakpoint, use dynamic endpoint if available
  const midEndX = dynamicEndpoint?.x ?? controls.mid.endX;
  const midEndY = dynamicEndpoint?.y ?? controls.mid.endY;
  const midCtrlX = controls.mid.ctrlX;
  const midCtrlY = controls.mid.ctrlY;

  // Use Leva controls for path data (Mid uses dynamic endpoint)
  const pathData = {
    small: {
      d: `M ${controls.small.startX} ${controls.small.startY} Q ${controls.small.ctrlX} ${controls.small.ctrlY}, ${controls.small.endX} ${controls.small.endY}`,
      startX: controls.small.startX, startY: controls.small.startY,
      lastCtrlX: controls.small.ctrlX, lastCtrlY: controls.small.ctrlY,
      endX: controls.small.endX, endY: controls.small.endY,
      angleOffset: controls.small.angleOffset,
    },
    mid: {
      d: `M ${controls.mid.startX} ${controls.mid.startY} Q ${midCtrlX} ${midCtrlY}, ${midEndX} ${midEndY}`,
      startX: controls.mid.startX, startY: controls.mid.startY,
      lastCtrlX: midCtrlX, lastCtrlY: midCtrlY,
      endX: midEndX, endY: midEndY,
      angleOffset: controls.mid.angleOffset,
    },
    tablet: {
      d: `M ${controls.tablet.startX} ${controls.tablet.startY} Q ${controls.tablet.ctrlX} ${controls.tablet.ctrlY}, ${controls.tablet.endX} ${controls.tablet.endY}`,
      startX: controls.tablet.startX, startY: controls.tablet.startY,
      lastCtrlX: controls.tablet.ctrlX, lastCtrlY: controls.tablet.ctrlY,
      endX: controls.tablet.endX, endY: controls.tablet.endY,
      angleOffset: controls.tablet.angleOffset,
    },
    ipadPro: {
      d: `M ${controls.ipadPro.startX} ${controls.ipadPro.startY} Q ${controls.ipadPro.ctrlX} ${controls.ipadPro.ctrlY}, ${controls.ipadPro.endX} ${controls.ipadPro.endY}`,
      startX: controls.ipadPro.startX, startY: controls.ipadPro.startY,
      lastCtrlX: controls.ipadPro.ctrlX, lastCtrlY: controls.ipadPro.ctrlY,
      endX: controls.ipadPro.endX, endY: controls.ipadPro.endY,
      angleOffset: controls.ipadPro.angleOffset,
    },
  };

  return (
    <svg
      ref={svgRef}
      className="nav-mobile-contact-arrow h-[120px] w-[80px] md:h-[165px] md:w-[110px]"
      viewBox="0 0 80 120"
      fill="none"
      style={{
        transform: svgTransform,
        transformOrigin: 'top center',
        overflow: 'visible',
      }}
    >
      {/* iPad Pro (1000-1199px) */}
      <g className="hidden min-[1000px]:max-[1199px]:block">
        <path
          d={pathData.ipadPro.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.ipadPro.startX} y={pathData.ipadPro.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.ipadPro.endX}
          y={pathData.ipadPro.endY}
          angle={getArrowAngle(pathData.ipadPro.lastCtrlX, pathData.ipadPro.lastCtrlY, pathData.ipadPro.endX, pathData.ipadPro.endY) + pathData.ipadPro.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Tablet (700-999px) */}
      <g className="hidden min-[700px]:max-[999px]:block">
        <path
          d={pathData.tablet.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.tablet.startX} y={pathData.tablet.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.tablet.endX}
          y={pathData.tablet.endY}
          angle={getArrowAngle(pathData.tablet.lastCtrlX, pathData.tablet.lastCtrlY, pathData.tablet.endX, pathData.tablet.endY) + pathData.tablet.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Mid (400-699px) */}
      <g className="hidden min-[400px]:max-[699px]:block">
        <path
          d={pathData.mid.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.mid.startX} y={pathData.mid.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.mid.endX}
          y={pathData.mid.endY}
          angle={getArrowAngle(pathData.mid.lastCtrlX, pathData.mid.lastCtrlY, pathData.mid.endX, pathData.mid.endY) + pathData.mid.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Small (<400px) */}
      <g className="hidden max-[399px]:block">
        <path
          d={pathData.small.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.small.startX} y={pathData.small.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.small.endX}
          y={pathData.small.endY}
          angle={getArrowAngle(pathData.small.lastCtrlX, pathData.small.lastCtrlY, pathData.small.endX, pathData.small.endY) + pathData.small.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>
    </svg>
  );
};

// =============================================================================
// GALLERY ARROW - Right side, waves right toward button
// ViewBox: 180×110, starts left, loops/waves, ends pointing right at button
// =============================================================================
export const GalleryArrow = ({ isVisible, delay = 500, springTransform, curveOffset, controlsStore, buttonPosition }: ArrowProps) => {
  // Leva controls for live editing
  const controls = useGalleryArrowControls(controlsStore);
  const { centerYOffset } = useArrowTargetingControls(controlsStore);

  // Ref for dynamic endpoint calculation
  const svgRef = useRef<SVGSVGElement>(null);
  const viewBox = { width: 180, height: 110 };

  // Calculate endpoint from button position (no DOM queries)
  // Gallery: right-positioned with margin-right: -56px (shifts right)
  const dynamicEndpoint = useCalculatedEndpoint(
    svgRef,
    buttonPosition ?? { right: 17, bottom: 8 },
    viewBox,
    80, // button size in pixels
    -56, // marginX: -mr-14 shifts right (handled specially for right-positioned)
    0,   // marginY: none
    centerYOffset // visual adjustment for crosshair targeting
  );

  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

  const ox = curveOffset?.x ?? 0;
  const oy = curveOffset?.y ?? 0;

  const svgTransform = springTransform || curveOffset
    ? `translate(${(springTransform?.translateX ?? 0) + ox * 0.04}px, ${(springTransform?.translateY ?? 0) + oy * 0.06}px) rotate(${(springTransform?.rotate ?? 0) + ox * 0.08}deg) skewY(${-oy * 0.2}deg) scaleX(${1 + Math.abs(ox) * 0.004})`
    : undefined;

  // For Mid breakpoint, use dynamic endpoint if available
  const midEndX = dynamicEndpoint?.x ?? controls.mid.endX;
  const midEndY = dynamicEndpoint?.y ?? controls.mid.endY;
  const midCtrlX = controls.mid.ctrlX;
  const midCtrlY = controls.mid.ctrlY;

  // Use Leva controls for path data (Mid uses dynamic endpoint)
  const pathData = {
    small: {
      d: `M ${controls.small.startX} ${controls.small.startY} Q ${controls.small.ctrlX} ${controls.small.ctrlY}, ${controls.small.endX} ${controls.small.endY}`,
      startX: controls.small.startX, startY: controls.small.startY,
      lastCtrlX: controls.small.ctrlX, lastCtrlY: controls.small.ctrlY,
      endX: controls.small.endX, endY: controls.small.endY,
      angleOffset: controls.small.angleOffset,
    },
    mid: {
      d: `M ${controls.mid.startX} ${controls.mid.startY} Q ${midCtrlX} ${midCtrlY}, ${midEndX} ${midEndY}`,
      startX: controls.mid.startX, startY: controls.mid.startY,
      lastCtrlX: midCtrlX, lastCtrlY: midCtrlY,
      endX: midEndX, endY: midEndY,
      angleOffset: controls.mid.angleOffset,
    },
    tablet: {
      d: `M ${controls.tablet.startX} ${controls.tablet.startY} Q ${controls.tablet.ctrlX} ${controls.tablet.ctrlY}, ${controls.tablet.endX} ${controls.tablet.endY}`,
      startX: controls.tablet.startX, startY: controls.tablet.startY,
      lastCtrlX: controls.tablet.ctrlX, lastCtrlY: controls.tablet.ctrlY,
      endX: controls.tablet.endX, endY: controls.tablet.endY,
      angleOffset: controls.tablet.angleOffset,
    },
    ipadPro: {
      d: `M ${controls.ipadPro.startX} ${controls.ipadPro.startY} Q ${controls.ipadPro.ctrlX} ${controls.ipadPro.ctrlY}, ${controls.ipadPro.endX} ${controls.ipadPro.endY}`,
      startX: controls.ipadPro.startX, startY: controls.ipadPro.startY,
      lastCtrlX: controls.ipadPro.ctrlX, lastCtrlY: controls.ipadPro.ctrlY,
      endX: controls.ipadPro.endX, endY: controls.ipadPro.endY,
      angleOffset: controls.ipadPro.angleOffset,
    },
  };

  return (
    <svg
      ref={svgRef}
      className="nav-mobile-gallery-arrow h-[110px] w-[180px] md:h-[151px] md:w-[247px]"
      style={{
        transform: svgTransform,
        transformOrigin: 'left center',
        overflow: 'visible',
      }}
      viewBox="0 0 180 110"
      fill="none"
    >
      {/* iPad Pro (1000-1199px) */}
      <g className="hidden min-[1000px]:max-[1199px]:block">
        <path
          d={pathData.ipadPro.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.ipadPro.startX} y={pathData.ipadPro.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.ipadPro.endX}
          y={pathData.ipadPro.endY}
          angle={getArrowAngle(pathData.ipadPro.lastCtrlX, pathData.ipadPro.lastCtrlY, pathData.ipadPro.endX, pathData.ipadPro.endY) + pathData.ipadPro.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Tablet (700-999px) */}
      <g className="hidden min-[700px]:max-[999px]:block">
        <path
          d={pathData.tablet.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.tablet.startX} y={pathData.tablet.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.tablet.endX}
          y={pathData.tablet.endY}
          angle={getArrowAngle(pathData.tablet.lastCtrlX, pathData.tablet.lastCtrlY, pathData.tablet.endX, pathData.tablet.endY) + pathData.tablet.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Mid (400-699px) */}
      <g className="hidden min-[400px]:max-[699px]:block">
        <path
          d={pathData.mid.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.mid.startX} y={pathData.mid.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.mid.endX}
          y={pathData.mid.endY}
          angle={getArrowAngle(pathData.mid.lastCtrlX, pathData.mid.lastCtrlY, pathData.mid.endX, pathData.mid.endY) + pathData.mid.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Small (<400px) */}
      <g className="hidden max-[399px]:block">
        <path
          d={pathData.small.d}
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          style={pathStyle}
          fill="none"
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        />
        <AnimatedDot x={pathData.small.startX} y={pathData.small.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          size="mobile"
          x={pathData.small.endX}
          y={pathData.small.endY}
          angle={getArrowAngle(pathData.small.lastCtrlX, pathData.small.lastCtrlY, pathData.small.endX, pathData.small.endY) + pathData.small.angleOffset}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>
    </svg>
  );
};
