import clsx from 'clsx';

interface BackButtonProps {
  onClick: () => void;
}

/**
 * Simple back button to return to home scene
 * Appears when viewing Ethos, Contact, or Gallery scenes
 */
const BackButton = ({ onClick }: BackButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'fixed top-6 left-6 z-50',
        'px-4 py-2 rounded-full',
        'bg-black/10 backdrop-blur-sm',
        'border border-black/30',
        'text-black font-medium',
        'hover:bg-black/20 transition-colors',
        'flex items-center gap-2'
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
};

export default BackButton;
