interface TextOverlayProps {
  show: boolean;
}

/**
 * TextOverlay component for displaying the "Doug's Found Wood" title
 * Centered at the bottom of the screen with a writing animation
 * Responsive design for mobile devices
 */
const TextOverlay = ({ show }: TextOverlayProps) => {
  if (!show) return null;

  return (
    <div className="absolute bottom-32 md:bottom-10 left-0 right-0 flex justify-center pointer-events-none select-none overflow-visible">


        <h1 
          className="
  font-cursive
  text-4xl sm:text-5xl md:text-7xl lg:text-8xl
  text-white
  writing-animation
  px-4
  pr-12
  pb-8
  pt-2
  leading-relaxed
  text-center
  whitespace-nowrap
  overflow-visible
  z-40
"
          style={{
            textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            WebkitTextStroke: '1.5px rgba(0, 0, 0, 0.8)',
            paintOrder: 'stroke fill',
          }}
        >
            Doug's Found Wood{'\u00A0'}{'\u00A0'}
        </h1>
    </div>
  );
};

export default TextOverlay;
