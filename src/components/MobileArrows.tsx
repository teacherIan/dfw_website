interface ArrowProps {
  isVisible: boolean;
  delay?: number;
}

export const EthosArrow = ({ isVisible, delay = 300 }: ArrowProps) => (
  <svg
    className="absolute pointer-events-none"
    style={{
      left: '0%',
      bottom: '8vh',
      width: '120px',
      height: '160px',
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
        <path d="M0,0 L9,3 L0,6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </marker>
      <marker
        id="dot-ethos"
        markerWidth="6"
        markerHeight="6"
        refX="3"
        refY="3"
        orient="auto"
      >
        <circle cx="3" cy="3" r="2" fill="white" />
      </marker>
    </defs>

    {/* ETHOS: Restored the "Left Bracket" style.
        Start: Left of 'E'
        End: On the button
    */}
    <path
      d="M 35 135 Q 0 70, 30 0"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="6 4"
      fill="none"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
      markerStart="url(#dot-ethos)"
      markerEnd="url(#arrow-ethos)"
    />
  </svg>
);

export const ContactArrow = ({ isVisible, delay = 400 }: ArrowProps) => (
  <svg
    className="absolute pointer-events-none"
    style={{
      left: '43%',
      bottom: '4vh',
      width: '80px',
      height: '120px',
      opacity: isVisible ? 1 : 0,
      overflow: 'visible',
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
        <path d="M0,0 L9,3 L0,6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </marker>
      <marker
        id="dot-contact"
        markerWidth="6"
        markerHeight="6"
        refX="3"
        refY="3"
        orient="auto"
      >
        <circle cx="3" cy="3" r="2" fill="white" />
      </marker>
    </defs>

    {/* CONTACT FIX:
        Start (M 68 55): Moved to the RIGHT (under the second 'c').
        End (40 115): Remains on the center button.
        Control (Q 60 90): Angles the line back towards the left.
    */}
    <path
      d="M 68 55 Q 60 90, 40 115"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="5 5"
      fill="none"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
      markerStart="url(#dot-contact)"
      markerEnd="url(#arrow-contact)"
    />
  </svg>
);

export const GalleryArrow = ({ isVisible, delay = 500 }: ArrowProps) => (
  <svg
    className="absolute pointer-events-none"
    style={{
      right: '2%',
      bottom: '0vh',
      width: '180px',
      height: '110px',
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
        <path d="M0,0 L9,3 L0,6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </marker>
      <marker
        id="dot-gallery"
        markerWidth="6"
        markerHeight="6"
        refX="3"
        refY="3"
        orient="auto"
      >
        <circle cx="3" cy="3" r="2" fill="white" />
      </marker>
    </defs>

    {/* GALLERY: Stays exactly as is */}
    <path
      d="M 150 95 Q 185 60, 170 5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="7 3"
      fill="none"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
      markerStart="url(#dot-gallery)"
      markerEnd="url(#arrow-gallery)"
    />
  </svg>
);