import { Check, Lock, Sparkles, Loader2, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { BOARD_THEMES, type BoardTheme } from '@/lib/boardThemes';
import { useNftOwnership, useMintSkin } from '@/hooks/useNft';
import { NFT_CONTRACT } from '@/lib/nftContract';

interface BoardSkinSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const BoardSkinSelector = ({ selectedId, onSelect }: BoardSkinSelectorProps) => {
  const { isConnected } = useAccount();
  const { mint, mintingSkinId, isWriting, isConfirming, isSuccess, txHash } = useMintSkin();
  const contractReady = NFT_CONTRACT.address !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Status Info - Compact */}
      {!contractReady && (
        <div className="glass-panel py-1.5 px-4 rounded-full flex items-center justify-center gap-2.5 self-center animate-fade-in group hover:bg-white/10 transition-colors border-white/10">
          <Info className="w-3 h-3 text-muted-foreground/60 group-hover:text-blue-400 transition-colors" />
          <p className="text-[9px] text-muted-foreground/80 font-display tracking-[0.15em] uppercase">
            Skins Unlocked
          </p>
        </div>
      )}

      {/* Grid Layout - Fixed 3 columns with regulated height */}
      <div className="grid grid-cols-3 gap-6 p-4 h-[calc(100vh-240px)] overflow-hidden">
        {BOARD_THEMES.map((theme) => (
          <SkinCard
            key={theme.id}
            theme={theme}
            active={selectedId === theme.id}
            onSelect={() => onSelect(theme.id)}
            isConnected={isConnected}
            contractReady={contractReady}
            onMint={() => mint(theme.id)}
            isMinting={mintingSkinId === theme.id && (isWriting || isConfirming)}
          />
        ))}
      </div>

      {/* Mint success feedback - Absolute centered to avoid pushing layout */}
      {isSuccess && txHash && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 glass-panel-strong rounded-2xl p-4 text-center animate-fade-in-up border-green-500/20 shadow-2xl max-w-[280px] w-full">
          <Sparkles className="w-5 h-5 mx-auto mb-1 text-green-400" />
          <p className="text-[10px] font-display font-bold text-foreground mb-0.5 tracking-wider uppercase">SUCCESS!</p>
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-muted-foreground underline decoration-green-500/30 hover:text-green-400 transition-all font-mono"
          >
            {txHash.substring(0, 10)}...
          </a>
        </div>
      )}
    </div>
  );
};

interface SkinCardProps {
  theme: BoardTheme;
  active: boolean;
  onSelect: () => void;
  isConnected: boolean;
  contractReady: boolean;
  onMint: () => void;
  isMinting: boolean;
}

const SkinCard = ({ theme, active, onSelect, isConnected, contractReady, onMint, isMinting }: SkinCardProps) => {
  const { ownsNft, isLoading: nftLoading } = useNftOwnership(theme.id);
  const unlocked = !contractReady || ownsNft || theme.id === 'neon-grid';
  const showMint = contractReady && isConnected && !unlocked && !nftLoading;

  return (
    <div className="group relative">
      <button
        onClick={unlocked ? onSelect : undefined}
        className={`w-full h-[200px] relative flex flex-col p-3 rounded-[1.8rem] transition-all duration-500 border overflow-hidden select-none
          ${active && unlocked
            ? 'bg-white/[0.08] border-white/30 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] scale-[1.02]'
            : unlocked
              ? 'bg-black/20 border-white/[0.04] hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-1 cursor-pointer'
              : 'bg-black/60 border-white/5 opacity-40 cursor-default grayscale'
          }
        `}
      >
        {/* Animated Active Border */}
        {active && unlocked && (
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
              className={`w-full h-full object-cover transition-all duration-1000 ${active ? 'scale-110' : 'group-hover:scale-105'} ${!unlocked ? 'blur-[2px]' : ''}`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

            {/* Active Label - Minimal */}
            {active && unlocked && (
              <div className="absolute top-2 right-2 glass-panel-strong px-2 py-0.5 rounded-full border-white/30 shadow-lg scale-90">
                <span className="text-[8px] font-display font-black tracking-[0.1em] text-white">SET</span>
              </div>
            )}

            {/* Locked Status */}
            {!unlocked && !showMint && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                <Lock className="w-4 h-4 text-white/60" />
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

      {/* Action Button - Overlayed to preserve height */}
      {showMint && (
        <div className="absolute bottom-2 left-2 right-2 z-20 animate-fade-in-up">
          <button
            onClick={onMint}
            disabled={isMinting}
            className="w-full py-2 rounded-xl font-display font-black text-[8px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-2xl border border-white/20 bg-white text-black"
          >
            {isMinting ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
            MINT
          </button>
        </div>
      )}
    </div>
  );
};

export default BoardSkinSelector;
