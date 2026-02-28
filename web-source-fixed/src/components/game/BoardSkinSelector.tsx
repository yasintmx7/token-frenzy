import { Check, Sparkles, Info } from 'lucide-react';
import { BOARD_THEMES, type BoardTheme } from '@/lib/boardThemes';

interface BoardSkinSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const BoardSkinSelector = ({ selectedId, onSelect }: BoardSkinSelectorProps) => {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Status Info - Compact */}
      <div className="glass-panel py-1.5 px-4 rounded-full flex items-center justify-center gap-2.5 self-center animate-fade-in group hover:bg-white/10 transition-colors border-white/10">
        <Info className="w-3 h-3 text-muted-foreground/60 group-hover:text-blue-400 transition-colors" />
        <p className="text-[9px] text-muted-foreground/80 font-display tracking-[0.15em] uppercase">
          Skins Selection Unlocked
        </p>
      </div>

      {/* Grid Layout - 2 columns on mobile, 3 on wider */}
      <div className="grid grid-cols-2 gap-4 p-2">
        {BOARD_THEMES.map((theme) => (
          <SkinCard
            key={theme.id}
            theme={theme}
            active={selectedId === theme.id}
            onSelect={() => onSelect(theme.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface SkinCardProps {
  theme: BoardTheme;
  active: boolean;
  onSelect: () => void;
}

const SkinCard = ({ theme, active, onSelect }: SkinCardProps) => {
  return (
    <div className="group relative">
      <button
        onClick={onSelect}
        className={`w-full h-[200px] relative flex flex-col p-3 rounded-[1.8rem] transition-all duration-500 border overflow-hidden select-none
          ${active
            ? 'bg-white/[0.08] border-white/30 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] scale-[1.02]'
            : 'bg-black/20 border-white/[0.04] hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1 cursor-pointer'
          }
        `}
      >
        {/* Animated Active Border */}
        {active && (
          <div className="absolute inset-0 z-0 p-[1.5px] rounded-[1.8rem]">
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/10 to-white/40 animate-pulse" />
            <div className="absolute inset-[1.5px] bg-[#0c0c0e] rounded-[calc(1.8rem-1.5px)]" />
          </div>
        )}

        {/* Content Container */}
        <div className="relative z-10 w-full">
          {/* Preview Image - Compact */}
          <div className="relative w-full aspect-[16/10] rounded-[1.2rem] overflow-hidden mb-3 border border-white/5 group-hover:border-white/10 transition-all">
            <img
              src={theme.preview}
              alt=""
              className={`w-full h-full object-cover transition-all duration-1000 ${active ? 'scale-110' : 'group-hover:scale-105'}`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            {/* Active Label - Minimal */}
            {active && (
              <div className="absolute top-2 right-2 glass-panel-strong px-2 py-0.5 rounded-full border-white/30 shadow-lg scale-90">
                <span className="text-[8px] font-display font-black tracking-[0.1em] text-white">SET</span>
              </div>
            )}
          </div>

          {/* Text Area - Compact */}
          <div className="px-0.5 text-left">
            <h4 className={`text-[11px] font-display font-black tracking-widest uppercase transition-colors truncate ${active ? 'text-white' : 'text-white/80'}`}>
              {theme.name}
            </h4>
            <p className="text-[9px] leading-tight text-muted-foreground/60 font-display tracking-wide uppercase truncate mt-0.5">
              {theme.emoji} {theme.description.split('.')[0]}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default BoardSkinSelector;
