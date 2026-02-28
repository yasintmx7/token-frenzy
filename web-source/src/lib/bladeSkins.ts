export interface BladeSkin {
  id: string;
  name: string;
  emoji: string;
  pointsNeeded: number;
  description: string;
  trail: {
    core: string;
    glow: string;
    outer: string;
  };
  particles: string[];
}

export const BLADE_SKINS: BladeSkin[] = [
  {
    id: 'crypto-cyan',
    name: 'Crypto Cyan',
    emoji: '⚡',
    pointsNeeded: 0,
    description: 'Default blade',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(0,255,255,{a})',
      outer: 'rgba(0,200,200,{a})',
    },
    particles: ['#00FFFF', '#00E5FF', '#FFFFFF'],
  },
  {
    id: 'bull-run',
    name: 'Bull Run',
    emoji: '🐂',
    pointsNeeded: 500,
    description: 'Unlock at 500 pts',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(52,211,153,{a})',
      outer: 'rgba(16,185,129,{a})',
    },
    particles: ['#34D399', '#10B981', '#6EE7B7'],
  },
  {
    id: 'bear-freeze',
    name: 'Bear Freeze',
    emoji: '❄️',
    pointsNeeded: 1000,
    description: 'Unlock at 1,000 pts',
    trail: {
      core: 'rgba(224,242,254,{a})',
      glow: 'rgba(56,189,248,{a})',
      outer: 'rgba(14,165,233,{a})',
    },
    particles: ['#38BDF8', '#7DD3FC', '#E0F2FE'],
  },
  {
    id: 'golden-whale',
    name: 'Golden Whale',
    emoji: '🐋',
    pointsNeeded: 2500,
    description: 'Unlock at 2,500 pts',
    trail: {
      core: 'rgba(255,255,240,{a})',
      glow: 'rgba(245,158,11,{a})',
      outer: 'rgba(217,119,6,{a})',
    },
    particles: ['#F59E0B', '#FBBF24', '#FDE68A'],
  },
  {
    id: 'diamond-hands',
    name: 'Diamond Hands',
    emoji: '💎',
    pointsNeeded: 5000,
    description: 'Unlock at 5,000 pts',
    trail: {
      core: 'rgba(255,255,255,{a})',
      glow: 'rgba(165,243,252,{a})',
      outer: 'rgba(103,232,249,{a})',
    },
    particles: ['#A5F3FC', '#FFFFFF', '#67E8F9', '#CFFAFE'],
  },
  {
    id: 'to-the-moon',
    name: 'To The Moon',
    emoji: '🚀',
    pointsNeeded: 10000,
    description: 'Unlock at 10,000 pts',
    trail: {
      core: 'rgba(255,200,255,{a})',
      glow: 'rgba(192,38,211,{a})',
      outer: 'rgba(236,72,153,{a})',
    },
    particles: ['#C026D3', '#EC4899', '#E879F9', '#F0ABFC'],
  },
];

export function getUnlockedSkins(totalScore: number): BladeSkin[] {
  return BLADE_SKINS.filter(s => totalScore >= s.pointsNeeded);
}

export function getSkinById(id: string): BladeSkin {
  return BLADE_SKINS.find(s => s.id === id) || BLADE_SKINS[0];
}
