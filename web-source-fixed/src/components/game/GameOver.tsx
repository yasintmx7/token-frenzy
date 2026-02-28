import { useState, useCallback, useEffect } from 'react';
import { RotateCcw, Home, Zap, Scissors, Star, Trophy } from 'lucide-react';
import { type GameMode } from '@/lib/gameEngine';
import { loadProgress } from '@/lib/storage';
import { getThemeById } from '@/lib/boardThemes';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@solana/wallet-adapter-react';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { transferSol } from '@metaplex-foundation/mpl-toolbox';
import { sol, transactionBuilder, publicKey as umiPublicKey } from '@metaplex-foundation/umi';
import { SOLANA_RPC_URL, TREASURY_WALLET, SCORE_SUBMIT_PRICE_SOL } from '@/lib/solanaConfig';

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
  const { publicKey, wallet, connected } = useWallet();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleScoreSubmit = async () => {
    if (!publicKey || !wallet || !connected || isSubmitted) return;

    try {
      setIsLoading(true);
      setStatus("Awaiting payment approval...");

      const umi = createUmi(SOLANA_RPC_URL)
        .use(walletAdapterIdentity(wallet.adapter));

      await transactionBuilder()
        .add(
          transferSol(umi, {
            destination: umiPublicKey(TREASURY_WALLET),
            amount: sol(SCORE_SUBMIT_PRICE_SOL),
          })
        )
        .sendAndConfirm(umi);

      setStatus("Saving score...");
      // Omit created_at to let Supabase default now() handle it
      // Added .select() to ensure the operation completes and returns the result for verification
      const { error: dbError } = await supabase
        .from('leaderboard')
        .insert([
          {
            wallet: publicKey.toString(),
            score: Number(stats.score)
          }
        ])
        .select();

      if (!dbError) {
        setIsSubmitted(true);
        setStatus("Rank updated successfully!");
      } else {
        console.error('Supabase save error:', dbError);
        setStatus(`DB Error: ${dbError.message || "Failed to save"}`);
      }
    } catch (err: any) {
      console.error('Failed to submit score:', err);
      // Report detailed error for debugging
      setStatus(err.message?.includes("User rejected") ? "Payment cancelled" : (err.message || "Transaction failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-12 px-6 relative overflow-y-auto overflow-x-hidden custom-scrollbar"
      style={{ backgroundColor: boardTheme.background }}>
      {/* Full-screen board skin background */}
      <img src={boardTheme.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover fixed" />
      <div className="absolute inset-0 bg-background/50 fixed" />

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

          {/* Score Submission */}
          <div className="flex flex-col gap-3 w-full mt-2">
            {!isSubmitted && connected && publicKey && (
              <button
                onClick={handleScoreSubmit}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)',
                  boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
                }}
              >
                <Trophy className="w-4 h-4" />
                <span>{isLoading ? 'SUBMITTING...' : `SUBMIT SCORE — ${SCORE_SUBMIT_PRICE_SOL} SOL`}</span>
              </button>
            )}

            {status && (
              <div className={`text-[10px] font-display font-bold tracking-widest text-center mt-2 animate-pulse ${status.includes('Error') || status.includes('failed') || status.includes('cancelled') ? 'text-red-400' : 'text-green-400'}`}>
                {status.toUpperCase()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full mt-2">
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

          {/* 📊 Global Hall of Fame Link */}
          <div className="w-full pt-2 flex flex-col gap-2 border-t border-white/5">
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
