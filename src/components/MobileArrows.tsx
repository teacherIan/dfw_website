interface ArrowProps {
  isVisible: boolean;
  delay?: number;
}

export const EthosArrow = ({ isVisible, delay = 300 }: ArrowProps) => (
  <svg
    className="absolute pointer-events-none"
    style={{
      left: '3%',
      bottom: '8vh',
      width: '120px',
      height: '160px',
      opacity: isVisible ? 1 : 0,
      transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
    }}
    viewBox="0 0 120 160"
    fill="none"
  >
    {/* Gentle upward curve from Ethos label to button */}
    <path
      d="M15 15
         Q 25 25, 35 40
         Q 50 65, 60 95
         Q 70 125, 75 150"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="4 3"
      opacity="0.95"
      fill="none"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
    />
    {/* Arrowhead angled upward matching curve */}
    <path
      d="M72 145 L75 152 L78 145 M75 152 L70 148"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
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
      transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
    }}
    viewBox="0 0 80 120"
    fill="none"
  >
    {/* Straight down, loop at bottom, straight back up to button */}
    <path
      d="M40 10
         L 40 40
         Q 40 50, 35 55
         C 28 62, 22 58, 22 50
         C 22 42, 28 38, 35 45
         Q 38 48, 40 55
         L 40 110"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="4 3"
      opacity="0.95"
      fill="none"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
    />
    {/* Arrowhead pointing straight up */}
    <path
      d="M36 113 L40 118 L44 113 M40 118 L40 112"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity="0.95"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
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
      transition: `opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
    }}
    viewBox="0 0 180 110"
    fill="none"
  >
    {/* Loop around Gallery text, then diagonal path up-right to button */}
    <path
      d="M10 90
         Q 20 85, 30 82
         C 40 79, 45 83, 47 89
         C 49 95, 45 99, 40 98
         C 35 97, 33 91, 37 87
         Q 45 78, 60 65
         Q 85 45, 115 25
         Q 140 10, 165 3"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="4 3"
      opacity="0.95"
      fill="none"
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))"
    />
    {/* Arrowhead angled up-right matching diagonal */}
    <path 
      d="M160 6 L167 2 L163 0 M167 2 L162 5" 
      stroke="white" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill="none" 
      opacity="0.95" 
      filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7))" 
    />
  </svg>
);
