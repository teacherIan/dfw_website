import { useControls } from 'leva';

interface ArrowProps {
  isVisible: boolean;
  delay?: number;
}

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
    startX: { value: 113, min: -100, max: 300, step: 1, label: 'Start X' },
    startY: { value: 124, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: -27, min: -200, max: 300, step: 1, label: 'Control X' },
    controlY: { value: 98, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: 55, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: -30, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const smallPathD = `M ${ethosSmall.startX} ${ethosSmall.startY} Q ${ethosSmall.controlX} ${ethosSmall.controlY}, ${ethosSmall.endX} ${ethosSmall.endY}`;
  const midPathD = `M ${ethosMid.startX} ${ethosMid.startY} Q ${ethosMid.controlX} ${ethosMid.controlY}, ${ethosMid.endX} ${ethosMid.endY}`;
  const tabletPathD = `M ${ethosTablet.startX} ${ethosTablet.startY} Q ${ethosTablet.controlX} ${ethosTablet.controlY}, ${ethosTablet.endX} ${ethosTablet.endY}`;
  const ipadProPathD = `M ${ethosIpadPro.startX} ${ethosIpadPro.startY} Q ${ethosIpadPro.controlX} ${ethosIpadPro.controlY}, ${ethosIpadPro.endX} ${ethosIpadPro.endY}`;

  return (
    <svg
      className="pointer-events-none absolute h-[160px] w-[120px] md:h-[220px] md:w-[165px]"
      style={{
        left: '0%',
        bottom: '8vh',
        opacity: isVisible ? 1 : 0,
        overflow: 'visible',
        transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
      viewBox="0 0 120 160"
      fill="none"
    >
      <defs>
        <marker
          id="arrow-ethos"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L9,3 L0,6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </marker>
        <marker id="dot-ethos" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="2" fill="white" />
        </marker>
      </defs>

      {/* iPad Pro (1000-1199px) */}
      <path
        d={ipadProPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-ethos)"
        markerEnd="url(#arrow-ethos)"
        className="hidden min-[1000px]:max-[1199px]:block"
      />

      {/* Tablet (700-999px) */}
      <path
        d={tabletPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-ethos)"
        markerEnd="url(#arrow-ethos)"
        className="hidden min-[700px]:max-[999px]:block"
      />

      {/* Mid (400-699px) */}
      <path
        d={midPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-ethos)"
        markerEnd="url(#arrow-ethos)"
        className="hidden min-[400px]:max-[699px]:block"
      />

      {/* Small (<400px) */}
      <path
        d={smallPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-ethos)"
        markerEnd="url(#arrow-ethos)"
        className="hidden max-[399px]:block"
      />
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
    startY: { value: 6, min: -100, max: 300, step: 1, label: 'Start Y' },
    controlX: { value: -50, min: -200, max: 300, step: 1, label: 'Control X' },
    controlY: { value: -44, min: -100, max: 300, step: 1, label: 'Control Y' },
    endX: { value: -17, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: 105, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const smallPathD = `M ${contactSmall.startX} ${contactSmall.startY} Q ${contactSmall.controlX} ${contactSmall.controlY}, ${contactSmall.endX} ${contactSmall.endY}`;
  const midPathD = `M ${contactMid.startX} ${contactMid.startY} Q ${contactMid.controlX} ${contactMid.controlY}, ${contactMid.endX} ${contactMid.endY}`;
  const tabletPathD = `M ${contactTablet.startX} ${contactTablet.startY} Q ${contactTablet.controlX} ${contactTablet.controlY}, ${contactTablet.endX} ${contactTablet.endY}`;
  const ipadProPathD = `M ${contactIpadPro.startX} ${contactIpadPro.startY} Q ${contactIpadPro.controlX} ${contactIpadPro.controlY}, ${contactIpadPro.endX} ${contactIpadPro.endY}`;

  return (
    <svg
      className="nav-mobile-contact-arrow h-[120px] w-[80px] md:h-[165px] md:w-[110px]"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
      viewBox="0 0 80 120"
      fill="none"
    >
      <defs>
        <marker
          id="arrow-contact"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L9,3 L0,6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </marker>
        <marker id="dot-contact" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="2" fill="white" />
        </marker>
      </defs>

      {/* iPad Pro (1000-1199px) */}
      <path
        d={ipadProPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 5"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-contact)"
        markerEnd="url(#arrow-contact)"
        className="hidden min-[1000px]:max-[1199px]:block"
      />

      {/* Tablet (700-999px) */}
      <path
        d={tabletPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 5"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-contact)"
        markerEnd="url(#arrow-contact)"
        className="hidden min-[700px]:max-[999px]:block"
      />

      {/* Mid (400-699px) */}
      <path
        d={midPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 5"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-contact)"
        markerEnd="url(#arrow-contact)"
        className="hidden min-[400px]:max-[699px]:block"
      />

      {/* Small (<400px) */}
      <path
        d={smallPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 5"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-contact)"
        markerEnd="url(#arrow-contact)"
        className="hidden max-[399px]:block"
      />
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
    endX: { value: 150, min: -100, max: 300, step: 1, label: 'End X' },
    endY: { value: 15, min: -100, max: 300, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const smallPathD = `M ${gallerySmall.startX} ${gallerySmall.startY} Q ${gallerySmall.controlX} ${gallerySmall.controlY}, ${gallerySmall.endX} ${gallerySmall.endY}`;
  const midPathD = `M ${galleryMid.startX} ${galleryMid.startY} Q ${galleryMid.controlX} ${galleryMid.controlY}, ${galleryMid.endX} ${galleryMid.endY}`;
  const tabletPathD = `M ${galleryTablet.startX} ${galleryTablet.startY} Q ${galleryTablet.controlX} ${galleryTablet.controlY}, ${galleryTablet.endX} ${galleryTablet.endY}`;
  const ipadProPathD = `M ${galleryIpadPro.startX} ${galleryIpadPro.startY} Q ${galleryIpadPro.controlX} ${galleryIpadPro.controlY}, ${galleryIpadPro.endX} ${galleryIpadPro.endY}`;

  return (
    <svg
      className="pointer-events-none absolute h-[110px] w-[180px] md:h-[151px] md:w-[247px]"
      style={{
        right: '2%',
        bottom: '0vh',
        opacity: isVisible ? 1 : 0,
        overflow: 'visible',
        transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
      }}
      viewBox="0 0 180 110"
      fill="none"
    >
      <defs>
        <marker
          id="arrow-gallery"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L9,3 L0,6"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </marker>
        <marker id="dot-gallery" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="2" fill="white" />
        </marker>
      </defs>

      {/* iPad Pro (1000-1199px) */}
      <path
        d={ipadProPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 3"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-gallery)"
        markerEnd="url(#arrow-gallery)"
        className="hidden min-[1000px]:max-[1199px]:block"
      />

      {/* Tablet (700-999px) */}
      <path
        d={tabletPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 3"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-gallery)"
        markerEnd="url(#arrow-gallery)"
        className="hidden min-[700px]:max-[999px]:block"
      />

      {/* Mid (400-699px) */}
      <path
        d={midPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 3"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-gallery)"
        markerEnd="url(#arrow-gallery)"
        className="hidden min-[400px]:max-[699px]:block"
      />

      {/* Small (<400px) */}
      <path
        d={smallPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 3"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-gallery)"
        markerEnd="url(#arrow-gallery)"
        className="hidden max-[399px]:block"
      />
    </svg>
  );
};
