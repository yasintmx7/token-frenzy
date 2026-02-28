import { useState } from 'react';
import { Zap, Flame, Waves, Gamepad2, Trophy, User, Paintbrush, Medal, Copy, CheckCircle, TrendingUp, Target, Activity, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi';
import { type GameMode } from '@/lib/gameEngine';
import { loadProgress, setSelectedBoard, loadLeaderboard, shortenAddress, setIsVertical } from '@/lib/storage';
import BoardSkinSelector from './BoardSkinSelector';
import WalletButton from './WalletButton';
import heroBg from '@/assets/hero-bg.png';


interface MainMenuProps {
  onStart: (mode: GameMode) => void;
}

type BottomTab = 'play' | 'rank' | 'skins' | 'profile';

const modes: { id: GameMode; title: string; desc: string; icon: React.ReactNode; neonColor: string; glowHsl: string }[] = [
  {
    id: 'classic',
    title: 'CLASSIC',
    desc: 'Stable spawns + combos',
    icon: <Zap className="w-9 h-9 sm:w-11 sm:h-11" />,
    neonColor: 'hsl(38, 100%, 60%)',
    glowHsl: '38, 100%, 60%',
  },
  {
    id: 'frustration',
    title: 'FRENZY',
    desc: 'Fast spawns + bombs',
    icon: <Flame className="w-9 h-9 sm:w-11 sm:h-11" />,
    neonColor: 'hsl(15, 100%, 60%)',
    glowHsl: '15, 100%, 60%',
  },
  {
    id: 'zen',
    title: 'CHILL',
    desc: 'Relax gameplay',
    icon: <Waves className="w-9 h-9 sm:w-11 sm:h-11" />,
    neonColor: 'hsl(185, 100%, 60%)',
    glowHsl: '185, 100%, 60%',
  },
];

const MainMenu = ({ onStart }: MainMenuProps) => {
  const progress = loadProgress();
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [activeTab, setActiveTab] = useState<BottomTab>('play');
  const [selectedBoardId, setSelectedBoardId] = useState(progress.selectedBoard);

  const handleBoardSelect = (id: string) => {
    setSelectedBoardId(id);
    setSelectedBoard(id);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      {/* Dark overlay with dynamic intensity */}
      <div className={`absolute inset-0 transition-all duration-700 ${activeTab === 'skins' ? 'bg-black/75 backdrop-blur-[6px]' : 'bg-black/50'}`} />

      {/* Subtle Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 flex-shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--neon-purple))' }} />
            <span className="font-display font-bold text-[10px] sm:text-xs tracking-wider neon-text-purple whitespace-nowrap" style={{ color: 'hsl(var(--neon-purple))' }}>
              TOKEN FRENZY
            </span>
          </div>
          <div className="glass-panel rounded-full px-3 py-1 text-[10px] font-semibold font-sans whitespace-nowrap">
            <span style={{ color: 'hsl(var(--neon-amber))' }} className="font-bold neon-text-amber">{progress.totalScore.toLocaleString()}</span>
            <span className="text-muted-foreground ml-1.5">COINS</span>
          </div>
        </div>
        <div className="scale-90 flex-shrink-0">
          <WalletButton />
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col items-center px-6 relative z-10 transition-all duration-500 ${activeTab === 'skins' ? 'justify-start pt-10' : 'justify-center'} overflow-hidden`}>
        {activeTab === 'play' && (
          <>
            {/* Neon title */}
            <div className="text-center mb-6 sm:mb-8 animate-fade-in select-none">
              <h1 className="font-display font-black tracking-wider leading-none">
                <span className="block text-5xl sm:text-7xl lg:text-8xl bg-gradient-to-b from-white via-purple-300 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(280,100%,65%,0.6)]">
                  TOKEN
                </span>
                <span className="block text-5xl sm:text-7xl lg:text-8xl bg-gradient-to-b from-purple-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(38,100%,60%,0.5)] -mt-1 sm:-mt-2">
                  FRENZY
                </span>
              </h1>
            </div>

            {/* PLAY button */}
            <button
              onClick={() => onStart(selectedMode)}
              className="group relative mb-10 sm:mb-14 animate-fade-in btn-premium"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="absolute -inset-1.5 rounded-full opacity-50 blur-lg group-hover:opacity-70 transition-opacity"
                style={{ background: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-pink)), hsl(var(--neon-cyan)))' }} />
              <div className="relative flex items-center gap-3 px-14 sm:px-20 py-4 sm:py-5 rounded-full glass-panel-strong">
                <Gamepad2 className="w-6 h-6 text-foreground/80" />
                <span className="text-xl sm:text-2xl font-display font-bold tracking-[0.25em] text-foreground">
                  PLAY
                </span>
              </div>
            </button>

            {/* Mode selection cards */}
            <div className="flex gap-3 sm:gap-4 w-full max-w-2xl justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {modes.map((m) => {
                const isActive = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`flex-1 max-w-[200px] flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl transition-all duration-300
                      ${isActive ? 'glass-panel-strong scale-[1.03]' : 'glass-panel hover:scale-[1.02]'}
                    `}
                    style={{
                      borderColor: isActive ? `hsla(${m.glowHsl}, 0.4)` : undefined,
                      boxShadow: isActive ? `0 0 25px hsla(${m.glowHsl}, 0.2), inset 0 0 20px hsla(${m.glowHsl}, 0.05)` : undefined,
                    }}
                  >
                    <div className="transition-all duration-300" style={{
                      color: isActive ? m.neonColor : 'hsl(var(--muted-foreground))',
                      filter: isActive ? `drop-shadow(0 0 10px hsla(${m.glowHsl}, 0.5))` : undefined,
                      transform: isActive ? 'scale(1.1)' : undefined,
                    }}>
                      {m.icon}
                    </div>
                    <div>
                      <h3 className={`text-sm sm:text-base font-display font-bold tracking-wider transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {m.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 tracking-wider uppercase font-sans">
                        {m.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'skins' && (
          <div className="w-full max-w-5xl animate-fade-in px-4 overflow-hidden pb-10">
            <div className="text-center mb-6">
              <h2 className="text-4xl sm:text-5xl font-display font-black text-white mb-2 tracking-tight">
                ARENA SKINS
              </h2>
              <p className="text-muted-foreground/60 text-[9px] sm:text-[10px] font-display tracking-[0.4em] uppercase">
                Choose your battleground visual
              </p>
            </div>
            <BoardSkinSelector
              selectedId={selectedBoardId}
              onSelect={handleBoardSelect}
            />
          </div>
        )}

        {activeTab === 'rank' && (
          <div className="animate-fade-in w-full max-w-md mx-auto">
            <div className="glass-panel-strong rounded-3xl p-6">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Trophy className="w-7 h-7" style={{ color: 'hsl(var(--neon-amber))', filter: 'drop-shadow(0 0 10px hsla(38,100%,60%,0.4))' }} />
                <h2 className="text-xl font-display font-bold text-foreground">LEADERBOARD</h2>
              </div>

              {(() => {
                const entries = loadLeaderboard();
                if (entries.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No scores submitted yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Play a game and submit your score!</p>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    {entries.slice(0, 20).map((entry, i) => {
                      const medalColor = i === 0 ? 'hsl(var(--neon-amber))' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : undefined;
                      return (
                        <div
                          key={`${entry.address}-${entry.timestamp}`}
                          className="flex items-center gap-3 glass-panel rounded-xl px-3 py-2.5"
                          style={i < 3 ? { borderColor: `${medalColor}33` } : undefined}
                        >
                          <div className="w-7 text-center font-display font-bold text-sm" style={{ color: medalColor || 'hsl(var(--muted-foreground))' }}>
                            {i < 3 ? <Medal className="w-5 h-5 mx-auto" style={{ color: medalColor }} /> : `#${i + 1}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-mono text-muted-foreground">{shortenAddress(entry.address)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-display font-bold text-foreground">{entry.score.toLocaleString()}</span>
                            <span className="text-[10px] text-muted-foreground ml-1">pts</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground uppercase tracking-wider w-12 text-right">
                            {entry.mode === 'frustration' ? 'Frenzy' : entry.mode === 'zen' ? 'Chill' : 'Classic'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {progress.gamesPlayed > 0 && (
                <div className="mt-5 pt-4 border-t border-border/30 flex gap-6 justify-center">
                  <StatMini value={progress.totalScore.toLocaleString()} label="Your Total" />
                  <StatMini value={`${progress.bestCombo}x`} label="Best Combo" />
                  <StatMini value={String(progress.gamesPlayed)} label="Games" />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="w-full max-w-2xl animate-fade-in px-4 h-full overflow-y-auto pb-6 custom-scrollbar">
            <ProfileDashboard
              progress={progress}
              onToggleVertical={(val) => {
                setIsVertical(val);
                window.location.reload(); // Reload to apply aspect ratio changes
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-8 py-2 px-4 glass-panel-strong rounded-2xl">
        {([
          { id: 'rank' as BottomTab, icon: Trophy, label: 'Rank' },
          { id: 'play' as BottomTab, icon: Gamepad2, label: 'Play' },
          { id: 'skins' as BottomTab, icon: Paintbrush, label: 'Skins' },
          { id: 'profile' as BottomTab, icon: User, label: 'Profile' },
        ]).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-5 sm:px-7 py-2 rounded-xl transition-all duration-200
                  ${isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/60'
                }
                `}
              style={{
                background: isActive ? 'rgba(255,255,255,0.08)' : undefined,
                boxShadow: isActive ? '0 0 15px hsla(280,100%,65%,0.15)' : undefined,
              }}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-display tracking-wider">{tab.label.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

function ProfileDashboard({ progress, onToggleVertical }: { progress: any, onToggleVertical: (val: boolean) => void }) {
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const [localVertical, setLocalVertical] = useState(progress.isVertical);

  const toggleVertical = () => {
    const newVal = !localVertical;
    setLocalVertical(newVal);
    onToggleVertical(newVal);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRank = (score: number) => {
    if (score > 100000) return { name: 'TOKEN OVERLORD', color: 'hsl(var(--neon-purple))' };
    if (score > 50000) return { name: 'GRAND MASTER', color: 'hsl(var(--neon-pink))' };
    if (score > 10000) return { name: 'PRO CUTTER', color: 'hsl(var(--neon-cyan))' };
    return { name: 'RECRUIT', color: 'hsl(var(--muted-foreground))' };
  };

  const rank = getRank(progress.totalScore);

  return (
    <div className="flex flex-col gap-6">
      {/* Header / Identity Card */}
      <div className="glass-panel-heavy rounded-[2.5rem] p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-[80px] -mr-16 -mt-16" />
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
              <User className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-black border-2 border-purple-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-black tracking-tighter text-foreground mb-1 truncate">
              {isConnected ? shortenAddress(address!) : 'GUEST PLAYER'}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-display font-bold tracking-[0.2em] px-3 py-1 rounded-full bg-white/5 border border-white/10 whitespace-nowrap"
                style={{ color: rank.color, borderColor: `${rank.color}33` }}>
                {rank.name}
              </span>
              {isConnected && (
                <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="glass-panel-heavy rounded-[2rem] p-6 relative overflow-hidden border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-foreground">DISPLAY MODE</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Aspect Ratio Settings</p>
            </div>
          </div>
          <button
            onClick={toggleVertical}
            className="glass-panel rounded-full px-4 py-2 flex items-center gap-3 hover:bg-white/10 transition-all border-white/10"
          >
            <span className={`text-[10px] font-display font-bold tracking-widest ${localVertical ? 'text-purple-400' : 'text-muted-foreground'}`}>
              VERTICAL
            </span>
            <div className={`w-10 h-5 rounded-full p-1 transition-colors duration-300 ${localVertical ? 'bg-purple-500/30' : 'bg-white/10'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-300 ${localVertical ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className={`text-[10px] font-display font-bold tracking-widest ${!localVertical ? 'text-purple-400' : 'text-muted-foreground'}`}>
              FULL SCREEN
            </span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <ProfileStatCard
          icon={TrendingUp}
          label="Cumulative Score"
          value={progress.totalScore.toLocaleString()}
          color="hsl(var(--neon-purple))"
        />
        <ProfileStatCard
          icon={Target}
          label="Total Slices"
          value={progress.totalTokensSliced.toLocaleString()}
          color="hsl(var(--neon-cyan))"
        />
        <ProfileStatCard
          icon={Medal}
          label="Highest Combo"
          value={`${progress.bestCombo}x`}
          color="hsl(var(--neon-amber))"
        />
        <ProfileStatCard
          icon={Activity}
          label="Games Played"
          value={String(progress.gamesPlayed)}
          color="hsl(var(--neon-pink))"
        />
      </div>
    </div>
  );
}

function ProfileStatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass-panel-heavy rounded-3xl p-5 border-white/5 group hover:bg-white/[0.05] transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <span className="text-[10px] font-display font-bold tracking-wider text-muted-foreground block mb-0.5 uppercase">
          {label}
        </span>
        <span className="text-xl sm:text-2xl font-display font-black text-foreground tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
}

function StatMini({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <span className="text-foreground/70 font-semibold text-lg block">{value}</span>
      <span className="text-muted-foreground text-xs uppercase tracking-tight font-display">{label}</span>
    </div>
  );
}

export default MainMenu;
