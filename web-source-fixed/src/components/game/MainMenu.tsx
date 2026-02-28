import { useState } from 'react';
import { Zap, Flame, Waves, Gamepad2, Trophy, User, Paintbrush } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { type GameMode } from '@/lib/gameEngine';
import { loadProgress, setSelectedBoard } from '@/lib/storage';
import BoardSkinSelector from './BoardSkinSelector';
import WalletButton from './WalletButton';
import { Leaderboard } from './Leaderboard';
import { LegalModal } from './LegalModals';
import heroBg from '@/assets/hero-bg.png';

interface MainMenuProps {
  onStart: (mode: GameMode) => void;
  initialTab?: BottomTab;
}

type BottomTab = 'play' | 'rank' | 'skins' | 'profile';

const modes: { id: GameMode; title: string; desc: string; icon: React.ReactNode; neonColor: string; glowHsl: string }[] = [
  {
    id: 'classic',
    title: 'CLASSIC',
    desc: 'Stable spawns + combos',
    icon: <Zap className="w-8 h-8" />,
    neonColor: 'hsl(38, 100%, 60%)',
    glowHsl: '38, 100%, 60%',
  },
  {
    id: 'frustration',
    title: 'FRENZY',
    desc: 'Fast spawns + bombs',
    icon: <Flame className="w-8 h-8" />,
    neonColor: 'hsl(15, 100%, 60%)',
    glowHsl: '15, 100%, 60%',
  },
  {
    id: 'zen',
    title: 'CHILL',
    desc: 'Relax gameplay',
    icon: <Waves className="w-8 h-8" />,
    neonColor: 'hsl(185, 100%, 60%)',
    glowHsl: '185, 100%, 60%',
  },
];

const MainMenu = ({ onStart, initialTab = 'play' }: MainMenuProps) => {
  const progress = loadProgress();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab);
  const [selectedBoardId, setSelectedBoardId] = useState(progress.selectedBoard);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({ isOpen: false, type: 'privacy' });
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const handleBoardSelect = (id: string) => {
    setSelectedBoardId(id);
    setSelectedBoard(id);
  };

  const handlePlayClick = () => {
    if (connected) {
      onStart(selectedMode);
    } else {
      setVisible(true);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className={`absolute inset-0 transition-all duration-700 ${activeTab === 'skins' ? 'bg-black/80' : 'bg-black/55'}`} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--neon-purple))' }} />
          <span className="font-display font-bold text-[11px] tracking-wider neon-text-purple" style={{ color: 'hsl(var(--neon-purple))' }}>
            TOKEN FRENZY
          </span>
          <div className="glass-panel rounded-full px-3 py-1 text-[10px] font-semibold font-sans">
            <span style={{ color: 'hsl(var(--neon-amber))' }} className="font-bold neon-text-amber">{progress.totalScore.toLocaleString()}</span>
            <span className="text-muted-foreground ml-1">COINS</span>
          </div>
        </div>
        <div className="scale-90 flex-shrink-0">
          <WalletButton />
        </div>
      </div>

      {/* ── Main scrollable content ── */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden pb-20">

        {/* PLAY TAB */}
        {activeTab === 'play' && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 gap-5">
            {/* Title */}
            <div className="text-center select-none animate-fade-in">
              <h1 className="font-display font-black tracking-wider leading-none">
                <span className="block text-5xl bg-gradient-to-b from-white via-purple-300 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(280,100%,65%,0.6)]">
                  TOKEN
                </span>
                <span className="block text-5xl bg-gradient-to-b from-purple-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(38,100%,60%,0.5)] -mt-1">
                  FRENZY
                </span>
              </h1>
            </div>

            {/* Play button */}
            <button
              onClick={handlePlayClick}
              className={`group relative animate-fade-in btn-premium ${!connected ? 'opacity-85' : ''}`}
            >
              <div className="absolute -inset-1.5 rounded-full opacity-50 blur-lg group-hover:opacity-70 transition-opacity"
                style={{ background: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-pink)), hsl(var(--neon-cyan)))' }} />
              <div className="relative flex items-center gap-2 px-8 py-3.5 rounded-full glass-panel-strong">
                <Gamepad2 className="w-5 h-5 text-foreground/80" />
                <span className="text-base font-display font-bold tracking-[0.2em] text-foreground">
                  {connected ? 'PLAY' : 'CONNECT WALLET'}
                </span>
              </div>
            </button>

            {/* Mode cards — equal width, equal height, no max-w cap */}
            <div className="w-full flex gap-3 animate-fade-in">
              {modes.map((m) => {
                const isActive = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`flex-1 flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300
                      ${isActive ? 'glass-panel-strong scale-[1.03]' : 'glass-panel hover:scale-[1.02]'}
                    `}
                    style={{
                      borderColor: isActive ? `hsla(${m.glowHsl}, 0.4)` : undefined,
                      boxShadow: isActive ? `0 0 20px hsla(${m.glowHsl}, 0.2)` : undefined,
                    }}
                  >
                    <div style={{
                      color: isActive ? m.neonColor : 'hsl(var(--muted-foreground))',
                      filter: isActive ? `drop-shadow(0 0 8px hsla(${m.glowHsl}, 0.5))` : undefined,
                    }}>
                      {m.icon}
                    </div>
                    <h3 className={`text-xs font-display font-bold tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {m.title}
                    </h3>
                    <p className="text-[9px] text-muted-foreground text-center tracking-wide uppercase font-sans leading-tight">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SKINS TAB */}
        {activeTab === 'skins' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-4 animate-fade-in">
            <div className="text-center mb-4">
              <h2 className="text-3xl font-display font-black text-white tracking-tight">ARENA SKINS</h2>
              <p className="text-muted-foreground/60 text-[9px] font-display tracking-[0.3em] uppercase mt-1">
                Choose your battleground visual
              </p>
            </div>
            <BoardSkinSelector selectedId={selectedBoardId} onSelect={handleBoardSelect} />
          </div>
        )}

        {/* RANK TAB */}
        {activeTab === 'rank' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-4 animate-fade-in">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Trophy className="w-7 h-7" style={{ color: 'hsl(var(--neon-amber))' }} />
              <h2 className="text-2xl font-display font-black text-foreground tracking-tight">HALL OF FAME</h2>
            </div>
            <Leaderboard />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-4 animate-fade-in">
            <ProfileDashboard
              progress={progress}
              onOpenLegal={(type) => setLegalModal({ isOpen: true, type })}
            />
          </div>
        )}
      </div>

      {/* ── Bottom navigation ── */}
      <div className="absolute bottom-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="flex items-center glass-panel-strong rounded-2xl overflow-hidden">
          {([
            { id: 'rank' as BottomTab, icon: Trophy, label: 'RANK' },
            { id: 'play' as BottomTab, icon: Gamepad2, label: 'PLAY' },
            { id: 'skins' as BottomTab, icon: Paintbrush, label: 'SKINS' },
            { id: 'profile' as BottomTab, icon: User, label: 'PROFILE' },
          ]).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center gap-0.5 px-6 py-3 transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : undefined,
                  color: isActive ? 'white' : 'hsla(0,0%,100%,0.4)',
                }}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] font-display font-bold tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        type={legalModal.type}
      />
    </div>
  );
};

// ─── Profile Dashboard ────────────────────────────────────────────────────────

import { useWallet as useWalletHook } from '@solana/wallet-adapter-react';
import { Copy, CheckCircle, TrendingUp, Target, Activity, Medal, ShieldCheck, Shield, FileText } from 'lucide-react';
import { shortenAddress } from '@/lib/storage';

function ProfileDashboard({ progress, onOpenLegal }: {
  progress: any,
  onOpenLegal: (type: 'privacy' | 'terms') => void
}) {
  const { publicKey, connected } = useWalletHook();
  const [copied, setCopied] = useState(false);

  const getRank = (score: number) => {
    if (score > 100000) return { name: 'TOKEN OVERLORD', color: 'hsl(var(--neon-purple))' };
    if (score > 50000) return { name: 'GRAND MASTER', color: 'hsl(var(--neon-pink))' };
    if (score > 10000) return { name: 'PRO CUTTER', color: 'hsl(var(--neon-cyan))' };
    return { name: 'RECRUIT', color: 'hsl(var(--muted-foreground))' };
  };
  const rank = getRank(progress.totalScore);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard?.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identity card */}
      <div className="glass-panel-strong rounded-3xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-black text-foreground truncate">
            {connected && publicKey ? shortenAddress(publicKey.toString()) : 'GUEST PLAYER'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-display font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5"
              style={{ color: rank.color }}>
              {rank.name}
            </span>
            {connected && publicKey && (
              <button onClick={copyAddress} className="text-muted-foreground p-0.5">
                {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
        {connected && (
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
        )}
      </div>

      {/* Stats grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: TrendingUp, label: 'Score', value: progress.totalScore.toLocaleString(), color: 'hsl(var(--neon-purple))' },
          { icon: Target, label: 'Slices', value: progress.totalTokensSliced.toLocaleString(), color: 'hsl(var(--neon-cyan))' },
          { icon: Medal, label: 'Best Combo', value: `${progress.bestCombo}x`, color: 'hsl(var(--neon-amber))' },
          { icon: Activity, label: 'Games', value: String(progress.gamesPlayed), color: 'hsl(var(--neon-pink))' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-panel rounded-2xl p-4">
            <Icon className="w-4 h-4 mb-2" style={{ color }} />
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-display">{label}</p>
            <p className="text-xl font-display font-black text-foreground tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Wallet connect shortcut */}
      {!connected && (
        <div className="glass-panel rounded-2xl p-4 flex items-center gap-3 border border-purple-500/20">
          <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-display font-bold text-foreground">CONNECT WALLET</p>
            <p className="text-[9px] text-muted-foreground">Link your Solana wallet to save scores</p>
          </div>
        </div>
      )}

      {/* Legal */}
      <div className="flex gap-3">
        <button
          onClick={() => onOpenLegal('privacy')}
          className="flex-1 glass-panel rounded-2xl p-3 flex items-center gap-2 hover:bg-white/5 transition-all"
        >
          <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-[10px] font-display font-bold text-foreground">PRIVACY</span>
        </button>
        <button
          onClick={() => onOpenLegal('terms')}
          className="flex-1 glass-panel rounded-2xl p-3 flex items-center gap-2 hover:bg-white/5 transition-all"
        >
          <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span className="text-[10px] font-display font-bold text-foreground">TERMS</span>
        </button>
      </div>

      <p className="text-[9px] text-center text-muted-foreground/40 font-display tracking-[0.2em] uppercase pb-2">
        Made for Solana Mobile &amp; Web
      </p>
    </div>
  );
}

export default MainMenu;
