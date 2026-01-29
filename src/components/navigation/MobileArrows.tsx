import { useControls } from 'leva';

interface ArrowProps {
  isVisible: boolean;
  delay?: number;
}

// Helper to calculate arrowhead rotation angle for quadratic bezier
// At t=1, tangent direction is from control point to end point
const getArrowAngle = (controlX: number, controlY: number, endX: number, endY: number) => {
  const dx = endX - controlX;
  const dy = endY - controlY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
};

// Reusable animated arrowhead component
const AnimatedArrowhead = ({
  x,
  y,
  angle,
  isVisible,
  delay,
  className,
}: {
  x: number;
  y: number;
  angle: number;
  isVisible: boolean;
  delay: number;
  className?: string;
}) => (
  <g
    transform={`translate(${x}, ${y}) rotate(${angle})`}
    style={{
      opacity: isVisible ? 1 : 0,
      transition: `opacity 0.3s ease-out ${delay}ms`,
    }}
    className={className}
  >
    <path
      d="M-8,-4 L0,0 L-8,4"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
    />
  </g>
);

// Reusable animated dot component
const AnimatedDot = ({
  x,
  y,
  isVisible,
  delay,
  className,
}: {
  x: number;
  y: number;
  isVisible: boolean;
  delay: number;
  className?: string;
}) => (
  <circle
    cx={x}
    cy={y}
    r="3"
    fill="white"
    filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
    style={{
      opacity: isVisible ? 1 : 0,
      transition: `opacity 0.3s ease-out ${delay}ms`,
    }}
    className={className}
  />
);

export const EthosArrow = ({ isVisible, delay = 300 }: ArrowProps) => {
  const ethosSmall = useControls('📱 Mobile Arrows.Ethos Small (<400px)', {
    startX: { value: 100, min: 0, max: 120, step: 1, label: 'Start X' },
    startY: { value: 135, min: 0, max: 160, step: 1, label: 'Start Y' },
    controlX: { value: -40, min: -50, max: 120, step: 1, label: 'Control X' },
    controlY: { value: 70, min: 0, max: 160, step: 1, label: 'Control Y' },
    endX: { value: 30, min: 0, max: 120, step: 1, label: 'End X' },
    endY: { value: 0, min: -50, max: 160, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const ethosMid = useControls('📱 Mobile Arrows.Ethos Mid (400-699px)', {
    startX: { value: 100, min: 0, max: 120, step: 1, label: 'Start X' },
    startY: { value: 135, min: 0, max: 160, step: 1, label: 'Start Y' },
    controlX: { value: -40, min: -50, max: 120, step: 1, label: 'Control X' },
    controlY: { value: 70, min: 0, max: 160, step: 1, label: 'Control Y' },
    endX: { value: 30, min: 0, max: 120, step: 1, label: 'End X' },
    endY: { value: -35, min: -50, max: 160, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const ethosTablet = useControls('📱 Mobile Arrows.Ethos Tablet (700-999px)', {
    startX: { value: 113, min: 0, max: 120, step: 1, label: 'Start X' },
    startY: { value: 124, min: 0, max: 160, step: 1, label: 'Start Y' },
    controlX: { value: -27, min: -50, max: 120, step: 1, label: 'Control X' },
    controlY: { value: 98, min: 0, max: 160, step: 1, label: 'Control Y' },
    endX: { value: 55, min: 0, max: 120, step: 1, label: 'End X' },
    endY: { value: -30, min: -100, max: 160, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const ethosIpadPro = useControls('📱 Mobile Arrows.Ethos iPad Pro (1000-1199px)', {
    startX: { value: 130, min: -100, max: 300, step: 1, label: 'Start X' },
    startY: { value: 124, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: -27, min: -200, max: 300, step: 1, label: 'Control X' },
    controlY: { value: 98, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: 75, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: -80, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const smallPathD = `M ${ethosSmall.startX} ${ethosSmall.startY} Q ${ethosSmall.controlX} ${ethosSmall.controlY}, ${ethosSmall.endX} ${ethosSmall.endY}`;
  const midPathD = `M ${ethosMid.startX} ${ethosMid.startY} Q ${ethosMid.controlX} ${ethosMid.controlY}, ${ethosMid.endX} ${ethosMid.endY}`;
  const tabletPathD = `M ${ethosTablet.startX} ${ethosTablet.startY} Q ${ethosTablet.controlX} ${ethosTablet.controlY}, ${ethosTablet.endX} ${ethosTablet.endY}`;
  const ipadProPathD = `M ${ethosIpadPro.startX} ${ethosIpadPro.startY} Q ${ethosIpadPro.controlX} ${ethosIpadPro.controlY}, ${ethosIpadPro.endX} ${ethosIpadPro.endY}`;

  // Path style for draw animation
  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  // Delays: dot appears with line start, arrowhead appears when line finishes
  const dotDelay = delay;
  const arrowheadDelay = delay + 500; // Appears near end of stroke animation

  return (
    <svg
      className="pointer-events-none absolute h-[160px] w-[120px] md:h-[220px] md:w-[165px]"
      style={{
        left: '0%',
        bottom: '8vh',
        overflow: 'visible',
      }}
      viewBox="0 0 120 160"
      fill="none"
    >
      {/* iPad Pro (1000-1199px) */}
      <g className="hidden min-[1000px]:max-[1199px]:block">
        <path
          d={ipadProPathD}
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
        <AnimatedDot x={ethosIpadPro.startX} y={ethosIpadPro.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={ethosIpadPro.endX}
          y={ethosIpadPro.endY}
          angle={getArrowAngle(ethosIpadPro.controlX, ethosIpadPro.controlY, ethosIpadPro.endX, ethosIpadPro.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Tablet (700-999px) */}
      <g className="hidden min-[700px]:max-[999px]:block">
        <path
          d={tabletPathD}
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
        <AnimatedDot x={ethosTablet.startX} y={ethosTablet.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={ethosTablet.endX}
          y={ethosTablet.endY}
          angle={getArrowAngle(ethosTablet.controlX, ethosTablet.controlY, ethosTablet.endX, ethosTablet.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Mid (400-699px) */}
      <g className="hidden min-[400px]:max-[699px]:block">
        <path
          d={midPathD}
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
        <AnimatedDot x={ethosMid.startX} y={ethosMid.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={ethosMid.endX}
          y={ethosMid.endY}
          angle={getArrowAngle(ethosMid.controlX, ethosMid.controlY, ethosMid.endX, ethosMid.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Small (<400px) */}
      <g className="hidden max-[399px]:block">
        <path
          d={smallPathD}
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
        <AnimatedDot x={ethosSmall.startX} y={ethosSmall.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={ethosSmall.endX}
          y={ethosSmall.endY}
          angle={getArrowAngle(ethosSmall.controlX, ethosSmall.controlY, ethosSmall.endX, ethosSmall.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>
    </svg>
  );
};

export const ContactArrow = ({ isVisible, delay = 400 }: ArrowProps) => {
  const contactSmall = useControls('📱 Mobile Arrows.Contact Small (<400px)', {
    startX: { value: 93, min: 0, max: 150, step: 1, label: 'Start X' },
    startY: { value: 37, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 80, min: -50, max: 150, step: 1, label: 'Control X' },
    controlY: { value: 120, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 15, min: 0, max: 150, step: 1, label: 'End X' },
    endY: { value: 124, min: -50, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const contactMid = useControls('📱 Mobile Arrows.Contact Mid (400-699px)', {
    startX: { value: 100, min: 0, max: 150, step: 1, label: 'Start X' },
    startY: { value: 0, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 149, min: -50, max: 150, step: 1, label: 'Control X' },
    controlY: { value: 200, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 15, min: 0, max: 150, step: 1, label: 'End X' },
    endY: { value: 111, min: -50, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const contactTablet = useControls('📱 Mobile Arrows.Contact Tablet (700-999px)', {
    startX: { value: 150, min: -100, max: 300, step: 1, label: 'Start X' },
    startY: { value: 6, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: -50, min: -200, max: 300, step: 1, label: 'Control X' },
    controlY: { value: -44, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: -17, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: 105, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const contactIpadPro = useControls('📱 Mobile Arrows.Contact iPad Pro (1000-1199px)', {
    startX: { value: 150, min: -100, max: 300, step: 1, label: 'Start X' },
    startY: { value: -10, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: -50, min: -200, max: 300, step: 1, label: 'Control X' },
    controlY: { value: -60, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: -22, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: 105, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const smallPathD = `M ${contactSmall.startX} ${contactSmall.startY} Q ${contactSmall.controlX} ${contactSmall.controlY}, ${contactSmall.endX} ${contactSmall.endY}`;
  const midPathD = `M ${contactMid.startX} ${contactMid.startY} Q ${contactMid.controlX} ${contactMid.controlY}, ${contactMid.endX} ${contactMid.endY}`;
  const tabletPathD = `M ${contactTablet.startX} ${contactTablet.startY} Q ${contactTablet.controlX} ${contactTablet.controlY}, ${contactTablet.endX} ${contactTablet.endY}`;
  const ipadProPathD = `M ${contactIpadPro.startX} ${contactIpadPro.startY} Q ${contactIpadPro.controlX} ${contactIpadPro.controlY}, ${contactIpadPro.endX} ${contactIpadPro.endY}`;

  // Path style for draw animation
  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  // Delays: dot appears with line start, arrowhead appears when line finishes
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

  return (
    <svg
      className="nav-mobile-contact-arrow h-[120px] w-[80px] md:h-[165px] md:w-[110px]"
      viewBox="0 0 80 120"
      fill="none"
      style={{ overflow: 'visible' }}
    >
      {/* iPad Pro (1000-1199px) */}
      <g className="hidden min-[1000px]:max-[1199px]:block">
        <path
          d={ipadProPathD}
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
        <AnimatedDot x={contactIpadPro.startX} y={contactIpadPro.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={contactIpadPro.endX}
          y={contactIpadPro.endY}
          angle={getArrowAngle(contactIpadPro.controlX, contactIpadPro.controlY, contactIpadPro.endX, contactIpadPro.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Tablet (700-999px) */}
      <g className="hidden min-[700px]:max-[999px]:block">
        <path
          d={tabletPathD}
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
        <AnimatedDot x={contactTablet.startX} y={contactTablet.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={contactTablet.endX}
          y={contactTablet.endY}
          angle={getArrowAngle(contactTablet.controlX, contactTablet.controlY, contactTablet.endX, contactTablet.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Mid (400-699px) */}
      <g className="hidden min-[400px]:max-[699px]:block">
        <path
          d={midPathD}
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
        <AnimatedDot x={contactMid.startX} y={contactMid.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={contactMid.endX}
          y={contactMid.endY}
          angle={getArrowAngle(contactMid.controlX, contactMid.controlY, contactMid.endX, contactMid.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Small (<400px) */}
      <g className="hidden max-[399px]:block">
        <path
          d={smallPathD}
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
        <AnimatedDot x={contactSmall.startX} y={contactSmall.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={contactSmall.endX}
          y={contactSmall.endY}
          angle={getArrowAngle(contactSmall.controlX, contactSmall.controlY, contactSmall.endX, contactSmall.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>
    </svg>
  );
};

export const GalleryArrow = ({ isVisible, delay = 500 }: ArrowProps) => {
  const gallerySmall = useControls('📱 Mobile Arrows.Gallery Small (<400px)', {
    startX: { value: 92, min: 0, max: 250, step: 1, label: 'Start X' },
    startY: { value: 100, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 220, min: 0, max: 300, step: 1, label: 'Control X' },
    controlY: { value: 110, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 145, min: 0, max: 250, step: 1, label: 'End X' },
    endY: { value: 15, min: 0, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const galleryMid = useControls('📱 Mobile Arrows.Gallery Mid (400-699px)', {
    startX: { value: 92, min: 0, max: 250, step: 1, label: 'Start X' },
    startY: { value: 100, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 220, min: 0, max: 300, step: 1, label: 'Control X' },
    controlY: { value: 110, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 145, min: 0, max: 250, step: 1, label: 'End X' },
    endY: { value: 15, min: 0, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const galleryTablet = useControls('📱 Mobile Arrows.Gallery Tablet (700-999px)', {
    startX: { value: -68, min: -100, max: 300, step: 1, label: 'Start X' },
    startY: { value: 95, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: 203, min: -200, max: 400, step: 1, label: 'Control X' },
    controlY: { value: 137, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: 150, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: 15, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const galleryIpadPro = useControls('📱 Mobile Arrows.Gallery iPad Pro (1000-1199px)', {
    startX: { value: -68, min: -100, max: 300, step: 1, label: 'Start X' },
    startY: { value: 95, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: 203, min: -200, max: 400, step: 1, label: 'Control X' },
    controlY: { value: 137, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: 140, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: 0, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const smallPathD = `M ${gallerySmall.startX} ${gallerySmall.startY} Q ${gallerySmall.controlX} ${gallerySmall.controlY}, ${gallerySmall.endX} ${gallerySmall.endY}`;
  const midPathD = `M ${galleryMid.startX} ${galleryMid.startY} Q ${galleryMid.controlX} ${galleryMid.controlY}, ${galleryMid.endX} ${galleryMid.endY}`;
  const tabletPathD = `M ${galleryTablet.startX} ${galleryTablet.startY} Q ${galleryTablet.controlX} ${galleryTablet.controlY}, ${galleryTablet.endX} ${galleryTablet.endY}`;
  const ipadProPathD = `M ${galleryIpadPro.startX} ${galleryIpadPro.startY} Q ${galleryIpadPro.controlX} ${galleryIpadPro.controlY}, ${galleryIpadPro.endX} ${galleryIpadPro.endY}`;

  // Path style for draw animation
  const pathStyle = {
    strokeDashoffset: isVisible ? 0 : 1,
    transition: `stroke-dashoffset 0.6s ease-out ${delay}ms`,
  };

  // Delays: dot appears with line start, arrowhead appears when line finishes
  const dotDelay = delay;
  const arrowheadDelay = delay + 500;

  return (
    <svg
      className="pointer-events-none absolute h-[110px] w-[180px] md:h-[151px] md:w-[247px]"
      style={{
        right: '2%',
        bottom: '0vh',
        overflow: 'visible',
      }}
      viewBox="0 0 180 110"
      fill="none"
    >
      {/* iPad Pro (1000-1199px) */}
      <g className="hidden min-[1000px]:max-[1199px]:block">
        <path
          d={ipadProPathD}
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
        <AnimatedDot x={galleryIpadPro.startX} y={galleryIpadPro.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={galleryIpadPro.endX}
          y={galleryIpadPro.endY}
          angle={getArrowAngle(galleryIpadPro.controlX, galleryIpadPro.controlY, galleryIpadPro.endX, galleryIpadPro.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Tablet (700-999px) */}
      <g className="hidden min-[700px]:max-[999px]:block">
        <path
          d={tabletPathD}
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
        <AnimatedDot x={galleryTablet.startX} y={galleryTablet.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={galleryTablet.endX}
          y={galleryTablet.endY}
          angle={getArrowAngle(galleryTablet.controlX, galleryTablet.controlY, galleryTablet.endX, galleryTablet.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Mid (400-699px) */}
      <g className="hidden min-[400px]:max-[699px]:block">
        <path
          d={midPathD}
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
        <AnimatedDot x={galleryMid.startX} y={galleryMid.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={galleryMid.endX}
          y={galleryMid.endY}
          angle={getArrowAngle(galleryMid.controlX, galleryMid.controlY, galleryMid.endX, galleryMid.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>

      {/* Small (<400px) */}
      <g className="hidden max-[399px]:block">
        <path
          d={smallPathD}
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
        <AnimatedDot x={gallerySmall.startX} y={gallerySmall.startY} isVisible={isVisible} delay={dotDelay} />
        <AnimatedArrowhead
          x={gallerySmall.endX}
          y={gallerySmall.endY}
          angle={getArrowAngle(gallerySmall.controlX, gallerySmall.controlY, gallerySmall.endX, gallerySmall.endY)}
          isVisible={isVisible}
          delay={arrowheadDelay}
        />
      </g>
    </svg>
  );
};
