import { useControls } from 'leva';

interface ArrowProps {
  isVisible: boolean;
  delay?: number;
}

export const EthosArrow = ({ isVisible, delay = 300 }: ArrowProps) => {
  const ethos = useControls('📱 Mobile Arrows.Ethos', {
    startX: { value: 35, min: 0, max: 120, step: 1, label: 'Start X' },
    startY: { value: 135, min: 0, max: 160, step: 1, label: 'Start Y' },
    controlX: { value: 0, min: -50, max: 120, step: 1, label: 'Control X' },
    controlY: { value: 70, min: 0, max: 160, step: 1, label: 'Control Y' },
    endX: { value: 30, min: 0, max: 120, step: 1, label: 'End X' },
    endY: { value: 0, min: -50, max: 160, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const ethosSmall = useControls('📱 Mobile Arrows.Ethos Small (<400px)', {
    startX: { value: 100, min: 0, max: 120, step: 1, label: 'Start X' },
    startY: { value: 135, min: 0, max: 160, step: 1, label: 'Start Y' },
    controlX: { value: -40, min: -50, max: 120, step: 1, label: 'Control X' },
    controlY: { value: 70, min: 0, max: 160, step: 1, label: 'Control Y' },
    endX: { value: 30, min: 0, max: 120, step: 1, label: 'End X' },
    endY: { value: 0, min: 0, max: 160, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const ethosMid = useControls('📱 Mobile Arrows.Ethos Mid (400-450px)', {
    startX: { value: 100, min: 0, max: 120, step: 1, label: 'Start X' },
    startY: { value: 135, min: 0, max: 160, step: 1, label: 'Start Y' },
    controlX: { value: -40, min: -50, max: 120, step: 1, label: 'Control X' },
    controlY: { value: 70, min: 0, max: 160, step: 1, label: 'Control Y' },
    endX: { value: 30, min: 0, max: 120, step: 1, label: 'End X' },
    endY: { value: -35, min: -50, max: 160, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const standardPathD = `M ${ethos.startX} ${ethos.startY} Q ${ethos.controlX} ${ethos.controlY}, ${ethos.endX} ${ethos.endY}`;
  const midPathD = `M ${ethosMid.startX} ${ethosMid.startY} Q ${ethosMid.controlX} ${ethosMid.controlY}, ${ethosMid.endX} ${ethosMid.endY}`;
  const smallPathD = `M ${ethosSmall.startX} ${ethosSmall.startY} Q ${ethosSmall.controlX} ${ethosSmall.controlY}, ${ethosSmall.endX} ${ethosSmall.endY}`;

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

      <path
        d={standardPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-ethos)"
        markerEnd="url(#arrow-ethos)"
        className="max-[449px]:hidden"
      />

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
        className="hidden min-[400px]:max-[449px]:block"
      />

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
  const contact = useControls('📱 Mobile Arrows.Contact', {
    startX: { value: 68, min: 0, max: 80, step: 1, label: 'Start X' },
    startY: { value: 55, min: 0, max: 120, step: 1, label: 'Start Y' },
    controlX: { value: 60, min: 0, max: 80, step: 1, label: 'Control X' },
    controlY: { value: 90, min: 0, max: 120, step: 1, label: 'Control Y' },
    endX: { value: 40, min: 0, max: 80, step: 1, label: 'End X' },
    endY: { value: 115, min: -50, max: 120, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const contactSmall = useControls('📱 Mobile Arrows.Contact Small (<400px)', {
    startX: { value: 93, min: 0, max: 150, step: 1, label: 'Start X' },
    startY: { value: 37, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 80, min: -50, max: 150, step: 1, label: 'Control X' },
    controlY: { value: 120, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 15, min: 0, max: 150, step: 1, label: 'End X' },
    endY: { value: 124, min: -50, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const contactMid = useControls('📱 Mobile Arrows.Contact Mid (400-450px)', {
    startX: { value: 100, min: 0, max: 150, step: 1, label: 'Start X' },
    startY: { value: 0, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 149, min: -50, max: 150, step: 1, label: 'Control X' },
    controlY: { value: 200, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 15, min: 0, max: 150, step: 1, label: 'End X' },
    endY: { value: 111, min: -50, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const standardPathD = `M ${contact.startX} ${contact.startY} Q ${contact.controlX} ${contact.controlY}, ${contact.endX} ${contact.endY}`;
  const midPathD = `M ${contactMid.startX} ${contactMid.startY} Q ${contactMid.controlX} ${contactMid.controlY}, ${contactMid.endX} ${contactMid.endY}`;
  const smallPathD = `M ${contactSmall.startX} ${contactSmall.startY} Q ${contactSmall.controlX} ${contactSmall.controlY}, ${contactSmall.endX} ${contactSmall.endY}`;

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

      <path
        d={standardPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="5 5"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-contact)"
        markerEnd="url(#arrow-contact)"
        className="max-[449px]:hidden"
      />

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
        className="hidden min-[400px]:max-[449px]:block"
      />

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
  const gallery = useControls('📱 Mobile Arrows.Gallery', {
    startX: { value: 150, min: 0, max: 180, step: 1, label: 'Start X' },
    startY: { value: 95, min: 0, max: 110, step: 1, label: 'Start Y' },
    controlX: { value: 185, min: 0, max: 220, step: 1, label: 'Control X' },
    controlY: { value: 60, min: 0, max: 110, step: 1, label: 'Control Y' },
    endX: { value: 170, min: 0, max: 180, step: 1, label: 'End X' },
    endY: { value: 5, min: 0, max: 110, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const gallerySmall = useControls('📱 Mobile Arrows.Gallery Small (<400px)', {
    startX: { value: 92, min: 0, max: 250, step: 1, label: 'Start X' },
    startY: { value: 100, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 220, min: 0, max: 300, step: 1, label: 'Control X' },
    controlY: { value: 110, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 145, min: 0, max: 250, step: 1, label: 'End X' },
    endY: { value: 15, min: 0, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const galleryMid = useControls('📱 Mobile Arrows.Gallery Mid (400-450px)', {
    startX: { value: 92, min: 0, max: 250, step: 1, label: 'Start X' },
    startY: { value: 100, min: 0, max: 200, step: 1, label: 'Start Y' },
    controlX: { value: 220, min: 0, max: 300, step: 1, label: 'Control X' },
    controlY: { value: 110, min: 0, max: 200, step: 1, label: 'Control Y' },
    endX: { value: 145, min: 0, max: 250, step: 1, label: 'End X' },
    endY: { value: 15, min: 0, max: 200, step: 1, label: 'End Y' },
  }, { collapsed: true });

  const standardPathD = `M ${gallery.startX} ${gallery.startY} Q ${gallery.controlX} ${gallery.controlY}, ${gallery.endX} ${gallery.endY}`;
  const midPathD = `M ${galleryMid.startX} ${galleryMid.startY} Q ${galleryMid.controlX} ${galleryMid.controlY}, ${galleryMid.endX} ${galleryMid.endY}`;
  const smallPathD = `M ${gallerySmall.startX} ${gallerySmall.startY} Q ${gallerySmall.controlX} ${gallerySmall.controlY}, ${gallerySmall.endX} ${gallerySmall.endY}`;

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

      <path
        d={standardPathD}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="7 3"
        fill="none"
        filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
        markerStart="url(#dot-gallery)"
        markerEnd="url(#arrow-gallery)"
        className="max-[449px]:hidden"
      />

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
        className="hidden min-[400px]:max-[449px]:block"
      />

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
