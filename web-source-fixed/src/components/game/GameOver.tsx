import { useState, useEffect } from 'react';
import { RotateCcw, Home, Zap, Scissors, Star, Trophy, Heart, Flame, Coins, Wallet } from 'lucide-react';
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

  const handleReviveClick = async () => {
    if (progress.revives > 0) {
      if (useRevive()) {
        onRevive?.();
      }
    } else {
      if (!connected) {
        connect();
        return;
      }
      try {
        setIsLoading(true);
        setStatus("Approving purchase...");
        localStorage.setItem('pending-purchase', JSON.stringify({
          type: 'revive',
          qty: 1,
          timestamp: Date.now()
        }));
        await sendSol(TREASURY_WALLET, 0.0025);
        const updated = loadProgress();
        setProgress(updated);
        setStatus("Revive purchased!");
        if (updated.revives > 0 && useRevive()) {
          onRevive?.();
        }
      } catch (err: any) {
        localStorage.removeItem('pending-purchase');
        setStatus(err.message?.includes("User rejected") ? "Cancelled" : "Purchase failed");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleScoreSubmit = async () => {
    if (!walletAddress || !connected || isSubmitted) return;
    try {
      setIsLoading(true);
      setStatus("Awaiting payment approval...");
      if (SCORE_SUBMIT_PRICE_SOL > 0) {
        await sendSol(TREASURY_WALLET, SCORE_SUBMIT_PRICE_SOL);
      }
      setStatus("Saving score...");
      const { data: existingEntries, error: fetchError } = await supabase
        .from('leaderboard')
        .select('score, id')
        .eq('wallet', walletAddress)
        .eq('mode', stats.mode);

      if (fetchError) console.error('Error checking existing scores:', fetchError);

      let maxScore = Number(stats.score);
      if (existingEntries && existingEntries.length > 0) {
        const currentBestDB = Math.max(...existingEntries.map(e => e.score));
        maxScore = Math.max(maxScore, currentBestDB);
        await supabase
          .from('leaderboard')
          .delete()
          .eq('wallet', walletAddress)
          .eq('mode', stats.mode);
      }

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
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden"
      style={{ background: boardTheme.cssBackground || boardTheme.background }}>

      {boardTheme.backgroundImage && (
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          backgroundImage: `url(${boardTheme.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: boardTheme.id === 'void-whisper' ? 0.3 : 0.6,
          mixBlendMode: 'screen',
        }} />
      )}

      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        background: `radial-gradient(circle at 50% 50%, ${boardTheme.background}55 0%, transparent 70%)`,
      }} />

      <div className="absolute inset-0 z-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,0.95)]" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <div
        className="relative z-10 w-full max-w-sm flex flex-col overflow-y-auto max-h-full rounded-3xl animate-scale-in shadow-2xl p-6 gap-4"
        style={{
          background: `linear-gradient(180deg, ${boardTheme.background}CC 0%, #000000 100%)`,
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: `0 0 50px ${boardTheme.background}44, 0 20px 60px rgba(0, 0, 0, 0.7)`,
        }}
      >
        <div className="flex flex-col items-center shrink-0">
          <Star className="w-8 h-8 shrink-0 mb-2" style={{ color: 'hsl(var(--neon-amber))', filter: 'drop-shadow(0 0 10px hsla(38,100%,60%,0.6))' }} />
          <h1
            className="text-3xl font-display font-black tracking-wider uppercase text-center"
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

        <div className="flex flex-col items-center gap-1 shrink-0">
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
              <span className="text-xs font-bold text-cyan-400 tracking-wider">
                +{xpData.xpGained} XP
              </span>
              {xpData.leveledUp && (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-[10px] font-black text-black uppercase tracking-tighter shadow-[0_0_10px_rgba(34,211,238,0.5)]">
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

        <div className="flex flex-col gap-3 w-full shrink-0">
          {!isSubmitted && (
            <button
              onClick={connected ? handleScoreSubmit : connect}
              disabled={isLoading}
              className="w-full h-12 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
              }}
            >
              <Trophy className="w-5 h-5 shrink-0" />
              <span className="truncate">{isLoading ? 'SUBMITTING...' : (!connected ? 'CONNECT TO SUBMIT' : 'SUBMIT SCORE')}</span>
            </button>
          )}

          {status && (
            <div className={`text-xs font-display font-bold tracking-widest text-center animate-pulse ${status.includes('Error') || status.includes('failed') || status.includes('cancelled') ? 'text-red-400' : 'text-green-400'}`}>
              {status.toUpperCase()}
            </div>
          )}

          {stats.mode !== 'zen' && (
            <button
              onClick={handleReviveClick}
              disabled={isLoading}
              className={`w-full h-12 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold transition-all border group
                ${(progress.revives > 0 || connected)
                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 active:scale-95'
                  : 'border-white/5 bg-white/5 text-white/20 opacity-50'}
              `}
            >
              <Flame className={`w-5 h-5 shrink-0 ${progress.revives > 0 ? 'animate-pulse' : ''}`} />
              <span className="truncate">
                {progress.revives > 0
                  ? `USE REVIVE (${progress.revives})`
                  : (isLoading ? 'PURCHASING...' : 'BUY REVIVE')
                }
              </span>
              {!progress.revives && !isLoading && <Wallet className="w-4 h-4 shrink-0 opacity-70" />}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className="flex-1 h-12 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-foreground transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: 'linear-gradient(135deg, hsl(var(--neon-pink)), hsl(330,100%,55%))',
                boxShadow: '0 0 25px hsla(330,100%,65%,0.4)',
              }}
            >
              <RotateCcw className="w-5 h-5 shrink-0" />
              <span>Retry</span>
            </button>

            <button
              onClick={onMenu}
              className="flex-1 h-12 flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-bold text-muted-foreground transition-all hover:text-foreground glass-panel shadow-lg"
            >
              <Home className="w-5 h-5 shrink-0" />
              <span>Menu</span>
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
      className="flex-1 rounded-xl px-2 py-3 text-center"
      style={{
        background: `hsla(${colorVar === '--neon-amber' ? '38,100%,60%' : '185,100%,60%'},0.08)`,
        border: `1px solid hsla(${colorVar === '--neon-amber' ? '38,100%,60%' : '185,100%,60%'},0.15)`,
      }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Icon className="w-4 h-4" style={{ color: `hsl(var(${colorVar}))` }} />
        <span className="text-xs font-medium" style={{ color: `hsl(var(${colorVar}))` }}>{label}</span>
      </div>
      <div className="text-2xl font-display font-black text-foreground">{value}</div>
    </div>
  );
}

export default GameOver;