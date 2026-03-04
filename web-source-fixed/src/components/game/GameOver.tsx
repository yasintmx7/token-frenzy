import { useState, useEffect } from 'react';
import { RotateCcw, Home, Zap, Scissors, Star, Trophy, Heart, Flame, Coins } from 'lucide-react';
import { type GameMode } from '@/lib/gameEngine';
import { loadProgress, useRevive, buyRevive, buyRevives, syncProgressToCloud } from '@/lib/storage';
import { awardXpFromScore, type XPResult } from '@/lib/xp';
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
  onRevive?: () => void;
  sessionId: string;
}

function modeLabel(mode: GameMode): string {
  if (mode === 'frustration') return 'Frenzy Mode';
  if (mode === 'zen') return 'Chill Mode';
  if (mode === 'timewarp') return 'Split Mode';
  if (mode === 'void') return 'Twin Mode';
  if (mode === 'laser') return 'Laser Mode';
  return 'Classic Mode';
}

const GameOver = ({ stats, onRestart, onMenu, onViewRank, onRevive, sessionId }: GameOverProps) => {
  const [progress, setProgress] = useState(loadProgress());
  const boardTheme = getThemeById(progress.selectedBoard);
  const { walletAddress, connected, connect, sendSol } = useNativeWallet();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [xpData, setXpData] = useState<XPResult | null>(null);

  useEffect(() => {
    if (sessionId) {
      const result = awardXpFromScore(stats.score, sessionId);
      if (result) {
        setXpData(result);
      }
    }
  }, [stats.score, sessionId]);

  const handleReviveClick = () => {
    if (progress.revives > 0) {
      if (useRevive()) {
        onRevive?.();
      }
    } else {
      if (progress.totalScore >= 2500) {
        if (buyRevive(2500)) {
          if (useRevive()) {
            onRevive?.();
          }
        }
      }
    }
  };

  const handleBuyMultiple = (amount: number, cost: number) => {
    if (progress.totalScore >= cost) {
      if (buyRevives(amount, cost)) {
        setProgress(loadProgress());
      }
    }
  };


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
        // Sync full profile data to cloud for this wallet
        await syncProgressToCloud(walletAddress);
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
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6"
      style={{ background: boardTheme.cssBackground || boardTheme.background }}>
      {boardTheme.backgroundImage && (
        <img src={boardTheme.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-background/50" />

      <div
        className="relative z-10 w-full max-w-[360px] max-h-[88vh] flex flex-col overflow-hidden rounded-[24px] animate-scale-in shadow-2xl"
        style={{
          transform: 'scale(0.96)',
          transformOrigin: 'center',
          background: 'linear-gradient(180deg, #140b2e 0%, #0b071a 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 0 40px rgba(150, 0, 255, 0.25), 0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar px-7 py-5 flex flex-col items-center gap-4">
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

          <div className="flex flex-col items-center gap-1">
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

            {xpData && xpData.xpGained > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-700">
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider">
                  +{xpData.xpGained} XP
                </span>
                {xpData.leveledUp && (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-[8px] font-black text-black uppercase tracking-tighter shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    Level Up!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 w-full shrink-0">
            <StatCard icon={Zap} label="Best Combo" value={`x${stats.bestCombo}`} colorVar="--neon-amber" />
            <StatCard icon={Scissors} label="Sliced" value={String(stats.tokensSliced)} colorVar="--neon-cyan" />
          </div>

          {/* Buttons Area */}
          <div className="flex flex-col gap-2.5 w-full mt-1 shrink-0">
            {/* Submit Action */}
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
              <div className={`text-[10px] font-display font-bold tracking-widest text-center animate-pulse ${status.includes('Error') || status.includes('failed') || status.includes('cancelled') ? 'text-red-400' : 'text-green-400'}`}>
                {status.toUpperCase()}
              </div>
            )}

            {/* Revive Action */}
            {stats.mode !== 'zen' && (
              <button
                onClick={handleReviveClick}
                disabled={progress.revives === 0 && progress.totalScore < 2500}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 border group
                  ${(progress.revives > 0 || progress.totalScore >= 2500)
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 active:scale-95'
                    : 'border-white/5 bg-white/5 text-white/20 opacity-50'}
                `}
              >
                <Flame className={`w-5 h-5 ${progress.revives > 0 ? 'animate-pulse' : ''}`} />
                <span>
                  {progress.revives > 0
                    ? `USE REVIVE (${progress.revives} LEFT)`
                    : 'BUY & USE REVIVE (2.5K)'
                  }
                </span>
                {!progress.revives && progress.totalScore >= 2500 && <Coins className="w-4 h-4 ml-1" />}
              </button>
            )}

            {/* Primary Navigation */}
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

            <button
              onClick={onMenu}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-muted-foreground transition-all duration-200 hover:text-foreground glass-panel hover:border-[hsla(280,100%,65%,0.3)] shadow-lg"
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
