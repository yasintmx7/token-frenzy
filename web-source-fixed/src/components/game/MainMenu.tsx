import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Zap, Flame, Waves, Gamepad2, Trophy, User, ShoppingBag,
  Lock, Coins, Shield as ShieldIcon, Star, Sparkles,
  CircleDashed, Gift, Wallet, Crown, Edit2, Copy, CheckCircle,
  TrendingUp, Target, Activity, Medal, ShieldCheck, Shield,
  FileText, ChevronRight, Check, X, Smile, Ghost, Bot,
  Settings, Volume2, Smartphone, Cpu, Trash2, Package, Sword
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { type GameMode } from '@/lib/gameEngine';
import {
  loadProgress, setSelectedBoard, setSelectedBlade, setSelectedFrame,
  buyFrame, buyBlade, buyBoard, buyRevive, buyRevives, buyPowerUp, shortenAddress,
  saveProfile, saveSettings, resetProgress, getCloudProgress, restoreFromCloud, type PlayerProgress
} from '@/lib/storage';
import { computeLevelFromTotalXp, XP_CONFIG } from '@/lib/xp';
import { BOARD_THEMES } from '@/lib/boardThemes';
import { BLADE_SKINS, type BladeSkin } from '@/lib/bladeSkins';
import { TOKEN_FRAMES, type TokenFrame } from '@/lib/tokenFrames';
import { setSFXEnabled, setMusicEnabled, updateMusic, resumeAudio, playSlice } from '@/lib/soundEngine';
import BoardSkinSelector from './BoardSkinSelector';
import { Leaderboard } from './Leaderboard';
import { LegalModal } from './LegalModals';
import WalletButton from './WalletButton';
import heroBg from '@/assets/hero-bg.webp';
// Pure CSS Trail Representation (No canvas logic)
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

// ─── Token Frame Preview (Animated Canvas) ───────────────────────────────────
function FramePreview({ frame }: { frame: TokenFrame }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 64; // Small preview size
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

      // Simple core token for preview
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#111';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // REPLICATE FRAME LOGIC FROM GameCanvas.tsx
      if (frame.id !== 'default') {
        const glowColor = frame.glowColor;

        // Aura
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = `${frame.glowColor}${Math.floor(frame.auraOpacity * 100).toString(16).padStart(2, '0')}`;
        ctx.fill();
        ctx.restore();

        // Specific Glitch/Tech Effects
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
            // Small energy arc
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

        // Overlay Ring
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
  hasPass: boolean | null;   // null = still checking; false = no pass; true = unlocked
  onRequestMint: () => void; // opens the MintOverlay from Game.tsx
}

type BottomTab = 'play' | 'rank' | 'shop' | 'profile' | 'settings';

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
  {
    id: 'timewarp',
    title: 'SPLIT',
    desc: 'Multiply on hit',
    icon: <Activity className="w-8 h-8" />,
    neonColor: 'hsl(280, 100%, 65%)',
    glowHsl: '280, 100%, 65%',
  },
  {
    id: 'void',
    title: 'TWIN',
    desc: 'Match Pairs',
    icon: <CircleDashed className="w-8 h-8" />,
    neonColor: 'hsl(140, 80%, 50%)',
    glowHsl: '280, 80%, 50%',
  },
  {
    id: 'laser',
    title: 'LASER',
    desc: '4x Death Beams',
    icon: <Target className="w-8 h-8" />,
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
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [cloudData, setCloudData] = useState<PlayerProgress | null>(null);

  useEffect(() => {
    if (connected && publicKey && progress.gamesPlayed === 0) {
      const checkCloud = async () => {
        const data = await getCloudProgress(publicKey.toString());
        if (data && data.totalScore > 0) {
          setCloudData(data);
          setShowRestorePrompt(true);
        }
      };
      checkCloud();
    }
  }, [connected, publicKey, progress.gamesPlayed]);

  const handleRestore = () => {
    if (cloudData) {
      restoreFromCloud(cloudData);
      setProgress(loadProgress());
      setShowRestorePrompt(false);
    }
  };

  useEffect(() => {
    // Sync procedural music on mount (requires interaction context usually)
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

  // Report active tab state to Android bridge and register back handler
  useEffect(() => {
    if (activeTab === 'play') {
      window.Android?.setState('home');
      // On play/home tab: no sub-nav back needed
      window.handleAndroidBack = undefined;
    } else {
      // On sub-tab: report subtab state and register back → return to play tab
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
      onClick={() => resumeAudio()}
      onTouchStart={() => resumeAudio()}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className={`absolute inset-0 transition-all duration-700 ${activeTab === 'shop' ? 'bg-black/80' : 'bg-black/55'}`} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* ── Top bar ── */}
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

      {/* ── Main scrollable content ── */}
      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">

        {/* PLAY TAB */}
        {activeTab === 'play' && (
          <div className={`flex-1 flex ${isLandscape ? 'flex-row items-center justify-center px-10 gap-10' : 'flex-col items-center justify-center px-5 gap-5'}`}>

            {/* Left side (Landscape) / Top (Portrait): Title & Play Button */}
            <div className={`flex flex-col items-center justify-center gap-4 ${isLandscape ? 'flex-[0.8]' : ''}`}>
              {/* Title */}
              <div className="text-center select-none animate-fade-in">
                <h1 className="font-display font-black tracking-wider leading-none">
                  <span className={`block ${isLandscape ? 'text-4xl' : 'text-5xl'} bg-gradient-to-b from-white via-purple-300 to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(280,100%,65%,0.6)]`}>
                    TOKEN
                  </span>
                  <span className={`block ${isLandscape ? 'text-4xl' : 'text-5xl'} bg-gradient-to-b from-purple-200 via-amber-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_hsla(38,100%,60%,0.5)] -mt-1`}>
                    FRENZY
                  </span>
                </h1>
              </div>

              {/* Play button */}
              <button
                onClick={handlePlayClick}
                className={`group relative animate-fade-in btn-premium ${isLandscape ? 'mt-2' : 'mt-1'}`}
              >
                <div className="absolute -inset-1.5 rounded-full opacity-50 blur-lg group-hover:opacity-70 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-pink)), hsl(var(--neon-cyan)))' }} />
                <div className="relative flex items-center gap-2 px-8 py-3 rounded-full glass-panel-strong">
                  <Gamepad2 className="w-5 h-5 text-foreground/80" />
                  <span className="text-sm font-display font-bold tracking-[0.2em] text-foreground">
                    PLAY
                  </span>
                </div>
              </button>
            </div>

            {/* Right side (Landscape) / Bottom (Portrait): Mode cards */}
            <div className={`grid grid-cols-3 gap-2 animate-fade-in ${isLandscape ? 'flex-[1.2] w-full max-w-xl' : 'w-full max-w-md mx-auto'}`}>
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
                    <h3 className={`text-[11px] font-display font-bold tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {m.title}
                    </h3>
                    <p className="text-[8px] text-muted-foreground text-center tracking-wide uppercase font-sans leading-tight">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SHOP TAB — scrollable, landscape fixes */}
        {activeTab === 'shop' && <ShopManager hasPass={hasPass} />}

        {/* RANK TAB */}
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

        {/* PROFILE TAB — fits one screen */}
        {activeTab === 'profile' && (
          <div className="flex-1 overflow-hidden px-4 pt-3 pb-2 flex flex-col justify-center animate-fade-in">
            <ProfileDashboard
              progress={progress}
              onOpenLegal={(type) => setLegalModal({ isOpen: true, type })}
              isLandscape={isLandscape}
              hasPass={hasPass}
            />
          </div>
        )}
        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <SettingsManager
            settings={progress.settings}
            onSave={(newSettings) => {
              saveSettings(newSettings);
              setProgress({ ...progress, settings: newSettings });
              // Sync with sound engine
              setSFXEnabled(newSettings.sfxEnabled);
              setMusicEnabled(newSettings.musicEnabled);
              // Audio feedback
              if (newSettings.sfxEnabled) playSlice();
            }}
          />
        )}
      </div>

      {/* ── Bottom navigation ── */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center glass-panel-strong rounded-2xl overflow-hidden w-full max-w-sm">
          {([
            { id: 'rank' as BottomTab, icon: Trophy, label: 'RANK' },
            { id: 'play' as BottomTab, icon: Gamepad2, label: 'PLAY' },
            { id: 'shop' as BottomTab, icon: ShoppingBag, label: 'SHOP' },
            { id: 'profile' as BottomTab, icon: User, label: 'PROFILE' },
            { id: 'settings' as BottomTab, icon: Settings, label: 'CONFIG' },
          ]).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all duration-200 min-w-0"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : undefined,
                  color: isActive ? 'white' : 'hsla(0,0%,100%,0.4)',
                }}
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

      {/* Restore Progress Prompt */}
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

// ─── Profile Dashboard ────────────────────────────────────────────────────────

const AVATARS = [User, Smile, Ghost, Bot, Zap];
const AVATAR_COLORS = [
  'linear-gradient(135deg,#9333ea,#ec4899)', // purple-pink
  'linear-gradient(135deg,#eab308,#f97316)', // yellow-orange
  'linear-gradient(135deg,#22d3ee,#3b82f6)', // cyan-blue
  'linear-gradient(135deg,#10b981,#14b8a6)', // emerald-teal
  'linear-gradient(135deg,#f43f5e,#fbbf24)'  // rose-amber
];

function ProfileDashboard({ progress, onOpenLegal, isLandscape, hasPass }: {
  progress: any,
  onOpenLegal: (type: 'privacy' | 'terms') => void,
  isLandscape?: boolean;
  hasPass?: boolean | null;
}) {
  const { publicKey, connected } = useWallet();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(progress.username || '');
  const [editAvatar, setEditAvatar] = useState(progress.avatarIndex || 0);
  const levelInfo = computeLevelFromTotalXp(progress.totalXp);

  const CurrentAvatar = AVATARS[progress.avatarIndex || 0] || User;

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
    <div className={`flex ${isLandscape ? 'flex-row items-center justify-center max-w-4xl mx-auto gap-6' : 'flex-col gap-3'}`}>

      {/* Left Column (If Landscape) / Top (If Portrait) */}
      <div className={`flex flex-col gap-3 ${isLandscape ? 'flex-[0.8] w-full max-w-sm' : ''}`}>

        {/* ── Header card or Edit UI ── */}
        {isEditing ? (
          <div
            className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex gap-2 justify-between">
              {AVATARS.map((Icon, idx) => (
                <button
                  key={idx}
                  onClick={() => setEditAvatar(idx)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${editAvatar === idx ? 'scale-110 border-2 border-white' : 'opacity-40 hover:opacity-100'}`}
                  style={{ background: AVATAR_COLORS[idx] }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </button>
              ))}
            </div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter Username"
              className="bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-display text-center outline-none focus:border-purple-400 focus:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
              maxLength={15}
            />
            <div className="flex gap-2 mt-1">
              <button onClick={handleCancel} className="flex-1 bg-white/10 hover:bg-white/20 text-white transition-colors rounded-lg py-2 text-xs font-bold font-display flex items-center justify-center gap-1">
                <X className="w-3.5 h-3.5" /> CANCEL
              </button>
              <button onClick={handleSave} className="flex-1 bg-purple-500 hover:bg-purple-400 text-white transition-colors rounded-lg py-2 text-xs font-bold font-display flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Check className="w-3.5 h-3.5" /> SAVE
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl p-4 flex items-center gap-4 animate-fade-in relative ${hasPass ? 'overflow-hidden' : ''}`}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: hasPass ? '2px solid rgba(251,191,36,0.6)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: hasPass ? 'inset 0 0 20px rgba(251,191,36,0.15), 0 0 15px rgba(251,191,36,0.2)' : 'none'
            }}
          >
            {/* Ambient gold glow if Game Pass */}
            {hasPass && (
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-amber-300/5 to-transparent pointer-events-none" />
            )}

            {/* Avatar with status dot */}
            <div className="relative flex-shrink-0 z-10">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${hasPass ? 'border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' : ''}`}
                style={{ background: AVATAR_COLORS[progress.avatarIndex || 0] }}
              >
                <CurrentAvatar className="w-7 h-7 text-white" />
              </div>
              {connected && (
                <div
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black animate-pulse"
                  style={{ background: '#4ade80' }}
                />
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0 z-10">
              <div className="flex justify-between items-center gap-2">
                <p className="text-sm font-display font-black text-white leading-tight truncate">
                  {displayName}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 transition-all flex-shrink-0 border border-white/10"
                >
                  <Edit2 className="w-3.5 h-3.5 text-white/70" />
                </button>
              </div>

              {/* STREAK BADGE */}
              {progress.dailyStreak > 0 && (
                <div className="mt-1 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-md px-2 py-0.5 w-fit">
                  <Flame className="w-3 h-3 text-orange-400 fill-orange-400/20" />
                  <span className="text-[9px] font-display font-black text-orange-400 tracking-wider font-bold">
                    {progress.dailyStreak} DAY STREAK
                  </span>
                </div>
              )}

              {/* LEVEL & XP PROGRESS */}
              <div className="mt-2.5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between leading-none">
                  <span className="text-[10px] font-display font-black text-cyan-400 tracking-wider uppercase">Level {levelInfo.level}</span>
                  <span className="text-[9px] text-white/40 font-bold tabular-nums">{levelInfo.xpIntoLevel} / {levelInfo.xpForNext} XP</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.4)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, (levelInfo.xpIntoLevel / levelInfo.xpForNext) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-0.5 leading-none px-0.5">
                  <span className="text-[8px] text-white/25 font-bold tracking-[0.1em] uppercase">Daily Earnings</span>
                  <span className="text-[8px] text-white/30 font-bold tabular-nums">{progress.earnedToday || 0} / {XP_CONFIG.dailyCapXp}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2.5">
                <span
                  className="text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded-full"
                  style={{ color: rank.color, background: rank.glow, border: `1px solid ${rank.color}40` }}
                >
                  {rank.name}
                </span>
                {connected && publicKey && (
                  <button onClick={copyAddress} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                    {copied
                      ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      : <Copy className="w-3.5 h-3.5 text-white/40" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── COLLECTION STATS ── */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3 animate-fade-in"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-emerald-400" />
            <p className="text-[10px] font-display font-black text-emerald-400 tracking-[0.2em] uppercase">Inventory status</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">
                <span>Blades</span>
                <span className="text-white/60">{(progress.ownedBlades?.length || 1)} / {BLADE_SKINS.length}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  style={{ width: `${((progress.ownedBlades?.length || 1) / BLADE_SKINS.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">
                <span>Frames</span>
                <span className="text-white/60">{(progress.ownedFrames?.length || 1)} / {TOKEN_FRAMES.length}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                  style={{ width: `${((progress.ownedFrames?.length || 1) / TOKEN_FRAMES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Legal — full-width stacked, always readable ── */}
        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={() => onOpenLegal('privacy')}
            className="w-full rounded-xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <Shield className="w-4 h-4 flex-shrink-0 text-blue-400" />
            <span className="text-xs font-display font-bold text-white">Privacy Policy</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 ml-auto flex-shrink-0" />
          </button>
          <button
            onClick={() => onOpenLegal('terms')}
            className="w-full rounded-xl px-4 py-3 flex items-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <FileText className="w-4 h-4 flex-shrink-0 text-purple-400" />
            <span className="text-xs font-display font-bold text-white">Terms &amp; Conditions</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 ml-auto flex-shrink-0" />
          </button>
        </div>

      </div>

      {/* Right Column (If Landscape) / Bottom (If Portrait) */}
      <div className={`flex flex-col gap-3 ${isLandscape ? 'flex-[1.2]' : ''}`}>
        {/* ── Stats 2×2 grid — big readable numbers ── */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: TrendingUp, label: 'TOTAL SCORE', value: progress.totalScore.toLocaleString(), color: '#c084fc', bg: 'rgba(192,132,252,0.09)', border: 'rgba(192,132,252,0.2)' },
            { icon: Target, label: 'SLICED', value: progress.totalTokensSliced.toLocaleString(), color: '#22d3ee', bg: 'rgba(34,211,238,0.09)', border: 'rgba(34,211,238,0.2)' },
            { icon: Medal, label: 'BEST COMBO', value: `${progress.bestCombo}×`, color: '#fbbf24', bg: 'rgba(251,191,36,0.09)', border: 'rgba(251,191,36,0.2)' },
            { icon: Activity, label: 'GAMES PLAYED', value: String(progress.gamesPlayed), color: '#f472b6', bg: 'rgba(244,114,182,0.09)', border: 'rgba(244,114,182,0.2)' },
          ].map(({ icon: Icon, label, value, color, bg, border }) => (
            <div key={label} className="rounded-xl p-4 flex flex-col justify-center" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
                <p className="text-[10px] font-display font-bold tracking-widest uppercase truncate" style={{ color }}>
                  {label}
                </p>
              </div>
              <p className="text-3xl font-display font-black text-white tabular-nums leading-none">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function ShopManager({ hasPass }: { hasPass?: boolean | null }) {
  const [subTab, setSubTab] = useState<'arena' | 'frames' | 'trails' | 'upgrades'>('arena');
  const [progress, setProgress] = useState(loadProgress());
  const isPassHolder = hasPass === true;

  // Refresh progress after purchase
  const refresh = () => setProgress(loadProgress());

  const handleBuyFrame = (id: string, cost: number) => {
    if (buyFrame(id, cost)) {
      refresh();
      setSelectedFrame(id);
    }
  };

  const handleBuyBlade = (id: string, cost: number) => {
    if (buyBlade(id, cost)) {
      refresh();
      setSelectedBlade(id);
    }
  };

  const handleBuyBoard = (id: string, cost: number) => {
    if (buyBoard(id, cost)) {
      refresh();
      setSelectedBoard(id);
    }
  };

  const handleBuyRevive = () => {
    if (buyRevive(2500)) refresh();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Shop Header with Coins */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-display font-black text-white tracking-tight">ARENA SHOP</h2>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <p className="text-[9px] text-white/40 font-display tracking-[0.2em] uppercase">Premium Inventory</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex px-4 gap-2 mb-4 overflow-x-auto no-scrollbar flex-shrink-0">
        {[
          { id: 'arena', label: 'ARENAS', icon: ShieldIcon },
          { id: 'frames', label: 'FRAMES', icon: CircleDashed },
          { id: 'trails', label: 'TRAILS', icon: Zap },
          { id: 'upgrades', label: 'POWER-UPS', icon: Gift },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-display font-black tracking-widest transition-all whitespace-nowrap
              ${subTab === t.id ? 'bg-white text-black' : 'glass-panel text-white/60 hover:text-white'}
            `}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-32">
        {subTab === 'arena' && (
          <div className="grid grid-cols-2 gap-3">
            {BOARD_THEMES.map((theme) => {
              const isOwned = isPassHolder || progress.ownedBoards.includes(theme.id);
              const isSelected = theme.id === progress.selectedBoard;
              return (
                <ShopItem
                  key={theme.id}
                  title={theme.name}
                  subtitle={theme.description}
                  image={theme.preview}
                  emoji={theme.emoji}
                  selected={isSelected}
                  owned={isOwned}
                  cost={theme.cost}
                  onAction={() => isOwned ? (() => { setSelectedBoard(theme.id); refresh(); })() : handleBuyBoard(theme.id, theme.cost)}
                  canAfford={progress.totalScore >= theme.cost}
                />
              );
            })}
          </div>
        )}

        {subTab === 'frames' && (
          <div className="grid grid-cols-2 gap-3">
            {TOKEN_FRAMES.map(f => {
              const isOwned = isPassHolder || progress.ownedFrames.includes(f.id);
              const isSelected = progress.selectedFrame === f.id;
              return (
                <ShopItem
                  key={f.id}
                  title={f.name}
                  subtitle={f.description}
                  selected={isSelected}
                  owned={isOwned}
                  cost={f.cost}
                  frame={f}
                  onAction={() => isOwned ? (() => { setSelectedFrame(f.id); refresh(); })() : handleBuyFrame(f.id, f.cost)}
                  canAfford={progress.totalScore >= f.cost}
                />
              );
            })}
          </div>
        )}

        {subTab === 'trails' && (
          <div className="grid grid-cols-2 gap-3">
            {BLADE_SKINS.map(b => {
              const isOwned = isPassHolder || progress.ownedBlades.includes(b.id);
              const isSelected = progress.selectedBlade === b.id;
              return (
                <ShopItem
                  key={b.id}
                  title={b.name}
                  subtitle={b.description}
                  emoji={b.emoji}
                  selected={isSelected}
                  owned={isOwned}
                  cost={b.cost}
                  trail={b}
                  onAction={() => isOwned ? (() => { setSelectedBlade(b.id); refresh(); })() : handleBuyBlade(b.id, b.cost)}
                  canAfford={progress.totalScore >= b.cost}
                />
              );
            })}
          </div>
        )}

        {subTab === 'upgrades' && (
          <div className="flex flex-col gap-6">
            {/* ── REVIVE ── */}
            <div className="glass-panel-strong p-5 rounded-3xl border-white/5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <Flame className="w-8 h-8 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-display font-black text-white">PHOENIX REVIVE</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Consumable • {progress.revives} Owned</p>
                  </div>
                </div>
                <button
                  onClick={handleBuyRevive}
                  disabled={progress.totalScore < 2500}
                  className={`px-5 py-3 rounded-2xl font-display font-black tracking-widest text-[11px] transition-all
                    ${progress.totalScore >= 2500 ? 'bg-amber-500 text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}
                  `}
                >
                  1x Buy (2.5K)
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { if (buyRevives(5, 12500)) refresh(); }}
                  disabled={progress.totalScore < 12500}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-bold hover:bg-amber-500/20 transition-all text-xs disabled:opacity-50 disabled:border-white/5 disabled:bg-white/5 disabled:text-white/20"
                >
                  <span>5x Pack</span>
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> 12.5K</span>
                </button>
                <button
                  onClick={() => { if (buyRevives(10, 25000)) refresh(); }}
                  disabled={progress.totalScore < 25000}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-500 font-bold hover:bg-amber-500/20 transition-all text-xs disabled:opacity-50 disabled:border-white/5 disabled:bg-white/5 disabled:text-white/20"
                >
                  <span>10x Pack</span>
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> 25K</span>
                </button>
              </div>
            </div>

            {/* ── MIDAS TOUCH ── */}
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
                <button
                  onClick={() => { if (buyPowerUp('midas-touch', 1, 4000)) refresh(); }}
                  disabled={progress.totalScore < 4000}
                  className={`px-5 py-3 rounded-2xl font-display font-black tracking-widest text-[11px] transition-all
                    ${progress.totalScore >= 4000 ? 'bg-yellow-500 text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}
                  `}
                >
                  1x Buy (4K)
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (buyPowerUp('midas-touch', 5, 18000)) refresh(); }}
                  disabled={progress.totalScore < 18000}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 font-bold hover:bg-yellow-500/20 transition-all text-xs disabled:opacity-50 disabled:border-white/5 disabled:bg-white/5 disabled:text-white/20"
                >
                  <span>5x Pack</span>
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> 18K</span>
                </button>
              </div>
            </div>

            {/* ── MEGA BLADE ── */}
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
                <button
                  onClick={() => { if (buyPowerUp('mega-blade', 1, 3500)) refresh(); }}
                  disabled={progress.totalScore < 3500}
                  className={`px-5 py-3 rounded-2xl font-display font-black tracking-widest text-[11px] transition-all
                    ${progress.totalScore >= 3500 ? 'bg-cyan-500 text-black hover:scale-105 active:scale-95' : 'bg-white/5 text-white/20'}
                  `}
                >
                  1x Buy (3.5K)
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { if (buyPowerUp('mega-blade', 5, 15000)) refresh(); }}
                  disabled={progress.totalScore < 15000}
                  className="flex-1 flex justify-between items-center px-4 py-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-500 font-bold hover:bg-cyan-500/20 transition-all text-xs disabled:opacity-50 disabled:border-white/5 disabled:bg-white/5 disabled:text-white/20"
                >
                  <span>5x Pack</span>
                  <span className="flex items-center gap-1"><Coins className="w-3 h-3" /> 15K</span>
                </button>
              </div>
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
  trail
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
}) {
  return (
    <div
      onClick={onAction}
      className={`relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 group cursor-pointer backdrop-blur-md
        ${selected ? 'ring-2 ring-cyan-400 bg-white/10' : 'border border-white/10 hover:border-white/30 bg-black/40 hover:bg-white/5 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black'}
      `}
      style={{
        boxShadow: selected ? '0 0 40px rgba(34, 211, 238, 0.3), inset 0 0 20px rgba(34, 211, 238, 0.1)' : 'none'
      }}
    >
      {/* Background Glow Effect */}
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent pointer-events-none animate-pulse duration-[3000ms]" />
      )}

      {image ? (
        <div className="h-28 relative overflow-hidden">
          <img src={image} className="w-full h-full object-cover opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ) : frame ? (
        <div className="h-16 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent flex-shrink-0 relative overflow-hidden group-hover:from-white/10 transition-colors">
          <FramePreview frame={frame} />
        </div>
      ) : trail ? (
        <div className="h-16 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent flex-shrink-0 relative overflow-hidden group-hover:from-white/10 transition-colors">
          <TrailPreview skin={trail} />
          <div className="w-full h-full absolute inset-0 bg-black/10" /> {/* Dimmer */}
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center bg-white/5 flex-shrink-0 group-hover:bg-white/10 transition-colors">
          <span className="text-2xl drop-shadow-md group-hover:scale-110 transition-transform">{emoji || '✨'}</span>
        </div>
      )}

      <div className="p-3 relative z-10 flex flex-col flex-grow justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div>
          <h4 className="text-[10px] font-display font-black text-white tracking-widest uppercase truncate drop-shadow-md">{title}</h4>
          <p className="text-[8px] text-white/50 uppercase tracking-tight truncate mt-0.5 font-medium">{subtitle}</p>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          {selected ? (
            <div className="flex items-center gap-1.5 text-cyan-400 font-display font-black text-[9px] tracking-widest bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20 w-fit">
              <Star className="w-3 h-3 fill-current" /> EQUIPPED
            </div>
          ) : owned || cost === 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-display font-black text-[9px] tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-md border border-emerald-400/20 w-fit">
              <User className="w-3 h-3" /> OWNED
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 font-display font-black text-[10px] px-2 py-0.5 rounded-md ${canAfford ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
              <Coins className="w-3.5 h-3.5" /> {cost.toLocaleString()}
            </div>
          )}

          {(!owned && cost > 0 && canAfford && !selected && !locked) && (
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

// ─── Settings Manager ────────────────────────────────────────────────────────

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
