import { useState } from 'react';
import { RotateCcw, Home, Zap, Scissors, Star, Trophy } from 'lucide-react';
import { type GameMode } from '@/lib/gameEngine';
import { loadProgress } from '@/lib/storage';
import { getThemeById } from '@/lib/boardThemes';
import { supabase } from '@/lib/supabase';
import { useNativeWallet } from '@/components/NativeWalletContext';
import { TREASURY_WALLET, SCORE_SUBMIT_PRICE_SOL } from '@/lib/solanaConfig';

interface GameOverProps {
  stats: {
    score: number;
    tokensSliced: number;
    bestCombo: number;
    mode: GameMode;
  };
  onRestart: () => void;
  onMenu: () => void;
  onViewRank?: () => void;
}

function modeLabel(mode: GameMode): string {
  if (mode === 'frustration') return 'Frenzy Mode';
  if (mode === 'zen') return 'Chill Mode';
  return 'Classic Mode';
}

const GameOver = ({ stats, onRestart, onMenu, onViewRank }: GameOverProps) => {
  const progress = loadProgress();
  const boardTheme = getThemeById(progress.selectedBoard);
  const { walletAddress, connected, connect, sendSol } = useNativeWallet();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleScoreSubmit = async () => {
    if (!walletAddress || !connected || isSubmitted) return;

    try {
      setIsLoading(true);
      setStatus("Awaiting payment approval...");

      // Send SOL via native bridge
      await sendSol(TREASURY_WALLET, SCORE_SUBMIT_PRICE_SOL);

      setStatus("Saving score...");

      // 1. Fetch only entries for this wallet AND this mode
      const { data: existingEntries, error: fetchError } = await supabase
        .from('leaderboard')
        .select('score, id')
        .eq('wallet', walletAddress)
        .eq('mode', stats.mode);

      if (fetchError) {
        console.error('Error checking existing scores:', fetchError);
      }

      let maxScore = Number(stats.score);
      let alreadyExists = false;

      if (existingEntries && existingEntries.length > 0) {
        alreadyExists = true;
        // Find the absolute best score between the current game and all DB records
        const currentBestDB = Math.max(...existingEntries.map(e => e.score));
        maxScore = Math.max(maxScore, currentBestDB);

        // 2. Delete existing entries for this specific mode
        const { error: deleteError } = await supabase
          .from('leaderboard')
          .delete()
          .eq('wallet', walletAddress)
          .eq('mode', stats.mode);

        if (deleteError) {
          console.error('Error cleaning up leaderboard duplicates:', deleteError);
          // If delete fails, we'll try to insert anyway, though it might still be messy
        }
      }

      // 3. Insert the single consolidated "best" score entry for this mode
      const { error: dbError } = await supabase
        .from('leaderboard')
        .insert([{
          wallet: walletAddress,
          score: maxScore,
          mode: stats.mode
        }]);

      if (!dbError) {
        setIsSubmitted(true);
        setStatus("Rank updated successfully!");
      } else {
        console.error('Supabase save error:', dbError);
        setStatus(`DB Error: ${dbError.message || "Failed to save"}`);
      }
    } catch (err: any) {
      console.error('Failed to submit score:', err);
      setStatus(err.message?.includes("User rejected") ? "Payment cancelled" : (err.message || "Transaction failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: boardTheme.background }}>
      <img src={boardTheme.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/50" />

      <div
        className="relative z-10 w-full max-w-[320px] max-h-[90vh] flex flex-col overflow-hidden rounded-[24px] animate-scale-in shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #140b2e 0%, #0b071a 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 40px rgba(150, 0, 255, 0.25), 0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col items-center gap-4">
          <Star className="w-8 h-8 shrink-0" style={{ color: 'hsl(var(--neon-amber))', filter: 'drop-shadow(0 0 10px hsla(38,100%,60%,0.6))' }} />

          <div className="text-center shrink-0">
            <h1
              className="text-3xl font-display font-black tracking-wider uppercase"
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

          <div className="flex items-baseline gap-2">
            <span
              className="text-5xl font-display font-black leading-none"
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

          <div className="flex gap-2 w-full shrink-0">
            <StatCard icon={Zap} label="Best Combo" value={`x${stats.bestCombo}`} colorVar="--neon-amber" />
            <StatCard icon={Scissors} label="Sliced" value={String(stats.tokensSliced)} colorVar="--neon-cyan" />
          </div>

          {/* Score Submission */}
          <div className="flex flex-col gap-2 w-full mt-1 shrink-0">
            {!isSubmitted && (
              <button
                onClick={connected ? handleScoreSubmit : connect}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                  boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Trophy className="w-4 h-4" />
                <span>{isLoading ? 'SUBMITTING...' : (!connected ? 'CONNECT WALLET TO SUBMIT' : 'SUBMIT SCORE')}</span>
              </button>
            )}

            {status && (
              <div className={`text-[10px] font-display font-bold tracking-widest text-center mt-2 animate-pulse ${status.includes('Error') || status.includes('failed') || status.includes('cancelled') ? 'text-red-400' : 'text-green-400'}`}>
                {status.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full mt-1 shrink-0">
            <button
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-foreground transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-pink)), hsl(330,100%,55%))',
                boxShadow: '0 0 25px hsla(330,100%,65%,0.4)',
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>

            <button
              onClick={onMenu}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground glass-panel hover:border-[hsla(280,100%,65%,0.3)]"
            >
              <Home className="w-4 h-4" />
              Back to Menu
            </button>
          </div>

          <div className="w-full pt-2 flex flex-col gap-2 border-t border-white/5 shrink-0">
            <button
              onClick={onViewRank || onMenu}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold tracking-[0.2em] text-cyan-400/80 uppercase transition-all duration-200 hover:text-cyan-300"
            >
              <Trophy className="w-3 h-3" />
              View Global Rankings
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
      className="flex-1 rounded-xl px-2 py-2 text-center"
      style={{
        background: `hsla(${colorVar === '--neon-amber' ? '38,100%,60%' : '185,100%,60%'},0.08)`,
        border: `1px solid hsla(${colorVar === '--neon-amber' ? '38,100%,60%' : '185,100%,60%'},0.15)`,
      }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: `hsl(var(${colorVar}))` }} />
        <span className="text-[10px] font-medium" style={{ color: `hsl(var(${colorVar}))` }}>{label}</span>
      </div>
      <div className="text-xl font-display font-black text-foreground">{value}</div>
    </div>
  );
}

export default GameOver;
