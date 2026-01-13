import clsx from 'clsx';

interface AnimationDebugProps {
  selectedType: number | null;
  onSelect: (type: number | null) => void;
}

const animations = [
  { id: 1, label: 'Gust (Ethos)' },
  { id: 2, label: 'Sonic (Contact)' },
  { id: 3, label: 'Cosmic (Gallery)' },
  { id: 4, label: 'Pond Ripple' },
  { id: 5, label: 'Exploded View' },
  { id: 6, label: 'Sawdust Drift' },
  { id: 7, label: 'Physics Explosion' },
];

const AnimationDebug = ({ selectedType, onSelect }: AnimationDebugProps) => {
  return (
    <div className="absolute bottom-8 left-8 z-50 flex flex-col gap-2 p-4 bg-black/30 backdrop-blur-md rounded-xl border border-white/10 pointer-events-auto">
      <h3 className="text-sm font-bold text-white/80 mb-2 uppercase tracking-wider">
        Exit Animation Override
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelect(null)}
          className={clsx(
            'px-3 py-1.5 text-xs rounded-md transition-all duration-200 border',
            selectedType === null
              ? 'bg-white text-black border-white font-bold'
              : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'
          )}
        >
          Default (Per Scene)
        </button>
        {animations.map((anim) => (
          <button
            key={anim.id}
            onClick={() => onSelect(anim.id)}
            className={clsx(
              'px-3 py-1.5 text-xs rounded-md transition-all duration-200 border text-left',
              selectedType === anim.id
                ? 'bg-white text-black border-white font-bold'
                : 'bg-transparent text-white/70 border-white/20 hover:bg-white/10'
            )}
          >
            {anim.id}. {anim.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnimationDebug;
