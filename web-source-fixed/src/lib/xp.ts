import { loadProgress, saveProgress } from './storage';

export const XP_CONFIG = {
    maxLevel: 100,

    // Best-case daily cap => ~1 year to reach max
    dailyCapXp: 1000,

    // Quadratic curve: level 100 requires ~366,000 XP total
    xpForNextLevel(level: number) {
        // Tuned for ~1000 XP daily cap over 365 days:
        // L1->2 ~400, L50->51 ~3200, L99->100 ~8800
        return Math.round(370 + 27.5 * level + 0.58 * level * level);
    },

    // XP from score ONLY at game over (diminishing returns)
    runXp(score: number) {
        const s = Math.max(0, score);
        const xp = 6 + Math.floor(4.2 * Math.sqrt(s));
        return Math.max(4, Math.min(80, xp)); // per-run min/max cap
    }
};

export interface XPLevelInfo {
    level: number;
    xpIntoLevel: number;
    xpForNext: number;
    totalXp: number;
}

export function computeLevelFromTotalXp(totalXp: number): XPLevelInfo {
    let level = 1;
    let remainingXp = totalXp;

    while (level < XP_CONFIG.maxLevel) {
        const needed = XP_CONFIG.xpForNextLevel(level);
        if (remainingXp >= needed) {
            remainingXp -= needed;
            level++;
        } else {
            break;
        }
    }

    return {
        level,
        xpIntoLevel: remainingXp,
        xpForNext: level < XP_CONFIG.maxLevel ? XP_CONFIG.xpForNextLevel(level) : XP_CONFIG.xpForNextLevel(XP_CONFIG.maxLevel - 1),
        totalXp
    };
}

export interface XPResult {
    xpGained: number;
    leveledUp: boolean;
    newLevel: number;
    totalXp: number;
    xpIntoLevel: number;
    xpForNext: number;
    earnedToday: number;
    dailyCapReached: boolean;
}

export function awardXpFromScore(score: number, sessionId: string): XPResult | null {
    const progress = loadProgress() as any;

    // Prevent double-award bug
    if (progress.lastAwardedSessionId === sessionId) {
        return null;
    }

    const today = new Date().toISOString().split('T')[0];

    // Daily reset
    if (progress.lastDailyReset !== today) {
        progress.earnedToday = 0;
        progress.lastDailyReset = today;
    }

    const potentialXp = XP_CONFIG.runXp(score);
    const xpGained = potentialXp;

    const oldLevelInfo = computeLevelFromTotalXp(progress.totalXp || 0);

    progress.totalXp = (progress.totalXp || 0) + xpGained;
    progress.earnedToday = (progress.earnedToday || 0) + xpGained;
    progress.lastAwardedSessionId = sessionId;

    saveProgress(progress);

    const newLevelInfo = computeLevelFromTotalXp(progress.totalXp);

    return {
        xpGained,
        leveledUp: newLevelInfo.level > oldLevelInfo.level,
        newLevel: newLevelInfo.level,
        totalXp: progress.totalXp,
        xpIntoLevel: newLevelInfo.xpIntoLevel,
        xpForNext: newLevelInfo.xpForNext,
        earnedToday: progress.earnedToday,
        dailyCapReached: progress.earnedToday >= XP_CONFIG.dailyCapXp
    };
}
