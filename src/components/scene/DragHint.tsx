import { useState, useEffect, useRef } from 'react';

/**
 * DragHint - Shows a brief hand-drag gesture hint on mobile
 * to indicate the 3D model can be rotated by touch.
 * Auto-dismisses after 3 seconds or on first touch.
 * Only shown once per session.
 */
export default function DragHint() {
  const [visible, setVisible] = useState(true);
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) {
      setVisible(false);
      return;
    }
    shownRef.current = true;

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => setVisible(false), 3000);

    // Dismiss on first touch
    const dismiss = () => setVisible(false);
    window.addEventListener('touchstart', dismiss, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('touchstart', dismiss);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '45%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 5,
        opacity: 0,
        animation: 'dragHintFade 3s ease-in-out forwards',
      }}
    >
      {/* Hand icon with drag motion */}
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        style={{
          animation: 'dragHintSlide 1.5s ease-in-out infinite',
          filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
        }}
      >
        {/* Hand shape */}
        <path
          d="M24 8c-1.1 0-2 .9-2 2v14l-2.3-2.3c-.8-.8-2-.8-2.8 0-.8.8-.8 2 0 2.8l7.1 7.1c.4.4.9.6 1.4.6h7.2c1.4 0 2.6-1 2.8-2.4l1.6-8c.3-1.3-.5-2.6-1.8-2.9-.3-.1-.6-.1-.9 0V12c0-1.1-.9-2-2-2s-2 .9-2 2v-2c0-1.1-.9-2-2-2s-2 .9-2 2V10c0-1.1-.9-2-2-2z"
          fill="rgba(245, 235, 220, 0.85)"
          stroke="rgba(107, 94, 79, 0.6)"
          strokeWidth="1.5"
        />
      </svg>

      <style>{`
        @keyframes dragHintFade {
          0% { opacity: 0; }
          10% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes dragHintSlide {
          0%, 100% { transform: translateX(-12px); }
          50% { transform: translateX(12px); }
        }
      `}</style>
    </div>
  );
}
