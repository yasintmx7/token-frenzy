import { Lock } from 'lucide-react';
import { BLADE_SKINS, type BladeSkin } from '@/lib/bladeSkins';

interface BladeSelectorProps {
  totalScore: number;
  selectedId: string;
  onSelect: (id: string) => void;
}

const BladeSelector = ({ totalScore, selectedId, onSelect }: BladeSelectorProps) => {
  return (
    <div className="w-full max-w-xl sm:max-w-2xl">
      <h3 className="text-xs tracking-[0.3em] text-purple-300/40 uppercase font-display mb-3 text-center">
        Blade Skin
      </h3>
      <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
        {BLADE_SKINS.map((skin) => {
          const unlocked = totalScore >= skin.pointsNeeded;
          const active = selectedId === skin.id;
          return (
            <BladeCard
              key={skin.id}
              skin={skin}
              unlocked={unlocked}
              active={active}
              onSelect={() => unlocked && onSelect(skin.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface BladeCardProps {
  skin: BladeSkin;
  unlocked: boolean;
  active: boolean;
  onSelect: () => void;
}

const BladeCard = ({ skin, unlocked, active, onSelect }: BladeCardProps) => {
  const glowColor = skin.trail.glow.replace('{a}', '0.6');

  return (
    <button
      onClick={onSelect}
      disabled={!unlocked}
      className={`
        relative flex flex-col items-center gap-1 p-2.5 sm:p-3 rounded-xl
        transition-all duration-300 min-w-[72px] sm:min-w-[84px]
        ${unlocked
          ? active
            ? 'bg-white/[0.12] border-2 scale-105 shadow-lg'
            : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:scale-[1.03] cursor-pointer'
          : 'bg-white/[0.02] border border-white/[0.04] opacity-50 cursor-not-allowed'
        }
      `}
      style={{
        borderColor: active && unlocked ? glowColor : undefined,
        boxShadow: active && unlocked ? `0 0 20px ${glowColor}` : undefined,
      }}
    >
      {/* Emoji */}
      <span className="text-xl sm:text-2xl">{skin.emoji}</span>

      {/* Name */}
      <span className={`text-[10px] sm:text-xs font-display font-semibold leading-tight text-center ${
        unlocked ? 'text-white/90' : 'text-white/30'
      }`}>
        {skin.name}
      </span>

      {/* Lock or points */}
      {!unlocked && (
        <div className="flex items-center gap-0.5 text-[9px] text-purple-300/40">
          <Lock className="w-2.5 h-2.5" />
          <span>{skin.pointsNeeded.toLocaleString()}</span>
        </div>
      )}

      {/* Active indicator */}
      {active && unlocked && (
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full"
          style={{ backgroundColor: glowColor }}
        />
      )}
    </button>
  );
};

export default BladeSelector;
