const OverlayHUD = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div className="gallery-button-wrapper absolute bottom-[-2vw] right-[-3vw] sm:bottom-[-1.5vw] sm:right-[-2.5vw] lg:bottom-[-1vw] lg:right-[-2vw]">
        <button
          type="button"
          className="gallery-button pointer-events-auto"
          aria-label="Open gallery mock-up"
        >
          <span className="gallery-button__grain" aria-hidden />
          <span className="gallery-button__scribe gallery-button__scribe--arc" aria-hidden />
          <span className="gallery-button__scribe gallery-button__scribe--tick" aria-hidden />
          <span className="sr-only">View gallery</span>
        </button>
      </div>

      <div className="gallery-note absolute bottom-24 right-16 sm:right-24 md:bottom-34 md:right-36 text-white flex flex-col items-end gap-3">
        <span className="gallery-note__label font-cursive text-3xl sm:text-[3rem] leading-none">
          Gallery
        </span>
        <svg
          className="gallery-arrow"
          viewBox="0 0 220 170"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 20C65 25 110 70 135 110C155 144 185 155 210 145"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 10"
          />
          <path
            d="M198 132L214 153"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M196 151L215 151"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default OverlayHUD;
