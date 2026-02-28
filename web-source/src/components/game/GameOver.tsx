import { RotateCcw, Home, Zap, Scissors, Star, Upload, Loader2, Check, ExternalLink } from 'lucide-react';
import { type GameMode } from '@/lib/gameEngine';
import { useSubmitScore } from '@/hooks/useSubmitScore';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { loadProgress } from '@/lib/storage';
import { getThemeById } from '@/lib/boardThemes';

interface GameOverProps {
  stats: {
    score: number;
    tokensSliced: number;
    bestCombo: number;
    mode: GameMode;
  };
  onRestart: () => void;
  onMenu: () => void;
}

function modeLabel(mode: GameMode): string {
  if (mode === 'frustration') return 'Frenzy Mode';
  if (mode === 'zen') return 'Chill Mode';
  return 'Classic Mode';
}

const GameOver = ({ stats, onRestart, onMenu }: GameOverProps) => {
  const { submitScore, isConnected, isWriting, isConfirming, isSuccess, txHash, fee } = useSubmitScore();
  const { openConnectModal } = useConnectModal();
  const progress = loadProgress();
  const boardTheme = getThemeById(progress.selectedBoard);

  const handleSubmit = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    submitScore(stats.score, stats.mode, stats.bestCombo, stats.tokensSliced);
  };

  const isSubmitting = isWriting || isConfirming;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ backgroundColor: boardTheme.background }}>
      {/* Full-screen board skin background */}
      <img src={boardTheme.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/50" />

      {/* Card container */}
      <div
        className="relative z-10 w-full max-w-sm rounded-[24px] p-8 animate-scale-in"
        style={{
          background: 'linear-gradient(180deg, #140b2e 0%, #0b071a 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 40px rgba(150, 0, 255, 0.25), 0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div className="flex flex-col items-center gap-5">
          {/* Star icon */}
          <Star className="w-10 h-10" style={{ color: 'hsl(var(--neon-amber))', filter: 'drop-shadow(0 0 10px hsla(38,100%,60%,0.6))' }} />

          {/* Title */}
          <div className="text-center">
            <h1
              className="text-4xl font-display font-black tracking-wider uppercase"
              style={{
                background: 'linear-gradient(180deg, hsl(var(--neon-cyan)), hsl(var(--neon-purple)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px hsla(280,100%,65%,0.5))',
              }}
            >
              GAME OVER
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{modeLabel(stats.mode)}</p>
          </div>

          {/* Score */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-6xl font-display font-black leading-none"
              style={{
                background: 'var(--gradient-score)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {stats.score.toLocaleString()}
            </span>
            <span className="text-xl font-display text-muted-foreground font-bold">pts</span>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 w-full">
            <StatCard icon={Zap} label="Best Combo" value={`x${stats.bestCombo}`} colorVar="--neon-amber" />
            <StatCard icon={Scissors} label="Sliced" value={String(stats.tokensSliced)} colorVar="--neon-cyan" />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full mt-2">
            {/* Submit Score */}
            {isSuccess ? (
              <div className="w-full flex flex-col items-center gap-1.5 py-3 rounded-xl text-sm font-semibold glass-panel"
                style={{ borderColor: 'hsla(120,80%,50%,0.3)' }}>
                <div className="flex items-center gap-2 text-green-400">
                  <Check className="w-4 h-4" />
                  Score Submitted!
                </div>
                {txHash && (
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View on BaseScan <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 glass-panel hover:border-[hsla(280,100%,65%,0.3)] disabled:opacity-50"
                style={{
                  color: isSubmitting ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground))',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isConfirming ? 'Confirming...' : 'Signing...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    {isConnected ? 'Submit Score (FREE + Gas)' : 'Connect & Submit Score'}
                  </>
                )}
              </button>
            )}

            {/* Play Again */}
            <button
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-pink)), hsl(330,100%,55%))',
                boxShadow: '0 0 25px hsla(330,100%,65%,0.4)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>

            {/* Back to Menu */}
            <button
              onClick={onMenu}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground glass-panel hover:border-[hsla(280,100%,65%,0.3)]"
            >
              <Home className="w-4 h-4" />
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, colorVar }: {
  icon: React.ElementType;
  label: string;
  value: string;
  colorVar: string;
}) {
  return (
    <div
      className="flex-1 rounded-xl px-4 py-3 text-center"
      style={{
        background: `hsla(${colorVar === '--neon-amber' ? '38,100%,60%' : '185,100%,60%'},0.08)`,
        border: `1px solid hsla(${colorVar === '--neon-amber' ? '38,100%,60%' : '185,100%,60%'},0.15)`,
      }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: `hsl(var(${colorVar}))` }} />
        <span className="text-xs font-medium" style={{ color: `hsl(var(${colorVar}))` }}>{label}</span>
      </div>
      <div className="text-2xl font-display font-black text-foreground">{value}</div>
    </div>
  );
}

export default GameOver;
