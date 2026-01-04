interface ArrowProps {
  className?: string;
}

// SHARED MARKER DEFINITION (You can keep this in a separate file or define in each if needed)
// Ideally, put this inside your main <svg> or repeating it here is fine for now.
const DesktopArrowMarker = ({ id }: { id: string }) => (
  <defs>
    <marker
      id={id}
      markerWidth="10"
      markerHeight="10"
      refX="9"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L9,3 L0,6" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </marker>
  </defs>
);

// 1. LOOP ARROW (Top)
export const LoopArrow = ({ className = "nav-arrow" }: ArrowProps) => (
  <svg
    className={className}
    viewBox="0 0 60 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible' }}
  >
    <DesktopArrowMarker id="desktop-arrow-loop" />
    
    <path
      /* FIX: The last 'C' command now ends with "65 25, 76 25".
         Since both Y values are 25, the line is perfectly flat at the end.
      */
      d="M2 25
         C 10 25, 14 15, 20 12
         C 26 9, 30 18, 27 24
         C 24 30, 18 27, 21 21
         C 24 15, 34 12, 44 16
         C 50 18, 55 25, 76 25"
         
      stroke="white"
      strokeWidth="1" 
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="6 4"
      fill="none"
      opacity="0.95"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      markerEnd="url(#desktop-arrow-loop)"
      
    />
  </svg>
);

// 2. SPIRAL ARROW (Middle)
export const SpiralArrow = ({ className = "nav-arrow" }: ArrowProps) => (
  <svg
    className={className}
    viewBox="0 0 60 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible' }}
  >
    <DesktopArrowMarker id="desktop-arrow-spiral" />

    <path
      /* FIX: Extended the spiral but forced the landing.
         Changed end coordinates to flatten out at y=25, x=76
      */
      d="M5 25
         C 12 35, 22 38, 30 32
         C 38 26, 35 18, 28 18
         C 21 18, 20 25, 26 28
         C 32 31, 42 28, 50 25
         C 55 24, 60 25, 76 25"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="6 4"
      fill="none"
      opacity="0.95"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      markerEnd="url(#desktop-arrow-spiral)"
    />
  </svg>
);

// 3. WAVE ARROW (Bottom)
export const WaveArrow = ({ className = "nav-arrow" }: ArrowProps) => (
  <svg
    className={className}
    viewBox="0 0 60 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible' }}
  >
    <DesktopArrowMarker id="desktop-arrow-wave" />

    <path
      /* FIX: This was the tricky one. It was swooping down steeply.
         I changed the control points to swoop down earlier, then level off.
         Ends flat at 76, 25.
      */
      d="M5 25
         C 15 15, 25 35, 35 25
         C 45 15, 55 25, 76 25"
      stroke="white"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="6 4"
      fill="none"
      opacity="0.95"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))"
      markerEnd="url(#desktop-arrow-wave)"
    />
  </svg>
);