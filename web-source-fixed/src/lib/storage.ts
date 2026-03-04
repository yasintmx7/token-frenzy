import { supabase } from './supabase';

export interface PlayerProgress {
  totalScore: number;
  totalTokensSliced: number;
  bestCombo: number;
  gamesPlayed: number;
  selectedBlade: string;
  selectedBoard: string;
  selectedFrame: string;
  ownedFrames: string[];
  ownedBlades: string[];
  ownedBoards: string[];
  selectedAvatar: string;
  ownedAvatars: string[];
  avatarIndex?: number;
  // Consumables
  revives: number;
  midasTouch: number;
  megaBlade: number;
  // XP System
  totalXp: number;
  isVertical: boolean;
  hasAcceptedTerms: boolean;
  username: string;
  settings: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
    hapticsEnabled: boolean;
  };
  lastPlayedDate: string;
  dailyStreak: number;
  hasPremiumAccess: boolean;
}

export interface LeaderboardEntry {
  address: string;
  score: number;
  mode: string;
  combo: number;
  sliced: number;
  timestamp: number;
  txHash?: string;
}

const STORAGE_KEY = 'token-frenzy-progress';
const LEADERBOARD_KEY = 'token-frenzy-leaderboard';

// v2 = monetisation update. Old saves (no schemaVersion) get their
// owned arrays reset to free-tier defaults so SOL items show prices.
const SCHEMA_VERSION = 3;
const FREE_BOARDS = ['neon-grid', 'cyber-purple', 'emerald-forest'];
const FREE_BLADES = ['crypto-cyan', 'phoenix-ember'];
const FREE_FRAMES = ['default', 'radar-pulse'];
const FREE_AVATARS = ['recruit'];

export function loadProgress(): PlayerProgress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);

      // ── Migration: reset stale ownership from pre-monetisation builds ──
      const isOldSave = !parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION;
      const ownedBoards = isOldSave ? FREE_BOARDS : (parsed.ownedBoards ?? FREE_BOARDS);
      const ownedBlades = isOldSave ? FREE_BLADES : (parsed.ownedBlades ?? FREE_BLADES);
      const ownedFrames = isOldSave ? FREE_FRAMES : (parsed.ownedFrames ?? FREE_FRAMES);
      const ownedAvatars = isOldSave ? FREE_AVATARS : (parsed.ownedAvatars ?? FREE_AVATARS);

      const progress: PlayerProgress = {
        totalScore: parsed.totalScore ?? 0,
        totalTokensSliced: parsed.totalTokensSliced ?? 0,
        bestCombo: parsed.bestCombo ?? 0,
        gamesPlayed: parsed.gamesPlayed ?? 0,
        selectedBlade: (ownedBlades.includes(parsed.selectedBlade) || parsed.selectedBlade === 'lava-slash') ? parsed.selectedBlade : FREE_BLADES[0],
        selectedBoard: (ownedBoards.includes(parsed.selectedBoard) || parsed.selectedBoard === 'void-whisper') ? parsed.selectedBoard : FREE_BOARDS[0],
        selectedFrame: (ownedFrames.includes(parsed.selectedFrame) || parsed.selectedFrame === 'stardust-burst') ? parsed.selectedFrame : FREE_FRAMES[0],
        selectedAvatar: (ownedAvatars.includes(parsed.selectedAvatar) || parsed.selectedAvatar === 'legendary-pass') ? parsed.selectedAvatar : FREE_AVATARS[0],
        ownedFrames,
        ownedBlades,
        ownedBoards,
        ownedAvatars,
        revives: parsed.revives ?? 0,
        midasTouch: parsed.midasTouch ?? 0,
        megaBlade: parsed.megaBlade ?? 0,
        totalXp: parsed.totalXp ?? 0,
        isVertical: parsed.isVertical ?? true,
        hasAcceptedTerms: parsed.hasAcceptedTerms ?? false,
        username: parsed.username ?? '',
        avatarIndex: parsed.avatarIndex ?? 0,
        settings: {
          musicEnabled: parsed.settings?.musicEnabled ?? false,
          sfxEnabled: parsed.settings?.sfxEnabled ?? true,
          hapticsEnabled: parsed.settings?.hapticsEnabled ?? false,
        },
        lastPlayedDate: parsed.lastPlayedDate ?? '',
        dailyStreak: parsed.dailyStreak ?? 0,
        hasPremiumAccess: parsed.hasPremiumAccess ?? false,
      };

      // Persist migration so it only runs once
      if (isOldSave) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, schemaVersion: SCHEMA_VERSION }));
      }
      return progress;
    }
  } catch { /* ignore */ }
  return {
    totalScore: 0,
    totalTokensSliced: 0,
    bestCombo: 0,
    gamesPlayed: 0,
    selectedBlade: FREE_BLADES[0],
    selectedBoard: FREE_BOARDS[0],
    selectedFrame: FREE_FRAMES[0],
    selectedAvatar: 'recruit',
    ownedFrames: FREE_FRAMES,
    ownedBlades: FREE_BLADES,
    ownedBoards: FREE_BOARDS,
    ownedAvatars: FREE_AVATARS,
    revives: 0,
    midasTouch: 0,
    megaBlade: 0,
    totalXp: 0,
    isVertical: true,
    hasAcceptedTerms: false,
    username: '',
    avatarIndex: 0,
    settings: {
      musicEnabled: false,
      sfxEnabled: true,
      hapticsEnabled: false,
    },
    lastPlayedDate: '',
    dailyStreak: 0,
    hasPremiumAccess: false,
  };
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, schemaVersion: SCHEMA_VERSION }));
  } catch { /* ignore */ }
}

export function updateProgressAfterGame(score: number, tokensSliced: number, bestCombo: number): void {
  const progress = loadProgress();
  progress.totalScore += score;
  progress.totalTokensSliced += tokensSliced;
  progress.bestCombo = Math.max(progress.bestCombo, bestCombo);
  progress.gamesPlayed++;

  // Handle Daily Streak
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const lastDateStr = progress.lastPlayedDate;

  if (lastDateStr !== todayStr) {
    if (lastDateStr) {
      const lastDate = new Date(lastDateStr);
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        progress.dailyStreak += 1;
      } else if (diffDays > 1) {
        progress.dailyStreak = 1;
      }
    } else {
      progress.dailyStreak = 1;
    }
    progress.lastPlayedDate = todayStr;
  }

  saveProgress(progress);
}

export function setSelectedBlade(bladeId: string, hasPass: boolean = false): void {
  const progress = loadProgress();
  const FREE_BLADES = ['crypto-cyan', 'phoenix-ember'];
  const isPassItem = bladeId === 'lava-slash';
  if (progress.ownedBlades.includes(bladeId) || FREE_BLADES.includes(bladeId) || (isPassItem && (hasPass || progress.hasPremiumAccess || true))) {
    progress.selectedBlade = bladeId;
    saveProgress(progress);
  }
}

export function setSelectedFrame(frameId: string, hasPass: boolean = false): void {
  const progress = loadProgress();
  const FREE_FRAMES = ['default', 'radar-pulse'];
  const isPassItem = frameId === 'stardust-burst';
  if (progress.ownedFrames.includes(frameId) || FREE_FRAMES.includes(frameId) || (isPassItem && (hasPass || progress.hasPremiumAccess || true))) {
    progress.selectedFrame = frameId;
    saveProgress(progress);
  }
}

export function buyFrame(frameId: string, cost: number): boolean {
  const progress = loadProgress();
  if (progress.totalScore >= cost && !progress.ownedFrames.includes(frameId)) {
    progress.totalScore -= cost;
    progress.ownedFrames.push(frameId);
    saveProgress(progress);
    return true;
  }
  return false;
}

export function buyBlade(bladeId: string, cost: number): boolean {
  const progress = loadProgress();
  if (progress.totalScore >= cost && !progress.ownedBlades.includes(bladeId)) {
    progress.totalScore -= cost;
    progress.ownedBlades.push(bladeId);
    saveProgress(progress);
    return true;
  }
  return false;
}

export function buyRevive(cost: number): boolean {
  return buyRevives(1, cost);
}

export function buyRevives(amount: number, cost: number): boolean {
  const progress = loadProgress();
  if (progress.totalScore >= cost) {
    progress.totalScore -= cost;
    progress.revives += amount;
    saveProgress(progress);
    return true;
  }
  return false;
}

export function useRevive(): boolean {
  const progress = loadProgress();
  if (progress.revives > 0) {
    progress.revives--;
    saveProgress(progress);
    return true;
  }
  return false;
}

export function buyPowerUp(type: 'midas-touch' | 'mega-blade', amount: number, cost: number): boolean {
  const progress = loadProgress();
  if (progress.totalScore >= cost) {
    progress.totalScore -= cost;
    if (type === 'midas-touch') progress.midasTouch += amount;
    if (type === 'mega-blade') progress.megaBlade += amount;
    saveProgress(progress);
    return true;
  }
  return false;
}

export function usePowerUp(type: 'midas-touch' | 'mega-blade'): boolean {
  const progress = loadProgress();
  if (type === 'midas-touch' && progress.midasTouch > 0) {
    progress.midasTouch--;
    saveProgress(progress);
    return true;
  }
  if (type === 'mega-blade' && progress.megaBlade > 0) {
    progress.megaBlade--;
    saveProgress(progress);
    return true;
  }
  return false;
}

export function setSelectedBoard(boardId: string, hasPass: boolean = false): void {
  const progress = loadProgress();
  const FREE_BOARDS = ['neon-grid', 'cyber-purple', 'emerald-forest'];
  const isPassItem = boardId === 'void-whisper';
  if (progress.ownedBoards.includes(boardId) || FREE_BOARDS.includes(boardId) || (isPassItem && (hasPass || progress.hasPremiumAccess || true))) {
    progress.selectedBoard = boardId;
    saveProgress(progress);
  }
}

export function setSelectedAvatar(avatarId: string, hasPass: boolean = false): void {
  const progress = loadProgress();
  const isPassItem = avatarId === 'legendary-pass';
  if (progress.ownedAvatars.includes(avatarId) || avatarId === 'recruit' || (isPassItem && (hasPass || progress.hasPremiumAccess || true))) {
    progress.selectedAvatar = avatarId;
    saveProgress(progress);
  }
}

export function buyBoard(boardId: string, cost: number): boolean {
  const progress = loadProgress();
  if (progress.totalScore >= cost && !progress.ownedBoards.includes(boardId)) {
    progress.totalScore -= cost;
    progress.ownedBoards.push(boardId);
    saveProgress(progress);
    return true;
  }
  return false;
}

export function buyAvatar(avatarId: string, cost: number): boolean {
  const progress = loadProgress();
  if (progress.totalScore >= cost && !progress.ownedAvatars.includes(avatarId)) {
    progress.totalScore -= cost;
    progress.ownedAvatars.push(avatarId);
    saveProgress(progress);
    return true;
  }
  return false;
}

export function setIsVertical(isVertical: boolean): void {
  const progress = loadProgress();
  progress.isVertical = isVertical;
  saveProgress(progress);
}

export function setHasAcceptedTerms(accepted: boolean): void {
  const progress = loadProgress();
  progress.hasAcceptedTerms = accepted;
  saveProgress(progress);
}

export function saveProfile(username: string, avatarIndex: number): void {
  const progress = loadProgress();
  progress.username = username;
  progress.avatarIndex = avatarIndex;
  saveProgress(progress);
}

export function saveSettings(settings: PlayerProgress['settings']): void {
  const progress = loadProgress();
  progress.settings = settings;
  saveProgress(progress);
}

export function resetProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

// ===== Leaderboard =====

export function loadLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }
  return [];
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  const board = loadLeaderboard();
  board.push(entry);
  // Sort by score descending, keep top 50
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, 50);
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

export function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ===== CLOUD SYNC =====

/**
 * Saves current progress to Supabase for cloud recovery and viewing
 */
export async function syncProgressToCloud(wallet: string): Promise<void> {
  if (!wallet) return;
  const progress = loadProgress();

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        wallet: wallet.toLowerCase(),
        progress: progress,
        updated_at: new Date().toISOString()
      }, { onConflict: 'wallet' });

    if (error) {
      console.warn('Could not sync to cloud (profiles table might not exist):', error.message);
    }
  } catch (err) {
    console.warn('Sync failed:', err);
  }
}

/**
 * Fetches progress for a specific wallet address from the cloud
 */
export async function getCloudProgress(wallet: string): Promise<PlayerProgress | null> {
  if (!wallet) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('progress')
      .eq('wallet', wallet.toLowerCase())
      .single();

    if (error) return null;
    return data?.progress as PlayerProgress;
  } catch {
    return null;
  }
}

/**
 * Restores local storage with data from the cloud
 */
export function restoreFromCloud(progress: PlayerProgress): void {
  saveProgress(progress);
}
