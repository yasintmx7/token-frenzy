import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Zap, Flame, Waves, Gamepad2, Trophy, User, ShoppingBag,
  Lock, Coins, Shield as ShieldIcon, Star, Sparkles,
  CircleDashed, Gift, Wallet, Crown, Edit2, Copy, CheckCircle,
  TrendingUp, Target, Activity, Medal, ShieldCheck, Shield,
  FileText, ChevronRight, Check, X, Smile, Ghost, Bot,
  Settings, Volume2, Smartphone, Cpu, Trash2, Package, Sword
} from 'lucide-react';
import {
  ClassicIcon, FrenzyIcon, ChillIcon, SplitIcon, TwinIcon, LaserIcon
} from './GameModeIcons';
import { useNativeWallet } from '@/components/NativeWalletContext';
import { type GameMode } from '@/lib/gameEngine';
import {
  loadProgress, setSelectedBoard, setSelectedBlade, setSelectedFrame, setSelectedAvatar,
  buyFrame, buyBlade, buyBoard, buyAvatar, buyRevive, buyRevives, buyPowerUp, shortenAddress,
  saveProfile, saveSettings, resetProgress, getCloudProgress, restoreFromCloud, syncProgressToCloud, type PlayerProgress
} from '@/lib/storage';
import { computeLevelFromTotalXp, XP_CONFIG } from '@/lib/xp';
import { BOARD_THEMES } from '@/lib/boardThemes';
import { BLADE_SKINS, type BladeSkin } from '@/lib/bladeSkins';
import { TOKEN_FRAMES, type TokenFrame } from '@/lib/tokenFrames';
import { AVATARS, getAvatarById } from '@/lib/avatars';
import { setSFXEnabled, setMusicEnabled, updateMusic, resumeAudio, prewarmAudio, playSlice } from '@/lib/soundEngine';
import BoardSkinSelector from './BoardSkinSelector';
import { Leaderboard } from './Leaderboard';
import { LegalModal } from './LegalModals';
import WalletButton from './WalletButton';
import heroBg from '@/assets/hero-bg.webp';

function TrailPreview({ skin }: { skin: BladeSkin }) {
  const outer = skin.trail.outer.replace('{a}', '0.8');
  const inner = skin.trail.glow.replace('{a}', '1');
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-[120%] h-3 rotate-[-15deg] blur-[2px]" style={{
        background: `linear-gradient(90deg, transparent, ${outer} 20%, ${inner} 50%, ${outer} 80%, transparent)`,
        boxShadow: `0 0 20px ${inner}`
      }} />
      <div className="absolute w-[80%] h-1 rotate-[-15deg] bg-white blur-[1px]" />
    </div>
  );
}

function FramePreview({ frame }: { frame: TokenFrame }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 64;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const loop = () => {
      const time = Date.now() / 1000;
      ctx.clearRect(0, 0, size, size);

      const r = 14;
      const cx = size / 2;
      const cy = size / 2;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (frame.id !== 'default') {
        const glowColor = frame.glowColor;

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = `${frame.glowColor}${Math.floor(frame.auraOpacity * 100).toString(16).padStart(2, '0')}`;
        ctx.fill();
        ctx.restore();

        if (frame.id === 'glitch-nexus') {
          const glitchColors = ['#00ffff', '#ff00ff', '#ffffff'];
          for (let i = 0; i < 6; i++) {
            const angle = (time * 2 + i) % (Math.PI * 2);
            const dist = r * (0.8 + Math.random() * 0.4);
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            ctx.fillStyle = glitchColors[Math.floor(Math.random() * glitchColors.length)];
            ctx.globalAlpha = 0.5;
            ctx.fillRect(x - 2, y - 4, 4, 8);
          }
        }

        if (frame.id === 'stardust-burst') {
          ctx.save();
          ctx.strokeStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 5;
          for (let i = 0; i < 8; i++) {
            const angle = (time * 1.5 + i * (Math.PI / 4));
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            const len = r * (0.4 + Math.sin(time * 10 + i) * 0.2);
            ctx.lineTo(Math.cos(angle) * (r + len), Math.sin(angle) * (r + len));
            ctx.stroke();
          }
          ctx.restore();
        }

        if (frame.id === 'nebula-spiral') {
          ctx.save();
          ctx.lineWidth = 4;
          for (let i = 0; i < 4; i++) {
            const startAngle = time * 3 + i * (Math.PI / 2);
            ctx.strokeStyle = i % 2 === 0 ? '#ffffff' : '#f0abfc';
            ctx.beginPath();
            for (let step = 0; step < 15; step++) {
              const angle = startAngle + step * 0.15;
              const d = r * (0.8 + step * 0.05);
              if (step === 0) ctx.moveTo(Math.cos(angle) * d, Math.sin(angle) * d);
              else ctx.lineTo(Math.cos(angle) * d, Math.sin(angle) * d);
            }
            ctx.stroke();
          }
          ctx.restore();
        }

        if (frame.id === 'titan-guard') {
          ctx.save();
          const shieldCount = 4;
          for (let i = 0; i < shieldCount; i++) {
            const angle = time * 3 + (i * Math.PI * 2 / shieldCount);
            const dist = r * 1.25;
            ctx.save();
            ctx.translate(Math.cos(angle) * dist, Math.sin(angle) * dist);
            ctx.rotate(angle);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(-2, -6, 4, 12);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, 8, -0.5, 0.5);
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        }

        if (frame.id === 'hypnotic-vortex') {
          ctx.save();
          for (let i = 0; i < 3; i++) {
            const startAngle = time * 3 + i * (Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.lineWidth = 6;
            ctx.strokeStyle = i % 2 === 0 ? '#333' : '#eee';
            for (let step = 0; step < 20; step++) {
              const angle = startAngle + step * 0.2;
              const d = r * (0.7 + step * 0.1);
              if (step === 0) ctx.moveTo(Math.cos(angle) * d, Math.sin(angle) * d);
              else ctx.lineTo(Math.cos(angle) * d, Math.sin(angle) * d);
            }
            ctx.stroke();
          }
          ctx.restore();
        }

        if (frame.id === 'energy-nova') {
          ctx.save();
          for (let i = 0; i < 10; i++) {
            const a = (time * 5 + i) % (Math.PI * 2);
            const d = r * (0.9 + Math.sin(time * 8 + i) * 0.1);
            ctx.fillStyle = i % 2 === 0 ? '#00ffff' : '#fff';
            ctx.beginPath();
            ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        if (frame.id === 'void-vortex') {
          ctx.save();
          ctx.strokeStyle = '#7c3aed';
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            const startAngle = time * 2 + i * (Math.PI / 2);
            ctx.beginPath();
            for (let step = 0; step < 15; step++) {
              const angle = startAngle + step * 0.15;
              const d = r * (1 + step * 0.05);
              ctx.lineTo(Math.cos(angle) * d, Math.sin(angle) * d);
            }
            ctx.stroke();
          }
          ctx.restore();
        }

        if (frame.id === 'plasma-saw') {
          ctx.save();
          ctx.rotate(time * 10);
          ctx.fillStyle = '#ef4444';
          for (let i = 0; i < 6; i++) {
            const angle = i * (Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.lineTo(Math.cos(angle + 0.2) * r * 1.5, Math.sin(angle + 0.2) * r * 1.5);
            ctx.lineTo(Math.cos(angle + 0.4) * r, Math.sin(angle + 0.4) * r);
            ctx.fill();
          }
          ctx.restore();
        }

        if (frame.id === 'radar-pulse') {
          ctx.save();
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1;
          const pulseR = r * (1 + (time % 0.5) * 2);
          ctx.beginPath();
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.rotate(time * 4);
          ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, r * 1.5, -0.4, 0.4, false);
          ctx.fill();
          ctx.restore();
        }

        if (frame.ringWidth > 0) {
          ctx.strokeStyle = frame.borderColor;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [frame]);

  return <canvas ref={canvasRef} className="w-16 h-16 pointer-events-none" />;
}

interface MainMenuProps {
  onStart: (mode: GameMode) => void;
  initialTab?: BottomTab;
  hasPass: boolean | null;
  onRequestMint: () => void;
}

type BottomTab = 'play' | 'rank' | 'shop' | 'profile' | 'settings';

const modes: { id: GameMode; title: string; desc: string; icon: React.ReactNode; neonColor: string; glowHsl: string }[] = [
  {
    id: 'classic',
    title: 'CLASSIC',
    desc: 'Stable spawns + combos',
    icon: <ClassicIcon size={32} />,
    neonColor: 'hsl(38, 100%, 60%)',
    glowHsl: '38, 100%, 60%',
  },
  {
    id: 'frustration',
    title: 'FRENZY',
    desc: 'Fast spawns + bombs',
    icon: <FrenzyIcon size={32} />,
    neonColor: 'hsl(15, 100%, 60%)',
    glowHsl: '15, 100%, 60%',
  },
  {
    id: 'zen',
    title: 'CHILL',
    desc: 'Relax gameplay',
    icon: <ChillIcon size={32} />,
    neonColor: 'hsl(185, 100%, 60%)',
    glowHsl: '185, 100%, 60%',
  },
  {
    id: 'timewarp',
    title: 'SPLIT',
    desc: 'Multiply on hit',
    icon: <SplitIcon size={32} />,
    neonColor: 'hsl(280, 100%, 65%)',
    glowHsl: '280, 100%, 65%',
  },
  {
    id: 'void',
    title: 'TWIN',
    desc: 'Match Pairs',
    icon: <TwinIcon size={32} />,
    neonColor: 'hsl(140, 80%, 50%)',
    glowHsl: '140, 80%, 50%',
  },
  {
    id: 'laser',
    title: 'LASER',
    desc: '4x Death Beams',
    icon: <LaserIcon size={32} />,
    neonColor: 'hsl(0, 100%, 60%)',
    glowHsl: '0, 100%, 60%',
  },
];

const MainMenu = ({ onStart, initialTab = 'play', hasPass, onRequestMint }: MainMenuProps) => {
  const [progress, setProgress] = useState(loadProgress());
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [activeTab, setActiveTab] = useState<BottomTab>(initialTab);
  const [selectedBoardId, setSelectedBoardId] = useState(progress.selectedBoard);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({ isOpen: false, type: 'privacy' });
  const { connected, walletAddress, connect } = useNativeWallet();
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [cloudData, setCloudData] = useState<PlayerProgress | null>(null);

  useEffect(() => {
    if (connected && walletAddress && progress.gamesPlayed === 0) {
      const checkCloud = async () => {
        const data = await getCloudProgress(walletAddress);
        if (data && (data.totalScore > 0 || data.ownedBoards.length > 3)) {
          setCloudData(data);
          setShowRestorePrompt(true);
        }
      };
      checkCloud();
    }
  }, [connected, walletAddress, progress.gamesPlayed]);

  const handleRestore = () => {
    if (cloudData) {
      restoreFromCloud(cloudData);
      setProgress(loadProgress());
      setShowRestorePrompt(false);
    }
  };

  useEffect(() => {
    updateMusic();
  }, []);

  const handleBoardSelect = (id: string) => {
    setSelectedBoardId(id);
    setSelectedBoard(id);
  };

  const handlePlayClick = () => {
    onStart(selectedMode);
  };

  const [isLandscape, setIsLandscape] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (activeTab === 'play') {
      window.Android?.setState('home');
      window.handleAndroidBack = undefined;
    } else {
      window.Android?.setState('subtab');
      window.handleAndroidBack = () => {
        setActiveTab('play');
      };
    }
    return () => {
      window.handleAndroidBack = undefined;
    };
  }, [activeTab]);

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden bg-background"
      onClick={() => { prewarmAudio(); resumeAudio(); }}
      onTouchStart={() => { prewarmAudio(); resumeAudio(); }}
    >
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className={`absolute inset-0 transition-all duration-700 ${activeTab === 'shop' ? 'bg-black/80' : 'bg-black/55'}`} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between px-4 pt-5 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="glass-panel-strong rounded-full px-4 py-2 flex items-center gap-3 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-fade-in flex-shrink-0">
            <Coins className="w-5 h-5 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' }} />
            <span className="text-lg font-display font-black text-amber-400 neon-text-amber tabular-nums leading-none">
              {progress.totalScore.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="animate-fade-in">
          <WalletButton />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {activeTab === 'play' && (
          <div className={`flex-1 flex ${isLandscape ? 'flex-row items-center justify-center px-10 gap-10' : 'flex-col items-center justify-center px-5 gap-4 overflow-y-auto pb-32'}`}>
            <div className={`flex flex-col items-center gap-2 ${isLandscape ? 'flex-[0.8]' : ''}`}>
              <div className="text-center select-none animate-fade-in origin-bottom">
                <h1 className="font-display font-black tracking-wider leading-none">
                  <span className={`block ${isLandscape ? 'text-4xl' : 'text-5xl sm:text-6xl'} bg-gradient-to-b from-white via-purple-300 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(280,100%,65%,0.6)]`}>
                    TOKEN
                  </span>
                  <span className={`block ${isLandscape ? 'text-4xl' : 'text-5xl sm:text-6xl'} bg-gradient-to-b from-purple-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(38,100%,60%,0.5)] -mt-2`}>
                    FRENZY
                  </span>
                </h1>
              </div>

              <button
                onClick={handlePlayClick}
                className="group relative animate-fade-in btn-premium mt-6 hover:scale-105 active:scale-95 transition-transform"
              >
                <div className="absolute -inset-2 rounded-full opacity-50 blur-xl group-hover:opacity-80 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-pink)), hsl(var(--neon-cyan)))' }} />
                <div className="relative flex items-center gap-4 px-12 sm:px-14 py-4 sm:py-5 rounded-full glass-panel-strong shadow-[0_0_30px_rgba(168,85,247,0.4)] border-white/10">
                  <Gamepad2 className="w-5 sm:w-6 h-5 sm:h-6 text-foreground/80" />
                  <span className="text-lg sm:text-xl font-display font-black tracking-[0.25em] text-foreground uppercase">
                    PLAY
                  </span>
                </div>
              </button>
            </div>

            <div className={`grid grid-cols-3 gap-2 animate-fade-in ${isLandscape ? 'flex-[1.2] w-full max-w-xl' : 'w-full max-w-md mx-auto mt-4'}`}>
              {modes.map((m) => {
                const isActive = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl transition-all duration-300
                      ${isActive ? 'glass-panel-strong scale-[1.03]' : 'glass-panel hover:scale-[1.02]'}
                      ${isLandscape ? 'min-h-[110px]' : ''}
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
                    <h3 className={`text-[10px] sm:text-[11px] font-display font-bold tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {m.title}
                    </h3>
                    <p className="text-[7px] sm:text-[8px] text-muted-foreground text-center tracking-wide uppercase font-sans leading-tight px-1">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <ShopManager
            hasPass={hasPass}
            onRefresh={() => setProgress(loadProgress())}
            walletAddress={walletAddress || undefined}
          />
        )}

        {activeTab === 'rank' && (
          <div className="flex-1 px-4 pt-4 pb-32 animate-fade-in flex flex-col items-center overflow-hidden h-full">
            <div className="w-full max-w-lg flex flex-col h-full">
              <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
                <Trophy className="w-7 h-7" style={{ color: 'hsl(var(--neon-amber))' }} />
                <h2 className="text-2xl font-display font-black text-foreground tracking-tight">HALL OF FAME</h2>
              </div>
              <div className="flex-1 min-h-0">
                <Leaderboard />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32 flex flex-col items-center animate-fade-in custom-scrollbar">
            <div className="w-full max-w-lg">
              <ProfileDashboard
                progress={progress}
                onOpenLegal={(type) => setLegalModal({ isOpen: true, type })}
                isLandscape={isLandscape}
                hasPass={hasPass}
                onRequestMint={onRequestMint}
                onRefresh={() => setProgress(loadProgress())}
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            settings={progress.settings}
            onSave={(newSettings) => {
              saveSettings(newSettings);
              setProgress({ ...progress, settings: newSettings });
              setSFXEnabled(newSettings.sfxEnabled);
              setMusicEnabled(newSettings.musicEnabled);
              if (newSettings.sfxEnabled) playSlice();
            }}
          />
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center glass-panel-strong rounded-2xl overflow-hidden w-full max-w-sm border border-white/10 shadow-lg shadow-black/50">
          {([
            { id: 'rank' as BottomTab, icon: Trophy, label: 'RANK' },
            { id: 'shop' as BottomTab, icon: ShoppingBag, label: 'SHOP' },
            { id: 'play' as BottomTab, icon: Gamepad2, label: 'PLAY' },
            { id: 'profile' as BottomTab, icon: User, label: 'PROFILE' },
            { id: 'settings' as BottomTab, icon: Settings, label: 'CONFIG' },
          ]).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 min-w-0
                  ${isActive ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}
                `}
              >
                <tab.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[9px] font-display font-bold tracking-wider truncate w-full text-center">{tab.label}</span>
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

      {showRestorePrompt && cloudData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-[320px] glass-panel-strong rounded-[32px] p-8 flex flex-col items-center text-center gap-6 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-scale-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border-2 border-amber-500/40 animate-bounce-subtle">
              <CloudSync className="w-9 h-9 text-amber-500" />
            </div>

            <div>
              <h3 className="text-xl font-display font-black text-white uppercase tracking-tighter">Restore Progress?</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                We found existing progress on the cloud for this wallet.
              </p>
            </div>

            <div className="w-full grid grid-cols-2 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-left">
                <div className="text-[8px] font-bold text-muted-foreground uppercase">SCORE</div>
                <div className="text-sm font-black text-amber-400">{cloudData.totalScore.toLocaleString()}</div>
              </div>
              <div className="text-left">
                <div className="text-[8px] font-bold text-muted-foreground uppercase">XP</div>
                <div className="text-sm font-black text-cyan-400">{cloudData.totalXp.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleRestore}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/30 active:scale-95 transition-all"
              >
                RESTORE DATA
              </button>
              <button
                onClick={() => setShowRestorePrompt(false)}
                className="w-full py-3 rounded-xl bg-white/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-white transition-colors"
              >
                START FRESH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AVATAR_COLORS = [
  'linear-gradient(135deg,#9333ea,#ec4899)',
  'linear-gradient(135deg,#eab308,#f97316)',
  'linear-gradient(135deg,#22d3ee,#3b82f6)',
  'linear-gradient(135deg,#10b981,#14b8a6)',
  'linear-gradient(135deg,#f43f5e,#fbbf24)'
];

function ProfileDashboard({ progress, onOpenLegal, isLandscape, hasPass, onRequestMint, onRefresh }: {
  progress: any,
  onOpenLegal: (type: 'privacy' | 'terms') => void,
  isLandscape?: boolean;
  hasPass?: boolean | null;
  onRequestMint: () => void;
  onRefresh: () => void;
}) {
  const { walletAddress: publicKey, connected } = useNativeWallet();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(progress.username || '');
  const [editAvatar, setEditAvatar] = useState(progress.avatarIndex || 0);
  const levelInfo = computeLevelFromTotalXp(progress.totalXp);

  const currentAvatarData = getAvatarById(progress.selectedAvatar);

  const getRank = (score: number) => {
    if (score > 100000) return { name: 'TOKEN OVERLORD', color: '#c084fc', glow: 'rgba(192,132,252,0.25)' };
    if (score > 50000) return { name: 'GRAND MASTER', color: '#f472b6', glow: 'rgba(244,114,182,0.25)' };
    if (score > 10000) return { name: 'PRO CUTTER', color: '#22d3ee', glow: 'rgba(34,211,238,0.25)' };
    return { name: 'RECRUIT', color: '#94a3b8', glow: 'rgba(148,163,184,0.15)' };
  };
  const rank = getRank(progress.totalScore);

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard?.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayName = progress.username ? progress.username : (connected && publicKey
    ? shortenAddress(publicKey.toString())
    : 'GUEST PLAYER');

  const handleSave = () => {
    saveProfile(editName, editAvatar);
    progress.username = editName;
    progress.avatarIndex = editAvatar;
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(progress.username || '');
    setEditAvatar(progress.avatarIndex || 0);
    setIsEditing(false);
  };

  return (
    <div className={`flex w-full ${isLandscape ? 'flex-row items-stretch justify-center gap-6' : 'flex-col gap-4'}`}>
      <div className={`flex flex-col gap-4 ${isLandscape ? 'flex-[0.8]' : 'w-full'}`}>
        {isEditing ? (
          <div
            className="rounded-2xl p-4 flex flex-col gap-4 animate-fade-in w-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <p className="text-[10px] font-display font-black text-purple-400 tracking-[0.2em] uppercase text-center">Customize Profile</p>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.slice(0, 8).map((avatar) => {
                const isOwned = avatar.tier === 'free' || progress.ownedAvatars?.includes(avatar.id);
                return (
                  <button
                    key={avatar.id}
                    onClick={() => isOwned && setEditAvatar(avatar.id)}
                    className={`aspect-square rounded-xl flex items-center justify-center p-1 relative ${editAvatar === avatar.id ? 'ring-2 ring-white scale-105 bg-white/10' : 'bg-black/40 opacity-40 hover:opacity-100'}`}
                    disabled={!isOwned}
                  >
                    <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: avatar.svg }} />
                    {!isOwned && <Lock className="absolute w-3 h-3 text-white/40" />}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter Username"
              className="bg-black/50 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm font-display text-center outline-none focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
              maxLength={15}
            />
            <div className="flex gap-2 w-full">
              <button onClick={handleCancel} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 transition-colors rounded-xl py-3 text-[10px] font-black font-display tracking-widest border border-white/5">
                CANCEL
              </button>
              <button onClick={() => {
                saveProfile(editName, 0);
                setSelectedAvatar(editAvatar);
                onRefresh();
                setIsEditing(false);
              }} className="flex-1 bg-purple-500 hover:bg-purple-400 text-white transition-colors rounded-xl py-3 text-[10px] font-black font-display tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                SAVE CHANGES
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl p-4 flex flex-col gap-4 animate-fade-in relative w-full ${hasPass ? 'overflow-hidden' : ''}`}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: hasPass ? '2px solid rgba(251,191,36,0.6)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: hasPass ? 'inset 0 0 20px rgba(251,191,36,0.15), 0 0 15px rgba(251,191,36,0.2)' : 'none'
            }}
          >
            {hasPass && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.15),transparent_70%)] pointer-events-none" />
            )}
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="relative flex-shrink-0">
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center p-1 overflow-hidden bg-black/60 ${hasPass ? 'border-2 border-yellow-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)]' : 'border border-white/10'}`}>
                  <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: currentAvatarData.svg }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {hasPass && <Crown className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />}
                  <p className="text-base font-display font-black text-white leading-tight truncate tracking-tight">{displayName}</p>
                  <button onClick={() => setIsEditing(true)} className="p-1 rounded-lg bg-white/5 hover:bg-white/15 transition-all border border-white/10 ml-0.5">
                    <Edit2 className="w-3 h-3 text-white/50" />
                  </button>
                  {hasPass && (
                    <div className="ml-auto bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 text-black text-[7px] font-black px-2 py-1 rounded-md shadow-lg border border-white/30 animate-pulse flex items-center gap-1 shrink-0">
                      <Trophy className="w-2 h-2" /> GAME PASS
                    </div>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border" style={{ color: rank.color, background: `${rank.color}15`, borderColor: `${rank.color}30` }}>
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-display font-black tracking-widest uppercase">{rank.name}</span>
                  </div>
                  {connected && publicKey && (
                    <button onClick={copyAddress} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                      {copied ? <CheckCircle className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-white/40" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {progress.dailyStreak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-md px-2 py-0.5 w-fit relative z-10">
                <Flame className="w-3 h-3 text-orange-400 fill-orange-400/20" />
                <span className="text-[9px] font-display font-black text-orange-400 tracking-wider uppercase">{progress.dailyStreak} DAY STREAK</span>
              </div>
            )}
            <div className="flex flex-col gap-1.5 relative z-10 w-full">
              <div className="flex items-center justify-between leading-none">
                <span className="text-[10px] font-display font-black text-cyan-400 tracking-wider uppercase">Level {levelInfo.level}</span>
                <span className="text-[9px] text-white/40 font-bold">{levelInfo.xpIntoLevel} / {levelInfo.xpForNext} XP</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all duration-1000" style={{ width: `${Math.min(100, (levelInfo.xpIntoLevel / levelInfo.xpForNext) * 100)}%` }} />
              </div>
            </div>
          </div>
        )}

        {!hasPass && !progress.hasPremiumAccess && connected && (
          <div onClick={onRequestMint} className="cursor-pointer rounded-2xl p-4 flex items-center justify-between border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 hover:from-amber-500/20 hover:to-amber-500/20 transition-all group animate-fade-in w-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400/20" />
              </div>
              <div>
                <h4 className="text-sm font-display font-black text-white leading-tight">GET GAME PASS</h4>
                <p className="text-[10px] text-white/50 mt-0.5 uppercase tracking-widest">Lifetime Access</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-display font-black text-amber-400">0.013 SOL</p>
              <p className="text-[9px] text-white/30 uppercase tracking-widest">LEGENDARY</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in w-full" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] font-display font-black text-emerald-400 tracking-[0.2em] uppercase">Inventory</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">
                <span>Blades</span>
                <span className="text-white/60">{progress.ownedBlades?.length || 1} / {BLADE_SKINS.length}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${((progress.ownedBlades?.length || 1) / BLADE_SKINS.length) * 100}%` }} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">
                <span>Frames</span>
                <span className="text-white/60">{progress.ownedFrames?.length || 1} / {TOKEN_FRAMES.length}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${((progress.ownedFrames?.length || 1) / TOKEN_FRAMES.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`flex flex-col gap-4 ${isLandscape ? 'flex-[1.2]' : 'w-full'}`}>
        <div className="grid grid-cols-2 gap-3 w-full">
          {[
            { icon: TrendingUp, label: 'TOTAL SCORE', value: progress.totalScore.toLocaleString(), color: '#c084fc', bg: 'rgba(192,132,252,0.09)', border: 'rgba(192,132,252,0.2)' },
            { icon: Target, label: 'SLICED', value: progress.totalTokensSliced.toLocaleString(), color: '#22d3ee', bg: 'rgba(34,211,238,0.09)', border: 'rgba(34,211,238,0.2)' },
            { icon: Medal, label: 'BEST COMBO', value: `${progress.bestCombo}x`, color: '#fbbf24', bg: 'rgba(251,191,36,0.09)', border: 'rgba(251,191,36,0.2)' },
            { icon: Activity, label: 'GAMES PLAYED', value: String(progress.gamesPlayed), color: '#f472b6', bg: 'rgba(244,114,182,0.09)', border: 'rgba(244,114,182,0.2)' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col justify-center w-full" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-4 h-4" style={{ color }} />
                <p className="text-[10px] font-display font-bold tracking-widest uppercase truncate" style={{ color }}>{label}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-display font-black text-white leading-none truncate">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-auto w-full">
          <button onClick={() => onOpenLegal('privacy')} className="w-full rounded-xl px-4 py-3 flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-display font-bold text-white">Privacy Policy</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 ml-auto" />
          </button>
          <button onClick={() => onOpenLegal('terms')} className="w-full rounded-xl px-4 py-3 flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-display font-bold text-white">Terms &amp; Conditions</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 ml-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}

const TREASURY = 'pR7YkBj2AsRLB7sSNJEyaSnengSF3c9UUQDH1y26NBi';

function buySolItem(solAmount: number, type: 'board' | 'frame' | 'blade' | 'avatar', id: string, refresh: () => void) {
  if (!window.Android) { alert('Wallet not available'); return; }

  localStorage.setItem('pending-purchase', JSON.stringify({
    type,
    itemId: id,
    timestamp: Date.now()
  }));

  (window.Android as any).sendSol(TREASURY, solAmount);
}

function buySolRevive(solAmount: number, qty: number, refresh: () => void) {
  if (!window.Android) { alert('Wallet not available'); return; }

  localStorage.setItem('pending-purchase', JSON.stringify({
    type: 'revive',
    qty: qty,
    timestamp: Date.now()
  }));

  (window.Android as any).sendSol(TREASURY, solAmount);
}

function buyFullBundle(refresh: () => void) {
  if (!window.Android) { alert('Wallet not available'); return; }

  localStorage.setItem('pending-purchase', JSON.stringify({
    type: 'bundle',
    timestamp: Date.now()
  }));

  (window.Android as any).sendSol(TREASURY, 0.12);
}

function BundleBanner({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div onClick={() => buyFullBundle(onRefresh)}
      className="cursor-pointer rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-500/10 via-amber-400/10 to-yellow-500/10 p-4 flex items-center justify-between hover:from-yellow-500/20 hover:to-yellow-500/20 transition-all">
      <div>
        <p className="text-xs font-display font-black text-yellow-400 tracking-widest uppercase">💎 FULL BUNDLE</p>
        <p className="text-[10px] text-white/50 mt-0.5">All arenas • frames • trails unlocked</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-display font-black text-yellow-400">0.12 SOL</p>
        <p className="text-[9px] text-white/30 uppercase tracking-wider">Best Value</p>
      </div>
    </div>
  );
}

function ShopManager({ hasPass: hasPassRaw, onRefresh, walletAddress }: { hasPass: boolean | null, onRefresh: () => void, walletAddress?: string }) {
  const [subTab, setSubTab] = useState<'arena' | 'frames' | 'trails' | 'upgrades' | 'avatars'>('arena');
  const [progress, setProgress] = useState(loadProgress());
  // Coerce null → false so ownership checks work correctly before wallet check completes
  const hasPass = !!hasPassRaw || progress.hasPremiumAccess;
  const refresh = () => {
    setProgress(loadProgress());
    onRefresh();
    if (walletAddress) {
      syncProgressToCloud(walletAddress);
    }
  };

  const handleBuyFrame = (id: string, cost: number) => { if (buyFrame(id, cost)) { setSelectedFrame(id); refresh(); } };
  const handleBuyBlade = (id: string, cost: number) => { if (buyBlade(id, cost)) { setSelectedBlade(id); refresh(); } };
  const handleBuyBoard = (id: string, cost: number) => { if (buyBoard(id, cost)) { setSelectedBoard(id); refresh(); } };
  const handleBuyAvatar = (id: string, cost: number) => { if (buyAvatar(id, cost)) { setSelectedAvatar(id); refresh(); } };

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-display font-black text-white tracking-tight">ARENA SHOP</h2>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-[9px] text-white/40 font-display tracking-[0.2em] uppercase">Premium Inventory</p>
          </div>
        </div>
      </div>

      <div className="flex px-4 gap-2 mb-4 overflow-x-auto no-scrollbar flex-shrink-0">
        {([
          { id: 'arena', label: 'ARENAS', icon: ShieldIcon },
          { id: 'frames', label: 'FRAMES', icon: CircleDashed },
          { id: 'trails', label: 'TRAILS', icon: Sword },
          { id: 'avatars', label: 'AVATARS', icon: User },
          { id: 'upgrades', label: 'UPGRADES', icon: Zap },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-display font-black tracking-widest transition-all whitespace-nowrap
              ${subTab === id ? 'bg-white text-black' : 'glass-panel text-white/60 hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-32">
        {subTab === 'arena' && (
          <div className="flex flex-col gap-4">
            <BundleBanner onRefresh={refresh} />
            <div className="grid grid-cols-2 gap-3">
              {BOARD_THEMES.map((theme) => {
                const isPassPerk = theme.id === 'void-whisper';
                const isOwned = theme.tier === 'free' || progress.ownedBoards.includes(theme.id) || (theme.tier === 'pass' && hasPass);
                const isSelected = theme.id === progress.selectedBoard;
                return (
                  <ShopItem key={theme.id} title={theme.name} subtitle={theme.description}
                    image={theme.preview} emoji={theme.emoji} selected={isSelected} owned={isOwned}
                    tier={theme.tier} cost={theme.cost} solPrice={theme.solPrice} isPassPerk={isPassPerk}
                    onAction={() => {
                      if (isOwned) { setSelectedBoard(theme.id, hasPass); refresh(); }
                      else if (theme.tier === 'sol' && theme.solPrice) buySolItem(theme.solPrice, 'board', theme.id, refresh);
                      else handleBuyBoard(theme.id, theme.cost);
                    }}
                    canAfford={progress.totalScore >= theme.cost}
                  />
                );
              })}
            </div>
          </div>
        )}

        {subTab === 'frames' && (
          <div className="flex flex-col gap-4">
            <BundleBanner onRefresh={refresh} />
            <div className="grid grid-cols-2 gap-3">
              {TOKEN_FRAMES.map(f => {
                const isPassPerk = f.id === 'stardust-burst';
                const isOwned = f.tier === 'free' || progress.ownedFrames.includes(f.id) || (f.tier === 'pass' && hasPass);
                const isSelected = progress.selectedFrame === f.id;
                return (
                  <ShopItem key={f.id} title={f.name} subtitle={f.description}
                    selected={isSelected} owned={isOwned} tier={f.tier} cost={f.cost} solPrice={f.solPrice} frame={f} isPassPerk={isPassPerk}
                    onAction={() => {
                      if (isOwned) { setSelectedFrame(f.id, hasPass); refresh(); }
                      else if (f.tier === 'sol' && f.solPrice) buySolItem(f.solPrice, 'frame', f.id, refresh);
                      else handleBuyFrame(f.id, f.cost);
                    }}
                    canAfford={progress.totalScore >= f.cost}
                  />
                );
              })}
            </div>
          </div>
        )}

        {subTab === 'trails' && (
          <div className="flex flex-col gap-4">
            <BundleBanner onRefresh={refresh} />
            <div className="grid grid-cols-2 gap-3">
              {BLADE_SKINS.map(b => {
                const isPassPerk = b.id === 'lava-slash';
                const isOwned = b.tier === 'free' || progress.ownedBlades.includes(b.id) || (b.tier === 'pass' && hasPass);
                const isSelected = progress.selectedBlade === b.id;
                return (
                  <ShopItem key={b.id} title={b.name} subtitle={b.description}
                    emoji={b.emoji} selected={isSelected} owned={isOwned} tier={b.tier} cost={b.cost} solPrice={b.solPrice} trail={b} isPassPerk={isPassPerk}
                    onAction={() => {
                      if (isOwned) { setSelectedBlade(b.id, hasPass); refresh(); }
                      else if (b.tier === 'sol' && b.solPrice) buySolItem(b.solPrice, 'blade', b.id, refresh);
                      else handleBuyBlade(b.id, b.cost);
                    }}
                    canAfford={progress.totalScore >= b.cost}
                  />
                );
              })}
            </div>
          </div>
        )}

        {subTab === 'avatars' && (
          <div className="flex flex-col gap-4">
            <BundleBanner onRefresh={refresh} />
            <div className="grid grid-cols-2 gap-3">
              {AVATARS.map(a => {
                const isPassPerk = a.id === 'legendary-pass';
                const isOwned = a.tier === 'free' || progress.ownedAvatars.includes(a.id) || (a.tier === 'pass' && hasPass);
                const isSelected = progress.selectedAvatar === a.id;
                return (
                  <ShopItem key={a.id} title={a.name} subtitle={a.description}
                    selected={isSelected} owned={isOwned} tier={a.tier} cost={a.cost} solPrice={a.solPrice} avatar={a} isPassPerk={isPassPerk}
                    onAction={() => {
                      if (isOwned) { setSelectedAvatar(a.id, hasPass); refresh(); }
                      else if (a.tier === 'sol' && a.solPrice) buySolItem(a.solPrice, 'avatar', a.id, refresh);
                      else handleBuyAvatar(a.id, a.cost);
                    }}
                    canAfford={progress.totalScore >= a.cost}
                  />
                );
              })}
            </div>
          </div>
        )}

        {subTab === 'upgrades' && (
          <div className="flex flex-col gap-6">
            <div className="glass-panel-strong p-5 rounded-3xl border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Flame className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-lg font-display font-black text-white">PHOENIX REVIVE</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Consumable • {progress.revives} Owned</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => buySolRevive(0.0025, 1, refresh)}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 font-bold hover:bg-yellow-400/20 transition-all text-xs">
                  <span>1x</span><span>0.0025 SOL</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => buySolRevive(0.010, 5, refresh)}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 font-bold hover:bg-yellow-400/20 transition-all text-xs">
                  <span>5x</span><span>0.010 SOL</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => buySolRevive(0.015, 10, refresh)}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 font-bold hover:bg-yellow-400/20 transition-all text-xs">
                  <span>10x</span><span>0.015 SOL</span>
                </button>
              </div>
            </div>

            <div className="glass-panel-strong p-5 rounded-3xl border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <Sparkles className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-black text-white leading-tight">MIDAS TOUCH</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Gold Rush • {progress.midasTouch} Owned</p>
                  </div>
                </div>
                <button onClick={() => { if (buyPowerUp('midas-touch', 1, 500000)) refresh(); }} disabled={progress.totalScore < 500000}
                  className={`px-5 py-3 rounded-2xl font-display font-black tracking-widest text-[11px] transition-all
                    ${progress.totalScore >= 500000 ? 'bg-yellow-500 text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}`}>
                  1x (500K)
                </button>
              </div>
              <button onClick={() => { if (buyPowerUp('midas-touch', 5, 2500000)) refresh(); }} disabled={progress.totalScore < 2500000}
                className="flex justify-between items-center px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 font-bold hover:bg-yellow-500/20 transition-all text-xs disabled:opacity-50 disabled:border-white/5 disabled:bg-white/5 disabled:text-white/20">
                <span>5x Pack</span><span className="flex items-center gap-1"><Coins className="w-3 h-3" /> 2.5M</span>
              </button>
            </div>

            <div className="glass-panel-strong p-5 rounded-3xl border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    <Sword className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-black text-white leading-tight">MEGA BLADE</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">3x Width • {progress.megaBlade} Owned</p>
                  </div>
                </div>
                <button onClick={() => { if (buyPowerUp('mega-blade', 1, 500000)) refresh(); }} disabled={progress.totalScore < 500000}
                  className={`px-5 py-3 rounded-2xl font-display font-black tracking-widest text-[11px] transition-all
                    ${progress.totalScore >= 500000 ? 'bg-cyan-500 text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}`}>
                  1x (500K)
                </button>
              </div>
              <button onClick={() => { if (buyPowerUp('mega-blade', 5, 2000000)) refresh(); }} disabled={progress.totalScore < 2000000}
                className="flex justify-between items-center px-4 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 font-bold hover:bg-cyan-500/20 transition-all text-xs disabled:opacity-50 disabled:border-white/5 disabled:bg-white/5 disabled:text-white/20">
                <span>5x Pack</span><span className="flex items-center gap-1"><Coins className="w-3 h-3" /> 2M</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopItem({
  title,
  subtitle,
  image,
  emoji,
  selected,
  locked,
  owned,
  cost,
  onAction,
  canAfford,
  frame,
  trail,
  avatar,
  tier,
  solPrice,
  isPassPerk,
}: {
  title: string;
  subtitle: string;
  image?: string;
  emoji?: string;
  selected?: boolean;
  locked?: boolean;
  owned?: boolean;
  cost: number;
  onAction: () => void;
  canAfford?: boolean;
  frame?: TokenFrame;
  trail?: BladeSkin;
  avatar?: any;
  tier?: 'free' | 'coins' | 'sol' | 'pass';
  solPrice?: number;
  isPassPerk?: boolean;
}) {
  return (
    <div
      onClick={onAction}
      className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 group cursor-pointer backdrop-blur-md h-full
        ${selected ? 'ring-2 ring-cyan-400 bg-white/10' : 'border border-white/10 hover:border-white/30 bg-black/40 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black'}
      `}
      style={{
        boxShadow: selected ? '0 0 40px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)' : 'none'
      }}
    >
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent pointer-events-none animate-pulse duration-[3000ms]" />
      )}

      {image ? (
        <div className="h-24 sm:h-28 relative overflow-hidden flex-shrink-0">
          <img src={image} className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ) : frame ? (
        <div className="h-20 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent flex-shrink-0 relative overflow-hidden group-hover:from-white/10 transition-colors">
          <FramePreview frame={frame} />
        </div>
      ) : trail ? (
        <div className="h-20 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent flex-shrink-0 relative overflow-hidden group-hover:from-white/10 transition-colors">
          <TrailPreview skin={trail} />
          <div className="w-full h-full absolute inset-0 bg-black/10" />
        </div>
      ) : avatar ? (
        <div className="h-20 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent flex-shrink-0 relative overflow-hidden group-hover:from-white/10 transition-colors p-3"
          dangerouslySetInnerHTML={{ __html: avatar.svg }}
        />
      ) : (
        <div className="h-20 flex items-center justify-center bg-white/5 flex-shrink-0 group-hover:bg-white/10 transition-colors">
          <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">{emoji || '✨'}</span>
        </div>
      )}

      <div className="p-2 sm:p-3 relative z-10 flex flex-col flex-grow justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex flex-col gap-1">
          {tier && (
            <div className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest w-fit border
              ${tier === 'pass' ? 'bg-amber-400/10 text-amber-400 border-amber-400/30' :
                tier === 'sol' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' :
                  tier === 'coins' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'}`}>
              {tier === 'pass' ? '🎫 PASS' : tier + ' TIER'}
            </div>
          )}
          <h4 className="text-[10px] font-display font-black text-white tracking-widest uppercase truncate drop-shadow-md">{title}</h4>
          <p className="text-[8px] text-white/50 uppercase tracking-tight truncate font-medium">{subtitle}</p>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          {selected ? (
            <div className="flex items-center gap-1.5 text-cyan-400 font-display font-black text-[9px] tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20 w-fit">
              <Star className="w-3 h-3 fill-current" /> EQUIPPED
            </div>
          ) : owned ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-display font-black text-[9px] tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 w-fit">
              <User className="w-3 h-3" /> OWNED
            </div>
          ) : isPassPerk ? (
            <div className="flex items-center gap-1.5 text-amber-400 font-display font-black text-[9px] tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 w-fit animate-pulse">
              <Star className="w-3 h-3" /> GAME PASS
            </div>
          ) : tier === 'free' ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-display font-black text-[9px] tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 w-fit">
              FREE
            </div>
          ) : tier === 'sol' && solPrice !== undefined ? (
            <div className="flex items-center gap-1.5 text-yellow-400 font-display font-black text-[10px] px-2 py-0.5 rounded-md bg-yellow-400/10 border border-yellow-400/20">
              {solPrice.toLocaleString(undefined, {
                minimumFractionDigits: solPrice < 0.1 ? 3 : 2,
                maximumFractionDigits: 4
              })} SOL
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 font-display font-black text-[10px] px-2 py-0.5 rounded-md ${canAfford ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
              <Coins className="w-3.5 h-3.5" /> {cost.toLocaleString()}
            </div>
          )}

          {(!owned && !selected && (tier === 'sol' || (cost > 0 && canAfford)) && !locked) && (
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ShoppingBag className="w-3 h-3 text-amber-500" />
            </div>
          )}
        </div>
      </div>

      {locked && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px] flex flex-col items-center justify-center z-20">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-white/40" />
          </div>
          <span className="text-[9px] font-display font-black text-white/50 tracking-widest uppercase">LOCKED</span>
        </div>
      )}
    </div>
  );
}

function SettingsManager({ settings, onSave }: { settings: any, onSave: (s: any) => void }) {
  const [localSettings, setLocalSettings] = useState(settings);

  const toggle = (key: string) => {
    const next = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(next);
    onSave(next);
  };

  return (
    <div className="flex-1 px-4 pt-6 pb-32 overflow-y-auto animate-fade-in custom-scrollbar">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <h2 className="text-2xl font-display font-black text-white tracking-tight text-center mb-2">PREFERENCES</h2>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-display font-black text-white/30 tracking-[0.2em] uppercase px-2">Audio</p>
          <SettingToggle
            icon={Volume2}
            label="Game Music"
            active={localSettings.musicEnabled}
            onToggle={() => toggle('musicEnabled')}
            color="#a855f7"
          />
          <SettingToggle
            icon={Zap}
            label="Sound Effects"
            active={localSettings.sfxEnabled}
            onToggle={() => toggle('sfxEnabled')}
            color="#22d3ee"
          />
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-display font-black text-white/30 tracking-[0.2em] uppercase px-2">Tactile & Video</p>
          <SettingToggle
            icon={Smartphone}
            label="Haptic Feedback"
            active={localSettings.hapticsEnabled}
            onToggle={() => toggle('hapticsEnabled')}
            color="#f472b6"
          />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <p className="text-[9px] text-white/20 text-center uppercase tracking-widest font-bold">Token Frenzy v1.0.4</p>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ icon: Icon, label, active, onToggle, color }: any) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-full glass-panel p-4 rounded-2xl flex items-center justify-between transition-all duration-300 ${active ? 'border-white/20 bg-white/5' : 'opacity-60 border-transparent shadow-none bg-black/20'}`}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 transition-all"
          style={{ background: active ? `${color}20` : 'rgba(255,255,255,0.05)', boxShadow: active ? `0 0 15px ${color}30` : 'none' }}>
          <Icon className="w-5 h-5" style={{ color: active ? color : 'rgba(255,255,255,0.3)' }} />
        </div>
        <span className="text-sm font-display font-bold text-white tracking-wide">{label}</span>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-all duration-500 ${active ? 'bg-white/10' : 'bg-black/40'}`}>
        <div className={`h-4 w-4 rounded-full transition-all duration-500 ease-spring ${active ? 'translate-x-6 bg-white shadow-[0_0_15px_white]' : 'bg-white/20'}`} />
      </div>
    </button>
  );
}

function CloudSync(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v8" /><path d="m16 6-4-4-4 4" /><path d="M12 12v9" /><path d="m8 17 4 4 4-4" /><path d="M4.39 10.58A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.43 8.28" />
    </svg>
  );
}

export default MainMenu;
