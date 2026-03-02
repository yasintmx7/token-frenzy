import { useState, useEffect } from 'react';
import { Zap, Flame, Waves, Gamepad2, Trophy, User, Paintbrush, Lock, Coins } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { type GameMode } from '@/lib/gameEngine';
import { loadProgress, setSelectedBoard } from '@/lib/storage';
import { BOARD_THEMES } from '@/lib/boardThemes';
import BoardSkinSelector from './BoardSkinSelector';
import { Leaderboard } from './Leaderboard';
import { LegalModal } from './LegalModals';
import WalletButton from './WalletButton';
import heroBg from '@/assets/hero-bg.png';

interface MainMenuProps {
  onStart: (mode: GameMode) => void;
  initialTab?: BottomTab;
  hasPass: boolean | null;   // null = still checking; false = no pass; true = unlocked
  onRequestMint: () => void; // opens the MintOverlay from Game.tsx
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

const MainMenu = ({ onStart, initialTab = 'play', hasPass, onRequestMint }: MainMenuProps) => {
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
    <div className="h-full flex flex-col relative overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className={`absolute inset-0 transition-all duration-700 ${activeTab === 'skins' ? 'bg-black/80' : 'bg-black/55'}`} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="glass-panel rounded-full px-4 py-1.5 flex items-center gap-2.5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-fade-in">
            <Coins className="w-6 h-6 text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' }} />
            <div className="flex flex-col -gap-1">
              <span className="text-lg font-display font-black text-amber-400 neon-text-amber tabular-nums leading-none">
                {progress.totalScore.toLocaleString()}
              </span>
              <span className="text-[8px] font-black text-amber-600/60 uppercase tracking-[0.2em] leading-none mt-0.5">
                TOTAL COINS
              </span>
            </div>
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
            <div className={`flex gap-3 animate-fade-in ${isLandscape ? 'flex-[1.2] w-full max-w-lg' : 'w-full'}`}>
              {modes.map((m) => {
                const isActive = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMode(m.id)}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl transition-all duration-300
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

        {/* SKINS TAB — scrollable, landscape fixes */}
        {activeTab === 'skins' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-4 pt-3 pb-24 animate-fade-in">
            {/* Compact header */}
            <div className="flex items-center justify-center mb-2 flex-shrink-0 text-center">
              <div>
                <h2 className="text-xl font-display font-black text-white tracking-tight">ARENA SKINS</h2>
                <p className="text-[8px] text-white/40 font-display tracking-[0.2em] uppercase">
                  {hasPass ? 'All skins unlocked' : 'Locked skins require Game Pass to equip'}
                </p>
              </div>
            </div>
            {/* Skins grid */}
            <SkinsGrid
              selectedId={selectedBoardId}
              hasPass={!!hasPass}
              onSelect={handleBoardSelect}
              isLandscape={isLandscape}
            />
          </div>
        )}

        {/* RANK TAB */}
        {activeTab === 'rank' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-4 animate-fade-in flex flex-col items-center">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-7 h-7" style={{ color: 'hsl(var(--neon-amber))' }} />
                <h2 className="text-2xl font-display font-black text-foreground tracking-tight">HALL OF FAME</h2>
              </div>
              <Leaderboard />
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
import { Copy, CheckCircle, TrendingUp, Target, Activity, Medal, ShieldCheck, Shield, FileText, ChevronRight, Edit2, Check, X, Smile, Ghost, Bot } from 'lucide-react';
import { shortenAddress, saveProfile } from '@/lib/storage';

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
  const { publicKey, connected } = useWalletHook();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(progress.username || '');
  const [editAvatar, setEditAvatar] = useState(progress.avatarIndex || 0);

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

              <div className="flex items-center gap-2 mt-1.5">
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

function SkinsGrid({
  selectedId,
  hasPass,
  onSelect,
  isLandscape
}: {
  selectedId: string;
  hasPass: boolean;
  onSelect: (id: string) => void;
  isLandscape?: boolean;
}) {
  return (
    <div className="flex-1 min-h-0 flex items-start justify-center pt-2">
      <div className={`grid ${isLandscape ? 'grid-cols-3 gap-3' : 'grid-cols-2 gap-2'} w-full max-w-2xl`}>
        {BOARD_THEMES.map((theme, index) => {
          const isSelected = theme.id === selectedId;
          const isLocked = !hasPass && index > 0;

          return (
            <div
              key={theme.id}
              onClick={() => {
                if (!isLocked) onSelect(theme.id);
              }}
              className="relative rounded-xl overflow-hidden cursor-pointer transition-all active:scale-[0.98]"
              style={{
                aspectRatio: isLandscape ? '21/9' : '16/9',
                border: isSelected ? '2px solid hsl(var(--neon-cyan))' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: isSelected ? '0 0 15px hsla(var(--neon-cyan), 0.3)' : undefined,
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              {/* Image */}
              <img
                src={theme.preview}
                alt={theme.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{theme.emoji}</span>
                  <span className="text-[9px] font-display font-black text-white truncate tracking-wider">
                    {theme.name}
                  </span>
                </div>
              </div>

              {/* Locked overlay */}
              {isLocked && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center border border-white/5">
                  <Lock className="w-5 h-5 text-white/50 mb-1" />
                  <span className="text-[7px] font-display font-black text-white/70 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full">
                    Locked
                  </span>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center border-2 border-black">
                  <div className="w-1.5 h-1.5 bg-black rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MainMenu;
