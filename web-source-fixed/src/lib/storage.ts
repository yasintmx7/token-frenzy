export interface PlayerProgress {
  totalScore: number;
  totalTokensSliced: number;
  bestCombo: number;
  gamesPlayed: number;
  selectedBlade: string;
  selectedBoard: string;
  isVertical: boolean;
  hasAcceptedTerms: boolean;
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

export function loadProgress(): PlayerProgress {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return {
        totalScore: parsed.totalScore ?? 0,
        totalTokensSliced: parsed.totalTokensSliced ?? 0,
        bestCombo: parsed.bestCombo ?? 0,
        gamesPlayed: parsed.gamesPlayed ?? 0,
        selectedBlade: parsed.selectedBlade ?? 'crypto-cyan',
        selectedBoard: parsed.selectedBoard ?? 'neon-grid',
        isVertical: parsed.isVertical ?? true,
        hasAcceptedTerms: parsed.hasAcceptedTerms ?? false,
      };
    }
  } catch { /* ignore */ }
  return {
    totalScore: 0,
    totalTokensSliced: 0,
    bestCombo: 0,
    gamesPlayed: 0,
    selectedBlade: 'crypto-cyan',
    selectedBoard: 'neon-grid',
    isVertical: true,
    hasAcceptedTerms: false,
  };
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch { /* ignore */ }
}

export function updateProgressAfterGame(score: number, tokensSliced: number, bestCombo: number): void {
  const progress = loadProgress();
  progress.totalScore += score;
  progress.totalTokensSliced += tokensSliced;
  progress.bestCombo = Math.max(progress.bestCombo, bestCombo);
  progress.gamesPlayed++;
  saveProgress(progress);
}

export function setSelectedBlade(bladeId: string): void {
  const progress = loadProgress();
  progress.selectedBlade = bladeId;
  saveProgress(progress);
}

export function setSelectedBoard(boardId: string): void {
  const progress = loadProgress();
  progress.selectedBoard = boardId;
  saveProgress(progress);
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
